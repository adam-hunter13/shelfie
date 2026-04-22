import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Web Push using the built-in fetch + VAPID
// Install: npm install web-push
// Then run: npx web-push generate-vapid-keys
// Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env.local

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url, type } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the requesting user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Log notification to DB
    await supabase.from("notifications").insert({ user_id: userId, type, title, body, url });

    // Get all push subscriptions for this user
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: "No subscriptions found" });
    }

    // Send push to each subscription
    const webpush = await import("web-push");

    webpush.default.setVapidDetails(
      "mailto:" + (process.env.VAPID_EMAIL ?? "admin@shelfie.app"),
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const payload = JSON.stringify({ title, body, url: url ?? "/dashboard" });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    // Remove expired subscriptions
    const expired = subs.filter((_, i) => {
      const r = results[i];
      return r.status === "rejected" && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404);
    });

    if (expired.length > 0) {
      await Promise.all(
        expired.map((sub) =>
          supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        )
      );
    }

    return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length });
  } catch (err) {
    console.error("Push error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export type NotificationType =
  | "reaction"
  | "friend_request"
  | "friend_accepted"
  | "book_added"
  | "book_finished"
  | "recommendation";

interface SendPushOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
}

export async function sendPush(opts: SendPushOptions) {
  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch (err) {
    // Non-critical — don't break the main flow
    console.warn("Push notification failed:", err);
  }
}

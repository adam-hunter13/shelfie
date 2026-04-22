import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FriendShelfClient from "@/components/friends/FriendShelfClient";

export default async function FriendShelfPage({ params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify accepted friendship
  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user!.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user!.id})`
    )
    .maybeSingle();

  if (!friendship) notFound();

  // Load friend's profile + books + reactions, and current user's book titles in parallel
  const [
    { data: profile },
    { data: books },
    { data: myBooks },
    { data: myProfile },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", friendId).single(),
    supabase.from("books").select("*").eq("user_id", friendId).order("created_at", { ascending: false }),
    supabase.from("books").select("title").eq("user_id", user!.id),
    supabase.from("profiles").select("display_name, email").eq("id", user!.id).single(),
  ]);

  const bookIds = (books ?? []).map((b) => b.id);
  const { data: reactions } = bookIds.length
    ? await supabase.from("reactions").select("*").in("book_id", bookIds)
    : { data: [] };

  const myBookTitles = (myBooks ?? []).map((b) => b.title.toLowerCase());
  const currentUserName = myProfile?.display_name ?? myProfile?.email ?? user!.email ?? "Someone";

  return (
    <FriendShelfClient
      currentUserId={user!.id}
      currentUserName={currentUserName}
      profile={profile!}
      books={books ?? []}
      reactions={reactions ?? []}
      myBookTitles={myBookTitles}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { Book, Profile } from "@/types";
import RecommendationsClient from "@/components/RecommendationsClient";

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get all accepted friend IDs
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user!.id ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) {
    return (
      <RecommendationsClient
        recommendedBooks={[]}
        friendProfiles={[]}
        myBookTitles={[]}
        currentUserId={user!.id}
        currentUserName={user!.email ?? ""}
      />
    );
  }

  // 2. Fetch all recommended books from friends + current user's book titles in parallel
  const [{ data: friendBooks }, { data: myBooks }, { data: profiles }] = await Promise.all([
    supabase
      .from("books")
      .select("*")
      .in("user_id", friendIds)
      .eq("recommended", true)
      .order("rating", { ascending: false }),
    supabase
      .from("books")
      .select("title")
      .eq("user_id", user!.id),
    supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds),
  ]);

  // 3. Get current user's display name
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user!.id)
    .single();

  const myBookTitles = (myBooks ?? []).map((b) => b.title.toLowerCase());
  const currentUserName = myProfile?.display_name ?? myProfile?.email ?? user!.email ?? "";

  // 4. Deduplicate by title — group recommenders per book
  type RecommendedBook = Book & { recommenders: Profile[] };

  const seen = new Map<string, RecommendedBook>();
  for (const book of (friendBooks ?? []) as Book[]) {
    const key = book.title.toLowerCase();
    // Skip books already on the user's shelf
    if (myBookTitles.includes(key)) continue;
    const profile = (profiles ?? []).find((p) => p.id === book.user_id);
    if (!profile) continue;

    if (seen.has(key)) {
      seen.get(key)!.recommenders.push(profile);
    } else {
      seen.set(key, { ...book, recommenders: [profile] });
    }
  }

  // Sort: most recommenders first, then by rating
  const recommendedBooks = [...seen.values()].sort((a, b) => {
    if (b.recommenders.length !== a.recommenders.length)
      return b.recommenders.length - a.recommenders.length;
    return b.rating - a.rating;
  });

  return (
    <RecommendationsClient
      recommendedBooks={recommendedBooks}
      friendProfiles={profiles ?? []}
      myBookTitles={myBookTitles}
      currentUserId={user!.id}
      currentUserName={currentUserName}
    />
  );
}

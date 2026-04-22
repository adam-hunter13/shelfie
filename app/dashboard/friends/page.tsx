import { createClient } from "@/lib/supabase/server";
import FriendsClient from "@/components/friends/FriendsClient";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load all friendships involving this user
  const { data: friendships } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

  // Load profiles for all involved users
  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user!.id ? f.addressee_id : f.requester_id
  );

  const { data: profiles } = friendIds.length
    ? await supabase.from("profiles").select("*").in("id", friendIds)
    : { data: [] };

  return (
    <FriendsClient
      currentUserId={user!.id}
      currentUserEmail={user!.email ?? ""}
      initialFriendships={friendships ?? []}
      initialProfiles={profiles ?? []}
    />
  );
}

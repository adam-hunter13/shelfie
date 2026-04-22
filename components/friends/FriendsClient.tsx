"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Check, X, BookOpen, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendPush } from "@/lib/sendPush";
import { Friendship, Profile } from "@/types";

interface Props {
  currentUserId: string;
  currentUserEmail: string;
  initialFriendships: Friendship[];
  initialProfiles: Profile[];
}

export default function FriendsClient({
  currentUserId,
  currentUserEmail,
  initialFriendships,
  initialProfiles,
}: Props) {
  const supabase = createClient();
  const router   = useRouter();

  const [friendships, setFriendships] = useState<Friendship[]>(initialFriendships);
  const [profiles,    setProfiles]    = useState<Profile[]>(initialProfiles);
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<Profile[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searchMsg,   setSearchMsg]   = useState("");

  // Derived lists
  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === currentUserId
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === currentUserId
  );

  function profileFor(id: string) {
    return profiles.find((p) => p.id === id);
  }

  function friendIdFor(f: Friendship) {
    return f.requester_id === currentUserId ? f.addressee_id : f.requester_id;
  }

  function friendshipWith(userId: string) {
    return friendships.find(
      (f) =>
        (f.requester_id === currentUserId && f.addressee_id === userId) ||
        (f.addressee_id === currentUserId && f.requester_id === userId)
    );
  }

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchMsg("");
    setResults([]);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", `%${query.trim()}%`)
      .neq("id", currentUserId)
      .limit(8);

    setResults(data ?? []);
    if (!data || data.length === 0) setSearchMsg("No users found.");
    setSearching(false);
  }

  async function sendRequest(addresseeId: string, profile: Profile) {
    const { data, error } = await supabase
      .from("friendships")
      .insert({ requester_id: currentUserId, addressee_id: addresseeId })
      .select()
      .single();

    if (!error && data) {
      setFriendships((prev) => [...prev, data]);
      if (!profiles.find((p) => p.id === addresseeId)) {
        setProfiles((prev) => [...prev, profile]);
      }
      // Notify the person who received the request
      const senderProfile = profiles.find((p) => p.id === currentUserId);
      const senderName = senderProfile?.display_name ?? currentUserEmail;
      await sendPush({
        userId: addresseeId,
        type:   "friend_request",
        title:  "New friend request",
        body:   `${senderName} wants to be friends on Shelfie`,
        url:    "/dashboard/friends",
      });
    }
  }

  async function respond(friendshipId: string, status: "accepted" | "declined") {
    const { data } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId)
      .select()
      .single();

    if (data) {
      setFriendships((prev) => prev.map((f) => (f.id === friendshipId ? data : f)));
      if (status === "accepted") {
        const myProfile = profiles.find((p) => p.id === currentUserId);
        const myName = myProfile?.display_name ?? currentUserEmail;
        await sendPush({
          userId: data.requester_id,
          type:   "friend_accepted",
          title:  "Friend request accepted!",
          body:   `${myName} accepted your friend request`,
          url:    `/dashboard/friends/${currentUserId}`,
        });
      }
    }
  }

  async function removeFriend(friendshipId: string) {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setFriendships((prev) => prev.filter((f) => f.id !== friendshipId));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">Friends</h1>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mt-1">
            {accepted.length} {accepted.length === 1 ? "friend" : "friends"}
          </p>
        </div>
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text mb-3 flex items-center gap-2">
            <Clock size={16} className="text-mahogany dark:text-dark-mahogany" />
            Friend requests
            <span className="bg-mahogany text-parchment-50 text-xs font-sans rounded-full px-2 py-0.5">
              {incoming.length}
            </span>
          </h2>
          <div className="space-y-2">
            {incoming.map((f) => {
              const p = profileFor(f.requester_id);
              return (
                <div key={f.id} className="flex items-center justify-between bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <p className="font-sans text-sm font-medium text-ink dark:text-dark-text">{p?.display_name ?? p?.email ?? "Unknown"}</p>
                    {p?.display_name && <p className="font-sans text-xs text-ink-light dark:text-dark-subtle">{p.email}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(f.id, "accepted")}
                      className="flex items-center gap-1 bg-moss text-white font-sans text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => respond(f.id, "declined")}
                      className="flex items-center gap-1 bg-parchment-200 text-ink-light font-sans text-xs px-3 py-1.5 rounded-lg hover:bg-parchment-300 transition"
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text mb-3 flex items-center gap-2">
          <UserPlus size={16} className="text-mahogany dark:text-dark-mahogany" />
          Add a friend
        </h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by email address…"
            className="flex-1 bg-white dark:bg-dark-surface border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
          />
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            className="bg-ink text-parchment-50 font-sans text-sm px-4 py-2 rounded-xl hover:bg-mahogany disabled:opacity-40 transition flex items-center gap-2"
          >
            <Search size={15} />
            {searching ? "…" : "Search"}
          </button>
        </div>

        {searchMsg && <p className="font-sans text-sm text-ink-light mt-3">{searchMsg}</p>}

        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((p) => {
              const existing = friendshipWith(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl px-4 py-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-ink dark:text-dark-text">{p.display_name ?? p.email}</p>
                    {p.display_name && <p className="font-sans text-xs text-ink-light dark:text-dark-subtle">{p.email}</p>}
                  </div>
                  {!existing ? (
                    <button
                      onClick={() => sendRequest(p.id, p)}
                      className="flex items-center gap-1 bg-ink text-parchment-50 font-sans text-xs px-3 py-1.5 rounded-lg hover:bg-mahogany transition"
                    >
                      <UserPlus size={12} /> Add
                    </button>
                  ) : existing.status === "pending" ? (
                    <span className="font-sans text-xs text-ink-light italic">Request sent</span>
                  ) : existing.status === "accepted" ? (
                    <span className="font-sans text-xs text-moss dark:text-dark-moss font-medium">Friends ✓</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Accepted friends */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-text mb-3 flex items-center gap-2">
          <Users size={16} className="text-mahogany dark:text-dark-mahogany" />
          My friends
        </h2>

        {accepted.length === 0 ? (
          <div className="text-center py-16 text-ink-light">
            <Users size={40} className="mx-auto mb-3 text-parchment-300" strokeWidth={1} />
            <p className="font-sans text-sm">No friends yet — search above to add some!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accepted.map((f) => {
              const fId = friendIdFor(f);
              const p   = profileFor(fId);
              return (
                <div key={f.id} className="flex items-center justify-between bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <p className="font-sans text-sm font-medium text-ink dark:text-dark-text">{p?.display_name ?? p?.email ?? "Unknown"}</p>
                    {p?.display_name && <p className="font-sans text-xs text-ink-light dark:text-dark-subtle">{p.email}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/friends/${fId}`)}
                      className="flex items-center gap-1 font-sans text-xs text-mahogany dark:text-dark-mahogany hover:text-ink transition"
                    >
                      <BookOpen size={13} /> View shelf
                    </button>
                    <button
                      onClick={() => removeFriend(f.id)}
                      className="font-sans text-xs text-ink-light hover:text-mahogany dark:text-dark-mahogany transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-base font-semibold text-ink-light mb-3">Pending sent requests</h2>
          <div className="space-y-2">
            {outgoing.map((f) => {
              const p = profileFor(f.addressee_id);
              return (
                <div key={f.id} className="flex items-center justify-between bg-parchment-100 dark:bg-dark-bg border border-parchment-200 dark:border-dark-border rounded-xl px-4 py-3">
                  <p className="font-sans text-sm text-ink-light">{p?.email ?? f.addressee_id}</p>
                  <button
                    onClick={() => removeFriend(f.id)}
                    className="font-sans text-xs text-ink-light hover:text-mahogany dark:text-dark-mahogany transition"
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, ThumbsUp, BookOpen, BookMarked, CheckCircle, BookmarkPlus, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendPush } from "@/lib/sendPush";
import { Book, Reaction, ReactionEmoji, Profile } from "@/types";

const EMOJIS: ReactionEmoji[] = ["👍", "❤️", "🤩"];

const COVER_COLORS = [
  "#7c3626","#4a5e3a","#1c1209","#8b5e18","#2e5c7c","#5c2e7c",
  "#7c5c2e","#2e7c5c","#7c2e5c","#3a4a5e",
];

const STATUS_META = {
  "read":         { label: "Read",         icon: CheckCircle },
  "reading":      { label: "Reading",      icon: BookOpen    },
  "want-to-read": { label: "Want to read", icon: BookMarked  },
};

interface Props {
  currentUserId: string;
  currentUserName: string;
  profile: Profile;
  books: Book[];
  reactions: Reaction[];
  myBookTitles: string[];
}

export default function FriendShelfClient({
  currentUserId,
  currentUserName,
  profile,
  books,
  reactions: initialReactions,
  myBookTitles,
}: Props) {
  const supabase = createClient();
  const router   = useRouter();

  const [reactions,  setReactions]  = useState<Reaction[]>(initialReactions);
  // Track which book IDs have been saved this session
  const [saved, setSaved] = useState<Record<string, "saving" | "saved">>({});
  // Track which books are already on shelf (by title, lowercased)
  const [onShelf, setOnShelf] = useState<Set<string>>(
    new Set(myBookTitles)
  );

  async function toggleReaction(bookId: string, emoji: ReactionEmoji) {
    const existing = reactions.find(
      (r) => r.book_id === bookId && r.user_id === currentUserId && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("reactions")
        .insert({ book_id: bookId, user_id: currentUserId, emoji })
        .select()
        .single();
      if (data) {
        setReactions((prev) => [...prev, data]);
        // Notify the book owner
        const book = books.find((b) => b.id === bookId);
        if (book) {
          await sendPush({
            userId: profile.id,
            type:   "reaction",
            title:  "Someone reacted to your book!",
            body:   `${currentUserName} reacted ${emoji} to "${book.title}"`,
            url:    "/dashboard",
          });
        }
      }
    }
  }

  async function addToShelf(book: Book) {
    setSaved((prev) => ({ ...prev, [book.id]: "saving" }));

    const color = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

    await supabase.from("books").insert({
      user_id:          currentUserId,
      title:            book.title,
      author:           book.author,
      review:           "",
      rating:           0,
      recommended:      false,
      status:           "want-to-read",
      cover_color:      color,
      tags:             book.tags ?? [],
      progress_type:    null,
      current_page:     null,
      total_pages:      null,
      progress_percent: null,
      date_finished:    null,
    });

    setSaved((prev) => ({ ...prev, [book.id]: "saved" }));
    setOnShelf((prev) => new Set([...prev, book.title.toLowerCase()]));

    // Notify the friend their recommendation influenced someone
    await sendPush({
      userId: profile.id,
      type:   "book_added",
      title:  "Your book inspired someone!",
      body:   `${currentUserName} added "${book.title}" to their want-to-read list`,
      url:    `/dashboard/friends/${currentUserId}`,
    });
  }

  function countFor(bookId: string, emoji: ReactionEmoji) {
    return reactions.filter((r) => r.book_id === bookId && r.emoji === emoji).length;
  }

  function myReaction(bookId: string, emoji: ReactionEmoji) {
    return reactions.some(
      (r) => r.book_id === bookId && r.user_id === currentUserId && r.emoji === emoji
    );
  }

  const displayName = profile.display_name ?? profile.email.split("@")[0];

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/friends")}
        className="flex items-center gap-2 font-sans text-sm text-ink-light hover:text-ink transition mb-6"
      >
        <ArrowLeft size={15} /> Back to friends
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="font-sans text-xs tracking-widest uppercase text-parchment-500 mb-1">
          {profile.email}
        </p>
        <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">
          {displayName}&apos;s Shelf
        </h1>
        <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mt-1">
          {books.length} {books.length === 1 ? "book" : "books"}
        </p>
      </div>

      {/* Empty */}
      {books.length === 0 && (
        <div className="text-center py-24 text-ink-light">
          <BookOpen size={48} className="mx-auto mb-4 text-parchment-300" strokeWidth={1} />
          <p className="font-sans text-sm">This shelf is empty so far.</p>
        </div>
      )}

      {/* Books */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {books.map((book, i) => {
          const meta    = STATUS_META[book.status];
          const Icon    = meta.icon;
          const delay   = Math.min(i, 6);
          const already = onShelf.has(book.title.toLowerCase());
          const state   = saved[book.id];

          return (
            <div
              key={book.id}
              className={`book-card bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-soft dark:shadow-soft-dark animate-fade-up opacity-0 stagger-${delay} flex flex-col`}
              style={{ animationFillMode: "forwards" }}
            >
              {/* Colour strip */}
              <div className="h-3 flex-shrink-0" style={{ backgroundColor: book.cover_color }} />

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Title / Author */}
                <div>
                  <h3 className="font-display font-semibold text-ink dark:text-dark-text text-lg leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mt-0.5">{book.author}</p>
                </div>

                {/* Stars */}
                {book.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < book.rating ? "#8b5e18" : "none"}
                        className={i < book.rating ? "star-filled" : "star-empty"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                )}

                {/* Review */}
                {book.review && (
                  <p className="font-body text-sm text-ink-light dark:text-dark-subtle leading-relaxed line-clamp-3 italic">
                    &ldquo;{book.review}&rdquo;
                  </p>
                )}

                {/* Tags */}
                {book.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {book.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="font-sans text-xs bg-parchment-100 dark:bg-dark-border text-ink-light dark:text-dark-subtle px-2 py-0.5 rounded-full border border-parchment-200 dark:border-dark-border">
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="font-sans text-xs text-parchment-400">+{book.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                  <span className="flex items-center gap-1 font-sans text-xs text-ink-light">
                    <Icon size={12} strokeWidth={2} />
                    {meta.label}
                  </span>
                  {book.recommended && (
                    <span className="flex items-center gap-1 font-sans text-xs text-moss dark:text-dark-moss bg-moss/10 dark:bg-dark-moss/20 px-2 py-0.5 rounded-full">
                      <ThumbsUp size={11} strokeWidth={2} /> Recommended
                    </span>
                  )}
                </div>

                {/* Add to shelf button */}
                <button
                  onClick={() => !already && !state && addToShelf(book)}
                  disabled={already || !!state}
                  className={`w-full flex items-center justify-center gap-2 font-sans text-xs py-2 rounded-xl border transition-all ${
                    already || state === "saved"
                      ? "bg-moss/10 dark:bg-dark-moss/20 border-moss text-moss dark:text-dark-moss cursor-default"
                      : state === "saving"
                      ? "bg-parchment-100 border-parchment-300 text-ink-light cursor-wait"
                      : "bg-white border-parchment-300 text-ink-light hover:bg-ink hover:text-parchment-50 hover:border-ink"
                  }`}
                >
                  {already || state === "saved" ? (
                    <><Check size={13} strokeWidth={2.5} /> On your shelf</>
                  ) : state === "saving" ? (
                    <>Adding…</>
                  ) : (
                    <><BookmarkPlus size={13} /> Want to read</>
                  )}
                </button>

                {/* Reactions */}
                <div className="flex items-center gap-2 border-t border-parchment-100 dark:border-dark-border pt-3 flex-wrap">
                  {EMOJIS.map((emoji) => {
                    const count   = countFor(book.id, emoji);
                    const reacted = myReaction(book.id, emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(book.id, emoji)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all ${
                          reacted
                            ? "bg-parchment-200 dark:bg-dark-border border-parchment-400 dark:border-dark-muted font-medium"
                            : "bg-white dark:bg-dark-surface border-parchment-200 dark:border-dark-border hover:bg-parchment-100 dark:hover:bg-dark-border"
                        }`}
                      >
                        {emoji}
                        {count > 0 && (
                          <span className="font-sans text-xs text-ink-light dark:text-dark-subtle">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {books.length > 0 && (
        <div className="mt-10 h-5 shelf-divider rounded-sm w-full" />
      )}
    </div>
  );
}

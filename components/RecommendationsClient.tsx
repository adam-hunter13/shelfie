"use client";

import { useState, useMemo } from "react";
import { Star, ThumbsUp, BookmarkPlus, Check, BookOpen, ArrowUpDown, X, Users } from "lucide-react";
import { Book, Profile } from "@/types";
import Avatar from "./Avatar";
import { sendPush } from "@/lib/sendPush";
import { createClient } from "@/lib/supabase/client";

const COVER_COLORS = [
  "#7c3626","#4a5e3a","#1c1209","#8b5e18","#2e5c7c","#5c2e7c",
  "#7c5c2e","#2e7c5c","#7c2e5c","#3a4a5e",
];

type RecommendedBook = Book & { recommenders: Profile[] };
type SortKey = "rating" | "recommenders" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "rating",       label: "Highest rated"      },
  { key: "recommenders", label: "Most recommended"   },
  { key: "recent",       label: "Recently added"     },
];

interface Props {
  recommendedBooks: RecommendedBook[];
  friendProfiles: Profile[];
  myBookTitles: string[];
  currentUserId: string;
  currentUserName: string;
}

export default function RecommendationsClient({
  recommendedBooks,
  myBookTitles,
  currentUserId,
  currentUserName,
}: Props) {
  const supabase = createClient();

  const [saved,    setSaved]    = useState<Record<string, "saving" | "saved">>({});
  const [onShelf,  setOnShelf]  = useState<Set<string>>(new Set(myBookTitles));
  const [sortKey,  setSortKey]  = useState<SortKey>("rating");
  const [sortOpen, setSortOpen] = useState(false);
  const [search,   setSearch]   = useState("");

  const displayed = useMemo(() => {
    let list = [...recommendedBooks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (sortKey === "rating")       return b.rating - a.rating;
      if (sortKey === "recommenders") return b.recommenders.length - a.recommenders.length;
      if (sortKey === "recent")       return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
  }, [recommendedBooks, sortKey, search]);

  async function addToShelf(book: RecommendedBook) {
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
      cover_url:        book.cover_url ?? null,
      tags:             book.tags ?? [],
      progress_type:    null,
      current_page:     null,
      total_pages:      null,
      progress_percent: null,
      date_finished:    null,
    });

    setOnShelf((prev) => new Set([...prev, book.title.toLowerCase()]));
    setSaved((prev) => ({ ...prev, [book.id]: "saved" }));

    // Notify all recommenders
    for (const recommender of book.recommenders) {
      await sendPush({
        userId: recommender.id,
        type:   "book_added",
        title:  "Your recommendation worked!",
        body:   `${currentUserName} added "${book.title}" to their want-to-read list`,
        url:    "/dashboard",
      });
    }
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">
            Recommendations
          </h1>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mt-1">
            Books your friends love and think you should read
          </p>
        </div>

        {/* Sort */}
        {recommendedBooks.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 font-sans text-sm bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border text-ink-light dark:text-dark-subtle px-4 py-2 rounded-xl hover:border-parchment-400 dark:hover:border-dark-muted transition-all"
            >
              <ArrowUpDown size={14} />
              {currentSortLabel}
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl shadow-soft dark:shadow-soft-dark overflow-hidden min-w-[180px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 font-sans text-sm transition-colors flex items-center justify-between ${
                      sortKey === opt.key
                        ? "text-mahogany dark:text-dark-mahogany bg-parchment-50 dark:bg-dark-bg"
                        : "text-ink dark:text-dark-text hover:bg-parchment-100 dark:hover:bg-dark-border"
                    }`}
                  >
                    {opt.label}
                    {sortKey === opt.key && <Check size={13} className="text-mahogany dark:text-dark-mahogany" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      {recommendedBooks.length > 0 && (
        <div className="relative mb-6">
          <BookOpen size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-parchment-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recommendations by title, author, or tag…"
            className="w-full bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl pl-10 pr-10 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-400 hover:text-ink dark:hover:text-dark-text transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Empty — no friends */}
      {recommendedBooks.length === 0 && (
        <div className="text-center py-32">
          <Users size={52} className="mx-auto mb-4 text-parchment-300 dark:text-dark-muted" strokeWidth={1} />
          <h3 className="font-display text-2xl text-ink dark:text-dark-text mb-2">No recommendations yet</h3>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle max-w-sm mx-auto">
            Once your friends mark books as recommended, they'll show up here.
            Add some friends to get started!
          </p>
        </div>
      )}

      {/* Empty — search */}
      {recommendedBooks.length > 0 && displayed.length === 0 && (
        <div className="text-center py-24">
          <BookOpen size={48} className="mx-auto mb-4 text-parchment-300 dark:text-dark-muted" strokeWidth={1} />
          <h3 className="font-display text-xl text-ink dark:text-dark-text mb-2">No results</h3>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle">
            No recommendations match &ldquo;{search}&rdquo;.
          </p>
        </div>
      )}

      {/* Stats strip */}
      {recommendedBooks.length > 0 && !search && (
        <div className="flex items-center gap-6 mb-6 font-sans text-sm text-ink-light dark:text-dark-subtle">
          <span>
            <span className="font-display text-2xl font-bold text-ink dark:text-dark-text mr-1">
              {recommendedBooks.length}
            </span>
            {recommendedBooks.length === 1 ? "recommendation" : "recommendations"}
          </span>
          <span className="text-parchment-300 dark:text-dark-border">·</span>
          <span>
            Sorted by <span className="text-ink dark:text-dark-text font-medium">{currentSortLabel?.toLowerCase()}</span>
          </span>
        </div>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayed.map((book, i) => {
          const already = onShelf.has(book.title.toLowerCase());
          const state   = saved[book.id];
          const delay   = Math.min(i, 6);

          return (
            <div
              key={book.id}
              className={`book-card bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-soft dark:shadow-soft-dark animate-fade-up opacity-0 stagger-${delay} flex flex-col`}
              style={{ animationFillMode: "forwards" }}
            >
              {/* Cover or colour strip */}
              {book.cover_url ? (
                <div className="h-32 w-full flex-shrink-0 overflow-hidden">
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-3 w-full flex-shrink-0" style={{ backgroundColor: book.cover_color }} />
              )}

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Title + Author */}
                <div>
                  <h3 className="font-display font-semibold text-ink dark:text-dark-text text-lg leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mt-0.5">
                    {book.author}
                  </p>
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

                {/* Review snippet */}
                {book.review && (
                  <p className="font-body text-sm text-ink-light dark:text-dark-subtle leading-relaxed line-clamp-3 italic">
                    &ldquo;{book.review}&rdquo;
                  </p>
                )}

                {/* Tags */}
                {book.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {book.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-sans text-xs bg-parchment-100 dark:bg-dark-border text-ink-light dark:text-dark-subtle px-2 py-0.5 rounded-full border border-parchment-200 dark:border-dark-border"
                      >
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="font-sans text-xs text-parchment-400 dark:text-dark-muted">
                        +{book.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Recommenders */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  <ThumbsUp size={12} className="text-moss dark:text-dark-moss flex-shrink-0" strokeWidth={2} />
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex -space-x-1.5">
                      {book.recommenders.slice(0, 4).map((p) => (
                        <div key={p.id} title={p.display_name ?? p.email}>
                          <Avatar
                            name={p.display_name ?? p.email}
                            color={p.avatar_color ?? "#7c3626"}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="font-sans text-xs text-ink-light dark:text-dark-subtle">
                      {book.recommenders.length === 1
                        ? (book.recommenders[0].display_name ?? book.recommenders[0].email.split("@")[0])
                        : `${book.recommenders.length} friends recommend`}
                    </span>
                  </div>
                </div>

                {/* Add to shelf */}
                <button
                  onClick={() => !already && !state && addToShelf(book)}
                  disabled={already || !!state}
                  className={`w-full flex items-center justify-center gap-2 font-sans text-xs py-2.5 rounded-xl border transition-all ${
                    already || state === "saved"
                      ? "bg-moss/10 dark:bg-dark-moss/20 border-moss text-moss dark:text-dark-moss cursor-default"
                      : state === "saving"
                      ? "bg-parchment-100 dark:bg-dark-border border-parchment-300 dark:border-dark-border text-ink-light dark:text-dark-subtle cursor-wait"
                      : "bg-white dark:bg-dark-bg border-parchment-300 dark:border-dark-border text-ink-light dark:text-dark-subtle hover:bg-ink hover:text-parchment-50 hover:border-ink dark:hover:bg-parchment-200 dark:hover:text-ink dark:hover:border-parchment-200"
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
              </div>
            </div>
          );
        })}
      </div>

      {displayed.length > 0 && (
        <div className="mt-10 h-5 shelf-divider rounded-sm w-full" />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Star, Pencil, Trash2, ThumbsUp, BookOpen, BookMarked, CheckCircle } from "lucide-react";
import { Book, Reaction, ReactionEmoji } from "@/types";

const STATUS_META = {
  "read":         { label: "Read",         icon: CheckCircle, color: "text-moss dark:text-dark-moss"         },
  "reading":      { label: "Reading",      icon: BookOpen,    color: "text-mahogany dark:text-dark-mahogany"      },
  "want-to-read": { label: "Want to read", icon: BookMarked,  color: "text-parchment-500" },
};

const EMOJIS: ReactionEmoji[] = ["👍", "❤️", "🤩"];

interface Props {
  book: Book;
  stagger: number;
  onEdit: () => void;
  onDelete: () => void;
  reactions?: Reaction[];
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function BookCard({ book, stagger, onEdit, onDelete, reactions = [] }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta  = STATUS_META[book.status];
  const Icon  = meta.icon;
  const delay = Math.min(stagger, 6);

  const pct =
    book.progress_percent ??
    (book.current_page && book.total_pages
      ? Math.round((book.current_page / book.total_pages) * 100)
      : null);

  // Group reactions by emoji with counts
  const reactionSummary = EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.emoji === emoji).length,
  })).filter((r) => r.count > 0);

  return (
    <div
      className={`book-card bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-soft dark:shadow-soft-dark animate-fade-up opacity-0 stagger-${delay} flex flex-col`}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Cover image or colour strip */}
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
          <h3 className="font-display font-semibold text-ink dark:text-dark-text text-lg leading-snug line-clamp-2">{book.title}</h3>
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

        {/* Progress bar — reading only */}
        {book.status === "reading" && pct !== null && (
          <div>
            <div className="flex justify-between font-sans text-xs text-ink-light dark:text-dark-subtle mb-1">
              <span>
                {book.progress_type === "pages" && book.current_page && book.total_pages
                  ? `p. ${book.current_page} of ${book.total_pages}`
                  : "Progress"}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-parchment-200 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-mahogany rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
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
            {book.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="font-sans text-xs bg-parchment-100 dark:bg-dark-border text-ink-light dark:text-dark-subtle px-2 py-0.5 rounded-full border border-parchment-200 dark:border-dark-border"
              >
                {tag}
              </span>
            ))}
            {book.tags.length > 4 && (
              <span className="font-sans text-xs text-parchment-400">+{book.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
          <span className={`flex items-center gap-1 font-sans text-xs ${meta.color}`}>
            <Icon size={12} strokeWidth={2} />
            {meta.label}
          </span>
          {book.recommended && (
            <span className="flex items-center gap-1 font-sans text-xs text-moss dark:text-dark-moss bg-moss/10 dark:bg-dark-moss/20 px-2 py-0.5 rounded-full">
              <ThumbsUp size={11} strokeWidth={2} /> Recommended
            </span>
          )}
          {book.status === "read" && book.date_finished && (
            <span className="font-sans text-xs text-parchment-400 dark:text-dark-muted ml-auto">
              {formatDate(book.date_finished)}
            </span>
          )}
        </div>

        {/* Actions + reactions row */}
        <div className="flex items-center justify-between border-t border-parchment-100 dark:border-dark-border pt-3 gap-2">

          {/* Reactions — left side */}
          <div className="flex items-center gap-1 flex-wrap">
            {reactionSummary.length > 0 ? (
              reactionSummary.map(({ emoji, count }) => (
                <span
                  key={emoji}
                  className="flex items-center gap-0.5 bg-parchment-100 dark:bg-dark-border border border-parchment-200 dark:border-dark-border rounded-full px-2 py-0.5 text-xs font-sans text-ink-light dark:text-dark-subtle"
                  title={`${count} ${count === 1 ? "reaction" : "reactions"}`}
                >
                  {emoji}
                  <span className="text-[11px]">{count}</span>
                </span>
              ))
            ) : (
              <span className="text-xs font-sans text-parchment-300 dark:text-dark-muted italic">No reactions yet</span>
            )}
          </div>

          {/* Edit / Delete — right side */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="font-sans text-xs text-mahogany dark:text-dark-mahogany">Remove?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-sans text-xs text-ink-light hover:text-ink px-2 py-1 rounded transition-colors"
              >
                No
              </button>
              <button
                onClick={onDelete}
                className="font-sans text-xs text-parchment-50 bg-mahogany px-2 py-1 rounded transition-colors"
              >
                Yes
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="flex items-center gap-1 font-sans text-xs text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text transition-colors px-2 py-1 rounded hover:bg-parchment-100 dark:hover:bg-dark-border"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 font-sans text-xs text-ink-light hover:text-mahogany dark:text-dark-mahogany transition-colors px-2 py-1 rounded hover:bg-parchment-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Star, ThumbsUp, BookOpen, BookMarked, CheckCircle, X } from "lucide-react";
import { Book } from "@/types";

// Each book gets deterministic-but-varied dimensions from its id
function bookDimensions(book: Book) {
  const seed = book.id.charCodeAt(0) + book.id.charCodeAt(1) + book.id.charCodeAt(4);
  const height = 120 + (seed % 5) * 16;   // 120–184px
  const width  = 28  + (seed % 4) * 8;    // 28–52px
  return { height, width };
}

// Lighten a hex color for the spine gradient
function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

const STATUS_META = {
  "read":         { label: "Read",         icon: CheckCircle },
  "reading":      { label: "Reading",      icon: BookOpen    },
  "want-to-read": { label: "Want to read", icon: BookMarked  },
};

interface BookModalProps {
  book: Book;
  onClose: () => void;
}

function BookModal({ book, onClose }: BookModalProps) {
  const meta = STATUS_META[book.status];
  const Icon = meta.icon;

  const pct =
    book.progress_percent ??
    (book.current_page && book.total_pages
      ? Math.round((book.current_page / book.total_pages) * 100)
      : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ perspective: "1200px" }}
    >
      {/* Book opening animation wrapper */}
      <div
        className="relative w-full max-w-md bg-parchment-50 dark:bg-dark-surface rounded-r-2xl shadow-[8px_8px_40px_rgba(0,0,0,0.5)] max-h-[88vh] overflow-y-auto"
        style={{
          animation: "bookOpen 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Book spine accent on left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 rounded-l-sm flex-shrink-0"
          style={{ backgroundColor: book.cover_color }}
        />

        <div className="pl-6 pr-5 py-5">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text transition-colors"
          >
            <X size={18} />
          </button>

          {/* Cover image */}
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-40 object-cover rounded-xl mb-4"
            />
          )}

          {/* Title */}
          <h2 className="font-display text-2xl font-bold text-ink dark:text-dark-text leading-snug mb-1">
            {book.title}
          </h2>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mb-4">
            by {book.author}
          </p>

          {/* Stars */}
          {book.rating > 0 && (
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ color: i < book.rating ? "#8b5e18" : "#8b6820", fontSize: 18 }}>★</span>
              ))}
              <span className="font-sans text-xs text-ink-light dark:text-dark-subtle ml-1">
                {["","Poor","Fair","Good","Great","Excellent"][book.rating]}
              </span>
            </div>
          )}

          {/* Status + badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center gap-1 font-sans text-xs text-ink-light dark:text-dark-subtle bg-parchment-100 dark:bg-dark-border px-2.5 py-1 rounded-full">
              <Icon size={11} strokeWidth={2} />
              {meta.label}
            </span>
            {book.recommended && (
              <span className="flex items-center gap-1 font-sans text-xs text-moss dark:text-dark-moss bg-moss/10 dark:bg-dark-moss/20 px-2.5 py-1 rounded-full">
                <ThumbsUp size={11} strokeWidth={2} /> Recommended
              </span>
            )}
            {book.date_finished && (
              <span className="font-sans text-xs text-parchment-400 dark:text-dark-muted bg-parchment-100 dark:bg-dark-border px-2.5 py-1 rounded-full">
                Finished {new Date(book.date_finished + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Progress */}
          {book.status === "reading" && pct !== null && (
            <div className="mb-4">
              <div className="flex justify-between font-sans text-xs text-ink-light dark:text-dark-subtle mb-1">
                <span>
                  {book.progress_type === "pages" && book.current_page && book.total_pages
                    ? `Page ${book.current_page} of ${book.total_pages}`
                    : "Progress"}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-parchment-200 dark:bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-mahogany rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Tags */}
          {book.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {book.tags.map(tag => (
                <span key={tag} className="font-sans text-xs bg-parchment-100 dark:bg-dark-border text-ink-light dark:text-dark-subtle px-2 py-0.5 rounded-full border border-parchment-200 dark:border-dark-border">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Review */}
          {book.review && (
            <div className="border-t border-parchment-200 dark:border-dark-border pt-4">
              <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mb-2 uppercase tracking-wide">My review</p>
              <p className="font-body text-sm text-ink dark:text-dark-text leading-relaxed italic">
                &ldquo;{book.review}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bookOpen {
          0%   { transform: perspective(800px) rotateY(-90deg) scale(0.8); opacity: 0; }
          60%  { transform: perspective(800px) rotateY(8deg)  scale(1.02); opacity: 1; }
          100% { transform: perspective(800px) rotateY(0deg)  scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

interface SpineProps {
  book: Book;
  onClick: () => void;
}

function BookSpine({ book, onClick }: SpineProps) {
  const { height, width } = bookDimensions(book);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setHovered(false), 150);
  }

  const spineGradient = `linear-gradient(
    to right,
    ${lighten(book.cover_color, -20)} 0%,
    ${book.cover_color} 30%,
    ${lighten(book.cover_color, 40)} 50%,
    ${book.cover_color} 70%,
    ${lighten(book.cover_color, -10)} 100%
  )`;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{
        width,
        height,
        transformStyle: "preserve-3d",
        perspective: "600px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      title={book.title}
    >
      {/* The spine */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: spineGradient,
          borderRadius: "2px 1px 1px 2px",
          transform: hovered
            ? "rotateX(12deg) translateY(-14px) translateZ(10px)"
            : "rotateX(0deg) translateY(0px) translateZ(0px)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
          boxShadow: hovered
            ? `2px -4px 16px rgba(0,0,0,0.35), inset -2px 0 6px rgba(0,0,0,0.2), inset 2px 0 4px rgba(255,255,255,0.15)`
            : `1px 1px 4px rgba(0,0,0,0.25), inset -2px 0 4px rgba(0,0,0,0.15)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top notch glow when hovered — simulates finger pulling */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: "6px",
              background: "rgba(255,255,255,0.4)",
              borderRadius: "0 0 4px 4px",
            }}
          />
        )}

        {/* Title text rotated vertically */}
        <div
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            fontSize: Math.max(9, Math.min(11, width - 14)),
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            fontWeight: 600,
            lineHeight: 1.2,
            padding: "8px 4px",
            maxHeight: height - 16,
            overflow: "hidden",
            userSelect: "none",
          }}
        >
          {book.title}
        </div>

        {/* Star indicator at bottom of spine */}
        {book.rating > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            {Array.from({ length: book.rating }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.7)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  books: Book[];
}

const SHELF_SIZE = 10; // books per shelf row

export default function BookshelfView({ books }: Props) {
  const [selected, setSelected] = useState<Book | null>(null);

  if (books.length === 0) {
    return (
      <div className="text-center py-24">
        <BookOpen size={48} className="text-parchment-300 dark:text-dark-muted mx-auto mb-4" strokeWidth={1} />
        <h3 className="font-display text-xl text-ink dark:text-dark-text mb-2">Your shelf is empty</h3>
        <p className="font-sans text-sm text-ink-light dark:text-dark-subtle">
          Add some books to see them here.
        </p>
      </div>
    );
  }

  // Split into rows of SHELF_SIZE
  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += SHELF_SIZE) {
    rows.push(books.slice(i, i + SHELF_SIZE));
  }

  return (
    <>
      <div className="space-y-6">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx}>
            {/* Books sitting on shelf */}
            <div
              className="relative px-4 pt-6 pb-0"
              style={{
                background: "linear-gradient(to bottom, transparent 0%, rgba(92,61,30,0.04) 100%)",
                borderRadius: "8px 8px 0 0",
                perspective: "800px",
                perspectiveOrigin: "50% 120%",
              }}
            >
              <div className="flex items-end gap-1 min-h-[160px]">
                {row.map(book => (
                  <BookSpine
                    key={book.id}
                    book={book}
                    onClick={() => setSelected(book)}
                  />
                ))}
                {/* Bookend — right side */}
                <div
                  className="flex-shrink-0 ml-2"
                  style={{
                    width: 10,
                    height: 80,
                    background: "linear-gradient(to right, #5c3d1e, #7c5c38, #5c3d1e)",
                    borderRadius: "2px",
                    boxShadow: "2px 2px 6px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>

            {/* Shelf plank */}
            <div
              className="shelf-divider rounded-sm mx-0"
              style={{
                height: 20,
                boxShadow: "0 6px 16px rgba(92,61,30,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)",
              }}
            />

            {/* Shelf bracket */}
            <div className="flex justify-between px-1">
              {[0, 1].map(side => (
                <div
                  key={side}
                  style={{
                    width: 14,
                    height: 20,
                    background: "linear-gradient(to bottom, #7c5c38, #5c3d1e)",
                    borderRadius: side === 0 ? "0 0 0 4px" : "0 0 4px 0",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Hint */}
        <p className="font-sans text-xs text-center text-parchment-400 dark:text-dark-muted mt-4">
          Hover to pull a book — click to open it
        </p>
      </div>

      {/* Book detail modal */}
      {selected && (
        <BookModal book={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

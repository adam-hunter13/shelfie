"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, BookOpen, BookMarked, CheckCircle, ArrowUpDown, X, LayoutGrid, Library, Search } from "lucide-react";
import { Book, Reaction, ReadingStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import BookCard from "./BookCard";
import BookFormModal from "./BookFormModal";
import BookshelfView from "./BookshelfView";

const COVER_COLORS = [
  "#7c3626","#4a5e3a","#1c1209","#8b5e18","#2e5c7c","#5c2e7c",
  "#7c5c2e","#2e7c5c","#7c2e5c","#3a4a5e",
];

// ── Sort definitions ──────────────────────────────────────────
export type SortKey = "date_added" | "title" | "author" | "rating" | "recommended";
export type SortDir = "asc" | "desc";

export interface SortRule {
  key: SortKey;
  dir: SortDir;
}

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: "date_added",   label: "Date added",        defaultDir: "desc" },
  { key: "title",        label: "Title (A–Z)",        defaultDir: "asc"  },
  { key: "author",       label: "Author (A–Z)",       defaultDir: "asc"  },
  { key: "rating",       label: "Rating",             defaultDir: "desc" },
  { key: "recommended",  label: "Recommended first",  defaultDir: "desc" },
];

function applySort(books: Book[], rules: SortRule[]): Book[] {
  if (rules.length === 0) return books;
  return [...books].sort((a, b) => {
    for (const { key, dir } of rules) {
      let cmp = 0;
      if (key === "date_added") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (key === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (key === "author") {
        cmp = a.author.localeCompare(b.author);
      } else if (key === "rating") {
        cmp = a.rating - b.rating;
      } else if (key === "recommended") {
        cmp = (a.recommended === b.recommended ? 0 : a.recommended ? -1 : 1);
      }
      if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

interface Props {
  initialBooks: Book[];
  initialReactions: Reaction[];
  userId: string;
}

type Filter = "all" | ReadingStatus;

export default function BookshelfClient({ initialBooks, initialReactions, userId }: Props) {
  const supabase = createClient();
  const [books,     setBooks]     = useState<Book[]>(initialBooks);
  const [filter,    setFilter]    = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Book | null>(null);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [sortOpen,  setSortOpen]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [viewMode,  setViewMode]  = useState<"grid"|"shelf">("grid");
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);

  // Realtime reactions subscription
  useEffect(() => {
    const channel = supabase
      .channel("bookcard-reactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReactions((prev) => [...prev, payload.new as Reaction]);
          } else if (payload.eventType === "DELETE") {
            setReactions((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const stats = {
    total:   books.length,
    read:    books.filter((b) => b.status === "read").length,
    reading: books.filter((b) => b.status === "reading").length,
    want:    books.filter((b) => b.status === "want-to-read").length,
  };

  const displayed = useMemo(() => {
    let base = filter === "all" ? books : books.filter((b) => b.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return applySort(base, sortRules);
  }, [books, filter, sortRules, search]);

  // ── Sort helpers ────────────────────────────────────────────
  function addSort(key: SortKey) {
    if (sortRules.find((r) => r.key === key)) return;
    const opt = SORT_OPTIONS.find((o) => o.key === key)!;
    setSortRules((prev) => [...prev, { key, dir: opt.defaultDir }]);
  }

  function removeSort(key: SortKey) {
    setSortRules((prev) => prev.filter((r) => r.key !== key));
  }

  function toggleDir(key: SortKey) {
    setSortRules((prev) =>
      prev.map((r) => r.key === key ? { ...r, dir: r.dir === "asc" ? "desc" : "asc" } : r)
    );
  }

  function moveRule(from: number, to: number) {
    setSortRules((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // ── CRUD ────────────────────────────────────────────────────
  async function handleSave(data: Omit<Book, "id" | "user_id" | "created_at" | "updated_at">) {
    if (editing) {
      const { data: updated, error } = await supabase
        .from("books")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", editing.id)
        .select()
        .single();
      if (!error && updated)
        setBooks((prev) => prev.map((b) => (b.id === editing.id ? updated : b)));
    } else {
      const color = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
      const { data: inserted, error } = await supabase
        .from("books")
        .insert({ ...data, user_id: userId, cover_color: color })
        .select()
        .single();
      if (!error && inserted) setBooks((prev) => [inserted, ...prev]);
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await supabase.from("books").delete().eq("id", id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function openEdit(book: Book) { setEditing(book); setModalOpen(true); }

  const availableToAdd = SORT_OPTIONS.filter((o) => !sortRules.find((r) => r.key === o.key));

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">My Shelf</h1>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mt-1">
            {stats.total} {stats.total === 1 ? "book" : "books"} in your collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-parchment-100 dark:bg-dark-bg rounded-full p-1 border border-parchment-200 dark:border-dark-border">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={`p-1.5 rounded-full transition-all ${viewMode === "grid" ? "bg-white dark:bg-dark-surface text-ink dark:text-dark-text shadow-sm" : "text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("shelf")}
              title="Shelf view"
              className={`p-1.5 rounded-full transition-all ${viewMode === "shelf" ? "bg-white dark:bg-dark-surface text-ink dark:text-dark-text shadow-sm" : "text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text"}`}
            >
              <Library size={15} />
            </button>
          </div>

          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-ink text-parchment-50 font-sans text-sm font-medium px-5 py-2.5 rounded-full hover:bg-mahogany dark:hover:bg-mahogany transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add a book
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-parchment-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or tag…"
          className="w-full bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl pl-10 pr-10 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-400 hover:text-ink transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: CheckCircle, label: "Read",         value: stats.read,    status: "read"         as Filter },
          { icon: BookOpen,    label: "Reading",      value: stats.reading, status: "reading"      as Filter },
          { icon: BookMarked,  label: "Want to read", value: stats.want,    status: "want-to-read" as Filter },
        ].map(({ icon: Icon, label, value, status }) => (
          <button
            key={status}
            onClick={() => setFilter(filter === status ? "all" : status)}
            className={`rounded-xl p-4 border text-left transition-all ${
              filter === status
                ? "bg-ink text-parchment-50 border-ink"
                : "bg-white dark:bg-dark-surface border-parchment-200 dark:border-dark-border hover:border-parchment-400 dark:hover:border-dark-muted"
            }`}
          >
            <Icon size={18} className={filter === status ? "text-parchment-300 mb-2" : "text-mahogany dark:text-dark-mahogany mb-2"} strokeWidth={1.5} />
            <div className={`font-display text-2xl font-bold ${filter === status ? "text-parchment-100" : "text-ink dark:text-dark-text"}`}>{value}</div>
            <div className={`font-sans text-xs ${filter === status ? "text-parchment-400" : "text-ink-light dark:text-dark-subtle"}`}>{label}</div>
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Active sort pills */}
        {sortRules.map((rule, i) => {
          const opt = SORT_OPTIONS.find((o) => o.key === rule.key)!;
          return (
            <div
              key={rule.key}
              className="flex items-center gap-1 bg-ink text-parchment-100 rounded-full pl-2 pr-1 py-1 text-xs font-sans"
            >
              {/* Priority number */}
              {sortRules.length > 1 && (
                <span className="text-parchment-400 text-[10px] w-4 text-center">{i + 1}</span>
              )}
              {/* Move up/down */}
              {sortRules.length > 1 && (
                <span className="flex flex-col gap-0.5">
                  <button
                    onClick={() => i > 0 && moveRule(i, i - 1)}
                    disabled={i === 0}
                    className="leading-none text-parchment-400 hover:text-parchment-100 disabled:opacity-20"
                  >▲</button>
                  <button
                    onClick={() => i < sortRules.length - 1 && moveRule(i, i + 1)}
                    disabled={i === sortRules.length - 1}
                    className="leading-none text-parchment-400 hover:text-parchment-100 disabled:opacity-20"
                  >▼</button>
                </span>
              )}
              <span className="px-1">{opt.label}</span>
              {/* Direction toggle */}
              <button
                onClick={() => toggleDir(rule.key)}
                className="text-parchment-400 hover:text-parchment-100 px-1 transition-colors"
                title="Toggle direction"
              >
                {rule.key === "recommended"
                  ? null
                  : rule.dir === "asc" ? "↑" : "↓"}
              </button>
              {/* Remove */}
              <button
                onClick={() => removeSort(rule.key)}
                className="text-parchment-400 hover:text-parchment-100 transition-colors p-0.5"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {/* Add sort dropdown */}
        {availableToAdd.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className={`flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-full border transition-all ${
                sortOpen
                  ? "bg-parchment-200 border-parchment-400 text-ink"
                  : "bg-white border-parchment-300 text-ink-light hover:border-parchment-400 hover:text-ink"
              }`}
            >
              <ArrowUpDown size={12} />
              {sortRules.length === 0 ? "Sort" : "Add sort"}
            </button>
            {sortOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl shadow-soft dark:shadow-soft-dark overflow-hidden min-w-[180px]">
                {availableToAdd.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { addSort(opt.key); setSortOpen(false); }}
                    className="w-full text-left px-4 py-2.5 font-sans text-sm text-ink dark:text-dark-text hover:bg-parchment-100 dark:hover:bg-dark-border transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clear all sorts */}
        {sortRules.length > 0 && (
          <button
            onClick={() => setSortRules([])}
            className="font-sans text-xs text-ink-light hover:text-mahogany dark:text-dark-mahogany transition-colors underline underline-offset-2"
          >
            Clear
          </button>
        )}

        {/* Active filter label */}
        {filter !== "all" && (
          <span className="font-sans text-xs text-parchment-500 ml-auto">
            Showing: {filter === "want-to-read" ? "Want to read" : filter}
          </span>
        )}
      </div>

      {/* Shelf view */}
      {viewMode === "shelf" && (
        <BookshelfView books={displayed} />
      )}

      {/* Grid view */}
      {viewMode === "grid" && (<>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="text-center py-24">
          <BookOpen size={48} className="text-parchment-300 mx-auto mb-4" strokeWidth={1} />
          <h3 className="font-display text-xl text-ink dark:text-dark-text mb-2">
            {search ? "No books found" : "Your shelf is empty"}
          </h3>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mb-6">
            {search
              ? `No books match "${search}". Try a different search.`
              : filter === "all"
              ? "Add your first book to get started."
              : "No books in this category yet."}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={() => setModalOpen(true)}
              className="font-sans text-sm text-mahogany dark:text-dark-mahogany underline underline-offset-2 hover:text-ink transition-colors"
            >
              Add a book
            </button>
          )}
        </div>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayed.map((book, i) => (
          <BookCard
            key={book.id}
            book={book}
            stagger={i}
            onEdit={() => openEdit(book)}
            onDelete={() => handleDelete(book.id)}
            reactions={reactions.filter((r) => r.book_id === book.id)}
          />
        ))}
      </div>

      {displayed.length > 0 && (
        <div className="mt-10 h-5 shelf-divider rounded-sm w-full" />
      )}

      </>)}

      {modalOpen && (
        <BookFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { BookOpen, Star, Tag, Target, Trophy, TrendingUp, Edit3, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Book } from "@/types";

interface Goal {
  id: string;
  books_target: number | null;
  pages_target: number | null;
  genres_target: number | null;
}

interface Props {
  books: Book[];
  goal: Goal | null;
  userId: string;
  year: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PALETTE = ["#8b5e18","#7c3626","#4a5e3a","#2e5c7c","#5c2e7c","#7c5c2e","#2e7c5c","#3a4a5e","#7c2e5c","#8b6820"];

export default function StatsClient({ books, goal: initialGoal, userId, year }: Props) {
  const supabase = createClient();
  const [goal,        setGoal]        = useState<Goal | null>(initialGoal);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalBooks,   setGoalBooks]   = useState(initialGoal?.books_target?.toString()  ?? "");
  const [goalPages,   setGoalPages]   = useState(initialGoal?.pages_target?.toString()  ?? "");
  const [goalGenres,  setGoalGenres]  = useState(initialGoal?.genres_target?.toString() ?? "");
  const [savingGoal,  setSavingGoal]  = useState(false);

  // ── Derived stats ──────────────────────────────────────────
  const readBooks   = useMemo(() => books.filter(b => b.status === "read"), [books]);
  const thisYear    = useMemo(() => readBooks.filter(b => {
    const d = b.date_finished ?? b.updated_at;
    return new Date(d).getFullYear() === year;
  }), [readBooks, year]);

  const totalPages  = useMemo(() =>
    books.reduce((s, b) => s + (b.total_pages ?? 0), 0), [books]);

  const avgRating   = useMemo(() => {
    const rated = books.filter(b => b.rating > 0);
    return rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  }, [books]);

  const uniqueAuthors = useMemo(() =>
    new Set(books.map(b => b.author.toLowerCase())).size, [books]);

  // Books per month (this year)
  const perMonth = useMemo(() => {
    const counts = Array(12).fill(0);
    thisYear.forEach(b => {
      const d = b.date_finished ?? b.updated_at;
      counts[new Date(d).getMonth()]++;
    });
    return counts;
  }, [thisYear]);

  const maxMonth = Math.max(...perMonth, 1);

  // Rating distribution
  const ratingDist = useMemo(() => {
    return [5,4,3,2,1].map(r => ({
      rating: r,
      count: books.filter(b => b.rating === r).length,
    }));
  }, [books]);
  const maxRating = Math.max(...ratingDist.map(d => d.count), 1);

  // Genre/tag breakdown
  const tagDist = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach(b => (b.tags ?? []).forEach(t => map.set(t, (map.get(t) ?? 0) + 1)));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [books]);
  const maxTag = Math.max(...tagDist.map(d => d.count), 1);

  // Unique genres read this year
  const uniqueGenresThisYear = useMemo(() => {
    const set = new Set<string>();
    thisYear.forEach(b => (b.tags ?? []).forEach(t => set.add(t)));
    return set.size;
  }, [thisYear]);

  // Goal progress
  const currentMonth = new Date().getMonth() + 1;
  const expectedByNow = goal?.books_target
    ? Math.round((goal.books_target / 12) * currentMonth)
    : null;
  const paceStatus = expectedByNow !== null
    ? thisYear.length >= expectedByNow ? "ahead" : "behind"
    : null;

  async function saveGoal() {
    setSavingGoal(true);
    const payload = {
      user_id:       userId,
      year,
      books_target:  goalBooks  ? parseInt(goalBooks)  : null,
      pages_target:  goalPages  ? parseInt(goalPages)  : null,
      genres_target: goalGenres ? parseInt(goalGenres) : null,
    };

    const { data } = goal
      ? await supabase.from("reading_goals").update(payload).eq("id", goal.id).select().single()
      : await supabase.from("reading_goals").insert(payload).select().single();

    if (data) setGoal(data);
    setSavingGoal(false);
    setEditingGoal(false);
  }

  function GoalRing({ value, target, label, icon: Icon, color }: {
    value: number; target: number | null; label: string;
    icon: React.ElementType; color: string;
  }) {
    if (!target) return null;
    const pct    = Math.min(value / target, 1);
    const r      = 36;
    const circ   = 2 * Math.PI * r;
    const offset = circ * (1 - pct);
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor"
              strokeWidth="8" className="text-parchment-200 dark:text-dark-border" />
            <circle cx="44" cy="44" r={r} fill="none" stroke={color}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon size={14} style={{ color }} />
            <span className="font-display text-lg font-bold text-ink dark:text-dark-text leading-none mt-0.5">
              {value}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-sans text-xs font-medium text-ink dark:text-dark-text">{label}</p>
          <p className="font-sans text-xs text-ink-light dark:text-dark-subtle">of {target}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text">Stats & Goals</h1>
        <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mt-1">
          Your reading life in numbers
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: BookOpen, label: "Books read",    value: readBooks.length,  sub: "all time"      },
          { icon: Star,     label: "Avg rating",    value: avgRating,         sub: "across rated"  },
          { icon: TrendingUp,label:"Pages tracked", value: totalPages.toLocaleString(), sub: "total" },
          { icon: Tag,      label: "Authors read",  value: uniqueAuthors,     sub: "unique"        },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-4 shadow-sm">
            <Icon size={16} className="text-mahogany dark:text-dark-mahogany mb-2" strokeWidth={1.5} />
            <div className="font-display text-2xl font-bold text-ink dark:text-dark-text">{value}</div>
            <div className="font-sans text-xs text-ink-light dark:text-dark-subtle">{label}</div>
            <div className="font-sans text-xs text-parchment-400 dark:text-dark-muted">{sub}</div>
          </div>
        ))}
      </div>

      {/* Goals section */}
      <div className="bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-mahogany dark:text-dark-mahogany" strokeWidth={1.5} />
            <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text">
              {year} Goals
            </h2>
            {paceStatus && (
              <span className={`font-sans text-xs px-2 py-0.5 rounded-full ${
                paceStatus === "ahead"
                  ? "bg-moss/10 dark:bg-dark-moss/20 text-moss dark:text-dark-moss"
                  : "bg-mahogany/10 text-mahogany dark:text-dark-mahogany"
              }`}>
                {paceStatus === "ahead" ? "On track 🎉" : "Behind pace"}
              </span>
            )}
          </div>
          <button
            onClick={() => setEditingGoal(!editingGoal)}
            className="flex items-center gap-1.5 font-sans text-xs text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text transition-colors px-3 py-1.5 rounded-lg hover:bg-parchment-100 dark:hover:bg-dark-border"
          >
            <Edit3 size={13} />
            {goal ? "Edit goals" : "Set goals"}
          </button>
        </div>

        {/* Edit form */}
        {editingGoal && (
          <div className="bg-parchment-50 dark:bg-dark-bg rounded-xl p-4 mb-6 border border-parchment-200 dark:border-dark-border">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Books to read", value: goalBooks,   set: setGoalBooks,   placeholder: "e.g. 24" },
                { label: "Pages to read", value: goalPages,   set: setGoalPages,   placeholder: "e.g. 8000" },
                { label: "Genres to explore", value: goalGenres, set: setGoalGenres, placeholder: "e.g. 5" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5">{label}</label>
                  <input
                    type="number" min="0"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white dark:bg-dark-surface border border-parchment-300 dark:border-dark-border rounded-lg px-3 py-2 font-sans text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveGoal}
                disabled={savingGoal}
                className="flex items-center gap-1.5 bg-ink dark:bg-parchment-200 text-parchment-50 dark:text-ink font-sans text-xs px-4 py-2 rounded-lg hover:bg-mahogany dark:hover:bg-parchment-300 transition-colors"
              >
                <Check size={13} /> {savingGoal ? "Saving…" : "Save goals"}
              </button>
              <button
                onClick={() => setEditingGoal(false)}
                className="flex items-center gap-1.5 font-sans text-xs text-ink-light dark:text-dark-subtle px-4 py-2 rounded-lg hover:bg-parchment-100 dark:hover:bg-dark-border transition-colors"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Goal rings */}
        {(goal?.books_target || goal?.pages_target || goal?.genres_target) ? (
          <div className="flex flex-wrap gap-8 justify-around">
            <GoalRing value={thisYear.length}       target={goal.books_target}  label="Books read"       icon={BookOpen}    color="#7c3626" />
            <GoalRing value={totalPages}            target={goal.pages_target}  label="Pages read"       icon={TrendingUp}  color="#8b5e18" />
            <GoalRing value={uniqueGenresThisYear}  target={goal.genres_target} label="Genres explored"  icon={Tag}         color="#4a5e3a" />
          </div>
        ) : !editingGoal ? (
          <div className="text-center py-8">
            <Target size={36} className="mx-auto mb-3 text-parchment-300 dark:text-dark-muted" strokeWidth={1} />
            <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mb-3">
              No goals set for {year} yet.
            </p>
            <button
              onClick={() => setEditingGoal(true)}
              className="font-sans text-sm text-mahogany dark:text-dark-mahogany underline underline-offset-2 hover:text-ink dark:hover:text-dark-text transition-colors"
            >
              Set your {year} reading goals
            </button>
          </div>
        ) : null}
      </div>

      {/* Books per month bar chart */}
      <div className="bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text mb-1">
          Books finished in {year}
        </h2>
        <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mb-6">
          {thisYear.length} books finished this year
        </p>
        <div className="flex items-end gap-1.5 h-32">
          {perMonth.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${(count / maxMonth) * 100}%`,
                  minHeight: count > 0 ? "4px" : "2px",
                  backgroundColor: count > 0 ? "#7c3626" : "#f2dbb5",
                }}
                title={`${MONTHS[i]}: ${count} books`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          {MONTHS.map(m => (
            <div key={m} className="flex-1 text-center font-sans text-[10px] text-ink-light dark:text-dark-subtle">{m}</div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Rating distribution */}
        <div className="bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text mb-1">Rating breakdown</h2>
          <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mb-5">
            {books.filter(b => b.rating > 0).length} rated books
          </p>
          <div className="space-y-3">
            {ratingDist.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 w-20 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < rating ? "#8b5e18" : "#8b6820", fontSize: 13 }}>★</span>
                  ))}
                </div>
                <div className="flex-1 h-2 bg-parchment-100 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mahogany rounded-full transition-all"
                    style={{ width: `${(count / maxRating) * 100}%` }}
                  />
                </div>
                <span className="font-sans text-xs text-ink-light dark:text-dark-subtle w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Genre/tag breakdown */}
        <div className="bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text mb-1">Top genres</h2>
          <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mb-5">
            {tagDist.length} genres across your shelf
          </p>
          {tagDist.length === 0 ? (
            <p className="font-sans text-sm text-ink-light dark:text-dark-subtle italic">
              Add tags to your books to see genre stats.
            </p>
          ) : (
            <div className="space-y-3">
              {tagDist.map(({ tag, count }, i) => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="font-sans text-xs text-ink dark:text-dark-text capitalize w-24 truncate flex-shrink-0">
                    {tag}
                  </span>
                  <div className="flex-1 h-2 bg-parchment-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxTag) * 100}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                  <span className="font-sans text-xs text-ink-light dark:text-dark-subtle w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fun facts */}
      <div className="bg-ink dark:bg-dark-surface border border-transparent dark:border-dark-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-parchment-100 dark:text-dark-text mb-4">
          Reading highlights
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Most read author",
              value: (() => {
                const map = new Map<string, number>();
                books.forEach(b => map.set(b.author, (map.get(b.author) ?? 0) + 1));
                const top = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
                return top ? `${top[0]} (${top[1]})` : "—";
              })(),
            },
            {
              label: "Highest rated book",
              value: (() => {
                const top = [...books].sort((a, b) => b.rating - a.rating)[0];
                return top?.rating > 0 ? top.title : "—";
              })(),
            },
            {
              label: "Books recommended",
              value: books.filter(b => b.recommended).length,
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-sans text-xs text-parchment-400 dark:text-dark-muted mb-1">{label}</p>
              <p className="font-display text-parchment-100 dark:text-dark-text font-semibold leading-snug line-clamp-2">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

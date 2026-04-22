"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Star, ThumbsUp, Tag, Plus, Search, Loader2 } from "lucide-react";
import { Book, BookFormData, ReadingStatus } from "@/types";

interface Props {
  initial: Book | null;
  onSave: (data: BookFormData) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "read",          label: "Read"              },
  { value: "reading",       label: "Currently reading" },
  { value: "want-to-read",  label: "Want to read"      },
];

const PRESET_TAGS = [
  "Fiction","Non-fiction","Sci-fi","Fantasy","Mystery","Thriller",
  "Romance","Historical","Biography","Self-help","Philosophy",
  "Poetry","Classics","Horror","Graphic novel","Essays",
];

const AVATAR_COLORS = [
  "#7c3626","#4a5e3a","#2e5c7c","#5c2e7c","#8b5e18","#1c5c3a",
];

export default function BookFormModal({ initial, onSave, onClose }: Props) {
  const [title,        setTitle]        = useState(initial?.title        ?? "");
  const [author,       setAuthor]       = useState(initial?.author       ?? "");
  const [review,       setReview]       = useState(initial?.review       ?? "");
  const [rating,       setRating]       = useState(initial?.rating       ?? 0);
  const [hovered,      setHovered]      = useState(0);
  const [recommended,  setRecommended]  = useState(initial?.recommended  ?? false);
  const [status,       setStatus]       = useState<ReadingStatus>(initial?.status ?? "read");
  const [dateFinished, setDateFinished] = useState(initial?.date_finished ?? "");
  const [tags,         setTags]         = useState<string[]>(initial?.tags ?? []);
  const [tagInput,     setTagInput]     = useState("");
  const [progressType, setProgressType] = useState<"pages"|"percent"|null>(initial?.progress_type ?? null);
  const [currentPage,  setCurrentPage]  = useState<string>(initial?.current_page?.toString()  ?? "");
  const [totalPages,   setTotalPages]   = useState<string>(initial?.total_pages?.toString()   ?? "");
  const [progressPct,  setProgressPct]  = useState<string>(initial?.progress_percent?.toString() ?? "");
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Cover search
  const [coverUrl,      setCoverUrl]      = useState<string | null>(initial?.cover_url ?? null);
  const [coverSearch,   setCoverSearch]   = useState(false);
  const [coverLoading,  setCoverLoading]  = useState(false);
  const [coverResults,  setCoverResults]  = useState<string[]>([]);

  async function searchCovers() {
    if (!title.trim() && !author.trim()) return;
    setCoverLoading(true);
    setCoverSearch(true);
    setCoverResults([]);
    try {
      const q = encodeURIComponent(`${title} ${author}`.trim());
      const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=8&fields=cover_i,title,author_name`);
      const data = await res.json();
      const urls = (data.docs ?? [])
        .filter((d: { cover_i?: number }) => d.cover_i)
        .map((d: { cover_i: number }) => `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`);
      setCoverResults(urls.slice(0, 6));
    } catch { /* silent fail */ }
    setCoverLoading(false);
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function handleTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && !tagInput && tags.length) removeTag(tags[tags.length - 1]);
  }

  function computedProgress(): number | null {
    if (progressType === "percent") return progressPct ? Number(progressPct) : null;
    if (progressType === "pages" && currentPage && totalPages) {
      return Math.round((Number(currentPage) / Number(totalPages)) * 100);
    }
    return null;
  }

  function handleSave() {
    if (!title.trim() || !author.trim()) return;
    const pct = computedProgress();
    onSave({
      title: title.trim(),
      author: author.trim(),
      review: review.trim(),
      rating,
      recommended,
      status,
      cover_url:        coverUrl ?? null,
      cover_color:      initial?.cover_color ?? "#7c3626",
      progress_type:    status === "reading" ? progressType : null,
      current_page:     status === "reading" && progressType === "pages" && currentPage ? Number(currentPage) : null,
      total_pages:      status === "reading" && progressType === "pages" && totalPages   ? Number(totalPages)  : null,
      progress_percent: status === "reading" ? pct : null,
      date_finished:    status === "read" && dateFinished ? dateFinished : null,
      tags,
    });
  }

  const pct = computedProgress();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-parchment-50 dark:bg-dark-surface rounded-2xl shadow-book w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-parchment-200 dark:border-dark-border sticky top-0 bg-parchment-50 dark:bg-dark-surface z-10">
          <h2 className="font-display text-xl font-semibold text-ink dark:text-dark-text">
            {initial ? "Edit book" : "Add a book"}
          </h2>
          <button onClick={onClose} className="text-ink-light hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
              Book title <span className="text-mahogany dark:text-dark-mahogany">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Shadow of the Wind"
              className="w-full bg-white dark:bg-dark-bg border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
              Author <span className="text-mahogany dark:text-dark-mahogany">*</span>
            </label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Carlos Ruiz Zafón"
              className="w-full bg-white dark:bg-dark-bg border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
            />
          </div>

          {/* Book cover search */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">Book cover</label>
            <div className="flex gap-2 items-start">
              {/* Current cover or placeholder */}
              <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border border-parchment-200 bg-parchment-100 flex items-center justify-center">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex-shrink-0 rounded-lg" style={{ backgroundColor: initial?.cover_color ?? "#7c3626" }} />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button
                  onClick={searchCovers}
                  disabled={coverLoading || (!title.trim() && !author.trim())}
                  className="flex items-center gap-2 font-sans text-xs bg-white border border-parchment-300 rounded-xl px-3 py-2 text-ink-light hover:border-mahogany hover:text-ink disabled:opacity-40 transition"
                >
                  {coverLoading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  {coverLoading ? "Searching…" : "Search for cover"}
                </button>
                {coverUrl && (
                  <button onClick={() => { setCoverUrl(null); setCoverSearch(false); }} className="block font-sans text-xs text-mahogany dark:text-dark-mahogany underline underline-offset-2">
                    Remove cover
                  </button>
                )}
                <p className="font-sans text-xs text-parchment-400">Uses title & author to search Open Library</p>
              </div>
            </div>

            {/* Cover results grid */}
            {coverSearch && (
              <div className="mt-3">
                {coverResults.length > 0 ? (
                  <div className="grid grid-cols-6 gap-2">
                    {coverResults.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => { setCoverUrl(url); setCoverSearch(false); }}
                        className={`rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${coverUrl === url ? "border-mahogany" : "border-transparent"}`}
                      >
                        <img src={url} alt={`Cover option ${i + 1}`} className="w-full aspect-[2/3] object-cover" />
                      </button>
                    ))}
                  </div>
                ) : !coverLoading ? (
                  <p className="font-sans text-xs text-parchment-400 italic">No covers found — try adjusting the title or author.</p>
                ) : null}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">Reading status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-all ${
                    status === opt.value
                      ? "bg-ink text-parchment-50 border-ink"
                      : "bg-white border-parchment-300 text-ink-light hover:border-ink-light"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading progress — only shown when status = reading */}
          {status === "reading" && (
            <div className="bg-parchment-100 dark:bg-dark-bg rounded-xl p-4 space-y-3">
              <label className="block font-sans text-xs text-ink-light tracking-wide">Reading progress</label>
              <div className="flex gap-2">
                {(["pages", "percent"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setProgressType(progressType === type ? null : type)}
                    className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-all ${
                      progressType === type
                        ? "bg-ink text-parchment-50 border-ink"
                        : "bg-white border-parchment-300 text-ink-light hover:border-ink-light"
                    }`}
                  >
                    {type === "pages" ? "By page" : "By %"}
                  </button>
                ))}
              </div>

              {progressType === "pages" && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block font-sans text-xs text-ink-light mb-1">Current page</label>
                    <input
                      type="number" min="0"
                      value={currentPage}
                      onChange={e => setCurrentPage(e.target.value)}
                      placeholder="e.g. 142"
                      className="w-full bg-white dark:bg-dark-surface border border-parchment-300 dark:border-dark-border rounded-lg px-3 py-2 font-sans text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
                    />
                  </div>
                  <span className="text-ink-light font-sans text-sm mt-4">of</span>
                  <div className="flex-1">
                    <label className="block font-sans text-xs text-ink-light mb-1">Total pages</label>
                    <input
                      type="number" min="1"
                      value={totalPages}
                      onChange={e => setTotalPages(e.target.value)}
                      placeholder="e.g. 480"
                      className="w-full bg-white dark:bg-dark-surface border border-parchment-300 dark:border-dark-border rounded-lg px-3 py-2 font-sans text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
                    />
                  </div>
                </div>
              )}

              {progressType === "percent" && (
                <div>
                  <label className="block font-sans text-xs text-ink-light mb-1">Percentage complete</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min="0" max="100"
                      value={progressPct}
                      onChange={e => setProgressPct(e.target.value)}
                      placeholder="e.g. 65"
                      className="w-24 bg-white border border-parchment-300 rounded-lg px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
                    />
                    <span className="font-sans text-sm text-ink-light">%</span>
                  </div>
                </div>
              )}

              {/* Progress bar preview */}
              {pct !== null && pct >= 0 && (
                <div>
                  <div className="flex justify-between font-sans text-xs text-ink-light mb-1">
                    <span>Progress</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-parchment-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mahogany rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date finished — only when status = read */}
          {status === "read" && (
            <div>
              <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
                Date finished <span className="text-parchment-400">(optional)</span>
              </label>
              <input
                type="date"
                value={dateFinished}
                onChange={e => setDateFinished(e.target.value)}
                className="bg-white border border-parchment-300 rounded-xl px-4 py-3 font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
              Tags / genres
            </label>
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(preset => {
                const active = tags.includes(preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    onClick={() => active ? removeTag(preset.toLowerCase()) : addTag(preset)}
                    className={`font-sans text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-mahogany/15 border-mahogany text-mahogany dark:text-dark-mahogany"
                        : "bg-white border-parchment-200 text-ink-light hover:border-parchment-400"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            {/* Custom tag input */}
            <div className="flex items-center gap-2 bg-white border border-parchment-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-mahogany/30 focus-within:border-mahogany transition flex-wrap min-h-[44px]">
              <Tag size={13} className="text-parchment-400 flex-shrink-0" />
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-parchment-200 text-ink font-sans text-xs px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-ink-light hover:text-mahogany dark:text-dark-mahogany transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                placeholder={tags.length === 0 ? "Add custom tag…" : ""}
                className="flex-1 min-w-[100px] bg-transparent font-sans text-sm text-ink placeholder-parchment-400 focus:outline-none"
              />
              {tagInput && (
                <button onClick={() => addTag(tagInput)} className="text-mahogany dark:text-dark-mahogany hover:text-ink transition-colors">
                  <Plus size={14} />
                </button>
              )}
            </div>
            <p className="font-sans text-xs text-parchment-400 mt-1">Press Enter or comma to add a custom tag</p>
          </div>

          {/* Star rating */}
          <div>
            <label className="block font-sans text-xs text-ink-light mb-2 tracking-wide">Rating</label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const val = i + 1;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHovered(val)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(rating === val ? 0 : val)}
                    className="transition-transform hover:scale-125"
                  >
                    <Star
                      size={24}
                      fill={(hovered || rating) >= val ? "#8b5e18" : "none"}
                      className={(hovered || rating) >= val ? "star-filled" : "star-empty"}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="font-sans text-xs text-ink-light ml-2">
                  {["","Poor","Fair","Good","Great","Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">Your review</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="What did you think? Any passages that stayed with you?"
              rows={4}
              className="w-full bg-white dark:bg-dark-bg border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-body text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition resize-none leading-relaxed"
            />
          </div>

          {/* Recommend toggle */}
          <button
            onClick={() => setRecommended(!recommended)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              recommended
                ? "bg-moss/10 dark:bg-dark-moss/20 border-moss text-moss dark:text-dark-moss"
                : "bg-white border-parchment-300 text-ink-light hover:border-ink-light"
            }`}
          >
            <ThumbsUp size={16} strokeWidth={2} />
            <span className="font-sans text-sm">
              {recommended ? "You'd recommend this book" : "Would you recommend this book?"}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-parchment-200 dark:border-dark-border flex justify-end gap-3 sticky bottom-0 bg-parchment-50 dark:bg-dark-surface">
          <button
            onClick={onClose}
            className="font-sans text-sm text-ink-light hover:text-ink px-4 py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !author.trim()}
            className="font-sans text-sm bg-ink text-parchment-50 px-6 py-2 rounded-xl hover:bg-mahogany disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {initial ? "Save changes" : "Add to shelf"}
          </button>
        </div>
      </div>
    </div>
  );
}

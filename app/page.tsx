import Link from "next/link";
import { BookOpen, Star, Bookmark, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-warm-gradient relative overflow-hidden">

      {/* Decorative circles */}
      <div className="absolute top-[-120px] right-[-120px] w-[480px] h-[480px] rounded-full bg-parchment-300 opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-parchment-400 opacity-20 blur-2xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="text-mahogany dark:text-dark-mahogany" size={28} strokeWidth={1.5} />
          <span className="font-display text-2xl font-bold text-ink">Shelfie</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="font-sans text-sm text-ink-light hover:text-mahogany dark:text-dark-mahogany transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth?tab=signup"
            className="font-sans text-sm bg-mahogany text-parchment-50 px-5 py-2 rounded-full hover:bg-ink transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-20 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="font-sans text-xs tracking-[0.25em] uppercase text-parchment-500 mb-4">
            Your personal reading life
          </p>
          <h1 className="font-display text-6xl lg:text-7xl font-bold text-ink leading-[1.05] mb-6">
            Every book<br />
            <em className="text-mahogany dark:text-dark-mahogany font-normal">deserves</em> a<br />
            home.
          </h1>
          <p className="font-body text-lg text-ink-light leading-relaxed mb-10 max-w-md">
            Shelfie is your cozy digital bookshelf. Track what you&apos;ve read,
            write honest reviews, and curate a collection that&apos;s entirely yours.
          </p>
          <Link
            href="/auth?tab=signup"
            className="inline-flex items-center gap-2 bg-ink text-parchment-50 font-sans font-medium px-8 py-4 rounded-full hover:bg-mahogany transition-colors shadow-book text-sm"
          >
            <BookOpen size={16} />
            Build your shelf — it&apos;s free
          </Link>
        </div>

        {/* Decorative book stack */}
        <div className="hidden lg:flex flex-col items-center gap-1 select-none">
          {[
            { color: "#7c3626", title: "The Shadow of the Wind", h: "h-36" },
            { color: "#4a5e3a", title: "Piranesi",              h: "h-28" },
            { color: "#1c1209", title: "Normal People",         h: "h-32" },
            { color: "#8b5e18", title: "The Midnight Library",  h: "h-24" },
          ].map((book, i) => (
            <div
              key={i}
              className={`w-48 ${book.h} rounded-sm flex items-center justify-center shadow-book`}
              style={{ backgroundColor: book.color, animationDelay: `${i * 0.1}s` }}
            >
              <span className="font-display text-parchment-100 text-xs text-center px-4 leading-snug opacity-80">
                {book.title}
              </span>
            </div>
          ))}
          {/* Shelf */}
          <div className="w-56 h-4 shelf-divider rounded-sm mt-1" />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 bg-ink/5 backdrop-blur-sm border-t border-parchment-300">
        <div className="max-w-6xl mx-auto px-8 py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: BookOpen, label: "Track every book", desc: "Log books you've read, are reading, or want to read." },
            { icon: Star,     label: "Honest reviews",   desc: "Write personal reviews and 5-star ratings for each title." },
            { icon: Bookmark, label: "Recommend picks",  desc: "Mark books you'd recommend and build a curated list." },
            { icon: Users,    label: "Your shelf only",  desc: "Private, personal, and perfectly yours — no noise." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-mahogany/10 flex items-center justify-center">
                <Icon size={18} className="text-mahogany dark:text-dark-mahogany" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-semibold text-ink text-lg">{label}</h3>
              <p className="font-sans text-sm text-ink-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

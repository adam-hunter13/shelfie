"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AuthPage() {
  const params     = useSearchParams();
  const router     = useRouter();
  const supabase   = createClient();

  const [tab, setTab]         = useState<"signin" | "signup">(
    params.get("tab") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { setError(null); setMessage(null); }, [tab]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    if (tab === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation is off — session is returned immediately
        router.push("/dashboard");
      } else {
        // Email confirmation is on — ask them to check inbox
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-warm-gradient dark:bg-dark-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <BookOpen className="text-mahogany dark:text-dark-mahogany" size={28} strokeWidth={1.5} />
          <span className="font-display text-3xl font-bold text-ink">Shelfie</span>
        </Link>

        {/* Card */}
        <div className="bg-parchment-50 dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl shadow-soft dark:shadow-soft-dark p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-parchment-100 dark:bg-dark-bg p-1 mb-8">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-sans font-medium rounded-lg transition-all ${
                  tab === t
                    ? "bg-white dark:bg-dark-surface text-ink dark:text-dark-text shadow-sm"
                    : "text-ink-light dark:text-dark-subtle hover:text-ink dark:hover:text-dark-text"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-text mb-1">
            {tab === "signin" ? "Welcome back" : "Start your shelf"}
          </h2>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mb-6">
            {tab === "signin"
              ? "Sign in to see your bookshelf."
              : "Create a free account to get started."}
          </p>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white dark:bg-dark-bg border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
              />
            </div>
            <div>
              <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-white dark:bg-dark-bg border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 pr-10 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-500 hover:text-ink transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {error   && <p className="mt-4 text-sm font-sans text-mahogany dark:text-dark-mahogany bg-mahogany/8 rounded-lg px-3 py-2">{error}</p>}
          {message && <p className="mt-4 text-sm font-sans text-moss dark:text-dark-moss bg-moss/8 rounded-lg px-3 py-2">{message}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="mt-6 w-full bg-ink text-parchment-50 font-sans font-medium text-sm py-3 rounded-xl hover:bg-mahogany disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Just a moment…" : tab === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>

        <p className="mt-6 text-center font-sans text-xs text-ink-light dark:text-dark-subtle">
          {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
            className="text-mahogany dark:text-dark-mahogany underline underline-offset-2 hover:text-ink transition-colors"
          >
            {tab === "signin" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function AuthPageWrapper() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, LogOut, Users, UserCircle, Menu, X, Sparkles, BarChart2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";
import { Profile } from "@/types";

export default function DashboardNav({ email }: { email: string }) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [open,       setOpen]       = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [pending,    setPending]    = useState(0);
  const [profile,    setProfile]    = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count }, { data: prof }] = await Promise.all([
        supabase
          .from("friendships")
          .select("*", { count: "exact", head: true })
          .eq("addressee_id", user.id)
          .eq("status", "pending"),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      if (mounted) {
        setPending(count ?? 0);
        setProfile(prof);
      }
    }

    load();

    const channel = supabase
      .channel("nav-friendships")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, load)
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenu(false); setOpen(false); }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const navLink = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return `font-sans text-sm transition-colors px-3 py-1.5 rounded-lg ${
      active
        ? "bg-white/10 text-parchment-100"
        : "text-parchment-400 hover:text-parchment-100"
    }`;
  };

  const mobileNavLink = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return `flex items-center gap-2 font-sans text-sm px-4 py-3 transition-colors ${
      active
        ? "text-parchment-100 bg-white/10"
        : "text-parchment-300 hover:text-parchment-100 hover:bg-white/5"
    }`;
  };

  const avatarName  = profile?.display_name || email;
  const avatarColor = profile?.avatar_color ?? "#7c3626";

  return (
    <header className="bg-ink sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">

        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="text-parchment-300" size={22} strokeWidth={1.5} />
            <span className="font-display text-xl font-bold text-parchment-100">Shelfie</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/dashboard" className={navLink("/dashboard", true)}>
              My Shelf
            </Link>
            <Link href="/dashboard/friends" className={navLink("/dashboard/friends")}>
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                Friends
                {pending > 0 && (
                  <span className="bg-mahogany text-parchment-50 text-xs font-sans rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {pending}
                  </span>
                )}
              </span>
            </Link>
            <Link href="/dashboard/recommendations" className={navLink("/dashboard/recommendations")}>
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} />
                Recommendations
              </span>
            </Link>
            <Link href="/dashboard/stats" className={navLink("/dashboard/stats")}>
              <span className="flex items-center gap-1.5">
                <BarChart2 size={14} />
                Stats
              </span>
            </Link>
          </nav>
        </div>

        {/* Right: avatar (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">

          {/* Desktop user menu */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 text-parchment-300 hover:text-parchment-100 transition-colors"
            >
              <Avatar name={avatarName} color={avatarColor} size="sm" />
              <span className="font-sans text-xs max-w-[140px] truncate text-parchment-300">
                {profile?.display_name || email}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-parchment-50 border border-parchment-200 rounded-xl shadow-soft overflow-hidden">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-sans text-ink hover:bg-parchment-100 transition-colors"
                >
                  <UserCircle size={14} className="text-mahogany dark:text-dark-mahogany" />
                  Edit profile
                </Link>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-sans text-ink hover:bg-parchment-100 transition-colors border-t border-parchment-200"
                >
                  <LogOut size={14} className="text-mahogany dark:text-dark-mahogany" />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="sm:hidden text-parchment-300 hover:text-parchment-100 transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenu && (
        <div className="sm:hidden bg-ink border-t border-white/10 pb-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Avatar name={avatarName} color={avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="font-sans text-sm text-parchment-100 truncate">
                {profile?.display_name || email}
              </p>
              {profile?.display_name && (
                <p className="font-sans text-xs text-parchment-400 truncate">{email}</p>
              )}
            </div>
          </div>

          {/* Nav links */}
          <Link href="/dashboard" className={mobileNavLink("/dashboard", true)}>
            <BookOpen size={15} /> My Shelf
          </Link>
          <Link href="/dashboard/friends" className={mobileNavLink("/dashboard/friends")}>
            <Users size={15} />
            Friends
            {pending > 0 && (
              <span className="bg-mahogany text-parchment-50 text-xs font-sans rounded-full w-4 h-4 flex items-center justify-center leading-none ml-1">
                {pending}
              </span>
            )}
          </Link>
          <Link href="/dashboard/recommendations" className={mobileNavLink("/dashboard/recommendations")}>
            <Sparkles size={15} /> Recommendations
          </Link>
          <Link href="/dashboard/stats" className={mobileNavLink("/dashboard/stats")}>
            <BarChart2 size={15} /> Stats & Goals
          </Link>
          <Link href="/dashboard/profile" className={mobileNavLink("/dashboard/profile")}>
            <UserCircle size={15} /> Edit profile
          </Link>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-3 font-sans text-sm text-parchment-400 hover:text-parchment-100 hover:bg-white/5 transition-colors border-t border-white/10 mt-1"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </header>
  );
}

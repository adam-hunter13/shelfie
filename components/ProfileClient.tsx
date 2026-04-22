"use client";

import { useState } from "react";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import Avatar from "./Avatar";
import { useTheme } from "./ThemeProvider";
import { usePushNotifications } from "@/lib/usePushNotifications";

const AVATAR_COLORS = [
  "#7c3626","#4a5e3a","#2e5c7c","#5c2e7c",
  "#8b5e18","#1c5c3a","#7c5c2e","#3a3a5e",
];

interface Props {
  profile: Profile;
  email: string;
}

export default function ProfileClient({ profile, email }: Props) {
  const supabase = createClient();
  const { theme, setTheme, systemTheme } = useTheme();

  const { supported, permission, subscribed, loading: pushLoading, register, unregister } = usePushNotifications();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [color,       setColor]       = useState(profile?.avatar_color ?? AVATAR_COLORS[0]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  const previewName = displayName.trim() || email;

  async function save() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null, avatar_color: color })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const themeOptions: { value: "light" | "dark"; icon: React.ReactNode; label: string; sub: string }[] = [
    { value: "light", icon: <Sun size={16} />,     label: "Light",  sub: "Warm parchment"   },
    { value: "dark",  icon: <Moon size={16} />,    label: "Dark",   sub: "Candlelit dark"   },
  ];

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-4xl font-bold text-ink dark:text-dark-text mb-2">Profile</h1>
      <p className="font-sans text-sm text-ink-light dark:text-dark-subtle mb-8">
        How you appear to friends on Shelfie.
      </p>

      {/* Preview */}
      <div className="flex items-center gap-4 bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-2xl p-5 mb-8 shadow-sm">
        <Avatar name={previewName} color={color} size="lg" />
        <div>
          <p className="font-display text-lg font-semibold text-ink dark:text-dark-text">
            {displayName.trim() || <span className="text-parchment-400 dark:text-dark-muted font-normal italic">No display name</span>}
          </p>
          <p className="font-sans text-sm text-ink-light dark:text-dark-subtle">{email}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Display name */}
        <div>
          <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-1.5 tracking-wide">
            Display name
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={email.split("@")[0]}
            maxLength={40}
            className="w-full bg-white dark:bg-dark-surface border border-parchment-300 dark:border-dark-border rounded-xl px-4 py-3 font-sans text-sm text-ink dark:text-dark-text placeholder-parchment-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-mahogany/30 focus:border-mahogany transition"
          />
          <p className="font-sans text-xs text-parchment-400 dark:text-dark-muted mt-1">
            Shown to friends instead of your email address.
          </p>
        </div>

        {/* Avatar color */}
        <div>
          <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-2 tracking-wide">
            Avatar color
          </label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mahogany"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-2 tracking-wide">
            Appearance
          </label>
          <p className="font-sans text-xs text-parchment-400 dark:text-dark-muted mb-3">
            System preference: <span className="font-medium capitalize">{systemTheme}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  theme === opt.value
                    ? "bg-ink dark:bg-parchment-200 border-ink dark:border-parchment-200 text-parchment-50 dark:text-ink"
                    : "bg-white dark:bg-dark-surface border-parchment-200 dark:border-dark-border text-ink-light dark:text-dark-subtle hover:border-parchment-400 dark:hover:border-dark-muted"
                }`}
              >
                <span className={theme === opt.value ? "opacity-100" : "opacity-50"}>
                  {opt.icon}
                </span>
                <div>
                  <p className="font-sans text-sm font-medium">{opt.label}</p>
                  <p className="font-sans text-xs opacity-60">{opt.sub}</p>
                </div>
                {theme === opt.value && (
                  <Check size={14} strokeWidth={3} className="ml-auto" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("shelfie-theme");
              setTheme(systemTheme);
            }}
            className="mt-2 font-sans text-xs text-ink-light dark:text-dark-subtle underline underline-offset-2 hover:text-mahogany dark:text-dark-mahogany transition-colors"
          >
            Reset to system default
          </button>
        </div>

        {/* Push notifications */}
        {supported && (
          <div>
            <label className="block font-sans text-xs text-ink-light dark:text-dark-subtle mb-2 tracking-wide">
              Push notifications
            </label>
            <div className="flex items-center justify-between bg-white dark:bg-dark-surface border border-parchment-200 dark:border-dark-border rounded-xl px-4 py-3">
              <div>
                <p className="font-sans text-sm text-ink dark:text-dark-text font-medium">
                  {subscribed ? "Notifications enabled" : "Notifications disabled"}
                </p>
                <p className="font-sans text-xs text-ink-light dark:text-dark-subtle mt-0.5">
                  {permission === "denied"
                    ? "Blocked in browser settings — please allow manually."
                    : subscribed
                    ? "You'll be notified about friend activity."
                    : "Get notified about reactions, requests, and more."}
                </p>
              </div>
              <button
                onClick={subscribed ? unregister : register}
                disabled={pushLoading || permission === "denied"}
                className={`ml-4 flex-shrink-0 font-sans text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
                  subscribed
                    ? "bg-parchment-100 dark:bg-dark-border text-ink-light dark:text-dark-subtle hover:bg-parchment-200"
                    : "bg-ink dark:bg-parchment-200 text-parchment-50 dark:text-ink hover:bg-mahogany"
                }`}
              >
                {pushLoading ? "…" : subscribed ? "Turn off" : "Turn on"}
              </button>
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-ink dark:bg-parchment-200 text-parchment-50 dark:text-ink font-sans text-sm font-medium px-6 py-3 rounded-xl hover:bg-mahogany dark:hover:bg-parchment-300 disabled:opacity-40 transition-colors"
        >
          {saved ? <><Check size={15} /> Saved!</> : saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

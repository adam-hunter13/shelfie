"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; setTheme: (t: Theme) => void; systemTheme: Theme };

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  systemTheme: "light",
});

export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemTheme, setSystemTheme] = useState<Theme>("light");
  const [override,    setOverride]    = useState<Theme | null>(null);

  useEffect(() => {
    // Read system preference
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);

    // Read stored override
    const stored = localStorage.getItem("shelfie-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setOverride(stored);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme: Theme = override ?? systemTheme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  function setTheme(t: Theme) {
    setOverride(t);
    localStorage.setItem("shelfie-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

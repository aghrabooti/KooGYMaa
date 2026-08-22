"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_THEME, THEMES, type Theme } from "./theme-config";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const COOKIE_NAME = "theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookieTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const match = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  const value = match?.[1];
  return THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;
}

function applyToDocument(theme: Theme) {
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const initial = readCookieTheme();
    setThemeState(initial);
    applyToDocument(initial);
  }, []);

  const setTheme = (next: Theme) => {
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    setThemeState(next);
    applyToDocument(next);
    router.refresh();
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

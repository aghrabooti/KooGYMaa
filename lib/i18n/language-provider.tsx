"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  createT,
  DEFAULT_LOCALE,
  DIRECTION,
  LOCALES,
  type Locale,
} from "./translations";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const value = match?.[1];
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

function applyToDocument(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = DIRECTION[locale];
  root.classList.toggle("locale-fa", locale === "fa");
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Sync initial state from the cookie on mount (avoids a flash of English
  // if the user previously chose Persian). Done in an effect so it runs after
  // hydration and never triggers a hydration mismatch warning.
  useEffect(() => {
    const initial = readCookieLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(initial);
    applyToDocument(initial);
  }, []);

  const setLocale = (next: Locale) => {
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    setLocaleState(next);
    applyToDocument(next);
    router.refresh(); // re-render Server Components with the new locale
  };

  const t = useCallback<Translate>(
    (key, vars) => createT(locale)(key, vars),
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT(): Translate {
  return useI18n().t;
}

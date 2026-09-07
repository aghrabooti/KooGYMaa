"use client";

import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/translations";
import { useI18n, useT } from "@/lib/i18n/language-provider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const t = useT();

  return (
    <div
      className={`language-switcher ${className}`.trim()}
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((code: Locale) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          className={locale === code ? "active" : ""}
          onClick={() => setLocale(code)}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}

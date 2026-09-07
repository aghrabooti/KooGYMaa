"use client";

import { Icon } from "@/components/icon";
import { useT } from "@/lib/i18n/language-provider";
import { useTheme } from "@/lib/theme/theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={theme === "dark" ? t("common.themeToLight") : t("common.themeToDark")}
      onClick={() => setTheme(next)}
    >
      <Icon name={next === "dark" ? "moon" : "sun"} size={16} />
    </button>
  );
}

"use client";

import { Icon } from "@/components/icon";
import { useTheme } from "@/lib/theme/theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(next)}
    >
      <Icon name={next === "dark" ? "moon" : "sun"} size={16} />
    </button>
  );
}

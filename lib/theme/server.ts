import { cookies } from "next/headers";
import { DEFAULT_THEME, THEMES, type Theme } from "./theme-config";

// Reads the active theme from the `theme` cookie (set by the client
// ThemeToggle). Defaults to light. Awaitable for Server Components.
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get("theme")?.value;
  return THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;
}

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./translations";

// Reads the active locale from the `locale` cookie (set by the client
// LanguageSwitcher). Defaults to English. Awaitable so it works in Server
// Components and Route Handlers.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

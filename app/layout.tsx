import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { getLocale } from "@/lib/i18n/server";
import { DIRECTION } from "@/lib/i18n/translations";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { getTheme } from "@/lib/theme/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Estedad — modern Persian/Arabic sans (OFL, https://github.com/aminabedi68/Estedad).
// Self-hosted single variable file (wght 100–900) so it loads without Google Fonts.
const estedad = localFont({
  src: "../public/fonts/Estedad-Variable.woff2",
  weight: "100 900",
  variable: "--font-estedad",
  display: "swap",
  fallback: ["Vazirmatn", "Tahoma", "Segoe UI", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "KooGYMaa — Move better. Manage smarter.",
    template: "%s | KooGYMaa",
  },
  description:
    "One powerful workspace for gyms, trainers, and members to manage training, progress, and community.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const theme = await getTheme();
  const dir = DIRECTION[locale];

  return (
    <html
      lang={locale}
      dir={dir}
      className={[
        inter.variable,
        estedad.variable,
        locale === "fa" ? "locale-fa" : "",
        theme === "dark" ? "theme-dark" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

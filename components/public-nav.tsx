import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getLocale } from "@/lib/i18n/server";
import { createT } from "@/lib/i18n/translations";

type PublicNavProps = {
  /** Optional "back" link shown on desktop next to the brand. */
  backHref?: string;
  backLabel?: string;
};

/** Top bar for public content pages (about, gyms, trainers, help, …). */
export async function PublicNav({ backHref = "/", backLabel }: PublicNavProps) {
  const t = createT(await getLocale());
  const items = [
    { href: "/gyms", label: t("nav.discoverGyms"), icon: "building" as const },
    { href: "/trainers", label: t("nav.findTrainers"), icon: "dumbbell" as const },
    { href: "/about", label: t("public.aboutTitle"), icon: "sparkles" as const },
    { href: "/help", label: t("public.helpTitle"), icon: "shield" as const },
    { href: "/contact", label: t("public.contactTitle"), icon: "bell" as const },
  ];
  return (
    <nav aria-label="Public navigation" className="public-nav">
      <Brand />
      <div className="public-nav__links">
        {items.slice(0, 3).map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
      <div className="public-nav__actions">
        <Link className="public-nav__back" href={backHref}>← {backLabel ?? t("nav.home")}</Link>
        <LanguageSwitcher className="public-language" />
        <ThemeToggle className="public-theme" />
        <Link className="button button--lime button--small" href="/login">{t("landing.logIn")} <Icon name="arrow" size={15} /></Link>
        <MobileMenu
          className="public-hamburger"
          footer={
            <div className="mobile-drawer__cta">
              <Link className="button button--lime" href="/register">{t("landing.getStarted")} <Icon name="arrow" size={16} /></Link>
              <Link className="button button--ghost" href="/login">{t("landing.logIn")}</Link>
            </div>
          }
          identity={<Brand className="mobile-drawer__brand" />}
          items={[{ href: "/", label: t("nav.home"), icon: "grid" as const }, ...items]}
        />
      </div>
    </nav>
  );
}

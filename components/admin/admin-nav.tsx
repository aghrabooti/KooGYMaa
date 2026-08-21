"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/language-provider";

type AdminNavProps = {
  gym: { city: string | null; id: string; name: string };
  pendingCount: number;
  user: { name: string };
};

const items: Array<{ href: string; icon: IconName; labelKey: string }> = [
  { href: "", icon: "grid", labelKey: "nav.overview" },
  { href: "/members", icon: "users", labelKey: "nav.members" },
  { href: "/trainers", icon: "dumbbell", labelKey: "nav.trainers" },
  { href: "/plans", icon: "clipboard", labelKey: "nav.plans" },
  { href: "/subscriptions", icon: "credit-card", labelKey: "nav.subscriptions" },
  { href: "/payments", icon: "shield", labelKey: "nav.payments" },
  { href: "/settings", icon: "settings", labelKey: "nav.gymSettings" },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AdminNav({ gym, pendingCount, user }: AdminNavProps) {
  const pathname = usePathname();
  const t = useT();
  const base = `/admin/gyms/${gym.id}`;

  return (
    <>
      <aside className="admin-sidebar">
        <Brand light />
        <Link className="admin-workspace" href="/admin/gyms">
          <span className="admin-workspace__mark"><Icon name="building" size={18} /></span>
          <span><strong>{gym.name}</strong><small>{gym.city || t("nav.locationNotSet")}</small></span>
          <Icon name="chevron" size={15} />
        </Link>

        <nav className="admin-nav" aria-label="Gym administration">
          <small>{t("nav.gymManagement")}</small>
          {items.map((item) => {
            const href = `${base}${item.href}`;
            const active = item.href ? pathname.startsWith(href) : pathname === base;
            return (
              <Link className={`admin-nav__item ${active ? "active" : ""}`} href={href} key={item.labelKey}>
                <Icon name={item.icon} size={19} />
                <span>{t(item.labelKey)}</span>
                {item.labelKey === "nav.members" && pendingCount > 0 && <b>{pendingCount}</b>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <div className="admin-user-card">
            <span>{initials(user.name)}</span>
            <div><strong>{user.name}</strong><small>{t("nav.gymAdministrator")}</small></div>
          </div>
          <LanguageSwitcher className="admin-language" />
          <ThemeToggle className="admin-theme" />
          <LogoutButton />
        </div>
      </aside>

      <header className="admin-mobile-header">
        <Brand compact />
        <div><strong>{gym.name}</strong><small>{t("nav.gymAdministrator")}</small></div>
        <Link href="/admin/gyms"><Icon name="building" size={19} /></Link>
      </header>
      <nav className="admin-mobile-nav" aria-label="Mobile gym administration">
        {items.map((item) => {
          const href = `${base}${item.href}`;
          const active = pathname.startsWith(href);
          return <Link aria-label={t(item.labelKey)} className={active ? "active" : ""} href={href} key={item.labelKey}><Icon name={item.icon} size={18} /><span>{t(item.labelKey)}</span></Link>;
        })}
      </nav>
    </>
  );
}

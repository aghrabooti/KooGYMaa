"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/language-provider";

const items: Array<{ href: string; icon: IconName; labelKey: string }> = [
  { href: "/user", icon: "grid", labelKey: "nav.overview" },
  { href: "/user/gyms", icon: "building", labelKey: "nav.discoverGyms" },
  { href: "/user/trainers", icon: "users", labelKey: "nav.findTrainers" },
  { href: "/user/workouts", icon: "dumbbell", labelKey: "nav.workouts" },
  { href: "/user/nutrition", icon: "heart", labelKey: "nav.nutrition" },
  { href: "/user/schedule", icon: "calendar", labelKey: "nav.schedule" },
  { href: "/user/progress", icon: "trend", labelKey: "nav.myProgress" },
  { href: "/user/subscriptions", icon: "credit-card", labelKey: "nav.subscriptions" },
  { href: "/user/notifications", icon: "bell", labelKey: "nav.notifications" },
  { href: "/user/profile", icon: "user", labelKey: "nav.profile" },
];

export function UserNav({ name, unread }: { name: string; unread: number }) {
  const pathname = usePathname();
  const t = useT();
  const isActive = (href: string) => (href === "/user" ? pathname === href : pathname.startsWith(href));
  return (
    <>
      <aside className="member-sidebar">
        <Brand light />
        <div className="member-identity">
          <span>{name.slice(0, 2).toUpperCase()}</span>
          <div><strong>{name}</strong><small>{t("nav.memberWorkspace")}</small></div>
        </div>
        <nav>
          {items.map((item) => (
            <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.labelKey}>
              <Icon name={item.icon} size={19} />
              <span>{t(item.labelKey)}</span>
              {item.labelKey === "nav.notifications" && unread > 0 && <b>{unread}</b>}
            </Link>
          ))}
        </nav>
        <div className="member-sidebar__bottom"><LanguageSwitcher className="member-language" /><ThemeToggle className="member-theme" /><LogoutButton /></div>
      </aside>
      <header className="member-mobile-header">
        <Brand compact />
        <div><strong>{name}</strong><small>{t("nav.memberWorkspace")}</small></div>
        <Link href="/user/notifications"><Icon name="bell" size={18} />{unread > 0 && <b>{unread}</b>}</Link>
      </header>
      <nav className="member-mobile-nav">
        {items.map((item) => (
          <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.labelKey}>
            <Icon name={item.icon} size={18} />
            <span>{t(item.labelKey)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

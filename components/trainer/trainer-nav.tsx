"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/language-provider";

type TrainerNavProps = {
  pendingStudents: number;
  user: { name: string };
};

const items: Array<{ href: string; icon: IconName; labelKey: string }> = [
  { href: "/trainer", icon: "grid", labelKey: "nav.overview" },
  { href: "/trainer/students", icon: "users", labelKey: "nav.myStudents" },
  { href: "/trainer/progress", icon: "trend", labelKey: "nav.clientProgress" },
  { href: "/trainer/gyms", icon: "building", labelKey: "nav.myGyms" },
  { href: "/trainer/workouts", icon: "clipboard", labelKey: "nav.workoutPlans" },
  { href: "/trainer/nutrition", icon: "heart", labelKey: "nav.nutritionPlans" },
  { href: "/trainer/schedule", icon: "calendar", labelKey: "nav.schedule" },
  { href: "/trainer/profile", icon: "user", labelKey: "nav.trainerProfile" },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function TrainerNav({ pendingStudents, user }: TrainerNavProps) {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      <aside className="trainer-sidebar">
        <Brand light />
        <div className="trainer-identity">
          <span>{initials(user.name)}</span>
          <div><strong>{user.name}</strong><small>{t("nav.trainerWorkspace")}</small></div>
        </div>
        <nav className="trainer-nav" aria-label="Trainer navigation">
          <small>{t("nav.coaching")}</small>
          {items.map((item) => {
            const active = item.href === "/trainer" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link className={active ? "active" : ""} href={item.href} key={item.labelKey}><Icon name={item.icon} size={19} /><span>{t(item.labelKey)}</span>{item.labelKey === "nav.myStudents" && pendingStudents > 0 && <b>{pendingStudents}</b>}</Link>;
          })}
        </nav>
        <div className="trainer-sidebar__tip"><Icon name="sparkles" size={17} /><strong>{t("dash.greatMomentum")}</strong><p>{t("authShell.benefit1")}</p><Link href="/trainer/profile">{t("nav.trainerProfile")} <Icon name="arrow" size={13} /></Link></div>
        <div className="trainer-sidebar__bottom"><LanguageSwitcher className="trainer-language" /><ThemeToggle className="trainer-theme" /><LogoutButton /></div>
      </aside>
      <header className="trainer-mobile-header"><Brand compact /><div><strong>{user.name}</strong><small>{t("nav.trainerWorkspace")}</small></div><Link href="/trainer/profile"><Icon name="user" size={18} /></Link></header>
      <nav className="trainer-mobile-nav" aria-label="Mobile trainer navigation">{items.map((item) => { const active = item.href === "/trainer" ? pathname === item.href : pathname.startsWith(item.href); return <Link aria-label={t(item.labelKey)} className={active ? "active" : ""} href={item.href} key={item.labelKey}><Icon name={item.icon} size={18} /><span>{t(item.labelKey)}</span></Link>; })}</nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";

type TrainerNavProps = {
  pendingStudents: number;
  user: { name: string };
};

const items: Array<{ href: string; icon: IconName; label: string }> = [
  { href: "/trainer", icon: "grid", label: "Overview" },
  { href: "/trainer/students", icon: "users", label: "My students" },
  { href: "/trainer/progress", icon: "trend", label: "Client progress" },
  { href: "/trainer/gyms", icon: "building", label: "My gyms" },
  { href: "/trainer/workouts", icon: "clipboard", label: "Workout plans" },
  { href: "/trainer/nutrition", icon: "heart", label: "Nutrition plans" },
  { href: "/trainer/schedule", icon: "calendar", label: "Schedule" },
  { href: "/trainer/profile", icon: "user", label: "Trainer profile" },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function TrainerNav({ pendingStudents, user }: TrainerNavProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="trainer-sidebar">
        <Brand light />
        <div className="trainer-identity">
          <span>{initials(user.name)}</span>
          <div><strong>{user.name}</strong><small>Trainer workspace</small></div>
        </div>
        <nav className="trainer-nav" aria-label="Trainer navigation">
          <small>COACHING</small>
          {items.map((item) => {
            const active = item.href === "/trainer" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link className={active ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.label === "My students" && pendingStudents > 0 && <b>{pendingStudents}</b>}</Link>;
          })}
        </nav>
        <div className="trainer-sidebar__tip"><Icon name="sparkles" size={17} /><strong>Coach with clarity</strong><p>Profiles with complete details receive more member interest.</p><Link href="/trainer/profile">Complete profile <Icon name="arrow" size={13} /></Link></div>
        <div className="trainer-sidebar__bottom"><LogoutButton /></div>
      </aside>
      <header className="trainer-mobile-header"><Brand compact /><div><strong>{user.name}</strong><small>Trainer workspace</small></div><Link href="/trainer/profile"><Icon name="user" size={18} /></Link></header>
      <nav className="trainer-mobile-nav" aria-label="Mobile trainer navigation">{items.map((item) => { const active = item.href === "/trainer" ? pathname === item.href : pathname.startsWith(item.href); return <Link aria-label={item.label} className={active ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} size={18} /><span>{item.label}</span></Link>; })}</nav>
    </>
  );
}

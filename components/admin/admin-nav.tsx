"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";

type AdminNavProps = {
  gym: { city: string | null; id: string; name: string };
  pendingCount: number;
  user: { name: string };
};

const items: Array<{ href: string; icon: IconName; label: string }> = [
  { href: "", icon: "grid", label: "Overview" },
  { href: "/members", icon: "users", label: "Members" },
  { href: "/trainers", icon: "dumbbell", label: "Trainers" },
  { href: "/plans", icon: "clipboard", label: "Plans" },
  { href: "/subscriptions", icon: "credit-card", label: "Subscriptions" },
  { href: "/payments", icon: "shield", label: "Payments & audit" },
  { href: "/settings", icon: "settings", label: "Gym settings" },
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AdminNav({ gym, pendingCount, user }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/admin/gyms/${gym.id}`;

  return (
    <>
      <aside className="admin-sidebar">
        <Brand light />
        <Link className="admin-workspace" href="/admin/gyms">
          <span className="admin-workspace__mark"><Icon name="building" size={18} /></span>
          <span><strong>{gym.name}</strong><small>{gym.city || "Location not set"}</small></span>
          <Icon name="chevron" size={15} />
        </Link>

        <nav className="admin-nav" aria-label="Gym administration">
          <small>GYM MANAGEMENT</small>
          {items.map((item) => {
            const href = `${base}${item.href}`;
            const active = item.href ? pathname.startsWith(href) : pathname === base;
            return (
              <Link className={`admin-nav__item ${active ? "active" : ""}`} href={href} key={item.label}>
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.label === "Members" && pendingCount > 0 && <b>{pendingCount}</b>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <div className="admin-user-card">
            <span>{initials(user.name)}</span>
            <div><strong>{user.name}</strong><small>Gym administrator</small></div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <header className="admin-mobile-header">
        <Brand compact />
        <div><strong>{gym.name}</strong><small>Admin workspace</small></div>
        <Link href="/admin/gyms"><Icon name="building" size={19} /></Link>
      </header>
      <nav className="admin-mobile-nav" aria-label="Mobile gym administration">
        {items.map((item) => {
          const href = `${base}${item.href}`;
          const active = item.href ? pathname.startsWith(href) : pathname === base;
          return <Link aria-label={item.label} className={active ? "active" : ""} href={href} key={item.label}><Icon name={item.icon} size={18} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </>
  );
}

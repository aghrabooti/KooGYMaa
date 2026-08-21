"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";

const items: Array<{ href: string; icon: IconName; label: string }> = [
  { href: "/user", icon: "grid", label: "Overview" },
  { href: "/user/gyms", icon: "building", label: "Discover gyms" },
  { href: "/user/trainers", icon: "users", label: "Find trainers" },
  { href: "/user/workouts", icon: "dumbbell", label: "Workouts" },
  { href: "/user/nutrition", icon: "heart", label: "Nutrition" },
  { href: "/user/schedule", icon: "calendar", label: "Schedule" },
  { href: "/user/progress", icon: "trend", label: "My progress" },
  { href: "/user/subscriptions", icon: "credit-card", label: "Subscriptions" },
  { href: "/user/notifications", icon: "bell", label: "Notifications" },
  { href: "/user/profile", icon: "user", label: "Profile" },
];

export function UserNav({ name, unread }: { name: string; unread: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/user" ? pathname === href : pathname.startsWith(href);
  return <><aside className="member-sidebar"><Brand light /><div className="member-identity"><span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>Member workspace</small></div></div><nav>{items.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.label === "Notifications" && unread > 0 && <b>{unread}</b>}</Link>)}</nav><div className="member-sidebar__bottom"><LogoutButton /></div></aside><header className="member-mobile-header"><Brand compact /><div><strong>{name}</strong><small>Member workspace</small></div><Link href="/user/notifications"><Icon name="bell" size={18} />{unread > 0 && <b>{unread}</b>}</Link></header><nav className="member-mobile-nav">{items.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><Icon name={item.icon} size={18} /><span>{item.label}</span></Link>)}</nav></>;
}

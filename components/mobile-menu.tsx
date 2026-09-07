"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/language-provider";

export type MobileMenuItem = {
  href: string;
  label: string;
  icon?: IconName;
  active?: boolean;
  badge?: number;
};

type MobileMenuProps = {
  items: MobileMenuItem[];
  /** Shown at the top of the drawer — name, initials, role, etc. */
  identity?: ReactNode;
  /** Optional block rendered under the items (e.g. auth CTAs on the landing). */
  footer?: ReactNode;
  /** Render the sign-out button in the drawer footer. */
  showLogout?: boolean;
  /** Visual tone for the active item. */
  tone?: "lime" | "orange";
  className?: string;
};

/**
 * Hamburger drawer for narrow viewports. Slides in from the inline-end side
 * (right in LTR, left in RTL), traps focus with the native <dialog>, closes on
 * Escape / backdrop tap / route change, and locks page scroll while open.
 */
const noopSubscribe = () => () => {};

export function MobileMenu({ items, identity, footer, showLogout = false, tone = "lime", className = "" }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const id = useId();
  // The drawer is portalled to <body> so it escapes sticky-header stacking contexts.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Close whenever navigation happens (state reset during render, no effect needed).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        aria-controls={id}
        aria-expanded={open}
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        className={`hamburger ${open ? "is-open" : ""} ${className}`.trim()}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {mounted && createPortal(
      <div className={`mobile-drawer ${open ? "is-open" : ""}`} data-tone={tone} id={id} aria-hidden={!open}>
        <button aria-label={t("nav.closeMenu")} className="mobile-drawer__backdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
        <aside aria-label={t("nav.menu")} className="mobile-drawer__panel" role="dialog" aria-modal={open}>
          <header className="mobile-drawer__head">
            <div className="mobile-drawer__identity">{identity}</div>
            <button aria-label={t("nav.closeMenu")} className="mobile-drawer__close" onClick={() => setOpen(false)} type="button">
              <Icon name="plus" size={20} />
            </button>
          </header>

          <nav className="mobile-drawer__nav">
            {items.map((item, index) => (
              <Link
                className={item.active ? "active" : ""}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
                style={{ "--i": index } as React.CSSProperties}
                tabIndex={open ? 0 : -1}
              >
                {item.icon && <Icon name={item.icon} size={20} />}
                <span>{item.label}</span>
                {item.badge ? <b>{item.badge}</b> : null}
                <Icon className="mobile-drawer__chev" name="chevron" size={16} />
              </Link>
            ))}
          </nav>

          <footer className="mobile-drawer__foot">
            {footer}
            <div className="mobile-drawer__tools">
              <LanguageSwitcher className="mobile-drawer__lang" />
              <ThemeToggle className="mobile-drawer__theme" />
            </div>
            {showLogout && <LogoutButton />}
          </footer>
        </aside>
      </div>,
      document.body,
      )}
    </>
  );
}

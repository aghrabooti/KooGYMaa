"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/language-provider";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const benefitKeys = [
  "authShell.benefit1",
  "authShell.benefit2",
  "authShell.benefit3",
];

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  const t = useT();

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="About KooGYMaa">
        <div className="auth-story__glow" />
        <Brand light />
        <span className="auth-brand-fa">{t("brand.fa")}</span>

        <div className="auth-story__content">
          <div className="eyebrow eyebrow--dark">
            <Icon name="sparkles" size={15} />
            {t("authShell.eyebrow")}
          </div>
          <h2>
            {t("authShell.title1")}
            <br />
            <span>{t("authShell.title2")}</span>
          </h2>
          <p>{t("authShell.desc")}</p>

          <div className="auth-benefits">
            {benefitKeys.map((key) => (
              <div className="auth-benefit" key={key}>
                <span><Icon name="check" size={15} /></span>
                {t(key)}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-quote">
          <div className="auth-quote__avatars" aria-hidden="true">
            <span>MK</span><span>JL</span><span>AS</span>
          </div>
          <div>
            <strong>{t("authShell.trustedBy")}</strong>
            <p>{t("authShell.oneWorkspace")}</p>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand"><Brand /></div>
        <LanguageSwitcher className="auth-language" />
        <ThemeToggle className="auth-theme" />
        <Link className="auth-back" href="/">
          <span aria-hidden="true">←</span> {t("auth.backToHome")}
        </Link>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </div>
        <p className="auth-legal">
          {t("auth.agreeTo")} <a href="#">{t("auth.terms")}</a> {t("auth.and")} <a href="#">{t("auth.privacy")}</a>.
        </p>
      </section>
    </main>
  );
}

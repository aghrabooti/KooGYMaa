import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const benefits = [
  "Your training, plans, and progress in one place",
  "Simple tools for every role in your fitness journey",
  "Private, secure, and built to keep you moving",
];

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="About KooGYMaa">
        <div className="auth-story__glow" />
        <Brand light />

        <div className="auth-story__content">
          <div className="eyebrow eyebrow--dark">
            <Icon name="sparkles" size={15} />
            Built for better movement
          </div>
          <h2>
            Stronger habits.
            <br />
            <span>Smarter training.</span>
          </h2>
          <p>
            The calm, capable home for your gym life—from the first check-in to
            your strongest set yet.
          </p>

          <div className="auth-benefits">
            {benefits.map((benefit) => (
              <div className="auth-benefit" key={benefit}>
                <span><Icon name="check" size={15} /></span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-quote">
          <div className="auth-quote__avatars" aria-hidden="true">
            <span>MK</span><span>JL</span><span>AS</span>
          </div>
          <div>
            <strong>Trusted by growing fitness communities</strong>
            <p>One workspace. Every goal.</p>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand"><Brand /></div>
        <Link className="auth-back" href="/">
          <span aria-hidden="true">←</span> Back to home
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
          By continuing, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
        </p>
      </section>
    </main>
  );
}

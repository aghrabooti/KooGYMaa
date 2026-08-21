"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Icon } from "@/components/icon";
import { useT } from "@/lib/i18n/language-provider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useT();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.loginDesc"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.loginDesc"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.welcomeBack")}
      title={t("auth.loginTitle")}
      description={t("auth.loginDesc")}
    >
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("auth.email")}</span>
          <div className="field__control">
            <Icon name="mail" size={19} />
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.placeholderEmail")}
              required
              type="email"
              value={email}
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label-row">
            {t("auth.password")}
            <a href="#">{t("auth.forgotPassword")}</a>
          </span>
          <div className="field__control">
            <Icon name="lock" size={19} />
            <input
              autoComplete="current-password"
              maxLength={72}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.placeholderPassword")}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? t("auth.password") : t("auth.password")}
              className="field__action"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={19} />
            </button>
          </div>
        </label>

        <label className="check-field">
          <input
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            type="checkbox"
          />
          <span>{t("auth.keepSignedIn")}</span>
        </label>

        <button className="auth-submit" disabled={isLoading} type="submit">
          {isLoading ? <span className="button-loader" /> : <>{t("auth.login")} <Icon name="arrow" size={18} /></>}
        </button>
      </form>

      <p className="auth-switch">
        {t("auth.newToKooGYMaa")} <Link href="/register">{t("auth.createAccount")}</Link>
      </p>
    </AuthShell>
  );
}

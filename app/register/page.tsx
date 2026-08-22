"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Icon } from "@/components/icon";
import { useT } from "@/lib/i18n/language-provider";

// Must match validatePassword in @/lib/auth-validation. Written as a normal
// JS string (not a JSX attribute literal) so `\\d` is escaped exactly once —
// inside a JSX string literal backslashes are NOT decoded and every extra
// backslash reaches the browser verbatim, which silently breaks the rule.
const PASSWORD_PATTERN = "(?=.*[A-Za-z])(?=.*\\d).{8,72}";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "TRAINER">("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useT();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.registerDesc"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.registerDesc"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t("auth.startJourney")}
      title={t("auth.registerTitle")}
      description={t("auth.registerDesc")}
    >
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("auth.fullName")}</span>
          <div className="field__control">
            <Icon name="user" size={19} />
            <input
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              placeholder={t("auth.placeholderName")}
              required
              type="text"
              value={name}
            />
          </div>
        </label>

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
          <span>{t("auth.password")}</span>
          <div className="field__control">
            <Icon name="lock" size={19} />
            <input
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              pattern={PASSWORD_PATTERN}
              placeholder={t("auth.placeholderPassword")}
              required
              title={t("auth.placeholderPassword")}
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

        <fieldset className="role-picker">
          <legend>{t("auth.joiningAs")}</legend>
          <div>
            <label className={role === "USER" ? "active" : ""}>
              <input checked={role === "USER"} name="role" onChange={() => setRole("USER")} type="radio" value="USER" />
              <span><Icon name="flame" size={20} /></span>
              <strong>{t("auth.member")}</strong>
              <small>{t("auth.memberHint")}</small>
            </label>
            <label className={role === "TRAINER" ? "active" : ""}>
              <input checked={role === "TRAINER"} name="role" onChange={() => setRole("TRAINER")} type="radio" value="TRAINER" />
              <span><Icon name="dumbbell" size={20} /></span>
              <strong>{t("auth.trainer")}</strong>
              <small>{t("auth.trainerHint")}</small>
            </label>
          </div>
        </fieldset>

        <button className="auth-submit" disabled={isLoading} type="submit">
          {isLoading ? <span className="button-loader" /> : <>{t("auth.createMyAccount")} <Icon name="arrow" size={18} /></>}
        </button>
      </form>

      <p className="auth-switch">
        {t("auth.alreadyHaveAccount")} <Link href="/login">{t("auth.login")}</Link>
      </p>
    </AuthShell>
  );
}

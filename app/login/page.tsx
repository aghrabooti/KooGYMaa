"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Icon } from "@/components/icon";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "We couldn’t sign you in. Please try again.");
        return;
      }

      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your space"
      description="Pick up where you left off and keep the momentum going."
    >
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email address</span>
          <div className="field__control">
            <Icon name="mail" size={19} />
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label-row">
            Password
            <a href="#">Forgot password?</a>
          </span>
          <div className="field__control">
            <Icon name="lock" size={19} />
            <input
              autoComplete="current-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="field__action"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={19} />
            </button>
          </div>
        </label>

        <label className="check-field">
          <input type="checkbox" />
          <span>Keep me signed in</span>
        </label>

        <button className="auth-submit" disabled={isLoading} type="submit">
          {isLoading ? <span className="button-loader" /> : <>Log in <Icon name="arrow" size={18} /></>}
        </button>
      </form>

      <p className="auth-switch">
        New to KooGYMaa? <Link href="/register">Create an account</Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Icon } from "@/components/icon";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "We couldn’t create your account. Please try again.");
        return;
      }

      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start your journey"
      title="Create your account"
      description="Join your gym community and put every goal within reach."
    >
      {error && <div className="form-alert" role="alert">{error}</div>}
      <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <div className="field__control">
            <Icon name="user" size={19} />
            <input
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
              type="text"
              value={name}
            />
          </div>
        </label>

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
          <span>Password</span>
          <div className="field__control">
            <Icon name="lock" size={19} />
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
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

        <fieldset className="role-picker">
          <legend>I&apos;m joining as</legend>
          <div>
            <label className={role === "USER" ? "active" : ""}>
              <input checked={role === "USER"} name="role" onChange={() => setRole("USER")} type="radio" value="USER" />
              <span><Icon name="flame" size={20} /></span>
              <strong>Member</strong>
              <small>Train and track</small>
            </label>
            <label className={role === "TRAINER" ? "active" : ""}>
              <input checked={role === "TRAINER"} name="role" onChange={() => setRole("TRAINER")} type="radio" value="TRAINER" />
              <span><Icon name="dumbbell" size={20} /></span>
              <strong>Trainer</strong>
              <small>Coach and guide</small>
            </label>
          </div>
        </fieldset>

        <button className="auth-submit" disabled={isLoading} type="submit">
          {isLoading ? <span className="button-loader" /> : <>Create my account <Icon name="arrow" size={18} /></>}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}

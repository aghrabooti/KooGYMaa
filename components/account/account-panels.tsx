"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormError, FormSuccess } from "@/components/forms";

// Item 1: account completion panels — change password, verify email, sessions.
export function ChangePasswordPanel() {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setOk(""); setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.get("current"), newPassword: form.get("next") }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "خطا در تغییر گذرواژه."); return; }
      setOk(data.message || "انجام شد.");
      (e.target as HTMLFormElement).reset();
    } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); }
  }
  return (
    <section className="account-panel" aria-label="تغییر گذرواژه">
      <h2>تغییر گذرواژه</h2>
      <form onSubmit={submit}>
        <label><span>گذرواژه فعلی</span><input name="current" type="password" required autoComplete="current-password" /></label>
        <label><span>گذرواژه جدید</span><input name="next" type="password" required minLength={8} autoComplete="new-password" placeholder="۸+ کاراکتر با حرف و عدد" /></label>
        <FormError message={error} />
        <FormSuccess message={ok} />
        <button className="member-primary-button" disabled={pending}>{pending ? "در حال ذخیره…" : "تغییر گذرواژه"}</button>
      </form>
    </section>
  );
}

export function VerifyEmailPanel() {
  const [state, setState] = useState<{ verified: boolean } | null>(null);
  const [message, setMessage] = useState("");
  async function load() {
    const res = await fetch("/api/auth/verify-email");
    if (res.ok) setState(await res.json());
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount load from API
    load();
  }, []);
  async function request() {
    const res = await fetch("/api/auth/verify-email", { method: "POST" });
    const data = await res.json();
    if (data.verifyToken) {
      const confirm = await fetch("/api/auth/verify-email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: data.verifyToken }) });
      const done = await confirm.json();
      setMessage(done.message || done.error || "");
      load();
    } else setMessage(data.message || "");
  }
  return (
    <section className="account-panel" aria-label="تأیید ایمیل">
      <h2>تأیید ایمیل</h2>
      <p>{state === null ? "در حال بررسی…" : state.verified ? "✅ ایمیل شما تأیید شده است." : "❌ ایمیل هنوز تأیید نشده است."}</p>
      {!state?.verified && <button className="member-secondary-button" onClick={request}>ارسال لینک تأیید</button>}
      {message && <p className="member-empty-line">{message}</p>}
    </section>
  );
}

type Session = { id: string; ip: string | null; userAgent: string | null; createdAt: string; lastSeenAt: string; current: boolean };

export function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const router = useRouter();
  async function load() {
    const res = await fetch("/api/auth/sessions");
    if (res.ok) setSessions((await res.json()).sessions || []);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount load from API
    load();
  }, []);
  async function revoke(id: string) {
    await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    load();
  }
  async function revokeOthers() {
    await fetch("/api/auth/sessions", { method: "DELETE" });
    load();
    router.refresh();
  }
  return (
    <section className="account-panel" aria-label="نشست‌های فعال">
      <div className="account-panel__head"><h2>نشست‌های فعال</h2><button className="member-secondary-button" onClick={revokeOthers}>بستن سایر نشست‌ها</button></div>
      {sessions.map((s) => (
        <article key={s.id} className="session-row">
          <div><strong>{s.current ? "این دستگاه ✅" : (s.userAgent || "دستگاه ناشناس").slice(0, 60)}</strong><small>{s.ip || ""} · آخرین فعالیت: {new Date(s.lastSeenAt).toLocaleString("fa-IR")}</small></div>
          {!s.current && <button onClick={() => revoke(s.id)}>بستن</button>}
        </article>
      ))}
      {!sessions.length && <p className="member-empty-line">نشستی ثبت نشده است.</p>}
    </section>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) });
    const data = await res.json();
    setMessage(data.message || "درخواست ثبت شد.");
  }
  return (
    <form onSubmit={submit} className="auth-recovery-form">
      <label><span>نشانی ایمیل</span><input name="email" type="email" required dir="ltr" /></label>
      <button className="member-primary-button" type="submit">ارسال لینک بازیابی</button>
      {message && <p className="member-empty-line">{message}</p>}
    </form>
  );
}

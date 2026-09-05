"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { FormError, FormSuccess } from "@/components/forms";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [error, setError] = useState(token ? "" : "لینک بازیابی نامعتبر است. دوباره درخواست بده.");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setOk(""); setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.get("next") }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "خطا در بازنشانی."); return; }
      setOk(data.message || "انجام شد.");
    } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="auth-recovery-form">
      <label><span>گذرواژه جدید</span><input name="next" type="password" required minLength={8} autoComplete="new-password" /></label>
      <FormError message={error} />
      <FormSuccess message={ok} />
      <button className="member-primary-button" disabled={pending || !token}>{pending ? "…" : "تعیین گذرواژه جدید"}</button>
      {ok && <p className="auth-alt"><Link href="/login">ورود به حساب</Link></p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="بازیابی حساب" title="گذرواژه جدید" description="یک گذرواژه قوی شامل حرف و عدد انتخاب کن.">
      <Suspense><ResetForm /></Suspense>
      <p className="auth-alt"><Link href="/forgot-password">درخواست لینک جدید</Link></p>
    </AuthShell>
  );
}

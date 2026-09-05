import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/account/account-panels";

export const metadata: Metadata = { title: "Forgot password", description: "Recover your KooGYMaa account." };

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="بازیابی حساب" title="گذرواژه را فراموش کردی؟" description="ایمیلت را وارد کن تا لینک بازیابی بگیری.">
      <ForgotPasswordForm />
      <p className="auth-alt"><Link href="/login">بازگشت به ورود</Link></p>
    </AuthShell>
  );
}

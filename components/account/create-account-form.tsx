"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type Props = {
  endpoint: string;
  kind: "مدیر باشگاه" | "مربی" | "شاگرد";
  panel: "admin" | "trainer";
  gyms?: Array<{ id: string; name: string }>;
};

export function CreateAccountForm({ endpoint, kind, panel, gyms }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [createdUsername, setCreatedUsername] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "حساب ساخته نشد. دوباره تلاش کنید.");
        return;
      }
      setCreatedUsername(result.account.username);
      setOpen(false);
      router.refresh();
    } catch {
      setError("ارتباط برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  const action = `ساخت حساب ${kind}`;
  if (!open) {
    return (
      <div className="account-create">
        <button className={`${panel}-primary-button`} onClick={() => { setError(""); setCreatedUsername(""); setOpen(true); }} type="button">
          <Icon name="plus" size={16} /> {action}
        </button>
        {createdUsername && <p role="status">حساب <bdi>{createdUsername}</bdi> ساخته شد.</p>}
      </div>
    );
  }

  return (
    <form className={`${panel}-inline-form account-create`} onSubmit={submit}>
      <label><span>نام کامل</span><input autoFocus name="name" minLength={2} maxLength={80} required /></label>
      <label><span>نام کاربری</span><input dir="ltr" autoCapitalize="none" autoComplete="off" name="username" minLength={3} maxLength={32} placeholder="mina.ahmadi" spellCheck={false} required /></label>
      <label><span>گذرواژهٔ اولیه</span><input dir="ltr" autoComplete="new-password" name="password" minLength={8} maxLength={72} type="password" required /></label>
      <label><span>ایمیل بازیابی (اختیاری)</span><input dir="ltr" name="email" maxLength={254} type="email" /></label>
      {gyms && gyms.length > 0 && (
        <label>
          <span>باشگاه</span>
          <select name="gymId">
            <option value="">مربی‌گری مستقل</option>
            {gyms.map((gym) => <option value={gym.id} key={gym.id}>{gym.name}</option>)}
          </select>
        </label>
      )}
      <button className={`${panel}-primary-button`} disabled={pending} type="submit">{pending ? "در حال ساخت حساب…" : action}</button>
      <button className={`${panel}-secondary-button`} disabled={pending} onClick={() => setOpen(false)} type="button">انصراف</button>
      {error && <small role="alert">{error}</small>}
    </form>
  );
}

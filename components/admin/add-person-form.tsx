"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type AddPersonFormProps = {
  endpoint: string;
  kind: "member" | "trainer";
};

export function AddPersonForm({ endpoint, kind }: AddPersonFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.get("identifier") }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `${kind === "member" ? "عضو" : "مربی"} افزوده نشد.`);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <button className={kind === "member" ? "admin-primary-button" : "admin-secondary-button"} onClick={() => { setError(""); setOpen(true); }} type="button"><Icon name="plus" size={16} /> افزودن {kind === "member" ? "عضو" : "مربی"} با حساب موجود</button>;
  }

  return (
    <form className="admin-inline-form" onSubmit={submit}>
      <label><span>نام کاربری یا ایمیل</span><input autoFocus dir="ltr" autoCapitalize="none" name="identifier" required /></label>
      <button className="admin-primary-button" disabled={pending} type="submit">{pending ? "در حال افزودن…" : "افزودن"}</button>
      <button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">انصراف</button>
      {error && <small role="alert">{error}</small>}
    </form>
  );
}

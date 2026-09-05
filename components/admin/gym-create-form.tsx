"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function GymCreateForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: form.get("city"),
          country: form.get("country"),
          email: form.get("email"),
          phone: form.get("phone"),
          status: "ACTIVE",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "باشگاه ساخته نشد.");
        return;
      }

      router.push(`/admin/gyms/${data.gym.id}`);
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button className="admin-primary-button" onClick={() => setOpen(true)} type="button">
        <Icon name="plus" size={17} /> افزودن باشگاه
      </button>
    );
  }

  return (
    <form className="admin-create-form" onSubmit={handleSubmit}>
      <div className="admin-create-form__heading">
        <div><strong>ساخت فضای باشگاه</strong><span>شما به‌عنوان مالک آن اضافه می‌شوید.</span></div>
        <button aria-label="بستن فرم" onClick={() => setOpen(false)} type="button">×</button>
      </div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-form-grid">
        <label><span>نام باشگاه</span><input name="name" placeholder="باشگاه مرکزی کوجیما" required minLength={2} /></label>
        <label><span>شهر</span><input name="city" placeholder="تهران" /></label>
        <label><span>کد کشور</span><input defaultValue="IR" maxLength={2} name="country" /></label>
        <label><span>ایمیل تماس</span><input name="email" placeholder="hello@gym.com" type="email" /></label>
        <label><span>تلفن</span><input name="phone" placeholder="+98 ..." /></label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">انصراف</button>
        <button className="admin-primary-button" disabled={pending} type="submit">
          {pending ? "در حال ایجاد…" : "ایجاد فضای کاری"}
        </button>
      </div>
    </form>
  );
}

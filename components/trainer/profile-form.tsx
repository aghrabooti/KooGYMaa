"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  bio: string | null;
  currency: string;
  experienceYears: number | null;
  hourlyRate: number | null;
  isAvailable: boolean;
  specialty: string | null;
};

export function TrainerProfileForm({ profile }: { profile: Profile }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.get("bio"),
          specialty: form.get("specialty"),
          experienceYears: form.get("experienceYears"),
          hourlyRate: form.get("hourlyRate"),
          currency: form.get("currency"),
          isAvailable: form.get("isAvailable") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "پروفایل به‌روزرسانی نشد."); return; }
      setMessage("پروفایل مربی saved.");
      router.refresh();
    } catch { setError("اتصال برقرار نشد."); }
    finally { setPending(false); }
  }

  return <form className="trainer-profile-form" onSubmit={submit}>
    <section className="trainer-panel"><div className="trainer-panel__heading"><div><h2>مشخصات حرفه‌ای</h2><p>به اعضا کمک کنید سبک مربی‌گری‌تان را بشناسند.</p></div></div><div className="trainer-form-grid"><label><span>تخصص</span><input defaultValue={profile.specialty || ""} name="specialty" placeholder="قدرت و تحرک" /></label><label><span>سابقه (سال)</span><input defaultValue={profile.experienceYears ?? ""} min="0" max="80" name="experienceYears" type="number" /></label><label><span>نرخ ساعتی</span><input defaultValue={profile.hourlyRate ?? ""} min="0" name="hourlyRate" type="number" /></label><label><span>ارز</span><input defaultValue={profile.currency} maxLength={3} name="currency" /></label><label className="trainer-form-wide"><span>معرفی</span><textarea defaultValue={profile.bio || ""} maxLength={1000} name="bio" placeholder="فلسفه تمرینی و افرادی که به آن‌ها کمک می‌کنید را بنویسید…" rows={7} /></label></div></section>
    <section className="trainer-panel trainer-availability-toggle"><div><h2>پذیرش شاگرد جدید</h2><p>به اعضا نشان دهید هم‌اکنون برای مربی‌گری در دسترس هستید.</p></div><label className="trainer-switch"><input defaultChecked={profile.isAvailable} name="isAvailable" type="checkbox" /><span /></label></section>
    {(message || error) && <p className={error ? "trainer-form-error" : "trainer-form-success"}>{error || message}</p>}
    <div className="trainer-form-actions"><button className="trainer-primary-button" disabled={pending} type="submit">{pending ? "در حال ذخیره…" : "ذخیره پروفایل"}</button></div>
  </form>;
}

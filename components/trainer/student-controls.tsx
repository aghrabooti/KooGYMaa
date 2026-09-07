"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function InviteStudent({ gyms }: { gyms: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch("/api/trainer/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), gymId: form.get("gymId") }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "دعوت شاگرد انجام نشد."); return; } setOpen(false); router.refresh(); } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); } }
  if (!open) return <button className="trainer-primary-button" onClick={() => setOpen(true)} type="button"><Icon name="plus" size={16} /> دعوت شاگرد</button>;
  return <form className="trainer-inline-form" onSubmit={submit}><label><span>ایمیل عضو</span><input autoFocus name="email" placeholder="member@example.com" required type="email" /></label><label><span>باشگاه</span><select name="gymId"><option value="">مربی‌گری مستقل</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></label><button className="trainer-primary-button" disabled={pending}>{pending ? "در حال دعوت…" : "ارسال دعوت"}</button><button className="trainer-secondary-button" onClick={() => setOpen(false)} type="button">انصراف</button>{error && <small>{error}</small>}</form>;
}

export function StudentStatusActions({ clientId, status }: { clientId: string; status: "PENDING" | "ACTIVE" | "PAUSED" | "REJECTED" | "ENDED" }) {
  const [pending, setPending] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function update(nextStatus: string) { setPending(nextStatus); setError(""); try { const response = await fetch(`/api/trainer/clients/${clientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "به‌روزرسانی انجام نشد."); return; } router.refresh(); } catch { setError("اتصال برقرار نشد."); } finally { setPending(""); } }
  return <div className="trainer-row-actions">{status === "PENDING" && <><button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>تأیید</button><button disabled={Boolean(pending)} onClick={() => update("REJECTED")}>رد</button></>}{status === "ACTIVE" && <><button disabled={Boolean(pending)} onClick={() => update("PAUSED")}>توقف موقت</button><button disabled={Boolean(pending)} onClick={() => update("ENDED")}>پایان مربی‌گری</button></>}{status === "PAUSED" && <><button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>ادامه</button><button disabled={Boolean(pending)} onClick={() => update("ENDED")}>پایان</button></>}{(status === "REJECTED" || status === "ENDED") && <button className="approve" disabled={Boolean(pending)} onClick={() => update("ACTIVE")}>بازگردانی</button>}{error && <small>{error}</small>}</div>;
}

// Item 12: one-click nudge for low-active students.
export function NudgeButton({ clientId }: { clientId: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  async function nudge() {
    setPending(true);
    try {
      const res = await fetch(`/api/trainer/clients/${clientId}/nudge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) setDone(true);
    } finally {
      setPending(false);
    }
  }
  if (done) return <small className="trainer-nudge-done">یادآوری ارسال شد ✓</small>;
  return <button className="trainer-secondary-button" disabled={pending} onClick={nudge}>{pending ? "…" : "یادآوری انگیزشی"}</button>;
}

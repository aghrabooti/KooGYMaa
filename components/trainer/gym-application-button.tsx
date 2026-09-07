"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GymApplicationButton({ gymId, membership }: { gymId: string; membership?: { id: string; status: string } }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function apply() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/trainer/gyms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gymId }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "درخواست انجام نشد."); return; }
      router.refresh();
    } catch { setError("اتصال برقرار نشد."); }
    finally { setPending(false); }
  }

  async function leave() {
    if (!membership) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/trainer/gyms/${membership.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "به‌روزرسانی انجام نشد."); return; }
      router.refresh();
    } catch { setError("اتصال برقرار نشد."); }
    finally { setPending(false); }
  }

  return <div className="trainer-gym-action">{membership?.status === "ACTIVE" ? <button className="trainer-secondary-button" disabled={pending} onClick={leave} type="button">{pending ? "در حال به‌روزرسانی…" : "ترک باشگاه"}</button> : membership?.status === "PENDING" ? <button disabled type="button">درخواست در انتظار بررسی</button> : <button className="trainer-primary-button" disabled={pending} onClick={apply} type="button">{pending ? "در حال ارسال درخواست…" : membership ? "درخواست دوباره" : "درخواست عضویت"}</button>}{error && <small>{error}</small>}</div>;
}

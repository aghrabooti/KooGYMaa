"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GymMembershipAction({ gymId, status }: { gymId: string; status?: string }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function act(method: "POST" | "DELETE") { setPending(true); setError(""); try { const response = await fetch(`/api/user/gyms/${gymId}/membership`, { method }); const data = await response.json(); if (!response.ok) { setError(data.error || "عضویت به‌روزرسانی نشد."); return; } router.refresh(); } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); } }
  return <div className="market-action">{status === "ACTIVE" ? <button className="member-secondary-button" disabled={pending} onClick={() => act("DELETE")}>ترک باشگاه</button> : status === "PENDING" ? <button className="member-secondary-button" disabled={pending} onClick={() => act("DELETE")}>{pending ? "در حال به‌روزرسانی…" : "لغو درخواست"}</button> : <button className="member-primary-button" disabled={pending} onClick={() => act("POST")}>{pending ? "در حال ارسال درخواست…" : status ? "درخواست دوباره" : "درخواست عضویت"}</button>}{error && <small>{error}</small>}</div>;
}

export function TrainerRequestAction({ gyms, status, trainerId }: { gyms: Array<{ id: string; name: string }>; status?: string; trainerId: string }) {
  const [pending, setPending] = useState(false); const [gymId, setGymId] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function request() { setPending(true); setError(""); try { const response = await fetch(`/api/user/trainers/${trainerId}/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gymId: gymId || null }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "درخواست مربی‌گری ارسال نشد."); return; } router.refresh(); } catch { setError("اتصال برقرار نشد."); } finally { setPending(false); } }
  async function end() { setPending(true); try { const response = await fetch(`/api/user/trainers/${trainerId}/request`, { method: "DELETE" }); if (response.ok) router.refresh(); } finally { setPending(false); } }
  return <div className="market-action market-action--trainer">{status === "ACTIVE" ? <button className="member-secondary-button" disabled={pending} onClick={end}>پایان مربی‌گری</button> : status === "PENDING" ? <button className="member-secondary-button" disabled={pending} onClick={end}>لغو درخواست</button> : <><select value={gymId} onChange={(event) => setGymId(event.target.value)}><option value="">مربی‌گری مستقل</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select><button className="member-primary-button" disabled={pending} onClick={request}>{pending ? "در حال ارسال…" : status ? "درخواست دوباره" : "درخواست مربی‌گری"}</button></>}{error && <small>{error}</small>}</div>;
}

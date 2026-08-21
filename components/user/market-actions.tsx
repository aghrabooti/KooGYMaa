"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GymMembershipAction({ gymId, status }: { gymId: string; status?: string }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function act(method: "POST" | "DELETE") { setPending(true); setError(""); try { const response = await fetch(`/api/user/gyms/${gymId}/membership`, { method }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to update membership."); return; } router.refresh(); } catch { setError("Unable to connect."); } finally { setPending(false); } }
  return <div className="market-action">{status === "ACTIVE" ? <button className="member-secondary-button" disabled={pending} onClick={() => act("DELETE")}>Leave gym</button> : status === "PENDING" ? <button className="member-secondary-button" disabled={pending} onClick={() => act("DELETE")}>{pending ? "Updating…" : "Cancel application"}</button> : <button className="member-primary-button" disabled={pending} onClick={() => act("POST")}>{pending ? "Applying…" : status ? "Apply again" : "Apply to join"}</button>}{error && <small>{error}</small>}</div>;
}

export function TrainerRequestAction({ gyms, status, trainerId }: { gyms: Array<{ id: string; name: string }>; status?: string; trainerId: string }) {
  const [pending, setPending] = useState(false); const [gymId, setGymId] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function request() { setPending(true); setError(""); try { const response = await fetch(`/api/user/trainers/${trainerId}/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gymId: gymId || null }) }); const data = await response.json(); if (!response.ok) { setError(data.error || "Unable to request coaching."); return; } router.refresh(); } catch { setError("Unable to connect."); } finally { setPending(false); } }
  async function end() { setPending(true); try { const response = await fetch(`/api/user/trainers/${trainerId}/request`, { method: "DELETE" }); if (response.ok) router.refresh(); } finally { setPending(false); } }
  return <div className="market-action market-action--trainer">{status === "ACTIVE" ? <button className="member-secondary-button" disabled={pending} onClick={end}>End coaching</button> : status === "PENDING" ? <button className="member-secondary-button" disabled={pending} onClick={end}>Cancel request</button> : <><select value={gymId} onChange={(event) => setGymId(event.target.value)}><option value="">Independent coaching</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select><button className="member-primary-button" disabled={pending} onClick={request}>{pending ? "Sending…" : status ? "Request again" : "Request coaching"}</button></>}{error && <small>{error}</small>}</div>;
}

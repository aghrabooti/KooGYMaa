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
      if (!response.ok) { setError(data.error || "Application failed."); return; }
      router.refresh();
    } catch { setError("Unable to connect."); }
    finally { setPending(false); }
  }

  async function leave() {
    if (!membership) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/trainer/gyms/${membership.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Update failed."); return; }
      router.refresh();
    } catch { setError("Unable to connect."); }
    finally { setPending(false); }
  }

  return <div className="trainer-gym-action">{membership?.status === "ACTIVE" ? <button className="trainer-secondary-button" disabled={pending} onClick={leave} type="button">{pending ? "Updating…" : "Leave gym"}</button> : membership?.status === "PENDING" ? <button disabled type="button">Application pending</button> : <button className="trainer-primary-button" disabled={pending} onClick={apply} type="button">{pending ? "Applying…" : membership ? "Apply again" : "Apply to join"}</button>}{error && <small>{error}</small>}</div>;
}

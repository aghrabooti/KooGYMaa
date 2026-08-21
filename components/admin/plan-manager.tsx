"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  audience: "MEMBER" | "TRAINER";
  price: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  subscriptionCount: number;
};

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

export function PlanManager({ gymId, plans }: { gymId: string; plans: Plan[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          audience: form.get("audience"),
          price: form.get("price"),
          currency: form.get("currency"),
          durationDays: form.get("durationDays"),
          isActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to create plan.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to connect.");
    } finally {
      setPending("");
    }
  }

  async function toggle(plan: Plan) {
    setPending(plan.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/gyms/${gymId}/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to update plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to connect.");
    } finally {
      setPending("");
    }
  }

  return (
    <>
      <div className="admin-page-action">
        <button className="admin-primary-button" onClick={() => setOpen((value) => !value)} type="button"><Icon name="plus" size={16} /> Create plan</button>
      </div>
      {open && <form className="admin-create-form admin-create-form--page" onSubmit={create}>
        <div className="admin-create-form__heading"><div><strong>New subscription plan</strong><span>Define access, duration, and pricing.</span></div><button onClick={() => setOpen(false)} type="button">×</button></div>
        {error && <p className="admin-form-error">{error}</p>}
        <div className="admin-form-grid admin-form-grid--three">
          <label><span>Plan name</span><input name="name" placeholder="Monthly Member" required /></label>
          <label><span>Audience</span><select name="audience"><option value="MEMBER">Members</option><option value="TRAINER">Trainers</option></select></label>
          <label><span>Duration (days)</span><input defaultValue="30" min="1" max="730" name="durationDays" required type="number" /></label>
          <label><span>Price (smallest currency unit)</span><input min="0" name="price" placeholder="15000000" required type="number" /></label>
          <label><span>Currency</span><input defaultValue="IRR" maxLength={3} name="currency" required /></label>
          <label className="admin-form-grid__wide"><span>Description</span><input name="description" placeholder="What this plan includes" /></label>
        </div>
        <div className="admin-form-actions"><button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">Cancel</button><button className="admin-primary-button" disabled={pending === "create"} type="submit">{pending === "create" ? "Creating…" : "Create plan"}</button></div>
      </form>}
      {!open && error && <p className="admin-form-error admin-form-error--standalone">{error}</p>}

      {plans.length ? <div className="admin-plan-grid">{plans.map((plan) => (
        <article className={`admin-plan-card ${plan.isActive ? "" : "is-inactive"}`} key={plan.id}>
          <div className="admin-plan-card__top"><span className={`admin-plan-icon admin-plan-icon--${plan.audience.toLowerCase()}`}><Icon name={plan.audience === "MEMBER" ? "users" : "dumbbell"} size={21} /></span><span className={`admin-status ${plan.isActive ? "admin-status--active" : "admin-status--cancelled"}`}>{plan.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
          <small>{plan.audience} PLAN</small><h2>{plan.name}</h2><p>{plan.description || "No description added."}</p>
          <div className="admin-plan-price"><strong>{money(plan.price, plan.currency)}</strong><span>every {plan.durationDays} days</span></div>
          <div className="admin-plan-card__footer"><span>{plan.subscriptionCount} subscriptions</span><button disabled={pending === plan.id} onClick={() => toggle(plan)} type="button">{pending === plan.id ? "Saving…" : plan.isActive ? "Deactivate" : "Activate"}</button></div>
        </article>
      ))}</div> : <div className="admin-panel admin-empty-table"><span><Icon name="clipboard" size={27} /></span><h2>No plans yet</h2><p>Create your first member or trainer subscription plan.</p></div>}
    </>
  );
}

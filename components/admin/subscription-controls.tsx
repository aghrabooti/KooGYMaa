"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type Plan = { audience: "MEMBER" | "TRAINER"; id: string; name: string };

export function CreateSubscription({ gymId, plans }: { gymId: string; plans: Plan[] }) {
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
      const response = await fetch(`/api/admin/gyms/${gymId}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberEmail: form.get("email"),
          planId: form.get("planId"),
          autoRenew: form.get("autoRenew") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "اشتراک ساخته نشد.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return <button className="admin-primary-button" onClick={() => setOpen(true)} type="button"><Icon name="plus" size={16} /> اشتراک تازه</button>;

  return (
    <form className="admin-inline-form admin-inline-form--subscription" onSubmit={submit}>
      <label><span>ایمیل حساب</span><input autoFocus name="email" placeholder="member@example.com" required type="email" /></label>
      <label><span>طرح</span><select name="planId" required><option value="">یک طرح انتخاب کنید</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.audience}</option>)}</select></label>
      <label className="admin-checkbox"><input name="autoRenew" type="checkbox" /><span>تمدید خودکار</span></label>
      <button className="admin-primary-button" disabled={pending} type="submit">{pending ? "در حال ایجاد…" : "ایجاد"}</button>
      <button className="admin-secondary-button" onClick={() => setOpen(false)} type="button">انصراف</button>
      {error && <small role="alert">{error}</small>}
    </form>
  );
}

export function SubscriptionActions({
  autoRenew,
  endpoint,
  status,
}: {
  autoRenew: boolean;
  endpoint: string;
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED";
}) {
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function update(payload: Record<string, unknown>, action: string) {
    setPending(action);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "به‌روزرسانی انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="admin-subscription-actions">
      <button disabled={Boolean(pending)} onClick={() => update({ extendDays: 30 }, "extend")} type="button">{pending === "extend" ? "در حال تمدید…" : "تمدید ۳۰ روزه"}</button>
      {status === "ACTIVE" ? <button disabled={Boolean(pending)} onClick={() => update({ status: "CANCELLED" }, "cancel")} type="button">انصراف</button> : <button className="approve" disabled={Boolean(pending)} onClick={() => update({ status: "ACTIVE" }, "activate")} type="button">فعال‌سازی</button>}
      <button disabled={Boolean(pending)} onClick={() => update({ autoRenew: !autoRenew }, "renew")} type="button">Auto-renew {autoRenew ? "off" : "on"}</button>
      {error && <small>{error}</small>}
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";

type Goal = { id: string; kind: string; target: number; unit: string; deadline: string | null };

const KINDS: Record<string, string> = {
  weight: "وزن هدف",
  body_fat: "درصد چربی هدف",
  waist: "دور کمر هدف",
  workouts_per_week: "تمرین در هفته",
  custom: "هدف دلخواه",
};

// Item 9: goal setting (هدف‌گذاری) with progress hint.
export function GoalsPanel({ latest }: { latest: { weightKg?: number | null; bodyFatPercent?: number | null; waistCm?: number | null } }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");
  const [kind, setKind] = useState("weight");

  async function load() {
    const res = await fetch("/api/user/goals");
    if (res.ok) setGoals((await res.json()).goals || []);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount load from API
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/user/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, target: Number(target), unit }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "خطا در ثبت هدف."); return; }
    setTarget("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/user/goals/${id}`, { method: "DELETE" });
    load();
  }

  function currentFor(g: Goal): number | null {
    if (g.kind === "weight") return latest.weightKg ?? null;
    if (g.kind === "body_fat") return latest.bodyFatPercent ?? null;
    if (g.kind === "waist") return latest.waistCm ?? null;
    return null;
  }

  return (
    <section className="member-panel" aria-label="هدف‌گذاری">
      <div className="member-panel__heading"><div><h2>هدف‌های من</h2><p>مقصدت را مشخص کن، پیشرفتت را ببین</p></div><Icon name="bolt" size={18} /></div>
      <form className="goals-form" onSubmit={submit}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="نوع هدف">
          {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="مقدار هدف" inputMode="decimal" required aria-label="مقدار هدف" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="واحد (kg)" aria-label="واحد" />
        <button className="member-primary-button" type="submit">ثبت هدف</button>
      </form>
      {error && <p className="member-form-error">{error}</p>}
      <div className="goals-list">
        {goals.length === 0 && <p className="member-empty-line">هنوز هدفی ثبت نشده.</p>}
        {goals.map((g) => {
          const cur = currentFor(g);
          return (
            <article key={g.id}>
              <div><strong>{KINDS[g.kind] || g.kind}</strong><small>{g.target} {g.unit}{cur !== null ? ` · فعلی: ${cur}` : ""}</small></div>
              <button type="button" aria-label="حذف هدف" onClick={() => remove(g.id)}>×</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

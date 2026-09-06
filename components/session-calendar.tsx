"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CalSession = { id: string; title: string; startsAt: string; endsAt: string; status: string; person?: string };

// Item 11: professional sessions calendar — weekly/monthly views, move & cancel.
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-first
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// `endpointBase` is a plain string (not a function) so Server Components can pass it.
export function SessionCalendar({ sessions, endpointBase }: { sessions: CalSession[]; endpointBase: string }) {
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState("");
  const router = useRouter();

  const days = useMemo(() => {
    const a = new Date(anchor + "T12:00:00");
    if (mode === "week") {
      const s = startOfWeek(a);
      return Array.from({ length: 7 }, (_, i) => new Date(s.getTime() + i * 86_400_000));
    }
    const first = new Date(a.getFullYear(), a.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    return Array.from({ length: 35 }, (_, i) => new Date(first.getTime() + (i - lead) * 86_400_000));
  }, [anchor, mode]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalSession[]>();
    for (const s of sessions) {
      const key = new Date(s.startsAt).toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const list of map.values()) list.sort((x, y) => +new Date(x.startsAt) - +new Date(y.startsAt));
    return map;
  }, [sessions]);

  async function act(id: string, action: "cancel" | "complete" | "move", startsAt?: string, endsAt?: string) {
    setPending(id + action);
    try {
      const body = action === "move" ? { startsAt, endsAt, status: "SCHEDULED" } : { status: action === "cancel" ? "CANCELLED" : "COMPLETED" };
      const res = await fetch(`${endpointBase}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 409) {
        const data = await res.json();
        alert(data.error || "تداخل زمانی وجود دارد.");
      } else {
        router.refresh();
      }
    } finally {
      setPending("");
    }
  }

  function shiftDay(id: string, s: CalSession, delta: number) {
    const st = new Date(new Date(s.startsAt).getTime() + delta * 86_400_000);
    const en = new Date(new Date(s.endsAt).getTime() + delta * 86_400_000);
    act(id, "move", st.toISOString(), en.toISOString());
  }

  return (
    <section className="session-calendar" aria-label="تقویم جلسات">
      <div className="session-calendar__bar">
        <div role="tablist" aria-label="نما">
          <button role="tab" aria-selected={mode === "week"} className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>هفتگی</button>
          <button role="tab" aria-selected={mode === "month"} className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>ماهانه</button>
        </div>
        <input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} aria-label="تاریخ مرجع" />
        <button onClick={() => setAnchor(new Date().toISOString().slice(0, 10))}>امروز</button>
      </div>
      <div className={`session-calendar__grid session-calendar__grid--${mode}`}>
        {days.map((d) => {
          const key = d.toLocaleDateString("en-CA");
          const list = byDay.get(key) || [];
          const today = key === new Date().toLocaleDateString("en-CA");
          return (
            <article key={key} className={today ? "is-today" : ""}>
              <header><strong>{d.toLocaleDateString("fa-IR", { weekday: "short" })}</strong><span>{d.toLocaleDateString("fa-IR", { day: "numeric", month: "short" })}</span></header>
              {list.map((s) => (
                <div key={s.id} className={`cal-event cal-event--${s.status.toLowerCase()}`}>
                  <strong>{new Date(s.startsAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} · {s.title}</strong>
                  {s.person && <small>{s.person}</small>}
                  {s.status === "SCHEDULED" && (
                    <div className="cal-event__actions">
                      <button disabled={!!pending} title="یک روز جلوتر" onClick={() => shiftDay(s.id, s, 1)}>+۱روز</button>
                      <button disabled={!!pending} title="یک روز عقب‌تر" onClick={() => shiftDay(s.id, s, -1)}>−۱روز</button>
                      <button disabled={!!pending} onClick={() => act(s.id, "complete")}>انجام شد</button>
                      <button disabled={!!pending} onClick={() => act(s.id, "cancel")}>لغو</button>
                    </div>
                  )}
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}

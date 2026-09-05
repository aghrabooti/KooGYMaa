"use client";

import { useMemo, useState } from "react";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from "@/lib/exercises";
import { Icon } from "@/components/icon";

// Item 10: exercise library (کتابخانه حرکات) + tutorial video links.
export function ExercisePicker({ onPick }: { onPick: (name: string, restSeconds: number | null) => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => {
      if (muscle && e.muscle !== muscle) return false;
      if (!needle) return true;
      return e.nameEn.toLowerCase().includes(needle) || e.nameFa.includes(q.trim());
    }).slice(0, 12);
  }, [q, muscle]);

  return (
    <div className="exercise-picker" aria-label="کتابخانه حرکات">
      <div className="exercise-picker__filters">
        <label><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی حرکت… (squat، پرس…)" aria-label="جستجوی حرکت" /></label>
        <select value={muscle} onChange={(e) => setMuscle(e.target.value)} aria-label="گروه عضلانی">
          <option value="">همه عضلات</option>
          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="exercise-picker__results">
        {results.map((e) => (
          <article key={e.id}>
            <div><strong>{e.nameFa}</strong><small>{e.nameEn} · {e.muscleFa} · {e.equipment}</small></div>
            <div className="exercise-picker__actions">
              {e.videoUrl && <a href={e.videoUrl} target="_blank" rel="noreferrer" title="ویدئوی آموزشی">🎬 آموزش</a>}
              <button type="button" onClick={() => onPick(e.nameFa, e.muscle === "cardio" ? null : 90)}>＋ افزودن</button>
            </div>
          </article>
        ))}
        {!results.length && <p className="trainer-availability-empty">حرکتی پیدا نشد — نام دلخواه را دستی وارد کنید.</p>}
      </div>
    </div>
  );
}

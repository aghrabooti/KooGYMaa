"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { ExercisePicker } from "@/components/trainer/exercise-picker";
import { faStatus } from "@/components/fa";

type Exercise = { key: string; name: string; sets: number | null; reps: string; weight: string; tempo: string; restSeconds: number | null; durationSeconds: number | null; distanceMeters: number | null; notes: string };
type Day = { key: string; name: string; notes: string; exercises: Exercise[] };
type Plan = { id: string; title: string; description: string | null; gymId: string | null; isTemplate: boolean; status: "DRAFT" | "ACTIVE" | "ARCHIVED"; version: number; assignmentCount: number; days: Day[] };
const blankExercise = (): Exercise => ({ key: crypto.randomUUID(), name: "", sets: 3, reps: "8–12", weight: "", tempo: "", restSeconds: 90, durationSeconds: null, distanceMeters: null, notes: "" });

export function WorkoutPlanEditor({ gyms, plan }: { gyms: Array<{ id: string; name: string }>; plan: Plan }) {
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description || "");
  const [gymId, setGymId] = useState(plan.gymId || "");
  const [isTemplate, setTemplate] = useState(plan.isTemplate);
  const [days, setDays] = useState(plan.days);
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const router = useRouter();
  const editable = plan.status === "DRAFT" && plan.assignmentCount === 0;

  // Item 10: unsaved-changes warning.
  const snapshot = useMemo(() => JSON.stringify({ title: plan.title, description: plan.description || "", gymId: plan.gymId || "", isTemplate: plan.isTemplate, days: plan.days }), [plan]);
  const dirty = JSON.stringify({ title, description, gymId, isTemplate, days }) !== snapshot;
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  function patchDay(index: number, values: Partial<Day>) { setDays((items) => items.map((day, i) => i === index ? { ...day, ...values } : day)); }
  function patchExercise(dayIndex: number, exerciseIndex: number, values: Partial<Exercise>) { setDays((items) => items.map((day, i) => i === dayIndex ? { ...day, exercises: day.exercises.map((exercise, j) => j === exerciseIndex ? { ...exercise, ...values } : exercise) } : day)); }
  function moveDay(index: number, delta: number) {
    setDays((items) => {
      const next = [...items];
      const j = index + delta;
      if (j < 0 || j >= next.length) return items;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }
  function duplicateDay(index: number) {
    setDays((items) => {
      const src = items[index];
      const copy: Day = { key: crypto.randomUUID(), name: `${src.name} (کپی)`, notes: src.notes, exercises: src.exercises.map((e) => ({ ...e, key: crypto.randomUUID() })) };
      return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
    });
  }

  // Item 10: complete required fields before save/publish.
  function validate(): string | null {
    if (title.trim().length < 3) return "عنوان برنامه حداقل ۳ کاراکتر باشد.";
    if (!days.length) return "حداقل یک روز تمرینی اضافه کنید.";
    for (let i = 0; i < days.length; i++) {
      if (!days[i].name.trim()) return `نام روز ${i + 1} را وارد کنید.`;
      if (!days[i].exercises.length) return `روز «${days[i].name}» حداقل یک حرکت نیاز دارد.`;
      for (const ex of days[i].exercises) {
        if (!ex.name.trim()) return `نام همه حرکات روز «${days[i].name}» را وارد کنید.`;
      }
    }
    return null;
  }

  async function save(): Promise<boolean> {
    const problem = validate();
    if (problem) { setError(problem); return false; }
    setPending("save"); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/trainer/workouts/${plan.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, gymId, isTemplate, days: days.map((day) => ({ name: day.name, notes: day.notes, exercises: day.exercises.map((exercise) => ({ name: exercise.name, sets: exercise.sets, reps: exercise.reps, weight: exercise.weight, tempo: exercise.tempo, restSeconds: exercise.restSeconds, durationSeconds: exercise.durationSeconds, distanceMeters: exercise.distanceMeters, notes: exercise.notes })) })) }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "طرح ذخیره نشد."); return false; }
      setMessage("برنامه تمرین ذخیره شد.");
      router.refresh();
      return true;
    } catch { setError("اتصال برقرار نشد."); return false; } finally { setPending(""); }
  }

  // Item 2: publish ONLY after a successful save — never publish stale/failed drafts.
  async function publish() {
    if (editable) {
      const saved = await save();
      if (!saved) return;
    }
    setPending("publish"); setError("");
    try {
      const response = await fetch(`/api/trainer/workouts/${plan.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "طرح منتشر نشد."); return; }
      router.refresh();
    } finally { setPending(""); }
  }

  return <section className="trainer-plan-editor">
    <div className="trainer-plan-editor__meta"><div><label><span>عنوان طرح *</span><input disabled={!editable} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span>باشگاه</span><select disabled={!editable} value={gymId} onChange={(event) => setGymId(event.target.value)}><option value="">مربی‌گری مستقل</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></label><label className="trainer-form-wide"><span>توضیحات</span><textarea disabled={!editable} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="trainer-check"><input checked={isTemplate} disabled={!editable} type="checkbox" onChange={(event) => setTemplate(event.target.checked)} /><span>قالب آماده</span></label></div><aside><span className={`trainer-status trainer-status--${plan.status.toLowerCase()}`}>{faStatus(plan.status)}</span><strong>نسخه {plan.version}</strong><small>{plan.assignmentCount} تکالیف</small>{dirty && editable && <small className="trainer-dirty">● تغییرات ذخیره‌نشده</small>}</aside></div>
    {!editable && <p className="trainer-plan-notice"><Icon name="lock" size={15} /> نسخه‌های منتشرشده یا تخصیص‌یافته فقط‌خواندنی‌اند؛ برای تغییر، نسخه تازه بسازید.</p>}
    <div className="trainer-workout-days">
      {days.map((day, dayIndex) => (
        <article className="trainer-workout-day" key={day.key}>
          <header><span>{dayIndex + 1}</span><input disabled={!editable} value={day.name} onChange={(event) => patchDay(dayIndex, { name: event.target.value })} placeholder="نام روز تمرینی *" /><input disabled={!editable} value={day.notes} onChange={(event) => patchDay(dayIndex, { notes: event.target.value })} placeholder="یادداشت روز" />
            {editable && <span className="trainer-day-tools">
              <button title="روز قبل" disabled={dayIndex === 0} onClick={() => moveDay(dayIndex, -1)}>↑</button>
              <button title="روز بعد" disabled={dayIndex === days.length - 1} onClick={() => moveDay(dayIndex, 1)}>↓</button>
              <button title="کپی روز" onClick={() => duplicateDay(dayIndex)}>⧉</button>
              <button aria-label="حذف روز" onClick={() => setDays((items) => items.filter((_, i) => i !== dayIndex))}>×</button>
            </span>}
          </header>
          <div className="trainer-exercise-head"><span>حرکت *</span><span>ست</span><span>تکرار</span><span>وزن</span><span>تمپو</span><span>استراحت</span><span /></div>
          {day.exercises.map((exercise, exerciseIndex) => <div className="trainer-exercise-row" key={exercise.key}><input disabled={!editable} value={exercise.name} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { name: event.target.value })} placeholder="نام حرکت *" /><input disabled={!editable} min="1" type="number" value={exercise.sets ?? ""} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { sets: event.target.value ? Number(event.target.value) : null })} /><input disabled={!editable} value={exercise.reps} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { reps: event.target.value })} /><input disabled={!editable} value={exercise.weight} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { weight: event.target.value })} placeholder="RPE / کیلوگرم" /><input disabled={!editable} value={exercise.tempo} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { tempo: event.target.value })} placeholder="3-1-1" /><input disabled={!editable} min="0" type="number" value={exercise.restSeconds ?? ""} onChange={(event) => patchExercise(dayIndex, exerciseIndex, { restSeconds: event.target.value ? Number(event.target.value) : null })} />{editable && <button aria-label="حذف حرکت" onClick={() => patchDay(dayIndex, { exercises: day.exercises.filter((_, i) => i !== exerciseIndex) })}>×</button>}</div>)}
          {editable && <button className="trainer-add-row" onClick={() => patchDay(dayIndex, { exercises: [...day.exercises, blankExercise()] })}><Icon name="plus" size={14} /> افزودن حرکت</button>}
          {editable && <button className="trainer-add-row" onClick={() => setPickerFor(pickerFor === dayIndex ? null : dayIndex)}><Icon name="search" size={14} /> {pickerFor === dayIndex ? "بستن کتابخانه حرکات" : "افزودن از کتابخانه حرکات"}</button>}
          {editable && pickerFor === dayIndex && <ExercisePicker onPick={(name, rest) => patchDay(dayIndex, { exercises: [...days[dayIndex].exercises, { ...blankExercise(), name, restSeconds: rest }] })} />}
        </article>
      ))}
      {editable && <button className="trainer-add-day" onClick={() => setDays((items) => [...items, { key: crypto.randomUUID(), name: `روز ${items.length + 1}`, notes: "", exercises: [blankExercise()] }])}><Icon name="plus" size={15} /> افزودن روز تمرینی</button>}
    </div>
    {(error || message) && <p className={error ? "trainer-form-error" : "trainer-form-success"}>{error || message}</p>}
    <div className="trainer-plan-editor__actions">{editable && <button className="trainer-secondary-button" disabled={Boolean(pending)} onClick={save}>{pending === "save" ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}</button>}{plan.status === "DRAFT" && <button className="trainer-primary-button" disabled={Boolean(pending)} onClick={publish}>{pending === "publish" ? "در حال انتشار…" : "انتشار نسخه"}</button>}</div>
  </section>;
}

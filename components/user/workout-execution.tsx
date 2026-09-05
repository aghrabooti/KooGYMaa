"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { RestTimer } from "@/components/user/rest-timer";

export function StartWorkout({ assignmentId, dayId, hasUnfinished }: { assignmentId: string; dayId: string; hasUnfinished?: boolean }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function start() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/user/workout-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId, dayId }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to start workout."); return; }
      router.push(`/user/workouts?log=${data.log.id}${data.resumed ? "&resumed=1" : ""}`); router.refresh();
    } catch { setError("Unable to connect."); } finally { setPending(false); }
  }
  return <div className="member-start-action"><button className="member-primary-button" disabled={pending} onClick={start}>{pending ? "Starting…" : hasUnfinished ? "Continue workout" : "Start workout"} <Icon name="arrow" size={14} /></button>{error && <small>{error}</small>}</div>;
}

type Exercise = { exerciseId: string; name: string; prescribedSets: number | null; prescribedReps: string | null; prescribedWeight: string | null; completed: boolean; actualSets: number | null; actualReps: string; actualWeight: string; rpe: number | null; notes: string };
export type PreviousExercise = { exerciseId: string; actualSets: number | null; actualReps: string | null; actualWeight: string | null; completedAt: string | null };

// Item 8: autosave (localStorage + server drafts), resume, rest timer, previous-session comparison.
export function WorkoutLogForm({ logId, initial, title, previous, resumed }: {
  logId: string;
  initial: Exercise[];
  title: string;
  previous?: PreviousExercise[];
  resumed?: boolean;
}) {
  const storageKey = `koogymaa:draft:${logId}`;
  // Restore a local draft once via lazy initializers (autosave safety net across reloads).
  const [draft] = useState<{ exercises?: Exercise[]; effort?: number | null; notes?: string } | null>(() => {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as { exercises?: Exercise[]; effort?: number | null; notes?: string }) : null;
    } catch { return null; }
  });
  const draftExercises = draft && Array.isArray(draft.exercises) && draft.exercises.length === initial.length ? draft.exercises : null;
  const [exercises, setExercises] = useState<Exercise[]>(draftExercises || initial);
  const [effort, setEffort] = useState<number | null>(draft?.effort ?? null);
  const [notes, setNotes] = useState(draft?.notes || "");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(draftExercises ? "پیش‌نویس بازیابی شد" : null);
  const [restFor, setRestFor] = useState<number | null>(null);
  const router = useRouter();
  const stateRef = useRef({ exercises, effort, notes });
  useEffect(() => {
    stateRef.current = { exercises, effort, notes };
  });
  const prevById = new Map((previous || []).map((p) => [p.exerciseId, p]));

  // Autosave: local draft every change + quiet server draft every 20s.
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(stateRef.current)); } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(t);
  }, [exercises, effort, notes, storageKey]);

  useEffect(() => {
    const t = setInterval(async () => {
      const s = stateRef.current;
      try {
        await fetch(`/api/user/workout-logs/${logId}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_PROGRESS", perceivedEffort: s.effort, notes: s.notes, exercises: s.exercises.map((item) => ({ exerciseId: item.exerciseId, completed: item.completed, actualSets: item.actualSets, actualReps: item.actualReps, actualWeight: item.actualWeight, rpe: item.rpe, notes: item.notes })) }) });
        setSavedAt(`ذخیره خودکار ${new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`);
      } catch { /* silent */ }
    }, 20000);
    return () => clearInterval(t);
  }, [logId]);

  // Unsaved-changes warning (shared with plan builder).
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  function patch(index: number, values: Partial<Exercise>) { setExercises((items) => items.map((item, i) => i === index ? { ...item, ...values } : item)); }

  async function save(status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED") {
    setPending(status); setError("");
    try {
      const response = await fetch(`/api/user/workout-logs/${logId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, perceivedEffort: effort, notes, exercises: exercises.map((item) => ({ exerciseId: item.exerciseId, completed: item.completed, actualSets: item.actualSets, actualReps: item.actualReps, actualWeight: item.actualWeight, rpe: item.rpe, notes: item.notes })) }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to save workout."); return; }
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      router.push("/user/workouts"); router.refresh();
    } catch { setError("Unable to connect."); } finally { setPending(""); }
  }

  const done = exercises.filter((e) => e.completed).length;

  return <section className="member-log-editor">
    <header><div><span>WORKOUT {resumed ? "RESUMED" : "IN PROGRESS"} · {done}/{exercises.length}</span><h1>{title}</h1><p>Record what you completed and how each exercise felt.</p></div><button className="member-secondary-button" onClick={() => router.push("/user/workouts")}>Exit</button></header>
    {resumed && <p className="member-resume-note"><Icon name="bolt" size={14} /> تمرین نیمه‌تمام قبلی ادامه پیدا کرد.</p>}
    {savedAt && <p className="member-autosave" role="status"><Icon name="check" size={13} /> {savedAt}</p>}
    <RestTimer defaultSeconds={restFor ?? 90} key={restFor ?? "default"} />
    <div className="member-exercise-log"><div className="member-exercise-log__head"><span>Done</span><span>Exercise</span><span>Sets</span><span>Reps</span><span>Weight</span><span>RPE</span></div>
      {exercises.map((exercise, index) => {
        const prev = prevById.get(exercise.exerciseId);
        return <article className={exercise.completed ? "is-done" : ""} key={exercise.exerciseId}>
          <label><input checked={exercise.completed} type="checkbox" onChange={(event) => patch(index, { completed: event.target.checked })} /><span><Icon name="check" size={13} /></span></label>
          <div><strong>{exercise.name}</strong><small>{exercise.prescribedSets || "—"} sets · {exercise.prescribedReps || "—"} reps · {exercise.prescribedWeight || "bodyweight"}</small>
            {prev && (prev.actualSets || prev.actualReps || prev.actualWeight) && <small className="member-prev">جلسه قبل: {prev.actualSets ?? "—"}×{prev.actualReps ?? "—"} · {prev.actualWeight ?? "—"}</small>}</div>
          <input min="0" type="number" value={exercise.actualSets ?? ""} aria-label="ست‌ها" onChange={(event) => patch(index, { actualSets: event.target.value ? Number(event.target.value) : null })} />
          <input value={exercise.actualReps} aria-label="تکرارها" onChange={(event) => patch(index, { actualReps: event.target.value })} />
          <input value={exercise.actualWeight} aria-label="وزنه" onChange={(event) => patch(index, { actualWeight: event.target.value })} />
          <input min="1" max="10" type="number" value={exercise.rpe ?? ""} aria-label="RPE" onChange={(event) => patch(index, { rpe: event.target.value ? Number(event.target.value) : null })} />
          <button type="button" className="member-rest-link" title="شروع استراحت" onClick={() => setRestFor(90)}>⏱</button>
        </article>;
      })}
    </div>
    <div className="member-log-summary"><label><span>Overall effort (1–10)</span><input min="1" max="10" type="number" value={effort ?? ""} onChange={(event) => setEffort(event.target.value ? Number(event.target.value) : null)} /></label><label><span>Workout notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div>
    {error && <p className="member-form-error">{error}</p>}
    <footer><button className="member-secondary-button" disabled={Boolean(pending)} onClick={() => save("IN_PROGRESS")}>Save for later</button><button className="member-primary-button" disabled={Boolean(pending)} onClick={() => save("COMPLETED")}>{pending === "COMPLETED" ? "Completing…" : "Complete workout"}</button></footer>
  </section>;
}

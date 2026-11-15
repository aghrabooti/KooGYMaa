"use client";

import { useMemo, useState } from "react";
import { exerciseEquipmentLabel, MUSCLE_GROUPS, searchExercises } from "@/lib/exercises";
import { ExerciseDemoLink } from "@/components/exercise-demo-link";
import { Icon } from "@/components/icon";

const PAGE_SIZE = 16;
const number = new Intl.NumberFormat("fa-IR");

export function ExercisePicker({ onPick }: { onPick: (name: string, restSeconds: number | null) => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [page, setPage] = useState(0);
  const results = useMemo(() => searchExercises(q, muscle), [q, muscle]);
  const visible = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.ceil(results.length / PAGE_SIZE);

  return (
    <div className="exercise-picker" aria-label="کتابخانه حرکات">
      <div className="exercise-picker__filters">
        <label><Icon name="search" size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="نام حرکت یا وسیله" aria-label="جستجوی حرکت" /></label>
        <select value={muscle} onChange={(e) => { setMuscle(e.target.value); setPage(0); }} aria-label="گروه عضلانی">
          <option value="">همهٔ گروه‌ها</option>
          {Object.entries(MUSCLE_GROUPS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      <div className="exercise-picker__results" key={`${q}/${muscle}/${page}`}>
        {visible.map((exercise) => {
          const name = exercise.nameFa ?? exercise.nameEn;
          const equipment = exerciseEquipmentLabel(exercise.equipment);

          return (
            <article key={exercise.id}>
              <div>
                <strong><bdi>{name}</bdi></strong>
                <small>{exercise.nameFa && <><bdi>{exercise.nameEn}</bdi> · </>}{MUSCLE_GROUPS[exercise.muscle]}{equipment ? ` · ${equipment}` : ""}</small>
              </div>
              <div className="exercise-picker__actions">
                <ExerciseDemoLink demo={exercise.demo} name={name} />
                <button type="button" onClick={() => onPick(name, exercise.muscle === "cardio" || exercise.muscle === "mobility" ? null : 90)}>＋ افزودن</button>
              </div>
            </article>
          );
        })}
        {!results.length && <p className="trainer-availability-empty">حرکتی پیدا نشد. می‌توانید نام حرکت را دستی وارد کنید.</p>}
      </div>
      {results.length > 0 && (
        <div className="exercise-picker__pagination">
          <span role="status">{number.format(results.length)} حرکت{pageCount > 1 ? ` · صفحهٔ ${number.format(page + 1)} از ${number.format(pageCount)}` : ""}</span>
          {pageCount > 1 && (
            <div>
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>قبلی</button>
              <button type="button" disabled={page + 1 === pageCount} onClick={() => setPage(page + 1)}>بعدی</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

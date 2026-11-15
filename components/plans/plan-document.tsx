import type { ReactNode } from "react";
import {
  PLAN_KIND_LABEL,
  PLAN_STATUS_LABEL,
  faNumber,
  formatPersianDate,
  planTotals,
  runningHeaderLine,
  planDocumentHeading,
  type PlanDocumentData,
  type PlanFoodItem,
  type PlanWorkoutDay,
  type PlanWorkoutExercise,
  type PlanNutritionDay,
} from "@/lib/plan-document";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pdf-section-title">
      <h2>{title}</h2>
    </div>
  );
}

const exerciseColumns = ["ردیف", "حرکت", "ست", "تکرار", "وزنه", "استراحت، مدت و مسافت", "توضیحات"] as const;
const foodColumns = ["مادهٔ غذایی", "مقدار", "انرژی", "ارزش غذایی و توضیحات"] as const;

function TableCell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <td className={className} role="cell">
      <span className="pdf-cell-label" aria-hidden="true">{label}</span>
      {children}
    </td>
  );
}

function ExerciseTable({ exercises }: { exercises: PlanWorkoutExercise[] }) {
  if (!exercises.length) {
    return <p className="pdf-muted">حرکتی برای این روز ثبت نشده است.</p>;
  }
  return (
    <table className="pdf-table" role="table">
      <thead role="rowgroup">
        <tr role="row">
          {exerciseColumns.map((label) => <th key={label} scope="col" role="columnheader">{label}</th>)}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {exercises.map((exercise, index) => {
          const timing = [
            exercise.restSeconds ? `${faNumber(exercise.restSeconds)} ثانیه استراحت` : null,
            exercise.durationSeconds ? `${faNumber(exercise.durationSeconds)} ثانیه اجرا` : null,
            exercise.distanceMeters ? `${faNumber(exercise.distanceMeters)} متر` : null,
          ].filter(Boolean);
          const notes = [exercise.tempo && `ریتم حرکت ${faNumber(exercise.tempo)}`, exercise.notes].filter(Boolean);
          return (
            <tr key={`${exercise.name}-${index}`} role="row">
              <TableCell label={exerciseColumns[0]}>{faNumber(index + 1)}</TableCell>
              <TableCell label={exerciseColumns[1]} className="pdf-strong">{exercise.name}</TableCell>
              <TableCell label={exerciseColumns[2]}>{faNumber(exercise.sets)}</TableCell>
              <TableCell label={exerciseColumns[3]}>{faNumber(exercise.reps)}</TableCell>
              <TableCell label={exerciseColumns[4]}>{faNumber(exercise.weight)}</TableCell>
              <TableCell label={exerciseColumns[5]}>{timing.join("، ") || "—"}</TableCell>
              <TableCell label={exerciseColumns[6]} className="pdf-note">{notes.join("، ") || "—"}</TableCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function WorkoutDay({ day, index }: { day: PlanWorkoutDay; index: number }) {
  return (
    <section className="pdf-day" data-pdf-block>
      <div className="pdf-day__head">
        <span className="pdf-day__badge">{faNumber(day.dayNumber || index + 1)}</span>
        <div>
          <h3>{day.name}</h3>
        </div>
        <b>{faNumber(day.exercises.length)} حرکت</b>
      </div>
      {day.notes ? <p className="pdf-day__note">{day.notes}</p> : null}
      <ExerciseTable exercises={day.exercises} />
    </section>
  );
}

function FoodTable({ foods }: { foods: PlanFoodItem[] }) {
  if (!foods.length) {
    return <p className="pdf-muted">هنوز مواد غذایی این وعده مشخص نشده‌اند.</p>;
  }
  return (
    <table className="pdf-table pdf-table--food" role="table">
      <thead role="rowgroup">
        <tr role="row">
          {foodColumns.map((label) => <th key={label} scope="col" role="columnheader">{label}</th>)}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {foods.map((food, index) => {
          const macros = [
            food.protein === null ? null : `${faNumber(food.protein)} گرم پروتئین`,
            food.carbs === null ? null : `${faNumber(food.carbs)} گرم کربوهیدرات`,
            food.fat === null ? null : `${faNumber(food.fat)} گرم چربی`,
            food.notes,
          ].filter(Boolean);
          return (
            <tr key={`${food.name}-${index}`} role="row">
              <TableCell label={foodColumns[0]} className="pdf-strong">{food.name}</TableCell>
              <TableCell label={foodColumns[1]}>{food.quantity !== null ? `${faNumber(food.quantity)}${food.unit ? ` ${food.unit}` : ""}` : "—"}</TableCell>
              <TableCell label={foodColumns[2]}>{food.calories !== null ? `${faNumber(food.calories)} کیلوکالری` : "—"}</TableCell>
              <TableCell label={foodColumns[3]} className="pdf-note">{macros.join("، ") || "—"}</TableCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NutritionDay({ day, index, fallbackCalories }: { day: PlanNutritionDay; index: number; fallbackCalories: number | null }) {
  const targets = [
    { label: "انرژی (کیلوکالری)", value: day.targetCalories ?? fallbackCalories },
    { label: "پروتئین (گرم)", value: day.targetProtein },
    { label: "کربوهیدرات (گرم)", value: day.targetCarbs },
    { label: "چربی (گرم)", value: day.targetFat },
  ];
  return (
    <section className="pdf-day" data-pdf-block>
      <div className="pdf-day__head">
        <span className="pdf-day__badge">{faNumber(day.dayNumber || index + 1)}</span>
        <div>
          <h3>{day.name}</h3>
        </div>
        <b>{faNumber(day.meals.length)} وعده</b>
      </div>
      <div className="pdf-targets">
        {targets.map((target) => (
          <div key={target.label}>
            <small>{target.label}</small>
            <strong>{faNumber(target.value)}</strong>
          </div>
        ))}
      </div>
      {day.notes ? <p className="pdf-day__note">{day.notes}</p> : null}
      {day.meals.length ? (
        day.meals.map((meal) => (
          <div className="pdf-meal" key={meal.id}>
            <div className="pdf-meal__head">
              <span className="pdf-meal__dot" />
              <strong>{meal.name}</strong>
              {meal.scheduledTime ? <small>{faNumber(meal.scheduledTime)}</small> : null}
            </div>
            {meal.notes ? <p className="pdf-day__note">{meal.notes}</p> : null}
            <FoodTable foods={meal.foodItems} />
          </div>
        ))
      ) : (
        <p className="pdf-muted">هنوز وعده‌ای برای این روز مشخص نشده است.</p>
      )}
    </section>
  );
}

function Overview({ doc }: { doc: PlanDocumentData }) {
  const facts: Array<{ label: string; value: string }> = [
    { label: "باشگاه", value: doc.gymName || "مربی مستقل" },
    { label: "نوع برنامه", value: doc.isTemplate ? "الگوی آماده" : "برنامهٔ اختصاصی" },
    { label: "تاریخ شروع", value: doc.startDate ? formatPersianDate(doc.startDate) : "تعیین نشده" },
    { label: "تاریخ پایان", value: doc.endDate ? formatPersianDate(doc.endDate) : "تعیین نشده" },
  ];
  if (doc.kind === "nutrition") {
    facts.push({
      label: "محدودیت‌های غذایی",
      value: doc.dietaryRestrictions || "محدودیتی ثبت نشده است",
    });
  }
  return (
    <section className="pdf-overview" data-pdf-block>
      <SectionTitle title="خلاصهٔ برنامه" />
      <div className="pdf-stats">
        {planTotals(doc).map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
      <div className="pdf-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <small>{fact.label}</small>
            <span>{fact.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Shared content for the responsive preview and A4 export. */
export function PlanDocument({ doc }: { doc: PlanDocumentData }) {
  return (
    <div className="pdf-document">
      <div className="pdf-sheet" id="pdf-sheet">
        <header className="pdf-head" id="pdf-head">
          <div className="pdf-head__top">
            <div className="pdf-brand">
              <span className="pdf-brand__mark">ک</span>
              <div>
                <strong>کوجیما</strong>
              </div>
            </div>
            <div className="pdf-head__issue">
              <small>تاریخ صدور (شمسی)</small>
              <strong>{formatPersianDate(doc.issuedAt)}</strong>
            </div>
          </div>

          <div className="pdf-head__title">
            {doc.genericPreview && <span className="pdf-kicker">{PLAN_KIND_LABEL[doc.kind]}</span>}
            <h1>{planDocumentHeading(doc)}</h1>
            {!doc.genericPreview && doc.title && <p>{doc.title}</p>}
            {doc.studentEmail && <p><bdi>{doc.studentEmail}</bdi></p>}
            {doc.description ? <p>{doc.description}</p> : null}
          </div>

          <div className="pdf-head__meta">
            <div>
              <strong>با راهنمایی {doc.trainerName}</strong>
              {doc.trainerSpecialty ? <em>{doc.trainerSpecialty}</em> : null}
            </div>
            <div>
              <small>نسخهٔ برنامه</small>
              <strong>{faNumber(doc.version)}</strong>
              <em>{PLAN_STATUS_LABEL[doc.status] || doc.status}</em>
            </div>
          </div>
        </header>

        <div className="pdf-body" id="pdf-body">
          <Overview doc={doc} />
          {doc.days.length ? (
            <section className="pdf-days-intro" data-pdf-block>
              <SectionTitle title={doc.kind === "workouts" ? "برنامهٔ روزهای تمرین" : "برنامهٔ غذایی روزانه"} />
            </section>
          ) : null}
          {doc.kind === "workouts"
            ? doc.days.map((day, index) => <WorkoutDay key={day.id} day={day} index={index} />)
            : doc.days.map((day, index) => (
                <NutritionDay key={day.id} day={day} index={index} fallbackCalories={doc.dailyCalories} />
              ))}
          <footer className="pdf-foot" data-pdf-block>
            <span className="pdf-foot__mark">ک</span>
            <div>
              <strong>کوجیما</strong>
            </div>
            <b>{PLAN_KIND_LABEL[doc.kind]}</b>
          </footer>
        </div>
      </div>

      {/* Repeated slim header drawn at the top of every PDF page after the first. */}
      <div className="pdf-running" id="pdf-running">
        <span className="pdf-running__mark">ک</span>
        <div>
          <strong>کوجیما</strong>
          <small>{runningHeaderLine(doc)}</small>
        </div>
      </div>
    </div>
  );
}

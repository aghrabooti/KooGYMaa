import {
  PLAN_KIND_LABEL,
  PLAN_STATUS_LABEL,
  faNumber,
  formatPersianDate,
  planTotals,
  runningHeaderLine,
  type NutritionDocument,
  type PlanDocumentData,
  type PlanFoodItem,
  type PlanWorkoutDay,
  type PlanWorkoutExercise,
  type PlanNutritionDay,
} from "@/lib/plan-document";

function SectionTitle({ number, title, hint }: { number: string; title: string; hint?: string }) {
  return (
    <div className="pdf-section-title">
      <span>{number}</span>
      <h2>{title}</h2>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function ExerciseTable({ exercises }: { exercises: PlanWorkoutExercise[] }) {
  if (!exercises.length) {
    return <p className="pdf-muted">حرکتی برای این روز ثبت نشده است.</p>;
  }
  return (
    <table className="pdf-table">
      <thead>
        <tr>
          <th>ردیف</th>
          <th>حرکت</th>
          <th>ست</th>
          <th>تکرار</th>
          <th>وزن</th>
          <th>استراحت</th>
          <th>توضیح</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((exercise, index) => (
          <tr key={`${exercise.name}-${index}`}>
            <td>{faNumber(index + 1)}</td>
            <td className="pdf-strong">{exercise.name}</td>
            <td>{exercise.sets ? faNumber(exercise.sets) : "—"}</td>
            <td>{exercise.reps || "—"}</td>
            <td>{exercise.weight || "—"}</td>
            <td>
              {exercise.restSeconds
                ? `${faNumber(exercise.restSeconds)} ثانیه`
                : exercise.durationSeconds
                  ? `${faNumber(exercise.durationSeconds)} ثانیه`
                  : exercise.distanceMeters
                    ? `${faNumber(exercise.distanceMeters)} متر`
                    : "—"}
            </td>
            <td className="pdf-note">{exercise.tempo || exercise.notes || "—"}</td>
          </tr>
        ))}
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
          <small>روز {faNumber(index + 1)}</small>
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
    return <p className="pdf-muted">مادهای برای این وعده ثبت نشده است.</p>;
  }
  return (
    <table className="pdf-table pdf-table--food">
      <thead>
        <tr>
          <th>مادهٔ غذایی</th>
          <th>مقدار</th>
          <th>انرژی</th>
          <th>درشتمغذیها</th>
        </tr>
      </thead>
      <tbody>
        {foods.map((food, index) => {
          const macros = [
            food.protein ? `پ ${faNumber(food.protein)}` : null,
            food.carbs ? `ک ${faNumber(food.carbs)}` : null,
            food.fat ? `چ ${faNumber(food.fat)}` : null,
          ].filter(Boolean);
          return (
            <tr key={`${food.name}-${index}`}>
              <td className="pdf-strong">{food.name}</td>
              <td>{food.quantity ? `${faNumber(food.quantity)}${food.unit ? ` ${food.unit}` : ""}` : "—"}</td>
              <td>{food.calories ? `${faNumber(food.calories)} کیلوکالری` : "—"}</td>
              <td className="pdf-note">{macros.length ? macros.join(" · ") : food.notes || "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NutritionDay({ day, index, fallbackCalories }: { day: PlanNutritionDay; index: number; fallbackCalories: number | null }) {
  const targets = [
    { label: "کالری", value: day.targetCalories ?? fallbackCalories },
    { label: "پروتئین", value: day.targetProtein },
    { label: "کربوهیدرات", value: day.targetCarbs },
    { label: "چربی", value: day.targetFat },
  ];
  return (
    <section className="pdf-day" data-pdf-block>
      <div className="pdf-day__head">
        <span className="pdf-day__badge">{faNumber(day.dayNumber || index + 1)}</span>
        <div>
          <small>روز {faNumber(index + 1)}</small>
          <h3>{day.name}</h3>
        </div>
        <b>{faNumber(day.meals.length)} وعده</b>
      </div>
      <div className="pdf-targets">
        {targets.map((target) => (
          <div key={target.label}>
            <small>{target.label}</small>
            <strong>{target.value ? faNumber(target.value) : "—"}</strong>
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
              <small>{meal.scheduledTime || "زمان آزاد"}</small>
            </div>
            {meal.notes ? <p className="pdf-day__note">{meal.notes}</p> : null}
            <FoodTable foods={meal.foodItems} />
          </div>
        ))
      ) : (
        <p className="pdf-muted">وعدهای برای این روز ثبت نشده است.</p>
      )}
    </section>
  );
}

function Overview({ doc }: { doc: PlanDocumentData }) {
  const facts: Array<{ label: string; value: string }> = [
    { label: "باشگاه", value: doc.gymName || "مربیگری مستقل" },
    { label: "وضعیت طرح", value: PLAN_STATUS_LABEL[doc.status] || doc.status },
    { label: "نوع طرح", value: doc.isTemplate ? "قالب آماده" : "اختصاصی شاگرد" },
    { label: "شروع برنامه", value: doc.startDate ? formatPersianDate(doc.startDate) : "پس از توافق با مربی" },
    { label: "پایان برنامه", value: doc.endDate ? formatPersianDate(doc.endDate) : "نامشخص" },
  ];
  if (doc.kind === "nutrition") {
    const nutrition = doc as NutritionDocument;
    facts.push({
      label: "ملاحظات غذایی",
      value: nutrition.dietaryRestrictions || "محدودیت خاصی ثبت نشده است.",
    });
  }
  return (
    <section className="pdf-overview" data-pdf-block>
      <SectionTitle number="۰۱" title="خلاصهٔ برنامه" hint="نگاهی سریع به محتوای این سند" />
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
      {doc.genericPreview ? (
        <p className="pdf-hint">این سند یک پیشنمایش کلی است؛ برای درج نام شاگرد، شاگرد را از بالای صفحه انتخاب کنید.</p>
      ) : null}
    </section>
  );
}

/**
 * The printable A4 sheet. It is also the exact source used by the client-side
 * PDF exporter, so the download and the on-screen preview are identical.
 */
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
                <small>سامانهٔ تمرین و تغذیه</small>
              </div>
            </div>
            <div className="pdf-head__issue">
              <small>تاریخ شمسی صدور</small>
              <strong>{formatPersianDate(doc.issuedAt)}</strong>
            </div>
          </div>

          <div className="pdf-head__title">
            <span className="pdf-kicker">{PLAN_KIND_LABEL[doc.kind]}</span>
            <h1>{doc.title}</h1>
            <p>{doc.description || "ساختار روزبهروز این برنامه در صفحههای بعد آمده است."}</p>
          </div>

          <div className="pdf-head__meta">
            <div>
              <small>شاگرد</small>
              <strong>{doc.studentName}</strong>
              <em>{doc.studentEmail || "—"}</em>
            </div>
            <div>
              <small>مربی</small>
              <strong>{doc.trainerName}</strong>
              <em>{doc.trainerSpecialty || "مربی برنامه"}</em>
            </div>
            <div>
              <small>تاریخ شمسی</small>
              <strong>{formatPersianDate(doc.issuedAt)}</strong>
              <em>بهوقت تهران</em>
            </div>
            <div>
              <small>نسخهٔ طرح</small>
              <strong>{faNumber(doc.version)}</strong>
              <em>{PLAN_STATUS_LABEL[doc.status] || doc.status}</em>
            </div>
          </div>
        </header>

        <div className="pdf-body" id="pdf-body">
          <Overview doc={doc} />
          {doc.days.length ? (
            <section className="pdf-days-intro" data-pdf-block>
              <SectionTitle
                number="۰۲"
                title={doc.kind === "workouts" ? "روزهای تمرین" : "روزهای تغذیه"}
                hint={`${faNumber(doc.days.length)} روز در این نسخه`}
              />
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
              <strong>کوجیما · همراه مسیر تمرین و تغذیهٔ شما</strong>
              <small>
                این سند در تاریخ {formatPersianDate(doc.issuedAt)} برای {doc.studentName} توسط {doc.trainerName} صادر شده است.
              </small>
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
        <b>{formatPersianDate(doc.issuedAt)}</b>
      </div>
      <p className="pdf-running-note">نمونهٔ سربرگ تکرارشونده در صفحههای بعد فایل PDF</p>
    </div>
  );
}

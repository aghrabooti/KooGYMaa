import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PLAN_KIND_LABEL,
  faNumber,
  formatPersianDate,
  formatPersianDateTime,
  pdfFilename,
  planTotals,
  runningHeaderLine,
  planDocumentHeading,
  type NutritionDocument,
  type WorkoutDocument,
} from "../lib/plan-document";

const file = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

const base = {
  planId: "seed-workout-plan",
  title: "قدرت پایه",
  description: "برنامهٔ چهار هفته",
  status: "ACTIVE",
  version: 2,
  isTemplate: false,
  gymName: "باشگاه مرکزی",
  trainerName: "سارا مربی",
  trainerSpecialty: "قدرت و بدنسازی",
  studentName: "نیما احمدی",
  studentEmail: "member@koogymaa.test",
  studentId: "seed-user-member",
  issuedAt: "2026-11-14T22:16:36.299Z",
  startDate: null,
  endDate: null,
  genericPreview: false,
};

const workout = (): WorkoutDocument => ({
  ...base,
  kind: "workouts",
  days: [
    {
      id: "d1",
      dayNumber: 1,
      name: "روز نخست",
      notes: null,
      exercises: [
        { name: "اسکات", sets: 4, reps: "۸", weight: "۶۰ کیلوگرم", tempo: null, restSeconds: 90, durationSeconds: null, distanceMeters: null, notes: null },
        { name: "پرس سینه", sets: 3, reps: "۱۰", weight: null, tempo: null, restSeconds: null, durationSeconds: null, distanceMeters: null, notes: null },
      ],
    },
    { id: "d2", dayNumber: 2, name: "روز دوم", notes: null, exercises: [] },
  ],
});

const nutrition = (): NutritionDocument => ({
  ...base,
  kind: "nutrition",
  dailyCalories: 2400,
  dietaryRestrictions: "بدون لبنیات",
  days: [
    {
      id: "n1",
      dayNumber: 1,
      name: "روز نخست",
      notes: null,
      targetCalories: 2300,
      targetProtein: 150,
      targetCarbs: 240,
      targetFat: 70,
      meals: [
        {
          id: "m1",
          name: "صبحانه",
          scheduledTime: "۰۷:۳۰",
          notes: null,
          foodItems: [
            { name: "جو دوسر", quantity: 80, unit: "گرم", calories: 300, protein: 10, carbs: 54, fat: 6, notes: null },
            { name: "تخممرغ", quantity: 2, unit: "عدد", calories: 140, protein: 12, carbs: 1, fat: 10, notes: null },
          ],
        },
      ],
    },
  ],
});

describe("سند PDF برنامههای تمرین و تغذیه", () => {
  it("تاریخ شمسی را بهوقت تهران و با ارقام فارسی مینویسد", () => {
    expect(formatPersianDate("2026-11-14T22:16:36.299Z")).toBe("۲۴ آبان ۱۴۰۵");
    expect(formatPersianDate("2026-03-21T00:00:00Z")).toContain("۱۴۰۵");
    expect(formatPersianDateTime("2026-11-14T22:16:36.299Z")).toContain("۲۴ آبان ۱۴۰۵");
    expect(faNumber(2400)).toBe("۲٬۴۰۰");
    expect(faNumber(null)).toBe("—");
  });

  it("سربرگ برنامه را به نام دریافت‌کننده نمایش می‌دهد", () => {
    const line = runningHeaderLine(workout());
    const heading = `${PLAN_KIND_LABEL.workouts} «نیما احمدی»`;
    expect(planDocumentHeading(workout())).toBe(heading);
    expect(line).toContain(heading);
    expect(line).toContain("با راهنمایی سارا مربی");
    expect(line).toContain("۲۴ آبان ۱۴۰۵");
    const generic = { ...workout(), genericPreview: true };
    expect(planDocumentHeading(generic)).toBe(generic.title);
    expect(runningHeaderLine(generic)).not.toContain("نیما احمدی");
  });

  it("خلاصهٔ آمار هر دو نوع طرح و نام فایل امن را میسازد", () => {
    expect(planTotals(workout()).map((item) => item.label)).toEqual([
      "روزهای تمرین",
      "تعداد حرکت‌ها",
      "تعداد کل ست‌ها",
      "شمارهٔ نسخه",
    ]);
    expect(planTotals(workout())[1].value).toBe("۲");
    expect(planTotals(workout())[2].value).toBe("۷");
    expect(planTotals(nutrition())[3].value).toBe("۲٬۴۰۰");

    expect(pdfFilename(workout())).toMatch(/^KooGYMaa-workout-[A-Za-z0-9]+-[A-Za-z0-9]+\.pdf$/);
    expect(pdfFilename(nutrition())).toMatch(/^KooGYMaa-nutrition-[A-Za-z0-9]+-[A-Za-z0-9]+\.pdf$/);
    expect(pdfFilename({ ...workout(), studentId: "seed-user-reza" })).not.toBe(pdfFilename(workout()));
  });

  it("سند، سربرگ و مسیرهای پیشنمایش/دانلود به هم وصلاند", () => {
    const doc = file("components/plans/plan-document.tsx");
    expect(doc).toContain('id="pdf-head"');
    expect(doc).toContain("با راهنمایی");
    expect(doc).toContain("تاریخ صدور (شمسی)");

    const css = file("app/plans/preview/plan-print.css");
    expect(css).toContain("@page { size: A4 portrait; margin: 0; }");
    expect(css).toContain(".pdf-head");
    expect(css).toContain(".pdf-running");

    expect(file("app/user/workouts/page.tsx")).toContain("download=1");
    expect(file("app/user/nutrition/page.tsx")).toContain("download=1");
    expect(file("components/trainer/plan-list-controls.tsx")).toContain("/plans/preview");
    expect(file("components/trainer/assignment-panel.tsx")).toContain("&student=");
    expect(file("components/trainer/assignment-panel.tsx")).toContain("&download=1");
    expect(file("app/plans/preview/page.tsx")).toContain("loadPlanDocument");
    const toolbar = file("components/plans/plan-export-toolbar.tsx");
    expect(toolbar).toContain("autoDownload");
    expect(toolbar).toContain("autoFired.current = true;");
    const loader = file("lib/plan-document-loader.ts");
    expect(loader).toContain('status: "ACTIVE"');
    expect(loader).toContain('status: { not: "CANCELLED" }');
    const layout = file("app/layout.tsx");
    expect(layout).not.toContain("next/font/google");
    expect(layout).toContain("Inter-Variable.woff2");
    expect(existsSync(fileURLToPath(new URL("../public/fonts/Inter-Variable.woff2", import.meta.url)))).toBe(true);
  });
});

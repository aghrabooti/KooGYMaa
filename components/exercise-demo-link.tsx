import type { ExerciseDemo } from "@/lib/exercises";

export function ExerciseDemoLink({ demo, name }: { demo?: ExerciseDemo; name: string }) {
  if (!demo) return null;
  const label = demo.kind === "gif" ? "نمایش اجرای حرکت" : "تصویر حرکت";

  return (
    <a className="exercise-demo-link" href={demo.url} target="_blank" rel="noreferrer" aria-label={`${label}؛ ${name}`}>
      {label}
    </a>
  );
}

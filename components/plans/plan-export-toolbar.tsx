"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { exportPlanPdf } from "@/components/plans/export-plan-pdf";
import { faNumber } from "@/lib/plan-document";

type StudentOption = { id: string; name: string; assigned: boolean };

export function PlanExportToolbar({
  filename,
  documentTitle,
  backHref,
  backLabel,
  students,
  selectedStudentId,
  autoDownload,
  genericPreview,
}: {
  filename: string;
  documentTitle: string;
  backHref: string;
  backLabel: string;
  students: StudentOption[];
  selectedStudentId: string | null;
  autoDownload: boolean;
  genericPreview: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const autoFired = useRef(false);

  const download = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setStatus({ text: "فایل PDF در حال آماده شدن است…", error: false });
    try {
      await document.fonts.ready;
      const pages = await exportPlanPdf(filename, documentTitle);
      setStatus({ text: `فایل ${faNumber(pages)} صفحه‌ای آماده شد و دانلود آن شروع شد.`, error: false });
    } catch {
      setStatus({
        text: "فایل PDF آماده نشد. دوباره تلاش کنید.",
        error: true,
      });
    } finally {
      setPending(false);
    }
  }, [documentTitle, filename, pending]);

  useEffect(() => {
    if (!autoDownload || autoFired.current) return;
    // The flag is set when the timer actually fires (not when scheduling), so
    // React Strict Mode's mount → cleanup → remount cycle still schedules once.
    const timer = window.setTimeout(() => {
      if (autoFired.current) return;
      autoFired.current = true;
      void download();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [autoDownload, download]);

  function changeStudent(id: string) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("student", id);
    else url.searchParams.delete("student");
    url.searchParams.delete("download");
    router.push(`${url.pathname}${url.search}`);
    router.refresh();
  }

  return (
    <>
      <div className="pdf-toolbar">
        <div className="pdf-toolbar__lead">
          <div>
            <strong>پیش‌نمایش برنامه</strong>
            {genericPreview && students.length > 0 ? (
              <small>برای شخصی‌سازی فایل، نام فرد را از فهرست انتخاب کنید.</small>
            ) : null}
          </div>
        </div>
        <div className="pdf-toolbar__actions">
          {students.length > 0 ? (
            <label className="pdf-student-pick">
              <span>برنامه برای</span>
              <select
                value={selectedStudentId ?? ""}
                onChange={(event) => changeStudent(event.target.value)}
                disabled={pending}
              >
                <option value="">بدون نام</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                    {student.assigned ? " (دریافت‌کنندهٔ برنامه)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Link className="pdf-btn pdf-btn--ghost" href={backHref}>
            {backLabel}
          </Link>
          <button className="pdf-btn pdf-btn--ghost" type="button" onClick={() => window.print()}>
            چاپ
          </button>
          <button className="pdf-btn pdf-btn--primary" type="button" onClick={() => void download()} disabled={pending}>
            {pending ? "در حال آماده‌سازی…" : "دانلود PDF"}
          </button>
        </div>
      </div>
      {status ? (
        <p className={`pdf-status ${status.error ? "pdf-status--error" : ""}`} role="status" aria-live="polite">
          {status.text}
        </p>
      ) : null}
    </>
  );
}

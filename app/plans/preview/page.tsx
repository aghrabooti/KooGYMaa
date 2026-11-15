import { notFound } from "next/navigation";
import { PlanDocument } from "@/components/plans/plan-document";
import { PlanExportToolbar } from "@/components/plans/plan-export-toolbar";
import { pdfFilename, runningHeaderLine, type PlanKind } from "@/lib/plan-document";
import { loadPlanDocument } from "@/lib/plan-document-loader";
import { requireCurrentUser } from "@/lib/session";
import "./plan-print.css";

type PageProps = {
  searchParams: Promise<{
    kind?: string;
    planId?: string;
    student?: string;
    download?: string;
  }>;
};

export default async function PlanPreviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const kind: PlanKind = params.kind === "nutrition" ? "nutrition" : "workouts";
  const planId = params.planId ?? "";
  const user = await requireCurrentUser(["TRAINER", "USER"]);
  const { doc, students, selectedStudentId } = await loadPlanDocument(user, kind, planId, params.student);
  if (!doc) notFound();

  const backHref =
    user.role === "TRAINER" ? `/trainer/${kind}/${planId}` : `/user/${kind}`;
  const documentTitle = runningHeaderLine(doc);

  return (
    <main className="pdf-page" dir="rtl" lang="fa">
      <PlanExportToolbar
        filename={pdfFilename(doc)}
        documentTitle={documentTitle}
        backHref={backHref}
        backLabel="بازگشت به برنامه"
        students={students}
        selectedStudentId={selectedStudentId}
        autoDownload={params.download === "1"}
        genericPreview={doc.genericPreview}
      />
      <PlanDocument doc={doc} />
    </main>
  );
}

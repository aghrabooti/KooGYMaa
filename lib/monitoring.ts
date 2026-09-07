// Minimal error monitoring: structured log + in-memory ring buffer surfaced via /api/health.
export type ErrorReport = { message: string; stack?: string; context?: Record<string, unknown>; at: string };

const buffer: ErrorReport[] = [];
const MAX = 50;

export function logError(error: unknown, context?: Record<string, unknown>): ErrorReport {
  const report: ErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
    context,
    at: new Date().toISOString(),
  };
  buffer.push(report);
  if (buffer.length > MAX) buffer.shift();
  console.error("[koogymaa:error]", report.message, context ?? "");
  return report;
}

export function recentErrors(): ErrorReport[] {
  return [...buffer].reverse();
}

export function apiErrorResponse(error: unknown, fallbackFa = "خطای غیرمنتظره. لطفاً دوباره تلاش کنید."): Promise<Response> {
  logError(error);
  return import("next/server").then(({ NextResponse }) =>
    NextResponse.json({ error: fallbackFa }, { status: 500 }),
  );
}

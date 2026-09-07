// Tiny CSV builder (Excel-compatible with BOM).
export function toCSV(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
}

export function downloadCSV(filename: string, csv: string): Promise<Response> {
  return import("next/server").then(
    ({ NextResponse }) =>
      new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      }),
  );
}

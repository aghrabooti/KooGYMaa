/**
 * Client-side A4 PDF exporter for the printable plan sheet.
 *
 * Persian/Arabic text needs real shaping, so the sheet is rendered by the
 * browser (correct RTL + connected glyphs) and then captured. A slim running
 * header is added to every page, and the body is sliced at section boundaries
 * so no table row is ever cut in half.
 */

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const BOTTOM_MARGIN_MM = 9;
const CAPTURE_SCALE = 2;

type Page = { start: number; end: number; full: boolean };

function dataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.92);
}

function sliceCanvas(source: HTMLCanvasElement, start: number, end: number): HTMLCanvasElement {
  const height = Math.max(1, Math.round(end - start));
  const slice = document.createElement("canvas");
  slice.width = source.width;
  slice.height = height;
  const context = slice.getContext("2d");
  if (!context) throw new Error("امکان آمادهسازی صفحه وجود ندارد.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, slice.width, height);
  context.drawImage(source, 0, start, source.width, height, 0, 0, source.width, height);
  return slice;
}

export async function exportPlanPdf(filename: string, documentTitle: string): Promise<number> {
  const head = document.getElementById("pdf-head");
  const body = document.getElementById("pdf-body");
  const running = document.getElementById("pdf-running");
  if (!head || !body || !running) throw new Error("سند قابل چاپ پیدا نشد.");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const options = {
    backgroundColor: "#ffffff",
    scale: CAPTURE_SCALE,
    useCORS: true,
    logging: false,
  } as const;

  const [headCanvas, bodyCanvas, runningCanvas] = await Promise.all([
    html2canvas(head, options),
    html2canvas(body, options),
    html2canvas(running, options),
  ]);
  if (!bodyCanvas.width || !bodyCanvas.height) throw new Error("سند خالی است.");

  const pxPerMm = bodyCanvas.width / PAGE_W_MM;
  const fullHeaderMm = Math.min(90, headCanvas.height / pxPerMm);
  const compactHeaderMm = Math.min(30, runningCanvas.height / pxPerMm);

  // Convert DOM section boundaries into canvas coordinates for clean page cuts.
  const bodyRect = body.getBoundingClientRect();
  const ratio = bodyCanvas.width / (bodyRect.width || 1);
  const boundaries = Array.from(body.querySelectorAll<HTMLElement>("[data-pdf-block]"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return (rect.bottom - bodyRect.top) * ratio;
    })
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const pages: Page[] = [];
  let cursor = 0;
  let first = true;
  let guard = 0;
  while (cursor < bodyCanvas.height - 2 && guard < 60) {
    guard += 1;
    const headerMm = first ? fullHeaderMm : compactHeaderMm;
    const available = Math.max(40, (PAGE_H_MM - headerMm - BOTTOM_MARGIN_MM) * pxPerMm);
    let end = Math.min(bodyCanvas.height, cursor + available);
    if (end < bodyCanvas.height) {
      const safeCuts = boundaries.filter((boundary) => boundary > cursor + 2 && boundary <= end);
      if (safeCuts.length) end = safeCuts[safeCuts.length - 1];
    }
    if (end <= cursor + 2) end = Math.min(bodyCanvas.height, cursor + available);
    pages.push({ start: cursor, end, full: first });
    cursor = end;
    first = false;
  }
  if (!pages.length) throw new Error("هیچ صفحهای برای خروجی وجود ندارد.");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.setProperties({
    title: documentTitle,
    subject: "برنامهٔ تمرینی و تغذیه",
    author: "کوجیما",
    creator: "KooGYMaa",
  });

  const fullImage = dataUrl(headCanvas);
  const compactImage = dataUrl(runningCanvas);

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage();
    const headerMm = page.full ? fullHeaderMm : compactHeaderMm;
    pdf.addImage(page.full ? fullImage : compactImage, "JPEG", 0, 0, PAGE_W_MM, headerMm);

    const slice = sliceCanvas(bodyCanvas, page.start, page.end);
    pdf.addImage(dataUrl(slice), "JPEG", 0, headerMm, PAGE_W_MM, slice.height / pxPerMm);

    pdf.setDrawColor(189, 232, 88);
    pdf.setLineWidth(0.7);
    pdf.line(16, PAGE_H_MM - 8, PAGE_W_MM - 16, PAGE_H_MM - 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(125, 133, 123);
    pdf.text(`${index + 1} / ${pages.length}`, PAGE_W_MM - 16, PAGE_H_MM - 4.5, { align: "right" });
  });

  pdf.save(filename);
  return pages.length;
}

import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { formatJalali, formatMoney } from "@/lib/fa";

type Ctx = { params: Promise<{ subscriptionId: string }> };

// Item 4: downloadable receipt (printable HTML; user prints/saves as PDF).
export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const { subscriptionId } = await params;
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, subscriberId: auth.user.id },
    select: {
      id: true, status: true, pricePaid: true, currency: true, startDate: true, endDate: true, createdAt: true,
      plan: { select: { name: true } }, gym: { select: { name: true } },
      payments: { select: { id: true, status: true, amount: true, currency: true, provider: true, paidAt: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!sub) return NextResponse.json({ error: "اشتراک یافت نشد." }, { status: 404 });
  const rows = sub.payments.map((p: any) => `<tr><td>${p.id.slice(0, 8)}…</td><td>${p.status}</td><td>${formatMoney(p.amount, p.currency, "fa-IR")}</td><td>${p.provider}</td><td>${formatJalali(p.paidAt ?? p.createdAt)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>رسید اشتراک ${sub.plan.name}</title><style>body{font-family:Tahoma,sans-serif;padding:32px;color:#171b17}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ccc;padding:8px;font-size:14px}h1{font-size:22px}</style></head><body><h1>رسید اشتراک — ${sub.plan.name}</h1><p>باشگاه: ${sub.gym.name} | وضعیت: ${sub.status}</p><p>مبلغ: ${formatMoney(sub.pricePaid, sub.currency, "fa-IR")} | از ${formatJalali(sub.startDate)} تا ${formatJalali(sub.endDate)}</p><table><thead><tr><th>پرداخت</th><th>وضعیت</th><th>مبلغ</th><th>درگاه</th><th>تاریخ</th></tr></thead><tbody>${rows}</tbody></table><p><small>شناسه اشتراک: ${sub.id} — صادر شده در ${formatJalali(new Date(), { withTime: true })}</small></p><script>window.print&&0;</script></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="receipt-${sub.id.slice(0, 8)}.html"`, "Cache-Control": "no-store" } });
}

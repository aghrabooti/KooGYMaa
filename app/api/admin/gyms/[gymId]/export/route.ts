import { type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { toCSV, downloadCSV } from "@/lib/csv";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ gymId: string }> };

// Item 13: Excel/CSV export (CSV opens directly in Excel, BOM included).
export async function GET(request: NextRequest, { params }: Ctx) {
  const { gymId } = await params;
  const auth = await authorizeGymAdminRequest(request, gymId);
  if (!auth.ok) return auth.response;
  const kind = request.nextUrl.searchParams.get("kind") || "members";
  const stamp = new Date().toISOString().slice(0, 10);

  if (kind === "members") {
    const rows = await prisma.gymMembership.findMany({
      where: { gymId },
      select: { status: true, requestedAt: true, startedAt: true, expiresAt: true, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { requestedAt: "desc" },
      take: 2000,
    });
    await recordAudit({ action: "EXPORT_MEMBERS", actorId: auth.access.user.id, actorRole: "ADMIN", entityId: gymId, entityType: "Gym", gymId, request });
    return downloadCSV(`members-${stamp}.csv`, toCSV(
      ["name", "email", "phone", "status", "requestedAt", "startedAt", "expiresAt"],
      rows.map((r: any) => [r.user.name, r.user.email, r.user.phone, r.status, r.requestedAt, r.startedAt, r.expiresAt]),
    ));
  }

  if (kind === "payments") {
    const rows = await prisma.payment.findMany({
      where: { gymId },
      select: { status: true, type: true, amount: true, currency: true, provider: true, paidAt: true, createdAt: true, user: { select: { name: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    await recordAudit({ action: "EXPORT_PAYMENTS", actorId: auth.access.user.id, actorRole: "ADMIN", entityId: gymId, entityType: "Gym", gymId, request });
    return downloadCSV(`payments-${stamp}.csv`, toCSV(
      ["customer", "email", "plan", "type", "status", "amount", "currency", "provider", "paidAt", "createdAt"],
      rows.map((r: any) => [r.user.name, r.user.email, r.plan.name, r.type, r.status, r.amount, r.currency, r.provider, r.paidAt, r.createdAt]),
    ));
  }

  if (kind === "subscriptions") {
    const rows = await prisma.subscription.findMany({
      where: { gymId },
      select: { status: true, pricePaid: true, currency: true, startDate: true, endDate: true, autoRenew: true, subscriber: { select: { name: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { endDate: "asc" },
      take: 2000,
    });
    await recordAudit({ action: "EXPORT_SUBSCRIPTIONS", actorId: auth.access.user.id, actorRole: "ADMIN", entityId: gymId, entityType: "Gym", gymId, request });
    return downloadCSV(`subscriptions-${stamp}.csv`, toCSV(
      ["subscriber", "email", "plan", "status", "pricePaid", "currency", "startDate", "endDate", "autoRenew"],
      rows.map((r: any) => [r.subscriber.name, r.subscriber.email, r.plan.name, r.status, r.pricePaid, r.currency, r.startDate, r.endDate, r.autoRenew ? "yes" : "no"]),
    ));
  }

  const { NextResponse } = await import("next/server");
  return NextResponse.json({ error: "kind must be members, payments, or subscriptions." }, { status: 400 });
}

// Financial summaries: revenue ONLY from SUCCEEDED payments, split by currency,
// with renewals and refunds handled explicitly.
export type PaymentLike = {
  status: string;
  type?: string | null;
  amount: number;
  currency?: string | null;
  paidAt?: Date | string | null;
  refundedAt?: Date | string | null;
  createdAt: Date | string;
};

export type FinanceSummary = {
  grossSucceeded: number;
  refunded: number;
  net: number;
  byCurrency: Record<string, { gross: number; refunded: number; net: number; count: number }>;
  counts: { succeeded: number; pending: number; failed: number; refunded: number; cancelled: number; processing: number };
  renewalsSucceeded: number;
  renewalsRevenue: number;
  currency: string;
};

export function summarizePayments(payments: PaymentLike[]): FinanceSummary {
  const byCurrency: FinanceSummary["byCurrency"] = {};
  const counts = { succeeded: 0, pending: 0, failed: 0, refunded: 0, cancelled: 0, processing: 0 };
  let grossSucceeded = 0;
  let refunded = 0;
  let renewalsSucceeded = 0;
  let renewalsRevenue = 0;
  for (const p of payments) {
    const key = (p.currency || "IRR").toUpperCase();
    byCurrency[key] ??= { gross: 0, refunded: 0, net: 0, count: 0 };
    const bucket = byCurrency[key];
    const status = (p.status || "").toUpperCase();
    if (status === "SUCCEEDED") {
      counts.succeeded += 1;
      bucket.gross += p.amount;
      bucket.count += 1;
      grossSucceeded += p.amount;
      if ((p.type || "").toUpperCase() === "RENEWAL") {
        renewalsSucceeded += 1;
        renewalsRevenue += p.amount;
      }
    } else if (status === "REFUNDED") {
      counts.refunded += 1;
      bucket.refunded += p.amount;
      refunded += p.amount;
    } else if (status === "PENDING") counts.pending += 1;
    else if (status === "FAILED") counts.failed += 1;
    else if (status === "CANCELLED") counts.cancelled += 1;
    else if (status === "PROCESSING") counts.processing += 1;
  }
  for (const bucket of Object.values(byCurrency)) bucket.net = bucket.gross - bucket.refunded;
  const currencies = Object.keys(byCurrency);
  return {
    grossSucceeded,
    refunded,
    net: grossSucceeded - refunded,
    byCurrency,
    counts,
    renewalsSucceeded,
    renewalsRevenue,
    currency: currencies.length === 1 ? currencies[0] : (currencies[0] || "IRR"),
  };
}

/** Monthly revenue series (SUCCEEDED only) for charts. */
export function monthlyRevenue(payments: PaymentLike[], months = 6, now = new Date()): Array<{ key: string; total: number; count: number }> {
  const out: Array<{ key: string; total: number; count: number }> = [];
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ key, total: 0, count: 0 });
  }
  const byKey = new Map(out.map((r) => [r.key, r]));
  for (const p of payments) {
    if ((p.status || "").toUpperCase() !== "SUCCEEDED") continue;
    const paid = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
    if (Number.isNaN(paid.getTime())) continue;
    const key = `${paid.getUTCFullYear()}-${String(paid.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = byKey.get(key);
    if (row) {
      row.total += p.amount;
      row.count += 1;
    }
  }
  return out;
}

import { describe, expect, it } from "vitest";
import { monthlyRevenue, summarizePayments } from "@/lib/finance";

describe("summarizePayments", () => {
  const rows = [
    { status: "SUCCEEDED", type: "SUBSCRIPTION", amount: 100, currency: "IRR", createdAt: new Date() },
    { status: "SUCCEEDED", type: "RENEWAL", amount: 50, currency: "IRR", createdAt: new Date() },
    { status: "PENDING", amount: 999, currency: "IRR", createdAt: new Date() },
    { status: "FAILED", amount: 999, currency: "IRR", createdAt: new Date() },
    { status: "REFUNDED", amount: 30, currency: "IRR", createdAt: new Date() },
    { status: "SUCCEEDED", amount: 20, currency: "USD", createdAt: new Date() },
  ];
  it("counts revenue only from SUCCEEDED payments", () => {
    const s = summarizePayments(rows);
    expect(s.grossSucceeded).toBe(170);
    expect(s.net).toBe(140);
    expect(s.counts.pending).toBe(1);
  });
  it("splits totals per currency", () => {
    const s = summarizePayments(rows);
    expect(s.byCurrency.IRR.net).toBe(120);
    expect(s.byCurrency.USD.net).toBe(20);
  });
  it("tracks renewals and refunds", () => {
    const s = summarizePayments(rows);
    expect(s.renewalsSucceeded).toBe(1);
    expect(s.renewalsRevenue).toBe(50);
    expect(s.refunded).toBe(30);
  });
});

describe("monthlyRevenue", () => {
  it("buckets SUCCEEDED payments by month", () => {
    const rows = [
      { status: "SUCCEEDED", amount: 10, currency: "IRR", paidAt: new Date(Date.UTC(2026, 7, 5)), createdAt: new Date() },
      { status: "PENDING", amount: 99, currency: "IRR", createdAt: new Date(Date.UTC(2026, 7, 6)) },
    ];
    const series = monthlyRevenue(rows, 3, new Date(Date.UTC(2026, 8, 5)));
    expect(series.find((r) => r.key === "2026-08")?.total).toBe(10);
  });
});

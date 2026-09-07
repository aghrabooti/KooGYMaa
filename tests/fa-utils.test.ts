import { describe, expect, it } from "vitest";
import { formatJalali, formatMoney, parseMoneyInput, toFaDigits, toJalali } from "@/lib/fa";

describe("jalali conversion", () => {
  it("converts Nowruz 2026 to 1 Farvardin 1405", () => {
    expect(toJalali(new Date(Date.UTC(2026, 2, 21)))).toEqual({ jy: 1405, jm: 1, jd: 1 });
  });
  it("formats a Jalali date string in Persian", () => {
    expect(formatJalali(new Date(Date.UTC(2026, 2, 21)))).toContain("فروردین");
  });
  it("converts digits to Persian", () => {
    expect(toFaDigits(123)).toBe("۱۲۳");
  });
});

describe("money", () => {
  it("shows IRR minor units as Toman", () => {
    expect(formatMoney(100000, "IRR", "en")).toContain("Toman");
    expect(formatMoney(100000, "IRR", "en")).toContain("10,000");
  });
  it("parses Persian-digit toman input to rial", () => {
    expect(parseMoneyInput("۱۲٬۵۰۰", "IRR")).toBe(125000);
    expect(parseMoneyInput("abc", "IRR")).toBeNull();
  });
});

// Persian (Jalali) date, Tehran time, and Rial/Toman formatting utilities.
// No external dependency — compact but correct Jalali conversion.
export const TEHRAN_TZ = "Asia/Tehran";

const DIV = (a: number, b: number) => Math.floor(a / b);
const MOD = (a: number, b: number) => a - Math.floor(a / b) * b;

// --- Jalali conversion (Kazimierz / jalaali-js algorithm, MIT) ---
function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < bl; i++) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += DIV(jump, 33) * 8 + DIV(MOD(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += DIV(n, 33) * 8 + DIV(MOD(n, 33) + 3, 4);
  if (MOD(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = DIV(gy, 4) - DIV((DIV(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + DIV(jump + 4, 33) * 33;
  let leap = MOD(MOD(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - DIV(jm, 7) * (jm - 7) + jd - 1;
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    DIV((gy + DIV(gm - 8, 6) + 100100) * 1461, 4) +
    DIV(153 * MOD(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - DIV(DIV(gy + 100100 + DIV(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();
  const jdn = g2d(gy, gm, gd);
  // jalaali-js d2j
  const jy0 = 979;
  const gy2 = 1600;
  const jdn1f = g2d(gy2, 3, 20);
  let jdn2 = jdn;
  let jy = jy0;
  // find jalali year via march reference
  // simplified loop-free approach:
  const approx = Math.floor((jdn - jdn1f) / 365.25) + 979;
  for (let y = approx - 2; y <= approx + 2; y++) {
    const start = j2d(y, 1, 1);
    const end = j2d(y + 1, 1, 1);
    if (jdn >= start && jdn < end) {
      jy = y;
      jdn2 = jdn - start;
      break;
    }
  }
  let jm: number;
  let jd: number;
  if (jdn2 < 186) {
    jm = 1 + Math.floor(jdn2 / 31);
    jd = 1 + (jdn2 % 31);
  } else {
    jm = 7 + Math.floor((jdn2 - 186) / 30);
    jd = 1 + ((jdn2 - 186) % 30);
  }
  return { jy, jm, jd };
}

const FA_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatJalali(date: Date | string | number, opts?: { withTime?: boolean; digits?: "fa" | "en" }): string {
  const d = date instanceof Date ? date : new Date(date);
  const { jy, jm, jd } = toJalali(d);
  let out = `${jd} ${FA_MONTHS[jm - 1]} ${jy}`;
  if (opts?.withTime) {
    const time = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: TEHRAN_TZ }).format(d);
    out += `، ساعت ${time}`;
  }
  return opts?.digits === "en" ? out.replace(/[۰-۹]/g, (ch) => String(FA_DIGITS.indexOf(ch))) : out;
}

export function formatTehran(date: Date | string | number, locale = "fa-IR"): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: TEHRAN_TZ }).format(d);
}

/** Amounts are stored in the currency's smallest unit (rial for IRR). */
export function formatMoney(amountMinor: number, currency = "IRR", locale = "fa-IR"): string {
  const code = (currency || "IRR").toUpperCase();
  if (code === "IRR" || code === "IRT") {
    const rial = code === "IRT" ? amountMinor * 10 : amountMinor;
    const toman = Math.round(rial / 10);
    const formatted = new Intl.NumberFormat(locale === "fa-IR" ? "fa-IR" : "en-IR", { maximumFractionDigits: 0 }).format(toman);
    return locale === "fa-IR" ? `${formatted} تومان` : `${formatted} Toman`;
  }
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: code === "IRR" ? 0 : 2 }).format(amountMinor / 100);
  } catch {
    return `${new Intl.NumberFormat(locale).format(amountMinor)} ${code}`;
  }
}

export function parseMoneyInput(input: string, currency = "IRR"): number | null {
  const faToEn = input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d))).replace(/[,٬\s]/g, "");
  const n = Number(faToEn);
  if (!Number.isFinite(n) || n < 0) return null;
  const code = currency.toUpperCase();
  // Users type toman for IRR; store rial.
  if (code === "IRR") return Math.round(n * 10);
  if (code === "IRT") return Math.round(n * 10);
  return Math.round(n * 100);
}

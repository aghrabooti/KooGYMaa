import { formatJalali, formatMoney, formatTehran } from "@/lib/fa";

// Item 5: server-rendered Jalali dates + Rial/Toman money.
export function FaDate({ value, withTime, locale }: { value: Date | string | number; withTime?: boolean; locale?: string }) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return <time>—</time>;
  const fa = locale !== "en";
  return (
    <time dateTime={d.toISOString()} title={formatTehran(d, fa ? "fa-IR" : "en-GB")}>
      {fa ? formatJalali(d, { withTime }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
    </time>
  );
}

export function Money({ amount, currency, locale }: { amount: number; currency?: string | null; locale?: string }) {
  return <span dir={locale === "en" ? "ltr" : "auto"}>{formatMoney(amount, currency || "IRR", locale === "en" ? "en-IR" : "fa-IR")}</span>;
}

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

// Persian labels for Prisma enum values rendered as badges/text in panels.
const FA_STATUS: Record<string, string> = {
  PENDING: "در انتظار",
  ACTIVE: "فعال",
  PAUSED: "متوقف",
  REJECTED: "ردشده",
  SUSPENDED: "معلق",
  EXPIRED: "منقضی",
  CANCELLED: "لغوشده",
  PAST_DUE: "سررسید گذشته",
  DRAFT: "پیش‌نویس",
  ARCHIVED: "بایگانی‌شده",
  INACTIVE: "غیرفعال",
  ASSIGNED: "تخصیص‌یافته",
  COMPLETED: "تکمیل‌شده",
  SCHEDULED: "زمان‌بندی‌شده",
  NO_SHOW: "عدم حضور",
  IN_PROGRESS: "در حال انجام",
  "IN PROGRESS": "در حال انجام",
  RESUMED: "ادامه‌یافته",
  SKIPPED: "رد شده",
  ENDED: "پایان‌یافته",
  GENERAL: "عمومی",
  WORKOUT: "تمرین",
  DIET: "تغذیه",
  PROGRESS: "پیشرفت",
  PLAN_ASSIGNED: "تخصیص طرح",
  FEEDBACK: "بازخورد",
  SESSION_REMINDER: "یادآوری جلسه",
  SUBSCRIPTION_EXPIRING: "اتمام اشتراک",
  PROCESSING: "در حال پردازش",
  SUCCEEDED: "موفق",
  FAILED: "ناموفق",
  REFUNDED: "بازپرداخت‌شده",
  SUBSCRIPTION: "اشتراک",
  RENEWAL: "تمدید",
  MEMBER: "عضو",
  TRAINER: "مربی",
  OWNER: "مالک",
  MANAGER: "مدیر",
};

export function faStatus(value: unknown): string {
  const key = String(value ?? "");
  return FA_STATUS[key] ?? key;
}

// Persian labels for admin audit-log actions.
const FA_AUDIT: Record<string, string> = {
  EMAIL_VERIFIED: "تأیید ایمیل",
  EXPORT_MEMBERS: "خروجی اعضا",
  EXPORT_PAYMENTS: "خروجی پرداخت‌ها",
  EXPORT_SUBSCRIPTIONS: "خروجی اشتراک‌ها",
  GYM_CREATED: "ساخت باشگاه",
  GYM_UPDATED: "به‌روزرسانی باشگاه",
  MEMBERSHIP_BULK_UPDATE: "به‌روزرسانی گروهی اعضا",
  MEMBERSHIP_STATUS_CHANGED: "تغییر وضعیت عضویت",
  PASSWORD_CHANGED: "تغییر رمز عبور",
  PASSWORD_RESET_COMPLETED: "تکمیل بازنشانی رمز",
  PASSWORD_RESET_REQUESTED: "درخواست بازنشانی رمز",
  PAYMENT_CHECKOUT_CREATED: "ایجاد پرداخت",
  PAYMENT_REFUNDED: "بازپرداخت",
  PAYMENT_SUCCEEDED: "پرداخت موفق",
  SUBSCRIPTION_BULK_CANCEL: "لغو گروهی اشتراک",
  SUBSCRIPTION_CANCELLED: "لغو اشتراک",
  SUBSCRIPTION_PAUSED: "توقف اشتراک",
  SUBSCRIPTION_UPDATED: "به‌روزرسانی اشتراک",
  TRAINER_BULK_UPDATE: "به‌روزرسانی گروهی مربی‌ها",
  TRAINER_STATUS_CHANGED: "تغییر وضعیت مربی",
};

export function faAudit(value: unknown): string {
  const key = String(value ?? "");
  return FA_AUDIT[key] ?? key;
}

// Persian labels for audit entity types.
const FA_ENTITY: Record<string, string> = {
  Gym: "باشگاه",
  GymMembership: "عضویت",
  GymTrainer: "مربی",
  Payment: "پرداخت",
  Subscription: "اشتراک",
  User: "کاربر",
};

export function faEntity(value: unknown): string {
  const key = String(value ?? "");
  return FA_ENTITY[key] ?? key;
}

// Persian labels for ISO country codes shown next to city names.
const FA_COUNTRY: Record<string, string> = {
  IR: "ایران",
};

export function faCountry(value: unknown): string {
  const key = String(value ?? "").toUpperCase();
  return FA_COUNTRY[key] ?? String(value ?? "");
}

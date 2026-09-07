// Item 5: Persian equivalents for common API error messages.
// Server responses stay in English (existing clients/tests rely on them);
// Persian UI maps them via faError() before display.
const MAP: Record<string, string> = {
  "Authentication required.": "ابتدا وارد شوید.",
  "You do not have permission to perform this action.": "اجازه این کار را ندارید.",
  "Invalid request body.": "درخواست نامعتبر است.",
  "Invalid email or password.": "ایمیل یا گذرواژه نادرست است.",
  "An account with this email already exists.": "با این ایمیل حسابی وجود دارد.",
  "This account is not currently active.": "این حساب فعال نیست.",
  "Unable to sign in right now. Please try again.": "ورود ممکن نشد. دوباره تلاش کنید.",
  "Unable to create your account right now. Please try again.": "ساخت حساب ممکن نشد. دوباره تلاش کنید.",
  "Too many login attempts. Please try again later.": "تلاش‌های ورود زیاد است. کمی بعد تلاش کنید.",
  "Too many accounts created. Please try again later.": "تعداد ساخت حساب زیاد است. کمی بعد تلاش کنید.",
  "This session overlaps another scheduled session.": "این جلسه با جلسه دیگری تداخل دارد.",
  "Choose one of your active students.": "یکی از شاگردان فعال را انتخاب کنید.",
  "Cancellable subscription not found.": "اشتراک قابل لغو یافت نشد.",
  "Payment not found.": "پرداخت یافت نشد.",
};

export function faError(message: string, locale = "fa"): string {
  if (locale !== "fa") return message;
  return MAP[message] || message;
}

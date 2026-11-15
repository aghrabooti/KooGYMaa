import type { AppRole } from "@/lib/auth";

type ValidationSuccess<T> = { data: T; ok: true };
type ValidationFailure = { error: string; ok: false };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type LoginInput = {
  identifier: string;
  password: string;
  remember: boolean;
};

export type AccountInput = {
  email: string | null;
  name: string;
  password: string;
  username: string;
};

export type RegisterInput = AccountInput & {
  role: Exclude<AppRole, "ADMIN">;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

export function validateUsername(value: unknown): ValidationResult<string> {
  const username = normalizeIdentifier(value);
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "نام کاربری باید ۳ تا ۳۲ نویسه باشد، با حرف انگلیسی یا عدد شروع شود و می‌تواند نقطه، خط تیره و زیرخط داشته باشد.", ok: false };
  }
  return { data: username, ok: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateEmail(email: string) {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function parseAccountIdentifier(value: unknown) {
  const identifier = normalizeIdentifier(value);
  return validateEmail(identifier) || USERNAME_PATTERN.test(identifier) ? identifier : null;
}

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function validateLoginInput(value: unknown): ValidationResult<LoginInput> {
  if (!isRecord(value)) {
    return { error: "Invalid request body.", ok: false };
  }

  const identifier = parseAccountIdentifier(value.identifier ?? value.email);
  const password = typeof value.password === "string" ? value.password : "";

  if (
    !identifier ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return { error: "نام کاربری یا ایمیل و گذرواژه را درست وارد کنید.", ok: false };
  }

  return {
    data: {
      identifier,
      password,
      remember: value.remember === true,
    },
    ok: true,
  };
}

export function validateAccountInput(value: unknown): ValidationResult<AccountInput> {
  if (!isRecord(value)) {
    return { error: "Invalid request body.", ok: false };
  }

  const email = normalizeIdentifier(value.email);
  const name = normalizeName(value.name);
  const password = value.password;
  const username = validateUsername(value.username);

  if (name.length < 2 || name.length > 80) {
    return { error: "نام کامل باید بین ۲ تا ۸۰ نویسه باشد.", ok: false };
  }

  if (!username.ok) return username;

  if ((value.email != null && typeof value.email !== "string") || (email && !validateEmail(email))) {
    return { error: "نشانی ایمیل را درست وارد کنید.", ok: false };
  }

  if (!validatePassword(password)) {
    return {
      error: "گذرواژه باید دست‌کم ۸ نویسه، یک حرف انگلیسی و یک عدد داشته باشد و از ۷۲ بایت بیشتر نباشد.",
      ok: false,
    };
  }

  return { data: { email: email || null, name, password, username: username.data }, ok: true };
}

export function validateRegisterInput(value: unknown): ValidationResult<RegisterInput> {
  if (!isRecord(value)) {
    return { error: "Invalid request body.", ok: false };
  }

  const role = value.role;
  if (role !== "USER" && role !== "TRAINER") {
    return { error: "Choose a valid account type.", ok: false };
  }

  const validation = validateAccountInput(value);
  if (!validation.ok) return validation;
  return { data: { ...validation.data, role }, ok: true };
}

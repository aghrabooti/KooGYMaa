type Success<T> = { data: T; ok: true };
type Failure = { error: string; ok: false };
type Result<T> = Success<T> | Failure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function numeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

export function validateTrainerProfile(value: unknown): Result<{
  bio?: string | null;
  currency?: string;
  experienceYears?: number | null;
  hourlyRate?: number | null;
  isAvailable?: boolean;
  specialty?: string | null;
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const data: {
    bio?: string | null;
    currency?: string;
    experienceYears?: number | null;
    hourlyRate?: number | null;
    isAvailable?: boolean;
    specialty?: string | null;
  } = {};

  if (value.bio !== undefined) data.bio = text(value.bio, 1_000) || null;
  if (value.specialty !== undefined) data.specialty = text(value.specialty, 100) || null;
  if (value.currency !== undefined) {
    const currency = text(value.currency, 3).toUpperCase();
    if (currency.length !== 3) return { error: "Currency must use a 3-letter code.", ok: false };
    data.currency = currency;
  }
  if (value.experienceYears !== undefined) {
    if (value.experienceYears === null || value.experienceYears === "") data.experienceYears = null;
    else {
      const years = numeric(value.experienceYears);
      if (!Number.isInteger(years) || years < 0 || years > 80) return { error: "Experience must be between 0 and 80 years.", ok: false };
      data.experienceYears = years;
    }
  }
  if (value.hourlyRate !== undefined) {
    if (value.hourlyRate === null || value.hourlyRate === "") data.hourlyRate = null;
    else {
      const rate = numeric(value.hourlyRate);
      if (!Number.isSafeInteger(rate) || rate < 0) return { error: "Hourly rate must be a non-negative whole number.", ok: false };
      data.hourlyRate = rate;
    }
  }
  if (value.isAvailable !== undefined) {
    if (typeof value.isAvailable !== "boolean") return { error: "Availability must be true or false.", ok: false };
    data.isAvailable = value.isAvailable;
  }

  if (Object.keys(data).length === 0) return { error: "Provide at least one profile change.", ok: false };
  return { data, ok: true };
}

export function validateTrainerClientStatus(value: unknown): Result<{
  status: "ACTIVE" | "PAUSED" | "REJECTED" | "ENDED";
}> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };
  const statuses = new Set(["ACTIVE", "PAUSED", "REJECTED", "ENDED"]);
  if (typeof value.status !== "string" || !statuses.has(value.status)) {
    return { error: "Choose a valid student relationship status.", ok: false };
  }
  return { data: { status: value.status as "ACTIVE" | "PAUSED" | "REJECTED" | "ENDED" }, ok: true };
}

type SessionInput = {
  endsAt?: Date;
  gymId?: string | null;
  notes?: string | null;
  startsAt?: Date;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  title?: string;
  trainerClientId?: string;
};

export function validateSessionInput(value: unknown, partial = false): Result<SessionInput> {
  if (!isRecord(value)) return { error: "Invalid request body.", ok: false };

  const data: SessionInput = {};
  if (!partial || value.trainerClientId !== undefined) {
    const trainerClientId = text(value.trainerClientId, 100);
    if (!trainerClientId) return { error: "Choose a student.", ok: false };
    data.trainerClientId = trainerClientId;
  }
  if (!partial || value.title !== undefined) {
    const title = text(value.title, 100);
    if (title.length < 2) return { error: "Session title must contain at least 2 characters.", ok: false };
    data.title = title;
  }
  if (value.gymId !== undefined) data.gymId = text(value.gymId, 100) || null;
  if (value.notes !== undefined) data.notes = text(value.notes, 1_000) || null;

  if (!partial || value.startsAt !== undefined) {
    const startsAt = new Date(String(value.startsAt || ""));
    if (Number.isNaN(startsAt.getTime())) return { error: "Enter a valid session start time.", ok: false };
    data.startsAt = startsAt;
  }
  if (!partial || value.endsAt !== undefined) {
    const endsAt = new Date(String(value.endsAt || ""));
    if (Number.isNaN(endsAt.getTime())) return { error: "Enter a valid session end time.", ok: false };
    data.endsAt = endsAt;
  }

  const status = value.status;
  if (status !== undefined) {
    const statuses = new Set(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
    if (typeof status !== "string" || !statuses.has(status)) return { error: "Choose a valid session status.", ok: false };
    data.status = status as SessionInput["status"];
  }

  if (data.startsAt && data.endsAt) {
    const duration = data.endsAt.getTime() - data.startsAt.getTime();
    if (duration <= 0 || duration > 8 * 60 * 60 * 1000) return { error: "Session duration must be between 1 minute and 8 hours.", ok: false };
  }
  if (partial && Object.keys(data).length === 0) return { error: "Provide at least one session change.", ok: false };
  return { data, ok: true };
}

export type AvailabilityInput = {
  dayOfWeek: number;
  endMinutes: number;
  startMinutes: number;
};

export function validateAvailability(value: unknown): Result<{
  slots: AvailabilityInput[];
  timezone: string;
}> {
  if (!isRecord(value) || !Array.isArray(value.slots)) return { error: "Provide an availability schedule.", ok: false };
  if (value.slots.length > 30) return { error: "Availability is limited to 30 weekly slots.", ok: false };
  const timezone = text(value.timezone, 80) || "Asia/Tehran";
  const slots: AvailabilityInput[] = [];

  for (const raw of value.slots) {
    if (!isRecord(raw)) return { error: "Invalid availability slot.", ok: false };
    const dayOfWeek = numeric(raw.dayOfWeek);
    const startMinutes = numeric(raw.startMinutes);
    const endMinutes = numeric(raw.endMinutes);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return { error: "Availability day must be between Sunday and Saturday.", ok: false };
    if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes) || startMinutes < 0 || endMinutes > 1_440 || endMinutes <= startMinutes) {
      return { error: "Availability times are invalid.", ok: false };
    }
    slots.push({ dayOfWeek, startMinutes, endMinutes });
  }

  const sorted = [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous.dayOfWeek === current.dayOfWeek && current.startMinutes < previous.endMinutes) {
      return { error: "Availability slots cannot overlap.", ok: false };
    }
  }

  return { data: { slots, timezone }, ok: true };
}

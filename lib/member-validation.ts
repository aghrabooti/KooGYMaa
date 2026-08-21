type Success<T> = { data: T; ok: true };
type Failure = { error: string; ok: false };
type Result<T> = Success<T> | Failure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateMemberProfile(value: unknown): Result<{
  avatarUrl?: string | null;
  name?: string;
  phone?: string | null;
}> {
  if (!isRecord(value)) return { error: "Invalid profile request.", ok: false };
  const data: { avatarUrl?: string | null; name?: string; phone?: string | null } = {};
  if (value.name !== undefined) {
    const name = text(value.name, 80).replace(/\s+/g, " ");
    if (name.length < 2) return { error: "Name must contain at least 2 characters.", ok: false };
    data.name = name;
  }
  if (value.phone !== undefined) {
    const phone = text(value.phone, 40);
    if (phone && !/^[+\d][\d\s()-]{5,39}$/.test(phone)) return { error: "Enter a valid phone number.", ok: false };
    data.phone = phone || null;
  }
  if (value.avatarUrl !== undefined) {
    const avatarUrl = text(value.avatarUrl, 2_000);
    if (avatarUrl) {
      try {
        const parsed = new URL(avatarUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return { error: "Enter a valid avatar URL.", ok: false };
      }
    }
    data.avatarUrl = avatarUrl || null;
  }
  if (!Object.keys(data).length) return { error: "Provide at least one profile change.", ok: false };
  return { data, ok: true };
}

export function validateTrainerRequest(value: unknown): Result<{ gymId: string | null }> {
  if (!isRecord(value)) return { error: "Invalid coaching request.", ok: false };
  return { data: { gymId: text(value.gymId, 100) || null }, ok: true };
}

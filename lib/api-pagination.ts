// Shared pagination / filter / bulk helpers for admin APIs.
export function parsePagination(url: URL, defaults = { page: 1, pageSize: 20, max: 100 }) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || defaults.page);
  const pageSize = Math.min(defaults.max, Math.max(1, Number(url.searchParams.get("pageSize")) || defaults.pageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function parseBulkIds(body: unknown, max = 100): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const ids = (body as Record<string, unknown>).ids;
  if (!Array.isArray(ids)) return null;
  const clean = ids.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, max);
  return clean.length ? clean : null;
}

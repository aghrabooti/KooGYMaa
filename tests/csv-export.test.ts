import { describe, expect, it } from "vitest";
import { toCSV } from "@/lib/csv";

describe("toCSV", () => {
  it("builds Excel-compatible output with quoting", () => {
    const csv = toCSV(["name", "note"], [["Ali", 'says "hi", ok'], ["Sara", null]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"says ""hi"", ok"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
});

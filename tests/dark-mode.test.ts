import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../app/${name}`, import.meta.url)), "utf8");
const tsxFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), "utf8");

const globals = cssFile("globals.css");
const usability = cssFile("usability.css");
const darkLayer = cssFile("dark-mode.css");
const layout = tsxFile("app/layout.tsx");

/** Split a selector list on commas that are not inside :is()/[attr](). */
function splitSelectors(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const normalize = (selector: string) => selector.replace(/\s+/g, "");

type Rule = { selector: string; body: string };

/** Enough of a CSS parser for these stylesheets: flat + @media nested rules. */
function rulesOf(source: string): Rule[] {
  const result: Rule[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!selector || selector.startsWith("@") || /^(from|to|\d+%)$/.test(selector)) continue;
    result.push({ selector, body: match[2] });
  }
  return result;
}

/** Every `.theme-dark <selector>` rule available to the browser. */
function darkSelectorSet(): Set<string> {
  const found = new Set<string>();
  for (const rule of [
    ...rulesOf(globals),
    ...rulesOf(usability),
    ...rulesOf(darkLayer),
  ]) {
    for (const selector of splitSelectors(rule.selector)) {
      if (!selector.startsWith(".theme-dark")) continue;
      found.add(normalize(selector.replace(/^\.theme-dark\s*/, "")));
    }
  }
  return found;
}

function parseNeutralLuminance(value: string): number | null {
  const text = value.trim();
  if (text === "white") return 255;
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(text);
  if (!hex) return null;
  let digits = hex[1];
  if (digits.length === 3) digits = digits.split("").map((c) => c + c).join("");
  const channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  if (Math.max(...channels) - Math.min(...channels) > 30) return null;
  return channels.reduce((sum, channel) => sum + channel, 0) / 3;
}

function hasLightColor(value: string): boolean {
  const matches = value.match(/(?:#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|\bwhite\b)/g) ?? [];
  return matches.some((color) => {
    const luminance = parseNeutralLuminance(color);
    return luminance !== null && luminance >= 195;
  });
}

// Mirrors the generation rules in app/dark-mode.css. Tinted/status surfaces
// already have a hand-written dark treatment and are intentionally skipped.
const PRESERVE =
  /(form-error|form-success|form-alert|plan-notice|cal-event|actions-card|resume-note|is-unread|alert|toast|status--|tone--|badge|pill|mark|orb|ring|star|dot|switch|rating|chip|kbd|gradient|cta-section|hero|auth-story|brand__mark|button--dark|primary-button|secondary-button|nav__item\.active|nav > a\.active|progress-ring|rating-panel|rating-ring|progress-rings)/;
const EXCLUDE =
  /(\.theme-dark|:root|(^|\s)html\b|(^|\s)body\b|::|@|status--|tone--|-icon--|icon--|avatar|badge|pill|mark|orb|ring|star|dot|switch|rating|chip|kbd|gradient|\bfrom\b|\bto\b|^\d+%)/;

/** Light surfaces/borders in globals.css that must have a dark counterpart. */
function expectedDarkSelectors(): Set<string> {
  const expected = new Set<string>();
  for (const rule of rulesOf(globals)) {
    let needsDark = false;
    for (const declaration of rule.body.split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 0) continue;
      const prop = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1);
      if (
        ((prop === "background" || prop === "background-color") &&
          !/url\(|gradient\(/.test(value) &&
          hasLightColor(value)) ||
        ((prop.startsWith("border") || prop.startsWith("outline")) && hasLightColor(value))
      ) {
        needsDark = true;
      }
    }
    if (!needsDark) continue;
    for (const selector of splitSelectors(rule.selector)) {
      if (!selector || EXCLUDE.test(selector) || PRESERVE.test(selector)) continue;
      expected.add(normalize(selector));
    }
  }
  return expected;
}

describe("حالت شب در همهٔ بخشها", () => {
  it("لایهٔ تاریک بعد از دو لایهٔ دیگر وارد میشود و توکنها را تعریف میکند", () => {
    expect(layout.indexOf('"./dark-mode.css"')).toBeGreaterThan(
      layout.indexOf('"./usability.css"'),
    );
    expect(layout.indexOf('"./usability.css"')).toBeGreaterThan(
      layout.indexOf('"./globals.css"'),
    );
    expect(darkLayer).toContain("--card-bg: #121a14");
    expect(darkLayer).toContain("--line-soft: #2a322b");
    expect((darkLayer.match(/\{/g) ?? []).length).toBe(
      (darkLayer.match(/\}/g) ?? []).length,
    );
  });

  it("قاب «افزودن طرح تازه» و ویرایشگر برنامههای تمرین/تغذیه تاریک میشود", () => {
    const dark = darkSelectorSet();
    for (const selector of [
      ".trainer-plan-create",
      ".trainer-plan-grid>article",
      ".trainer-plan-editor__meta",
      ".trainer-workout-day",
      ".nutrition-day",
      ".nutrition-meal",
      ".trainer-add-day",
      ".trainer-plan-actionsbutton",
      ".msg-sidebar",
      ".msg-chat",
    ]) {
      expect(dark.has(selector), `قانون تاریک برای ${selector} پیدا نشد`).toBe(true);
    }
  });

  it("هیچ سطح یا قاب روشنِ ثابتی بدون معادل تاریک باقی نمیماند", () => {
    const dark = darkSelectorSet();
    const expected = expectedDarkSelectors();
    // Guard against a vacuous pass: the legacy stylesheet really does have
    // hundreds of hard-coded light surfaces.
    expect(expected.size).toBeGreaterThan(150);
    expect(dark.size).toBeGreaterThan(expected.size);
    const missing = [...expected].filter((selector) => !dark.has(selector));
    expect(missing, `سطوح بدون پوشش تاریک: ${missing.join("، ")}`).toEqual([]);
  });

  it("رنگهای درونخطی صفحهٔ سفر شاگرد از متغیر تم پیروی میکنند", () => {
    const journey = tsxFile("app/user/journey/page.tsx");
    expect(journey).not.toContain('background: "#f5f5f5"');
    expect(journey).toContain("var(--card-bg, #f5f5f5)");
  });
});

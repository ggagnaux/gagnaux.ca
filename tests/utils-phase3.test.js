const test = require("node:test");
const assert = require("node:assert/strict");
const { DateTime } = require("luxon");

const { renderMarkdown, createSlug, parseJsonSetting } = require("../src/utils/content");
const { formatDisplayDate, normalizeText } = require("../src/utils/formatters");

test("renderMarkdown converts markdown into HTML", () => {
  const html = renderMarkdown("## Hello\n\nThis is **bold**.");

  assert.match(html, /<h2[^>]*>Hello<\/h2>/i);
  assert.match(html, /<strong>bold<\/strong>/i);
});

test("createSlug normalizes mixed-case punctuation into a strict slug", () => {
  assert.equal(createSlug(" Hello, World! 2026 "), "hello-world-2026");
});

test("parseJsonSetting returns parsed JSON and falls back on invalid input", () => {
  assert.deepEqual(parseJsonSetting('{"enabled":true}', {}), { enabled: true });
  assert.deepEqual(parseJsonSetting("not-json", ["fallback"]), ["fallback"]);
});

test("formatDisplayDate returns a medium localized date for valid ISO values", () => {
  const isoValue = "2026-01-02T00:00:00.000Z";
  const expected = DateTime.fromISO(isoValue).toLocaleString(DateTime.DATE_MED);

  assert.equal(formatDisplayDate(isoValue), expected);
  assert.equal(formatDisplayDate(""), "");
});

test("normalizeText trims strings and rejects non-string values", () => {
  assert.equal(normalizeText("  padded value  "), "padded value");
  assert.equal(normalizeText(42), "");
  assert.equal(normalizeText(null), "");
});

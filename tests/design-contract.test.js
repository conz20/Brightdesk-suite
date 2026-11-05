import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contract = JSON.parse(await readFile(new URL("../docs/BRIGHTDESK_DESIGN_CONTRACT.json", import.meta.url), "utf8"));
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const theme = await readFile(new URL("../packages/ui/src/theme.js", import.meta.url), "utf8");

test("the approved visual contract locks exactly ten product identities", () => {
  assert.equal(contract.status, "approved");
  assert.equal(contract.portfolioBoundaries.exactApplicationCount, 10);
  assert.deepEqual(contract.applications.map(app => app.name), [
    "Pages", "Sheets", "Decks", "Notes", "Database", "Forms", "Lists", "Planner", "To Do", "Workspace"
  ]);
  assert.deepEqual(contract.portfolioBoundaries.excludedProducts, ["Outlook", "OneDrive", "Teams"]);
});

test("the Suite stylesheet and theme use the approved shared shell tokens", () => {
  const colors = contract.sharedDesign.colors;
  for (const [token, value] of [
    ["--bd-canvas", colors.canvas],
    ["--bd-surface", colors.surface],
    ["--bd-surface-muted", colors.surfaceMuted],
    ["--bd-ink", colors.ink],
    ["--bd-text", colors.text],
    ["--bd-muted", colors.muted],
    ["--bd-line", colors.line],
    ["--bd-nav-text", colors.navText],
    ["--bd-nav-muted", colors.navMuted],
    ["--bd-accent", colors.suiteAccent]
  ]) {
    assert.ok(css.includes(token + ": " + value + ";"), "missing " + token + " " + value);
  }
  for (const value of [colors.canvas, colors.surface, colors.navStart, colors.navEnd, colors.suiteAccent, colors.ink]) {
    assert.ok(theme.includes(value), "shared theme is missing " + value);
  }
  assert.ok(css.includes(".sidebar {\n  color: var(--bd-nav-text);\n  background: var(--bd-nav-gradient);"));
  assert.ok(css.includes(":focus-visible { outline-color: var(--bd-accent); }"));
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce) {"));
});

test("all ten Suite app-centre identities use their contract accent", () => {
  for (const app of contract.applications) {
    assert.ok(theme.includes(app.accent), app.name + " accent missing from shared theme");
    assert.ok(css.includes(app.accent), app.name + " accent missing from Suite stylesheet");
  }
});

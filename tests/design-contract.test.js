import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contract = JSON.parse(await readFile(new URL("../docs/BRIGHTDESK_DESIGN_CONTRACT.json", import.meta.url), "utf8"));

test("approved design contract locks the ten original product identities", () => {
  assert.equal(contract.status, "approved");
  assert.equal(contract.portfolioBoundaries.exactApplicationCount, 10);
  assert.deepEqual(contract.applications.map(app => app.name), [
    "Pages", "Sheets", "Decks", "Notes", "Database", "Forms", "Lists", "Planner", "To Do", "Workspace"
  ]);
  assert.equal(new Set(contract.applications.map(app => app.repository)).size, 10);
  assert.deepEqual(contract.portfolioBoundaries.excludedProducts, ["Outlook", "OneDrive", "Teams"]);
});

test("every product keeps its own original icon and distinct accent identity", () => {
  for (const app of contract.applications) {
    assert.match(app.repository, /^Brightdesk-/);
    assert.match(app.iconPath, /\.svg$/);
    assert.match(app.previewPath, /\.svg$/);
    assert.match(app.accent, /^#[0-9A-F]{6}$/);
    assert.match(app.accentStrong, /^#[0-9A-F]{6}$/);
    assert.match(app.accentSoft, /^#[0-9A-F]{6}$/);
  }
  assert.equal(new Set(contract.applications.map(app => app.accent)).size, 10);
});

test("shared UI theme matches the approved light canvas and navy navigation", async () => {
  const theme = await readFile(new URL("../packages/ui/src/theme.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  for (const token of ["#F3F6FA", "#14233F", "#0D1930", "#526FE0", "#202B3C"]) {
    assert.ok(theme.includes(token), `shared theme is missing ${token}`);
    assert.ok(css.includes(token), `suite stylesheet is missing ${token}`);
  }
  assert.match(css, /\.sidebar\s*\{[^}]*background:var\(--bd-nav-gradient\)/s);
});


test("suite home is the default app centre with persistent return navigation and truthful download status", () => {
  assert.equal(contract.sharedDesign.homeExperience.defaultView, "app-centre");
  assert.equal(contract.sharedDesign.homeExperience.allApprovedProductsVisible, true);
  assert.match(contract.sharedDesign.homeExperience.persistentReturnNavigation, /All apps/);
  assert.match(contract.sharedDesign.homeExperience.appCardActions, /Open/);
  assert.match(contract.sharedDesign.homeExperience.downloadPolicy, /verified published installer URL/);
});

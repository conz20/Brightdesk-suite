import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const matrix = readFileSync(new URL("../docs/PRINTING-COMPATIBILITY.md", import.meta.url), "utf8");
const integration = readFileSync(new URL("../docs/PRINTING_INTEGRATION.md", import.meta.url), "utf8");

test("Brightdesk printing acceptance never requires contributor-owned physical hardware", () => {
  assert.match(matrix, /No Brightdesk contributor, maintainer or product owner is required to own, borrow, locate, visit or obtain access to a physical printer/i);
  assert.match(matrix, /Physical-printer spot checks are optional extended compatibility evidence/i);
  assert.match(matrix, /not a prerequisite for passing automated acceptance, merging the source changes, or the normal software release gate/i);
  assert.match(integration, /No contributor or product owner needs to own, borrow or be near a printer/i);
});

test("hardware-free printing evidence uses virtual queues and platform-specific automated checks", () => {
  assert.match(matrix, /deterministic virtual-printer tests/i);
  assert.match(matrix, /native-helper compilation\/contract tests on the matching operating-system runner/i);
  assert.match(matrix, /Not physically verified/);
  assert.match(integration, /simulated OS\s*queue\/callback outcomes/i);
  assert.doesNotMatch(matrix, /acceptance matrix with real printers/i);
});

test("virtual acceptance never claims that a physical page was printed", () => {
  assert.match(matrix, /it never proves that paper printed/i);
  assert.match(matrix, /that optional check is not part of software acceptance/i);
  assert.match(integration, /not evidence\s*that a physical page printed/i);
});

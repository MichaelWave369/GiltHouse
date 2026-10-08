import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../public/bridge/gilt-house.venue.v0.json", import.meta.url);
const manifest = JSON.parse(await readFile(path, "utf8"));

test("Gilt House discovery manifest has stable City369 venue identity", () => {
  assert.equal(manifest.schema, "field.venue-discovery.v0");
  assert.equal(manifest.venueId, "gilt-house");
  assert.equal(manifest.experienceId, "neon-royal");
  assert.equal(manifest.platformId, "city369");
  assert.equal(manifest.entry.relativePath, "/");
  assert.equal(manifest.entry.deploymentUrl, null);
  assert.equal(manifest.authority.mode, "DISCOVERY_ONLY");
});

test("discovery does not provide payment, token, or execution authority", () => {
  for (const allowed of ["grantsExecution", "grantsPayments", "grantsAgentAccess", "grantsApiSpend"]) {
    assert.equal(manifest.authority[allowed], false, allowed);
  }
  assert.equal(manifest.economy.cashValue, false);
  assert.equal(manifest.economy.redeemable, false);
  assert.equal(manifest.economy.transferable, false);
  assert.equal(manifest.economy.apiCreditConvertible, false);
  assert.equal(manifest.economy.realMoneyWagering, false);
  assert.equal(manifest.economy.chipType, "NONREDEEMABLE_PLAY_ONLY");
});

test("simulation, training, and integrations are not represented as live", () => {
  assert.equal(manifest.training.agentsAre, "RULE_BASED_SIMULATION_NOT_LLM");
  assert.equal(manifest.training.verifiedSkillsExport, false);
  assert.equal(manifest.training.remoteAgentControl, false);
  assert.equal(manifest.training.modelTrainingEnabled, false);
  assert.ok(manifest.capabilities.length >= 4);
  for (const cap of manifest.capabilities) {
    assert.equal(cap.status, "CODE_PRESENT_UNQUALIFIED", cap.id);
  }
  for (const status of Object.values(manifest.integrations)) {
    assert.equal(status, "PROPOSED");
  }
});

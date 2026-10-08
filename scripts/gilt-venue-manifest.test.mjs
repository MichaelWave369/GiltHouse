import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../public/bridge/gilt-house.venue.v0.json", import.meta.url);
const manifest = JSON.parse(await readFile(path, "utf8"));

test("Gilt House advertises ONLY its independent identity", () => {
  assert.equal(manifest.schema, "field.venue-discovery.v0");
  assert.equal(manifest.venueId, "gilt-house");
  assert.equal(manifest.experienceId, "gilt-house");
  assert.equal(manifest.platformId, "gilt-house-standalone");
  assert.equal(manifest.entry.relativePath, "/");
  assert.equal(manifest.entry.deploymentUrl, null);
  assert.equal(manifest.productBoundary.status, "INDEPENDENT_PRODUCT");
  assert.equal(manifest.productBoundary.distribution, "SEPARATE_APP_AND_DEPLOYMENT");
  assert.equal(manifest.world.plannedMode, "INDEPENDENT_VIRTUAL_WORLD");
  assert.equal(manifest.world.implementationStatus, "PROPOSED");
  assert.equal(manifest.world.requiresCommercialCityApp, false);
  assert.equal(Object.hasOwn(manifest.integrations, "city369"), false);
  assert.doesNotMatch(
    JSON.stringify({
      experienceId: manifest.experienceId,
      platformId: manifest.platformId,
      integrations: manifest.integrations,
    }),
    /neon[-_ ]royal|city369|vegas369/i,
  );
});

test("standalone product cannot inherit paid-app commerce or user privileges", () => {
  for (const name of [
    "paidNeonRoyalDependency",
    "inheritsPaidAppLicense",
    "sharesAuthentication",
    "sharesPaymentProcessing",
    "sharesCustomerEntitlements",
    "sharesDatabase",
    "sharesApiKeys",
    "sharesGameChipsWithRealMoney",
    "paidAppLaunchDependsOnThis",
    "sharedDeploymentOrigin",
  ]) {
    assert.equal(manifest.productBoundary[name], false, name);
  }
});

test("discovery cannot confer spending, gambling, redemption, or execution authority", () => {
  assert.equal(manifest.authority.mode, "DISCOVERY_ONLY");
  for (const name of ["grantsExecution", "grantsPayments", "grantsAgentAccess", "grantsApiSpend"]) {
    assert.equal(manifest.authority[name], false, name);
  }
  assert.equal(manifest.economy.chipType, "NONREDEEMABLE_PLAY_ONLY");
  for (const name of ["cashValue", "transferable", "redeemable", "apiCreditConvertible", "realMoneyWagering"]) {
    assert.equal(manifest.economy[name], false, name);
  }
});

test("rule-based sports and educational drills do not claim verified live agent training", () => {
  assert.equal(manifest.training.agentsAre, "RULE_BASED_SIMULATION_NOT_LLM");
  for (const name of ["verifiedSkillsExport", "remoteAgentControl", "modelTrainingEnabled"]) {
    assert.equal(manifest.training[name], false, name);
  }
  assert.ok(manifest.capabilities.length >= 4);
  for (const cap of manifest.capabilities) {
    assert.equal(cap.status, "CODE_PRESENT_UNQUALIFIED", cap.id);
  }
  assert.deepEqual(Object.keys(manifest.integrations).sort(), ["brainc", "budgetgenius", "nbg", "phibots"]);
  for (const status of Object.values(manifest.integrations)) {
    assert.equal(status, "PROPOSED");
  }
});

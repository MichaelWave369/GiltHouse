import test from "node:test";
import assert from "node:assert/strict";
import {
  makeTrainingReceipt,
  makeTrainingSet,
  scoreTrainingSet,
  TRAINING_BANK_VERSION,
  TRAINING_COUNT,
  TRAINING_EVIDENCE,
  TRAINING_SCHEMA,
} from "./training-lab.ts";

function answers(seed: number, correct: boolean) {
  return makeTrainingSet(seed).map((challenge) => ({
    challengeId: challenge.id,
    choiceIndex: correct
      ? challenge.correctIndex
      : (challenge.correctIndex + 1) % challenge.choices.length,
  }));
}

test("repeatable training sets are bounded, distinct, and deterministic", () => {
  const a = makeTrainingSet(369);
  const b = makeTrainingSet(369);
  const c = makeTrainingSet(370);
  assert.deepEqual(a.map((item) => item.id), b.map((item) => item.id));
  assert.notDeepEqual(a.map((item) => item.id), c.map((item) => item.id));
  assert.equal(a.length, TRAINING_COUNT);
  assert.equal(new Set(a.map((item) => item.id)).size, a.length);
  assert.ok(a.every((item) => item.choices.length > 1));
  assert.throws(() => makeTrainingSet(0), /seed/);
  assert.throws(() => makeTrainingSet(-1), /seed/);
  assert.throws(() => makeTrainingSet(Number.MAX_SAFE_INTEGER), /seed/);
});

test("scoring computes results from the frozen question bank, not caller claims", () => {
  const good = scoreTrainingSet(369, answers(369, true));
  assert.equal(good.correct, TRAINING_COUNT);
  assert.equal(good.percentage, 100);
  const wrong = scoreTrainingSet(369, answers(369, false));
  assert.equal(wrong.correct, 0);
  assert.equal(wrong.percentage, 0);
});

test("missing, duplicate, shuffled, and out-of-range answers fail closed", () => {
  const good = answers(369, true);
  assert.throws(() => scoreTrainingSet(369, good.slice(1)), /exactly one/);
  assert.throws(() => scoreTrainingSet(369, [good[0]!, good[0]!, ...good.slice(2)]), /invalid/);
  assert.throws(() => scoreTrainingSet(369, [...good].reverse()), /invalid/);
  assert.throws(
    () => scoreTrainingSet(369, [{ ...good[0]!, choiceIndex: 900 }, ...good.slice(1)]),
    /invalid/,
  );
  assert.throws(
    () => scoreTrainingSet(369, [{ ...good[0]!, choiceIndex: 1.2 }, ...good.slice(1)]),
    /invalid/,
  );
});

test("exported receipt is non-authoritative and includes no money or identity", () => {
  const receipt = makeTrainingReceipt({
    seed: 369,
    answers: answers(369, true),
    completedAt: "2026-10-08T12:00:00.000Z",
  });
  assert.equal(receipt.schema, TRAINING_SCHEMA);
  assert.equal(receipt.challengeBankVersion, TRAINING_BANK_VERSION);
  assert.equal(receipt.evidence, TRAINING_EVIDENCE);
  assert.equal(receipt.source, "HUMAN_BROWSER");
  assert.equal(receipt.score.correct, TRAINING_COUNT);
  assert.equal(receipt.attempts.length, TRAINING_COUNT);
  assert.ok(Object.values(receipt.authority).every((flag) => flag === false));
  assert.doesNotMatch(JSON.stringify(receipt), /neon royal|city369|license|api_key|customerId|userId|"(?:cash|chips|balance|wager|token)"/i);
  assert.throws(
    () => makeTrainingReceipt({ seed: 369, answers: answers(369, true), completedAt: "invalid" }),
    /completedAt/,
  );
});

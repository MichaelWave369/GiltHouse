import { STATIONS } from "./workshop.ts";

/**
 * Browser-only study challenges. These are NOT production assessments:
 * questions and answers are shipped to every client, and results are editable.
 */
export const TRAINING_SCHEMA = "gilt-house.training-observation.v1";
export const TRAINING_BANK_VERSION = "workshop-drills-v1";
export const TRAINING_EVIDENCE = "UNVERIFIED_CLIENT_PRACTICE";
export const TRAINING_COUNT = 8;

export type TrainingAnswer = Readonly<{
  challengeId: string;
  choiceIndex: number;
}>;

export type TrainingChallenge = Readonly<{
  id: string;
  stationId: string;
  stationName: string;
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
  explanation: string;
}>;

const CHALLENGES: readonly TrainingChallenge[] = STATIONS.flatMap((station) =>
  station.drills.map((drill, index) => ({
    id: `${station.id}:${index}`,
    stationId: station.id,
    stationName: station.name,
    prompt: drill.prompt,
    choices: Object.freeze([...drill.choices]),
    correctIndex: drill.answer,
    explanation: drill.why,
  })),
);

function requireSeed(seed: number): void {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 0xffffffff) {
    throw new RangeError("seed must be an integer between 1 and 4294967295");
  }
}

// Deterministic PRNG for replayable *practice question order*, never wagering.
function nextSeed(n: number): number {
  let v = n >>> 0;
  v ^= v << 13;
  v ^= v >>> 17;
  v ^= v << 5;
  return v >>> 0;
}

export function makeTrainingSet(seed: number): readonly TrainingChallenge[] {
  requireSeed(seed);
  const shuffled = [...CHALLENGES];
  let state = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = nextSeed(state);
    const j = state % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return Object.freeze(shuffled.slice(0, TRAINING_COUNT));
}

export function scoreTrainingSet(seed: number, answers: readonly TrainingAnswer[]) {
  const challenges = makeTrainingSet(seed);
  if (!Array.isArray(answers) || answers.length !== challenges.length) {
    throw new TypeError("all challenges must have exactly one answer");
  }
  const results = challenges.map((challenge, index) => {
    const answer = answers[index];
    if (
      !answer ||
      answer.challengeId !== challenge.id ||
      !Number.isInteger(answer.choiceIndex) ||
      answer.choiceIndex < 0 ||
      answer.choiceIndex >= challenge.choices.length
    ) {
      throw new TypeError("invalid, missing, out-of-order, or duplicated challenge answer");
    }
    return Object.freeze({
      challengeId: challenge.id,
      stationId: challenge.stationId,
      selectedIndex: answer.choiceIndex,
      correct: answer.choiceIndex === challenge.correctIndex,
    });
  });
  const correct = results.filter((row) => row.correct).length;
  return Object.freeze({
    total: challenges.length,
    correct,
    percentage: Math.round((correct * 100) / challenges.length),
    results: Object.freeze(results),
  });
}

export function makeTrainingReceipt({
  seed,
  answers,
  completedAt,
}: {
  seed: number;
  answers: readonly TrainingAnswer[];
  completedAt: string;
}) {
  if (!Number.isFinite(Date.parse(completedAt)) || !/^\d{4}-\d{2}-\d{2}T/.test(completedAt)) {
    throw new TypeError("completedAt must be an ISO time");
  }
  const score = scoreTrainingSet(seed, answers);
  return {
    schema: TRAINING_SCHEMA,
    challengeBankVersion: TRAINING_BANK_VERSION,
    evidence: TRAINING_EVIDENCE,
    source: "HUMAN_BROWSER",
    seed,
    completedAt,
    score: { total: score.total, correct: score.correct, percentage: score.percentage },
    attempts: score.results.map(({ challengeId, stationId, selectedIndex, correct }) => ({
      challengeId,
      stationId,
      selectedIndex,
      correct,
    })),
    authority: {
      independentEvaluation: false,
      modelTraining: false,
      remoteAgentAccess: false,
      apiSpend: false,
      monetaryValue: false,
    },
  };
}

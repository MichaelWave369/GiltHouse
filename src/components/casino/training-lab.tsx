import { useMemo, useState } from "react";
import { Download, FlaskConical, RotateCcw } from "lucide-react";
import { Frame, TopBar } from "@/components/casino/shell";
import {
  makeTrainingReceipt,
  makeTrainingSet,
  scoreTrainingSet,
  TRAINING_COUNT,
  type TrainingAnswer,
} from "@/lib/casino/training-lab";

/**
 * Isolated human practice lab. Nothing is sent or saved without a deliberate
 * JSON export click. No wallet, account, network call, agent, or payout hook.
 */
export function TrainingLab() {
  const [seed, setSeed] = useState(369);
  const [answers, setAnswers] = useState<TrainingAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const challenges = useMemo(() => makeTrainingSet(seed), [seed]);
  const finished = answers.length === challenges.length;
  const current = challenges[answers.length];
  const score = useMemo(
    () => (finished ? scoreTrainingSet(seed, answers) : null),
    [answers, finished, seed],
  );

  function submit() {
    if (!current || selected === null || finished) return;
    setAnswers((currentAnswers) => [
      ...currentAnswers,
      { challengeId: current.id, choiceIndex: selected },
    ]);
    setSelected(null);
    setNote("");
  }

  function newRound() {
    setSeed((value) => (value >= 0xffffffff ? 1 : value + 1));
    setAnswers([]);
    setSelected(null);
    setNote("");
  }

  function exportReceipt() {
    if (!finished) return;
    try {
      const receipt = makeTrainingReceipt({
        seed,
        answers,
        completedAt: new Date().toISOString(),
      });
      const blob = new Blob([JSON.stringify(receipt, null, 2) + "\n"], {
        type: "application/json",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `gilt-house-training-${seed}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Defer revocation so browsers can finish the initiated local download.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNote("Practice JSON prepared locally. No data was uploaded.");
    } catch {
      setNote("Your browser could not export this practice receipt.");
    }
  }

  return (
    <Frame>
      <TopBar title="Training Lab" eyebrow="Independent practice · no chips" />
      <div className="rounded-xl border border-gold/40 bg-panel p-5">
        <div className="flex items-center gap-2 text-gold">
          <FlaskConical className="size-5" aria-hidden />
          <p className="text-xs font-medium tracking-widest uppercase">Gilt House practice experiment</p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          Eight reproducible challenges on probability, odds, and common decision traps.
          Results stay in memory on this screen. Nothing is saved or uploaded automatically.
          This lab never uses or awards play chips, money, or API credits.
        </p>
        <p className="mt-3 text-xs text-cream-dim">
          Practice seed {seed} · {TRAINING_COUNT} questions · browser self-assessment, not
          verified agent training or a gambling advantage.
        </p>
      </div>

      {finished && score ? (
        <section className="mt-5 rounded-xl border border-line bg-ink-2 p-5" aria-live="polite">
          <p className="text-xs tracking-widest text-gold uppercase">Practice complete</p>
          <h2 className="mt-2 font-display text-4xl text-cream">
            {score.correct} / {score.total} <span className="text-xl text-cream-dim">({score.percentage}%)</span>
          </h2>
          <p className="mt-3 text-sm text-cream-dim">
            Self-reported local score. Answer keys are bundled in the browser; this is
            not independent proof of learning, an agent benchmark, or a prize.
          </p>
          <div className="mt-4 grid gap-3">
            {challenges.map((challenge, index) => {
              const choice = answers[index]?.choiceIndex;
              const right = choice === challenge.correctIndex;
              return (
                <article key={challenge.id} className="rounded-lg border border-line bg-panel p-3">
                  <p className="text-xs text-gold">{challenge.stationName} · {right ? "Correct" : "Review"}</p>
                  <p className="mt-1 text-sm text-cream">{challenge.prompt}</p>
                  <p className="mt-1 text-sm text-cream-dim">
                    Your answer: {choice === undefined ? "Missing" : challenge.choices[choice]}
                  </p>
                  {!right && (
                    <p className="mt-1 text-sm text-cream">
                      Expected: {challenge.choices[challenge.correctIndex]}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-cream-dim">{challenge.explanation}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={exportReceipt}
              className="press inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-ink">
              <Download className="size-4" aria-hidden /> Export practice JSON
            </button>
            <button type="button" onClick={newRound}
              className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm text-cream">
              <RotateCcw className="size-4" aria-hidden /> New round
            </button>
          </div>
        </section>
      ) : current ? (
        <section className="mt-5 rounded-xl border border-line bg-ink-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs tracking-widest text-gold uppercase">
              Challenge {answers.length + 1} of {TRAINING_COUNT}
            </p>
            <p className="text-xs text-cream-dim">{current.stationName}</p>
          </div>
          <h2 className="mt-4 font-display text-2xl text-cream">{current.prompt}</h2>
          <div className="mt-4 grid gap-2" role="group" aria-label="Choose an answer">
            {current.choices.map((choice, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
                className={`press min-h-12 rounded-lg border px-4 py-3 text-left text-sm ${
                  selected === index ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <button type="button" onClick={submit} disabled={selected === null}
            className="press mt-4 min-h-12 w-full rounded-lg bg-gold px-4 font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40">
            {answers.length + 1 === TRAINING_COUNT ? "Finish practice" : "Submit and continue"}
          </button>
          <p className="mt-3 text-xs text-cream-dim">
            Answers and explanations appear at the end. Closing this view discards the round.
          </p>
        </section>
      ) : null}

      {note && <p className="mt-4 text-sm text-gold" role="status">{note}</p>}
      <p className="mt-6 text-xs leading-relaxed text-cream-dim">
        Experimental and optional. No profile, identity, cloud telemetry, API spend, login,
        payment processing, or connection to the separately sold Neon Royal product.
      </p>
    </Frame>
  );
}

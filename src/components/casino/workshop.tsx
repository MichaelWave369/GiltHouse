import { useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { chips, useCasino } from "@/lib/casino/store";
import { STATIONS } from "@/lib/casino/workshop";
import { BrokeBanner, Frame, TopBar } from "@/components/casino/shell";

export function Workshop() {
  const sound = useCasino((s) => s.sound);
  const pit = useCasino((s) => s.pit);
  const focusStation = useCasino((s) => s.focusStation);
  const markPit = useCasino((s) => s.markPit);
  const [stationId, setStationId] = useState(STATIONS[0]?.id ?? "shoe");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const station = STATIONS.find((row) => row.id === stationId) ?? STATIONS[0];
  const drill = station?.drills[step % (station.drills.length || 1)];

  if (!station || !drill) return null;

  function choose(index: number) {
    if (picked !== null || !station) return;
    setPicked(index);
    const correct = index === drill?.answer;
    markPit(station.id, correct, station.need);
    playCue(correct ? "win" : "lose", sound);
  }

  return (
    <Frame>
      <TopBar title="The Pit" eyebrow="Workshop · play chips" />
      <BrokeBanner />
      <p className="max-w-xl text-sm leading-relaxed text-cream-dim">
        The math of the house, said plainly. Five clean answers at the shoe, or a clean pass at the other stations, comps 100 chips once. It does not change the edge of the game.
      </p>
      <p className="mt-2 text-sm text-gold tabular-nums">
        {pit.correct} of {pit.asked} right · streak {pit.streak}
        {pit.cleared.length > 0 ? ` · cleared ${pit.cleared.length}` : ""}
      </p>
      <div className="mt-4 flex w-full min-w-0 gap-2 overflow-x-auto pb-1" role="group" aria-label="Stations">
        {STATIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              setStationId(row.id);
              setStep(0);
              setPicked(null);
              focusStation(row.id);
            }}
            className={`press min-h-11 shrink-0 rounded-full border px-4 text-sm ${
              row.id === station.id ? "border-gold bg-gold text-ink" : "border-line bg-panel text-cream"
            }`}
            aria-pressed={row.id === station.id}
          >
            {row.name}
            {pit.cleared.includes(row.id) ? " ·" : ""}
          </button>
        ))}
      </div>
      <article className="mt-4 rounded-xl border border-line bg-ink-2 p-4">
        <p className="text-xs tracking-widest text-gold uppercase">{station.kicker}</p>
        <h2 className="mt-2 font-display text-3xl text-cream italic">{station.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">{station.lesson}</p>
      </article>
      <section className="mt-4" aria-label="Drill">
        <p className="font-display text-2xl text-cream italic">{drill.prompt}</p>
        <div className="mt-3 grid gap-2">
          {drill.choices.map((choice, index) => {
            const show = picked !== null;
            const right = index === drill.answer;
            const mine = index === picked;
            return (
              <button
                key={choice}
                type="button"
                disabled={picked !== null}
                onClick={() => choose(index)}
                className={`press min-h-12 rounded-xl border px-4 text-left text-sm disabled:opacity-100 ${
                  show && right
                    ? "border-gold bg-gold text-ink"
                    : show && mine
                      ? "border-oxblood bg-oxblood text-cream"
                      : "border-line bg-panel text-cream"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-3">
            <p className="text-sm leading-relaxed text-cream-dim">{drill.why}</p>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setStep((value) => value + 1);
              }}
              className="press mt-3 min-h-11 rounded-full border border-gold px-4 text-sm text-gold"
            >
              Next hand
            </button>
          </div>
        )}
      </section>
      <p className="mt-5 text-sm text-cream-dim">
        A cleared station pays {chips(100)} once. The games themselves keep their edge.
      </p>
    </Frame>
  );
}

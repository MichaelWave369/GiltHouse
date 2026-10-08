import type { ReactNode } from "react";
import { ChevronLeft, Coins, Crown, Volume2, VolumeX } from "lucide-react";
import { chips, useCasino } from "@/lib/casino/store";

export function TopBar({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const bank = useCasino((s) => s.bank);
  const sound = useCasino((s) => s.sound);
  const toggleSound = useCasino((s) => s.toggleSound);
  const view = useCasino((s) => s.view);
  const setView = useCasino((s) => s.setView);

  return (
    <>
      <header className="mb-4 flex items-center gap-2">
        {view === "floor" ? (
          <div className="crown-glow flex size-11 shrink-0 items-center justify-center rounded-full border border-gold text-gold">
            <Crown className="size-5" aria-hidden />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setView("floor")}
            className="press flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink-2 text-cream"
            aria-label="Back to the floor"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-widest text-cream-dim uppercase">{eyebrow ?? "The Strip"}</p>
          <h1
            className={`truncate font-display text-3xl leading-none italic ${view === "floor" ? "marquee" : "text-cream"}`}
          >
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          className="press flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink-2 text-cream"
          aria-label={sound ? "Mute the room" : "Turn the room on"}
          aria-pressed={sound}
        >
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold bg-ink-2 px-3 py-2">
          <Coins className="size-4 text-gold" aria-hidden />
          <span key={bank} className="bank-pop font-display text-lg leading-none text-gold tabular-nums">
            {chips(bank)}
          </span>
        </div>
      </header>
      <div className="mb-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-gold/40" />
        <span className="size-1.5 rotate-45 bg-gold" />
        <span className="h-px flex-1 bg-gold/40" />
      </div>
    </>
  );
}

export function BrokeBanner() {
  const bank = useCasino((s) => s.bank);
  const marker = useCasino((s) => s.marker);
  if (bank >= 50) return null;
  return (
    <button
      type="button"
      onClick={marker}
      className="press mb-4 w-full rounded-xl border border-gold bg-panel px-4 py-3 text-left"
    >
      <span className="block font-medium text-gold">Take a house marker</span>
      <span className="mt-1 block text-sm text-cream-dim">
        1,000 play chips. They cannot be cashed, transferred, or redeemed.
      </span>
    </button>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="room relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pt-5 pb-16 sm:px-6">
      {children}
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MemoryGame, PulseGame } from "@/components/world/arcade";
import { FACADES, ITEMS, LOCATIONS, actorById, encounterById } from "@/lib/world/content";
import { drawPortrait } from "@/lib/world/draw";
import { choiceVisible, currentObjective, dialogueNodes, journal, lookAt, speakerTitle } from "@/lib/world/logic";
import { playStreetCue, unlockAudio } from "@/lib/casino/audio";
import { useWorld, type Panel } from "@/lib/world/store";

function Portrait({ who }: { who: "player" | { body: string; hair: string; hat?: boolean } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const appearance = useWorld((s) => s.world.appearance);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (who === "player") drawPortrait(ctx, appearance);
    else drawPortrait(ctx, who);
  }, [who, appearance]);
  return <canvas ref={ref} width={48} height={48} className="pixel-screen h-12 w-12 shrink-0 rounded-md border border-line" />;
}

export function WorldOverlay() {
  const world = useWorld((s) => s.world);
  const panel = useWorld((s) => s.panel);
  const talk = useWorld((s) => s.talk);
  const arcade = useWorld((s) => s.arcade);
  const toast = useWorld((s) => s.toast);
  const recovered = useWorld((s) => s.recovered);
  const look = lookAt(world);
  const objective = currentObjective(world);
  const place = LOCATIONS[world.scene].name;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => useWorld.getState().setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      <header className="pointer-events-auto flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 rounded-2xl border border-line bg-ink/90 px-3 py-2">
          <p className="text-[0.65rem] tracking-[0.18em] text-gold uppercase">The Neon Block</p>
          <h1 className="truncate font-display text-xl leading-none text-cream italic">{place}</h1>
          <p className="mt-1 text-xs text-cream-dim">
            {world.tokens} tokens · energy {Math.round(world.energy)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="press h-11 rounded-full border border-line bg-ink-2 px-3 text-sm text-cream" onClick={() => useWorld.getState().openPanel("pause")}>
            Menu
          </button>
          <button
            type="button"
            className="press h-11 rounded-full bg-gold px-3 text-sm font-medium text-ink"
            onClick={() => {
              unlockAudio();
              useWorld.getState().enterCasino("floor");
            }}
          >
            The Floor
          </button>
        </div>
      </header>

      {objective ? (
        <p className="pointer-events-none mx-3 max-w-md rounded-full border border-line bg-ink/80 px-3 py-1 text-xs text-cream">
          <span className="text-gold">{objective.title}.</span> {objective.detail}
        </p>
      ) : (
        <p className="pointer-events-none mx-3 text-xs text-cream-dim">The block is quiet. Doors are still open.</p>
      )}

      <div className="mt-auto flex flex-col gap-2 p-3">
        {toast ? (
          <p className="pointer-events-none max-w-lg rounded-xl border border-gold/50 bg-ink/95 px-3 py-2 text-sm text-cream" role="status">
            {toast}
          </p>
        ) : null}
        {look && panel === "none" && !talk && !arcade ? (
          <button
            type="button"
            className="pointer-events-auto press w-fit rounded-full border border-gold bg-ink px-4 py-2 text-sm text-gold"
            onClick={() => {
              unlockAudio();
              playStreetCue("talk", !world.prefs.mute);
              useWorld.getState().interact();
            }}
          >
            E · {look.label}
          </button>
        ) : null}
        <p className="pointer-events-none hidden text-[0.7rem] tracking-wide text-cream-dim sm:block">
          A D move · W or E act · Esc menu · tokens are not chips · chips are not cash
        </p>
      </div>

      {panel === "create" ? <Creator /> : null}
      {panel === "intro" ? <Intro /> : null}
      {panel === "pause" ? <Pause /> : null}
      {panel === "inventory" ? <Inventory /> : null}
      {panel === "journal" ? <Journal /> : null}
      {panel === "map" ? <DistrictMap /> : null}
      {panel === "help" ? <Help /> : null}
      {panel === "shop" ? <Shop /> : null}
      {talk ? <TalkBox /> : null}
      {arcade ? (
        <Sheet>
          {arcade === "pulse" ? (
            <PulseGame onDone={(score, total) => useWorld.getState().finishArcade(score, total)} onClose={() => useWorld.getState().closeArcade()} />
          ) : (
            <MemoryGame onDone={(score, total) => useWorld.getState().finishArcade(score, total)} onClose={() => useWorld.getState().closeArcade()} />
          )}
        </Sheet>
      ) : null}
      {recovered ? null : null}
    </div>
  );
}

function Sheet({ children, title }: { children: ReactNode; title?: string }) {
  const close = useWorld((s) => s.closePanel);
  const panel = useWorld((s) => s.panel);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end justify-center bg-ink/50 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={title ?? "Panel"}>
      <div className="max-h-[86%] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-ink-2 p-4 text-cream shadow-2xl">
        {title ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-cream italic">{title}</h2>
            {panel !== "create" ? (
              <button type="button" className="press h-10 rounded-full border border-line px-3 text-sm" onClick={() => close()}>
                Close
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function ChoiceRow<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: { id: T; name: string }[]; onPick: (id: T) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs tracking-widest text-cream-dim uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            className={`press h-10 rounded-full border px-3 text-sm ${option.id === value ? "border-gold bg-gold text-ink" : "border-line bg-ink text-cream"}`}
            onClick={() => onPick(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Creator() {
  const appearance = useWorld((s) => s.world.appearance);
  const setAppearance = useWorld((s) => s.setAppearance);
  const confirmLook = useWorld((s) => s.confirmLook);
  return (
    <Sheet title="Who's walking in?">
      <div className="mb-3 flex items-center gap-3">
        <Portrait who="player" />
        <p className="text-sm text-cream-dim">Pick a look. Velvet Vintage can change it later. Nothing here costs a chip.</p>
      </div>
      <ChoiceRow label="Hair" value={appearance.hair} onPick={(hair) => setAppearance({ hair })} options={[
        { id: "crop", name: "Crop" },
        { id: "wave", name: "Wave" },
        { id: "bun", name: "Bun" },
        { id: "spike", name: "Spike" },
      ]} />
      <ChoiceRow label="Outfit" value={appearance.outfit} onPick={(outfit) => setAppearance({ outfit })} options={[
        { id: "tee", name: "Tee" },
        { id: "suit", name: "Suit" },
        { id: "dress", name: "Column" },
      ]} />
      <ChoiceRow label="Jacket" value={appearance.jacket} onPick={(jacket) => setAppearance({ jacket })} options={[
        { id: "none", name: "None" },
        { id: "leather", name: "Leather" },
        { id: "champagne", name: "Champagne" },
        { id: "teal", name: "Teal" },
      ]} />
      <ChoiceRow label="Palette" value={appearance.palette} onPick={(palette) => setAppearance({ palette })} options={[
        { id: "oxblood", name: "Oxblood" },
        { id: "gold", name: "Gold" },
        { id: "teal", name: "Teal" },
        { id: "violet", name: "Violet" },
      ]} />
      <ChoiceRow label="Extra" value={appearance.accessory} onPick={(accessory) => setAppearance({ accessory })} options={[
        { id: "none", name: "None" },
        { id: "shades", name: "Shades" },
        { id: "hat", name: "Hat" },
        { id: "earring", name: "Ear" },
      ]} />
      <button type="button" className="press mt-2 h-12 w-full rounded-full bg-gold font-medium text-ink" onClick={() => confirmLook()}>
        Step onto the block
      </button>
    </Sheet>
  );
}

function Intro() {
  return (
    <Sheet title="A little after two">
      <p className="text-sm leading-relaxed text-cream">
        The Neon Block is awake in the way only a fictional downtown manages: marquees counting, a diner that never locks, Gilt House pouring play chips that cannot become money.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-cream-dim">
        Walk the sidewalk. Talk to Kit. Street tokens buy food, clothes, and records. They never buy chips, and chips never buy the street.
      </p>
      <button type="button" className="press mt-4 h-12 w-full rounded-full bg-gold font-medium text-ink" onClick={() => useWorld.getState().dismissIntro()}>
        Walk in
      </button>
    </Sheet>
  );
}

function Pause() {
  const prefs = useWorld((s) => s.world.prefs);
  const setPrefs = useWorld((s) => s.setPrefs);
  const open = (panel: Panel) => useWorld.getState().openPanel(panel);
  const [armed, setArmed] = useState(false);
  return (
    <Sheet title="The block menu">
      <div className="grid grid-cols-2 gap-2">
        <MenuButton label="Journal" onClick={() => open("journal")} />
        <MenuButton label="Bag" onClick={() => open("inventory")} />
        <MenuButton label="Map" onClick={() => open("map")} />
        <MenuButton label="Help" onClick={() => open("help")} />
        <MenuButton label="Training Lab" onClick={() => useWorld.getState().enterCasino("training")} />
        <MenuButton label="The Pit" onClick={() => useWorld.getState().enterCasino("workshop")} />
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <label className="block">
          Music
          <input className="mt-1 w-full accent-gold" type="range" min={0} max={100} value={Math.round(prefs.music * 100)} onChange={(event) => setPrefs({ music: Number(event.target.value) / 100 })} />
        </label>
        <label className="block">
          Effects
          <input className="mt-1 w-full accent-gold" type="range" min={0} max={100} value={Math.round(prefs.sfx * 100)} onChange={(event) => setPrefs({ sfx: Number(event.target.value) / 100 })} />
        </label>
        <button type="button" className="press h-11 w-full rounded-full border border-line" aria-pressed={prefs.mute} onClick={() => setPrefs({ mute: !prefs.mute })}>
          {prefs.mute ? "Sound is muted" : "Mute the block"}
        </button>
        <button type="button" className="press h-11 w-full rounded-full border border-line" aria-pressed={prefs.reduced} onClick={() => setPrefs({ reduced: !prefs.reduced })}>
          {prefs.reduced ? "Softer motion is on" : "Soften motion and flicker"}
        </button>
      </div>
      <div className="mt-4">
        {armed ? (
          <button type="button" className="press h-11 w-full rounded-full border border-oxblood text-gold" onClick={() => useWorld.getState().resetWorld()}>
            Confirm reset — chips stay
          </button>
        ) : (
          <button type="button" className="press h-11 w-full rounded-full border border-line text-cream-dim" onClick={() => setArmed(true)}>
            Reset this walk
          </button>
        )}
      </div>
    </Sheet>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="press h-12 rounded-xl border border-line bg-panel text-sm text-cream" onClick={onClick}>
      {label}
    </button>
  );
}

function Inventory() {
  const world = useWorld((s) => s.world);
  const ids = Object.keys(world.inventory).filter((id) => (world.inventory[id] ?? 0) > 0 && ITEMS[id]);
  return (
    <Sheet title="Bag">
      <p className="mb-3 text-sm text-cream-dim">
        Style {world.style} · Charm {world.charm} · Knowledge {world.knowledge}
      </p>
      {ids.length === 0 ? <p className="text-sm text-cream">Empty pockets. The diner can help with that.</p> : null}
      <ul className="space-y-2">
        {ids.map((id) => {
          const item = ITEMS[id];
          if (!item) return null;
          const worn = world.equipped.includes(id);
          return (
            <li key={id} className="rounded-xl border border-line bg-ink p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium text-cream">{item.name}</h3>
                <span className="text-xs text-cream-dim">×{world.inventory[id]}</span>
              </div>
              <p className="mt-1 text-sm text-cream-dim">{item.blurb}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.use ? (
                  <button type="button" className="press h-10 rounded-full bg-gold px-3 text-sm text-ink" onClick={() => useWorld.getState().use(id)}>
                    Use
                  </button>
                ) : null}
                {item.equip ? (
                  <button type="button" className="press h-10 rounded-full border border-line px-3 text-sm" onClick={() => useWorld.getState().equip(id)}>
                    {worn ? "Worn" : "Wear"}
                  </button>
                ) : null}
                {item.jukebox ? (
                  <button type="button" className="press h-10 rounded-full border border-line px-3 text-sm" onClick={() => useWorld.getState().listen(id)}>
                    {world.jukebox === item.jukebox ? "Playing" : "Play on the block"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function Journal() {
  const world = useWorld((s) => s.world);
  const entries = journal(world);
  const reps = Object.entries(world.reputation);
  return (
    <Sheet title="Journal">
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-line p-3">
            <p className="text-xs tracking-widest text-gold uppercase">{entry.status === "complete" ? "Done" : "Open"}</p>
            <h3 className="font-display text-xl text-cream italic">{entry.title}</h3>
            <p className="text-sm text-cream-dim">{entry.detail}</p>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-xs tracking-widest text-cream-dim uppercase">Reputation</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {reps.map(([name, value]) => (
          <li key={name} className="rounded-full border border-line px-3 py-1 text-sm">
            {name} {value}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function DistrictMap() {
  const scene = useWorld((s) => s.world.scene);
  const x = useWorld((s) => s.world.x);
  return (
    <Sheet title="The block">
      <p className="mb-3 text-sm text-cream-dim">West to east. The map does not skip the walk.</p>
      <ol className="space-y-2">
        {FACADES.map((facade) => {
          const here = scene === "neon-block" && x >= facade.x && x < facade.x + facade.w;
          return (
            <li key={facade.id} className={`rounded-xl border px-3 py-2 text-sm ${here ? "border-gold text-gold" : "border-line text-cream"}`}>
              {facade.label}
              {here ? " · you" : ""}
            </li>
          );
        })}
      </ol>
      {scene !== "neon-block" ? <p className="mt-3 text-sm text-cream">You are inside {LOCATIONS[scene].name}.</p> : null}
    </Sheet>
  );
}

function Help() {
  return (
    <Sheet title="How the night works">
      <ul className="space-y-2 text-sm leading-relaxed text-cream">
        <li>Move with A and D, or the arrows. On a phone, use Left and Right.</li>
        <li>W, E, Enter, or Act talks, reads a sign, or opens a door.</li>
        <li>Street tokens come from errands and arcade skill. They buy the block.</li>
        <li>Gilt House chips are a separate toy purse. They cannot be cashed, moved, or traded for tokens.</li>
        <li>The Floor button jumps to the classic casino. The lobby door does the same, more slowly, on purpose.</li>
        <li>Esc closes whatever is in front of you, then opens this menu.</li>
      </ul>
    </Sheet>
  );
}

function Shop() {
  const world = useWorld((s) => s.world);
  const location = LOCATIONS[world.scene];
  const keeper = location.keeper ? actorById(location.keeper) : undefined;
  return (
    <Sheet title={location.name}>
      <p className="mb-3 text-sm text-cream-dim">
        {keeper ? `${keeper.name} is at the counter. ` : ""}
        {world.tokens} street tokens. Not chips.
      </p>
      {location.shop.length === 0 ? <p className="text-sm">Nothing is priced in this room.</p> : null}
      <ul className="space-y-2">
        {location.shop.map((id) => {
          const item = ITEMS[id];
          if (!item) return null;
          const owned = item.unique && (world.inventory[id] ?? 0) > 0;
          return (
            <li key={id} className="rounded-xl border border-line bg-ink p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{item.name}</h3>
                <span className="text-gold tabular-nums">{item.price} t</span>
              </div>
              <p className="mt-1 text-sm text-cream-dim">{item.blurb}</p>
              <button
                type="button"
                className="press mt-2 h-10 rounded-full bg-gold px-4 text-sm text-ink disabled:opacity-40"
                disabled={owned || world.tokens < item.price}
                onClick={() => {
                  playStreetCue(world.tokens >= item.price && !owned ? "buy" : "nope", !world.prefs.mute);
                  useWorld.getState().buy(id);
                }}
              >
                {owned ? "Owned" : "Buy"}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function TalkBox() {
  const talk = useWorld((s) => s.talk);
  const world = useWorld((s) => s.world);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, [talk?.id, talk?.nodeId]);
  if (!talk) return null;
  const nodes = dialogueNodes(talk.kind, talk.id);
  const node = nodes?.[talk.nodeId];
  const npc = talk.kind === "npc" ? actorById(talk.id) : null;
  const encounter = talk.kind === "encounter" ? encounterById(talk.id) : null;
  const name = npc?.name ?? encounter?.name ?? "Someone";
  const title = speakerTitle(talk.kind, talk.id);
  const choices = (node?.choices ?? []).filter((choice) => choiceVisible(world, choice));
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 p-3" role="dialog" aria-label={name}>
      <div className="mx-auto flex max-w-lg gap-3 rounded-2xl border border-line bg-ink-2 p-3">
        <Portrait who={npc ? { body: npc.body, hair: npc.hair, hat: npc.hat } : { body: "#3a2428", hair: "#f2e2c4" }} />
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-widest text-gold uppercase">{title}</p>
          <h2 className="font-display text-2xl leading-none text-cream italic">{name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream">{node?.text ?? "..."}</p>
          <div className="mt-3 flex flex-col gap-2">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                ref={index === 0 ? first : undefined}
                type="button"
                className="press rounded-xl border border-line bg-ink px-3 py-2 text-left text-sm text-cream"
                onClick={() => {
                  playStreetCue("talk", !world.prefs.mute);
                  useWorld.getState().choose(choice.id);
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

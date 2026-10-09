import { useCallback, useEffect, useState } from "react";
import { normalizeFloor3DPose, type Floor3DPose, type FloorGame } from "@/lib/casino/floor3d";
import { unlockAudio, setLounge, setBlockMusic } from "@/lib/casino/audio";
import { useWorld } from "@/lib/world/store";
import { useCasino } from "@/lib/casino/store";
import { Agents } from "@/components/casino/agents";
import { AfterHours } from "@/components/casino/afterhours";
import { Baccarat } from "@/components/casino/baccarat";
import { Bartender } from "@/components/casino/bartender";
import { Blackjack } from "@/components/casino/blackjack";
import { Craps } from "@/components/casino/craps";
import { Floor } from "@/components/casino/floor";
import { RoomGL } from "@/components/casino/gl/room";
import { Smoke } from "@/components/casino/gl/smoke";
import { Keno } from "@/components/casino/keno";
import { Pianist } from "@/components/casino/pianist";
import { Poker } from "@/components/casino/poker";
import { Roulette } from "@/components/casino/roulette";
import { Slots } from "@/components/casino/slots";
import { Sportsbook } from "@/components/casino/sportsbook";
import { Workshop } from "@/components/casino/workshop";
import { TrainingLab } from "@/components/casino/training-lab";

export function CasinoApp() {
  const view = useCasino((s) => s.view);
  const from3DLobby = useWorld((s) => s.casino3DFromLobby);
  const boot = useCasino((s) => s.boot);
  const sound = useCasino((s) => s.sound);
  const agentStatus = useCasino((s) => s.agent?.status);
  const advanceAgent = useCasino((s) => s.advanceAgent);
  // Ephemeral UI navigation only. Never included in Zustand casino/save state.
  const [return3DPose, setReturn3DPose] = useState<Floor3DPose | null>(null);
  const clearReturn3D = useCallback(() => setReturn3DPose(null), []);
  const backTo3DLobby = useCallback(() => {
    // Explicit player action. The world store independently verifies the
    // 3D lobby origin before allowing a return to the street overlay.
    setLounge(false);
    setBlockMusic(false);
    useWorld.getState().returnTo3DLobby();
  }, []);
  const enterTableFrom3D = useCallback((game: FloorGame, pose: Floor3DPose) => {
    setReturn3DPose(normalizeFloor3DPose(pose));
    useCasino.getState().setView(game);
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    setLounge(sound);
  }, [sound]);

  useEffect(() => {
    if (agentStatus !== "live") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(advanceAgent, reduce ? 70 : 520);
    return () => window.clearInterval(timer);
  }, [advanceAgent, agentStatus]);

  useEffect(() => {
    const onPointer = () => unlockAudio();
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  return (
    <>
      <RoomGL />
      <Smoke />
      <Pianist />
      <Bartender />
      <div key={view} className="rise">
        {view === "blackjack" ? (
          <Blackjack />
        ) : view === "roulette" ? (
          <Roulette />
        ) : view === "slots" ? (
          <Slots />
        ) : view === "craps" ? (
          <Craps />
        ) : view === "baccarat" ? (
          <Baccarat />
        ) : view === "poker" ? (
          <Poker />
        ) : view === "keno" ? (
          <Keno />
        ) : view === "afterhours" ? (
          <AfterHours />
        ) : view === "sports" ? (
          <Sportsbook />
        ) : view === "workshop" ? (
          <Workshop />
        ) : view === "training" ? (
          <TrainingLab />
        ) : view === "agents" ? (
          <Agents />
        ) : (
          <Floor return3DPose={return3DPose} onLeave3D={clearReturn3D} onChoose3D={enterTableFrom3D} from3DLobby={from3DLobby} onBackTo3DLobby={backTo3DLobby} />
        )}
      </div>
    </>
  );
}

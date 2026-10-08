import { useEffect } from "react";
import { setBlockMusic, setLounge } from "@/lib/casino/audio";
import { CasinoApp } from "@/components/casino/app";
import { NeonStage } from "@/components/world/engine";
import { useWorld } from "@/lib/world/store";

export function GiltHouseShell() {
  const mode = useWorld((s) => s.mode);
  const boot = useWorld((s) => s.boot);

  useEffect(() => {
    boot();
  }, [boot]);

  if (mode === "casino") {
    return (
      <>
        <CasinoApp />
        <button
          type="button"
          className="press fixed bottom-4 left-1/2 z-40 h-12 -translate-x-1/2 rounded-full border border-gold bg-ink px-4 text-sm text-gold"
          onClick={() => {
            setLounge(false);
            setBlockMusic(false);
            useWorld.getState().leaveCasino();
          }}
        >
          Back to the Neon Block
        </button>
      </>
    );
  }

  return <NeonStage />;
}

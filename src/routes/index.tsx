import { createFileRoute } from "@tanstack/react-router";
import { CasinoApp } from "@/components/casino/app";

export const Route = createFileRoute("/")({
  component: CasinoApp,
});

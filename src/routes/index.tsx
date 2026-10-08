import { createFileRoute } from "@tanstack/react-router";
import { GiltHouseShell } from "@/components/world/shell";

export const Route = createFileRoute("/")({
  component: GiltHouseShell,
});

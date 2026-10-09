/**
 * GitHub Pages entry point: the real client-side Neon Block and casino code.
 * Deliberately bypasses TanStack Start SSR, auth, server routes, and Grok preview.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { GiltHouseShell } from "@/components/world/shell";
import "@/styles.css";

const node = document.getElementById("root");
if (!node) throw new Error("Gilt House Pages mount point is missing.");

createRoot(node).render(
  <React.StrictMode>
    <GiltHouseShell />
  </React.StrictMode>,
);

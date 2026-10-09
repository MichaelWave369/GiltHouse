/**
 * Separate static-only build. NEVER change vite.config.ts, TanStack Start,
 * Nitro/Vercel hosting, auth, or server routes to make Pages work.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL("./", import.meta.url));
const project = fileURLToPath(new URL("../", import.meta.url));
const src = fileURLToPath(new URL("../src", import.meta.url));
const noServerSportsbook = fileURLToPath(new URL("./sportsbook-unavailable.tsx", import.meta.url));

export default defineConfig({
  root,
  base: "/GiltHouse/",
  publicDir: false,
  resolve: {
    alias: [
      // Exact server-feature substitution must precede the generic @ alias.
      { find: "@/components/casino/sportsbook", replacement: noServerSportsbook },
      { find: "@", replacement: src },
    ],
  },
  plugins: [tailwindcss(), react()],
  build: {
    outDir: fileURLToPath(new URL("../dist-pages/", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    // Fail instead of quietly shipping broken imports.
    rollupOptions: { input: fileURLToPath(new URL("./index.html", import.meta.url)) },
  },
  // This is a project-only statically hosted bundle, not the TanStack SSR app.
  envDir: project,
});

/**
 * Visual-layout smoke check for the static GitHub Pages edition.
 * This specifically catches the R7 regression where Tailwind's reset loaded
 * but the missing utility classes collapsed the pixel-art viewport.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { chromium } from "playwright";

const url = "http://127.0.0.1:4173/GiltHouse/";
const preview = spawn(
  process.execPath,
  [resolve("node_modules/vite/bin/vite.js"), "preview", "--config",
    "pages-static/vite.config.ts", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
preview.stdout.on("data", (chunk) => { output += String(chunk).slice(-3000); });
preview.stderr.on("data", (chunk) => { output += String(chunk).slice(-3000); });

let browser;
try {
  let healthy = false;
  for (let i = 0; i < 90; i++) {
    if (preview.exitCode !== null) break;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) { healthy = true; break; }
    } catch { /* waiting for Vite preview */ }
    await pause(200);
  }
  assert.ok(healthy, `Vite Pages preview never served ${url}: ${output}`);
  browser = await chromium.launch({ headless: true });
  await mkdir("artifacts", { recursive: true });

  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, `Pages route failed: ${viewport.name}`);
      await page.locator(".world-root canvas.pixel-screen").first().waitFor({ state: "visible", timeout: 18000 });
      await page.waitForFunction(() => {
        const canvas = document.querySelector(".world-root canvas.pixel-screen");
        return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
      }, { timeout: 15000 });
      const layout = await page.evaluate(() => {
        const root = document.querySelector(".world-root");
        const canvas = document.querySelector(".world-root canvas.pixel-screen");
        const dialog = document.querySelector('[role="dialog"][aria-label="Gilt House title"]');
        if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) return null;
        const game = root.getBoundingClientRect();
        const frame = canvas.getBoundingClientRect();
        return {
          rootDisplay: getComputedStyle(root).display,
          rootHeight: game.height,
          canvasWidth: frame.width,
          canvasHeight: frame.height,
          titleFontSize: dialog ? Number.parseFloat(getComputedStyle(dialog.querySelector("h2")).fontSize) : 0,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        };
      });
      assert.ok(layout, "No live root/canvas found.");
      assert.equal(layout.rootDisplay, "flex", `${viewport.name}: Tailwind display:flex did not load`);
      assert.ok(layout.rootHeight >= viewport.height * 0.9, `${viewport.name}: root viewport collapsed: ${JSON.stringify(layout)}`);
      assert.ok(layout.canvasWidth >= viewport.width * 0.88, `${viewport.name}: canvas is too narrow: ${JSON.stringify(layout)}`);
      assert.ok(layout.canvasHeight >= viewport.height * 0.60, `${viewport.name}: canvas collapsed: ${JSON.stringify(layout)}`);
      assert.ok(layout.titleFontSize >= 28, `${viewport.name}: title typography is unstyled: ${JSON.stringify(layout)}`);
      assert.ok(layout.documentWidth <= layout.viewportWidth + 1, `${viewport.name}: horizontal overflow: ${JSON.stringify(layout)}`);
      assert.deepEqual(errors, [], `${viewport.name}: unhandled browser exceptions`);
      await page.screenshot({ path: `artifacts/gilt-house-pages-${viewport.name}.png`, fullPage: true });
      console.log(`PASS: ${viewport.name} ${viewport.width}x${viewport.height}; canvas ${Math.round(layout.canvasWidth)}x${Math.round(layout.canvasHeight)}; title ${layout.titleFontSize}px`);
    } finally {
      await page.close();
    }
  }
} finally {
  if (browser) await browser.close();
  preview.kill("SIGTERM");
}

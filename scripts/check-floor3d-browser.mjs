/**
 * Browser acceptance for the optional R11 Three.js gaming floor.
 * Verifies the actual UI and game routing in a static GitHub Pages build.
 * Software WebGL fallback still exposes the entire real casino directory.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { chromium } from "playwright";

const url = "http://127.0.0.1:4175/GiltHouse/";
const preview = spawn(process.execPath, [
  resolve("node_modules/vite/bin/vite.js"), "preview", "--config",
  "pages-static/vite.config.ts", "--host", "127.0.0.1",
  "--port", "4175", "--strictPort",
], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
preview.stdout.on("data", (chunk) => { output += String(chunk).slice(-2000); });
preview.stderr.on("data", (chunk) => { output += String(chunk).slice(-2000); });
let browser;
try {
  let running = false;
  for (let n = 0; n < 90; n++) {
    if (preview.exitCode !== null) break;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
      if (response.ok) { running = true; break; }
    } catch { /* waiting for static preview */ }
    await pause(200);
  }
  assert.ok(running, `Pages preview did not start: ${output}`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.getByRole("dialog", { name: "Gilt House title" })
      .waitFor({ state: "visible", timeout: 18000 });
    await page.getByRole("button", { name: "Quick casino access" }).click();

    const open = page.getByRole("button", { name: /Explore the 3D gaming floor/ });
    await open.waitFor({ state: "visible", timeout: 12000 });
    const before = await page.evaluate(() => localStorage.getItem("gilt-house-v1"));

    await open.click();
    const room = page.getByRole("dialog", { name: "Gilt House 3D gaming floor" });
    await room.waitFor({ state: "visible", timeout: 15000 });
    await room.getByRole("button", { name: "THE SHOE" }).waitFor({ state: "visible" });
    await room.getByRole("button", { name: "THE WHEEL" }).waitFor({ state: "visible" });
    await room.getByRole("button", { name: "AFTER HOURS" }).waitFor({ state: "visible" });
    assert.equal(await room.getByRole("group", { name: "Casino table shortcuts" }).getByRole("button").count(), 8);

    // The showroom must not let F teleport from its spawn point.
    await page.keyboard.press("f");
    await room.waitFor({ state: "visible" });
    await room.getByRole("button", { name: "Back to casino directory" }).click();
    await room.waitFor({ state: "detached" });
    await open.waitFor({ state: "visible" });

    await open.click();
    await room.waitFor({ state: "visible" });
    await room.getByRole("button", { name: "THE SHOE" }).click();
    await room.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Back to the floor" })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByRole("button", { name: "Back to the floor" }).click();
    await open.waitFor({ state: "visible" });

    assert.equal(await page.evaluate(() => localStorage.getItem("gilt-house-v1")), before,
      "Navigating in 3D must not change casino chip storage");
    assert.deepEqual(errors, [], "No unhandled browser errors during showroom journey");
    console.log("PASS: 3D floor opens, eight game entrances exist, F cannot teleport, Blackjack opens and returns without chip changes.");
  } finally {
    await page.close();
  }
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}

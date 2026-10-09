/**
 * R9 browser smoke: the opt-in 3D promenade opens from the existing Gilt
 * House scene, provides accessible destinations, and safely returns to 2D.
 * Software WebGL fallback is acceptable; the user can still enter each room.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { chromium } from "playwright";

const url = "http://127.0.0.1:4174/GiltHouse/";
const preview = spawn(process.execPath, [
  resolve("node_modules/vite/bin/vite.js"), "preview", "--config",
  "pages-static/vite.config.ts", "--host", "127.0.0.1", "--port", "4174", "--strictPort",
], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
preview.stdout.on("data", (c) => { output += String(c).slice(-2000); });
preview.stderr.on("data", (c) => { output += String(c).slice(-2000); });
let browser;
try {
  let running = false;
  for (let i = 0; i < 90; i++) {
    if (preview.exitCode !== null) break;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
      if (response.ok) { running = true; break; }
    } catch { /* preview loading */ }
    await pause(200);
  }
  assert.ok(running, `Static preview didn't start: ${output}`);
  browser = await chromium.launch({ headless: true });
  // Layout gets dedicated full-resolution browser QA elsewhere. Keep this
  // actual GPU movement probe responsive on GitHub's software renderer.
  const page = await browser.newPage({ viewport: { width: 960, height: 680 }, deviceScaleFactor: 0.75 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    // Seed local-only fixture before ANY application hydration/effects run.
    // Seeding after the first navigation could race with its autosave loop.
    await page.addInitScript(() => {
      localStorage.setItem("gilt-house-world-v1", JSON.stringify({
        version: 1, scene: "gilt-lobby", x: 64,
        flags: { created: true, intro: true },
        prefs: { music: 0, sfx: 0, mute: true, reduced: true },
      }));
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.getByRole("dialog", { name: "Gilt House title" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Enter 3D lobby" }).waitFor({ state: "visible" });
    const before = await page.evaluate(() => localStorage.getItem("gilt-house-v1"));
    await page.getByRole("button", { name: "Enter 3D lobby" }).click();
    const room = page.getByRole("dialog", { name: "Gilt House 3D promenade" });
    await room.waitFor({ state: "visible", timeout: 15000 });
    // Interaction does not teleport visitors from the spawn point.
    await page.keyboard.press("f");
    await room.waitFor({ state: "visible" });
    await room.getByRole("button", { name: /THE FLOOR/ }).waitFor({ state: "visible" });
    await room.getByRole("button", { name: /TRAINING LAB/ }).waitFor({ state: "visible" });

    // R17: exercise actual WebGL keyboard movement against a gold column
    // at x=-7.9,z=8. The camera/body should stop around x=-7.27, rather
    // than walking through the pillar until the original wall bound -7.4.
    await page.waitForFunction(() =>
      Boolean(document.querySelector('output[aria-label="3D grand lobby position"]')) ||
      document.body.textContent?.includes("3D graphics could not start on this device."),
      null, { timeout: 15000 });
    const hud = room.getByLabel("3D grand lobby position");
    if (await hud.isVisible()) {
      await room.focus();
      await page.keyboard.down("a");
      try {
        await page.waitForFunction(() => {
          const node = document.querySelector('output[aria-label="3D grand lobby position"]');
          return node && Number(node.getAttribute("data-x")) < -6.8;
        }, null, { timeout: 18000 });
        await page.waitForTimeout(900);
      } finally {
        await page.keyboard.up("a");
      }
      await page.waitForTimeout(350);
      const x = Number(await hud.getAttribute("data-x"));
      const z = Number(await hud.getAttribute("data-z"));
      assert.ok(x < -6.8 && x > -7.30,
        `R17 solid gilded pillar must block before wall (x=${x})`);
      assert.ok(Math.abs(z - 8) < 0.12, `strafe shouldn't alter Z: ${z}`);
      console.log(`PASS: R17 real WebGL movement blocked by solid gilded pillar at x=${x}, z=${z}`);
    } else {
      console.log("SKIP: lobby GPU collision probe unavailable; all physical collision paths unit tested and accessible HTML routes remain tested.");
    }
    await room.getByRole("button", { name: "Back to 16-bit lobby" }).click();
    await room.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Enter 3D lobby" }).click();
    await page.getByRole("dialog", { name: "Gilt House 3D promenade" })
      .getByRole("button", { name: /TRAINING LAB/ }).click();
    await page.getByRole("button", { name: "Back to the Neon Block" }).waitFor({ state: "visible", timeout: 12000 });
    await page.getByRole("button", { name: "Back to the Neon Block" }).click();
    await page.getByRole("button", { name: "Enter 3D lobby" }).waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => localStorage.getItem("gilt-house-v1")), before,
      "3D lobby and Training Lab navigation must not change play-chip storage");
    assert.deepEqual(errors, [], "No unhandled browser exceptions during 3D navigation");
    console.log("PASS: R17 solid grand-lobby geometry verified in WebGL where available; 3D opens, returns to 2D, enters Training Lab and keeps chip purse unchanged.");
  } finally {
    await page.close();
  }
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}

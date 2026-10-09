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
  // Use a moderate software-rendering resolution; desktop/mobile layout is
  // already separately qualified at full sizes in check-pages-browser.
  const page = await browser.newPage({ viewport: { width: 960, height: 680 }, deviceScaleFactor: 0.75 });
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

    // R14: interactive, accessible floor map is opt-in and never teleports.
    await room.getByRole("button", { name: "Show floor map" }).click();
    const map = room.getByRole("complementary", { name: "3D casino floor map" });
    await map.waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await map.getByRole("group", { name: "Choose map destination" }).getByRole("button").count(), 8);
    await map.getByRole("group", { name: "Choose map destination" }).getByRole("button", { name: "THE SHOE" }).click();
    await map.getByText(/m along the marked walking path/).waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await map.getByRole("button", { name: "THE SHOE" }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.evaluate(() => localStorage.getItem("gilt-house-v1")), before,
      "Simply selecting a walking route must never change the chip purse");
    await room.getByRole("button", { name: "Hide floor map" }).click();
    await map.waitFor({ state: "detached" });

    // R15: the selected target survives map close, and the real Three.js
    // scene renders a bounded set of gold route arrows, not auto-walking.
    const guide = room.locator('output[aria-label="3D floor guidance"]');
    await guide.waitFor({ state: "visible", timeout: 12000 });
    assert.equal(await guide.getAttribute("data-target"), "blackjack");
    await page.waitForFunction(() => {
      const path = document.querySelector('output[aria-label="3D floor guidance"]');
      const ready = document.querySelector('output[aria-label="3D camera location"]');
      const fallback = document.body.textContent?.includes("3D graphics aren't supported here.");
      return Boolean(fallback || (ready && path && Number(path.getAttribute("data-markers")) > 0));
    }, null, { timeout: 15000 });
    const markerCount = Number(await guide.getAttribute("data-markers"));
    if (await room.getByLabel("3D camera location").isVisible()) {
      assert.ok(markerCount > 0 && markerCount <= 72,
        `The GPU waypoint batch should be nonempty and bounded: ${markerCount}`);
    }
    assert.equal(await page.evaluate(() => localStorage.getItem("gilt-house-v1")), before,
      "3D breadcrumbs must not change the play-chip purse");
    await room.getByRole("button", { name: "Clear guide" }).click();
    await guide.waitFor({ state: "detached" });

    // R16: reselect Blackjack for the real 3D walk, then prove the beacon
    // arrives in the world while the camera remains under player control.
    await room.getByRole("button", { name: "Show floor map" }).click();
    await map.waitFor({ state: "visible" });
    await map.getByRole("group", { name: "Choose map destination" })
      .getByRole("button", { name: "THE SHOE" }).click();
    await room.getByRole("button", { name: "Hide floor map" }).click();
    await map.waitFor({ state: "detached" });
    await guide.waitFor({ state: "visible" });
    assert.equal(await guide.getAttribute("data-arrived"), "false");
    await page.waitForFunction(() => {
      const indicator = document.querySelector('output[aria-label="3D floor guidance"]');
      const gpu = document.querySelector('output[aria-label="3D camera location"]');
      const fallback = document.body.textContent?.includes("3D graphics aren't supported here.");
      return Boolean(fallback || (gpu && indicator?.getAttribute("data-beacon") === "true"));
    }, null, { timeout: 15000 });

    // The showroom must not let F teleport from its spawn point.
    await page.keyboard.press("f");
    await room.waitFor({ state: "visible" });

    // R13: where WebGL initializes, verify real player movement against
    // the physical Blackjack table. Other environments retain HTML fallback.
    await page.waitForFunction(() =>
      Boolean(document.querySelector('output[aria-label="3D camera location"]')) ||
      document.body.textContent?.includes("3D graphics aren't supported here."),
      null, { timeout: 15000 });
    const hud = room.getByLabel("3D camera location");
    let enteredFromBeacon = false;
    if (await hud.isVisible()) {
      // Playwright's last clicked casino shortcut can own focus. The game
      // intentionally ignores movement while a button is focused.
      await room.focus();
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        "Gilt House 3D gaming floor",
        "Room must own keyboard focus for movement controls",
      );
      console.log("R13: focused 3D room, starting camera Z:", await hud.getAttribute("data-z"));
      await page.keyboard.down("w");
      try {
        try {
          await page.waitForFunction(() => {
            const node = document.querySelector('output[aria-label="3D camera location"]');
            return node && Number(node.getAttribute("data-z")) < 7.3;
          }, null, { timeout: 12000 });
        } catch (error) {
          console.error("3D movement probe timed out. HUD:", await hud.getAttribute("data-z"),
            "focused:", await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 170)));
          throw error;
        }
      } finally {
        await page.keyboard.up("w");
      }
      await page.keyboard.down("a");
      try {
        await page.waitForFunction(() => {
          const node = document.querySelector('output[aria-label="3D camera location"]');
          return node && Number(node.getAttribute("data-x")) < -2.95;
        }, null, { timeout: 12000 });
        // Continue to press against the table; old R11 would pass through it.
        await page.waitForTimeout(950);
      } finally {
        await page.keyboard.up("a");
      }
      await page.waitForTimeout(350);

      const x = Number(await hud.getAttribute("data-x"));
      const z = Number(await hud.getAttribute("data-z"));
      assert.ok(x > -3.15 && x < -1.9,
        `Table collision should stop the camera at the Blackjack aisle rail, not inside felt: x=${x}`);
      assert.ok(z < 7.3 && z > 4.5, `The aisle should remain accessible: z=${z}`);
      await room.getByRole("button", { name: /F · Enter THE SHOE/ }).waitFor({ state: "visible" });
      await page.waitForFunction(() => document.querySelector('output[aria-label="3D floor guidance"]')?.getAttribute("data-arrived") === "true",
        null, { timeout: 12000 });
      await guide.getByText(/You've arrived!/).waitFor({ state: "visible" });
      const enterSelected = room.getByRole("button", { name: "Enter selected table" });
      await enterSelected.waitFor({ state: "visible" });
      await enterSelected.click();
      await room.waitFor({ state: "detached" });
      enteredFromBeacon = true;
      console.log(`PASS: R16 3D destination beacon reached Blackjack; existing game launched at x=${x}, z=${z}`);
    } else {
      console.log("SKIP: 3D GPU movement probe unavailable; accessible HTML casino table routing remains tested.");
    }

    if (!enteredFromBeacon) {
      // WebGL-disabled environments still enter real Blackjack through the
      // original accessible game shortcut, with no false 3D claims.
      await room.getByRole("button", { name: "Back to casino directory" }).click();
      await room.waitFor({ state: "detached" });
      await open.waitFor({ state: "visible" });
      await open.click();
      await room.waitFor({ state: "visible" });
      await room.getByRole("button", { name: "THE SHOE" }).click();
      await room.waitFor({ state: "detached" });
    }
    await page.getByRole("button", { name: "Back to the floor" })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByRole("button", { name: "Back to the floor" }).click();

    // R12: returning from the existing game must reopen the showroom, not
    // silently drop the player back into the 2D casino directory.
    await room.waitFor({ state: "visible", timeout: 15000 });
    await room.getByText("Welcome back. Your 3D position and view were restored.")
      .waitFor({ state: "visible", timeout: 15000 });
    await room.getByRole("button", { name: "Back to casino directory" }).click();
    await room.waitFor({ state: "detached" });
    await open.waitFor({ state: "visible" });

    // Leaving the showroom clears the return ticket. Plain 2D game access
    // must remain 2D when the player returns.
    await page.locator("button.table-card").filter({ hasText: "The Wheel" }).click();
    await page.getByRole("button", { name: "Back to the floor" }).click();
    await open.waitFor({ state: "visible" });
    assert.equal(await room.count(), 0,
      "Direct 2D game selection must never automatically open a 3D scene");

    assert.equal(await page.evaluate(() => localStorage.getItem("gilt-house-v1")), before,
      "Navigating in 3D must not change casino chip storage");
    assert.deepEqual(errors, [], "No unhandled browser errors during showroom journey");
    console.log("PASS: R16 gold arrival beacon and proximity-gated table entry (WebGL where present), R12 game return, 2D game and chip isolation.");
  } finally {
    await page.close();
  }
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}

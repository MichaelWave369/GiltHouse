/**
 * Verify the public Gilt House Pages artifact after the isolated Vite build.
 * No DNS, secrets, provider login, browser runtime or deployed URL required.
 */
import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist-pages/", import.meta.url));
const html = await readFile(resolve(root, "index.html"), "utf8");

assert.match(html, /<title>Gilt House \| The Neon Block<\/title>/);
assert.match(html, /id="root"/);
assert.doesNotMatch(html, /src="\/assets\/|href="\/assets\//, "Asset references must include the GiltHouse base.");

const assets = [...html.matchAll(/(?:src|href)="(\/GiltHouse\/[^"]+)"/g)]
  .map((match) => match[1].split(/[?#]/)[0]);
assert.ok(assets.some((path) => path.endsWith(".js")), "Static Pages needs a bundled JS entry.");
assert.ok(assets.some((path) => path.endsWith(".css")), "Static Pages needs bundled styles.");

for (const asset of assets) {
  const relative = decodeURIComponent(asset.slice("/GiltHouse/".length));
  assert.ok(relative && !relative.includes("..") && !relative.startsWith("/"), "Unsafe asset path.");
  const item = await stat(resolve(root, relative));
  assert.ok(item.isFile(), `Referenced asset is missing: ${asset}`);
}

const all = await readdir(resolve(root, "assets"));
assert.ok(all.some((name) => name.endsWith(".js")), "No generated app JavaScript.");
const scripts = await Promise.all(all.filter((name) => name.endsWith(".js"))
  .map((name) => readFile(resolve(root, "assets", name), "utf8")));
const bundle = scripts.join("\n");
assert.doesNotMatch(bundle, /site\.web\.api\.espn\.com/, "Server-only live scoreboard was bundled into GitHub Pages.");
assert.doesNotMatch(bundle, /@tanstack\/react-start/, "Static bundle must not import a server runtime.");

console.log(`PASS: static artifact at /GiltHouse/; ${assets.length} page assets verified; no live scoreboard server dependency.`);

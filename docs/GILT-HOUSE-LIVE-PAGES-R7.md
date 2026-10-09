# Gilt House Live: GitHub Pages static edition (R7)

Status: **build-and-deployment PR, pending GitHub Actions and browser qualification.** No live public URL should be claimed until the Pages deployment succeeds.

## Why a separate static entry?

Gilt House's existing TanStack Start / Nitro / Vercel application has real server-only behavior, including `src/lib/casino/wire.ts` which fetches ESPN data via a server function. **GitHub Pages cannot run a Node server.** Do not deploy the existing `.vercel/output` folder or rewrite `vite.config.ts` to fake static compatibility.

The standalone React entry at `pages-static/main.tsx` instead mounts the existing **real** `GiltHouseShell` client UI: the 320×180 Neon Block canvas, NPCs, shops, arcade cabinets, player and casino stores, Training Lab, Backstage Agent Desk, and original browser-based casino activities. There is no separately reimplemented game engine.

`pages-static/vite.config.ts` uses a different Vite root and a hardcoded `/GiltHouse/` base path. It replaces **only** the imported sportsbook screen with `pages-static/sportsbook-unavailable.tsx` at build time. This is deliberate: scoreboard loading and automatic ticket settlement require the original app's server. The server-hosted original app stays unchanged.

**On GitHub Pages:**
- Walk the Neon Block; enter interiors, shops, arcade, lobby, and most original casino activities.
- Use local save keys `gilt-house-world-v1` and `gilt-house-v1` on the github.io origin.
- View the live-scoreboard **unavailable** screen in The Wire. No live ticket placement or settlement is attempted there.
- Agent Desk local rehearsal, visual playback, and *manual* model-proposal inspection work without model or API calls.
- Three.js is already present in some of the existing casino/arena visuals, but this PR does **not** claim a new 3D district or VR qualification.
- No accounts, payment system, customer database, backend login or multiplayer are added.

**On the existing hosted application:** everything remains exactly as before. This PR does not modify server routes, auth, SSR setup, Vercel, deployment keys, or server sportsbook behavior.

## Local build and checks

Use Node 22:

```bash
npm ci
npm test
npm run typecheck
npm run typecheck:pages
npm run lint
npm run build:pages
npm run check:pages
```

The standalone static output is `dist-pages/` and is gitignored. The artifact checker confirms that generated HTML references locally present JS/CSS files under `/GiltHouse/` and that the live-scoreboard server URL / Start runtime is not included in the bundle.

To preview the static build locally:

```bash
npx vite preview --config pages-static/vite.config.ts --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/GiltHouse/`. Test actual keyboard/touch controls, the casino return button, local saved progress, optional Agent Desk, and a narrow viewport.

## Enable deployment once

1. Merge the reviewed R7 PR only after **Gilt House Pages** and existing Neon Block CI are green.
2. In **GitHub repository Settings → Pages**, choose **Build and deployment → Source: GitHub Actions**. This step must be done by the repository owner. Merely merging a workflow does not automatically enable a Pages site.
3. The push-to-main `Gilt House Pages` workflow builds and checks `dist-pages/`, uploads it as a Pages artifact, and then deploys using the official GitHub Pages actions.
4. The expected public project-site path, subject to successful deployment, is **https://michaelwave369.github.io/GiltHouse/**.
5. Verify the deployed home page loads without a 404; reload it, open The Neon Block, enter and leave Gilt House, check The Wire unavailable state, use both saves, and inspect the Agent Desk.
6. Check GitHub Actions and Pages settings for deployment URLs and errors. The current chat cannot turn GitHub Pages on via repository settings.

## Security, privacy and independence

- Site assets are publicly hosted; **never commit secrets or model API keys**. No auth or private application server is ported to static Pages.
- Each site's localStorage is origin-isolated. The github.io save **does not synchronize** with the existing hosted Gilt House save; do not claim account-based or cross-device continuity.
- An unknown page visitor can tamper with their own browser save. Casino chips/street tokens are nonredeemable, nontransferable entertainment counters.
- The model proposal bridge is manual, untrusted and inspection-only. No direct Ollama/PhiBot integration or spending authority exists.
- The separately sold **Neon Royal / City369** is never imported, deployed, modified, licensed or coupled here.
- Do not turn on real-money wagering or API-credit redemption.
- The initial Pages build uses third-party Google Fonts for optional typography. The game assets and scripts otherwise build locally; font loading can fall back when offline.

## Remaining QA and decisions

- **Browser acceptance is required**. CI confirms compilation and static asset references, not a live client-only playthrough or headset test.
- Verify if the sportsbook unavailable screen is acceptable or whether a future read-only static scoreboard sourced from a public, CORS-permitting endpoint is desired. Do **not** silently change casino payouts or existing tickets.
- If GitHub Pages deployment fails due to repository configuration, enable Actions source and rerun the workflow. Do not change the full-stack app or create another public repo to work around this.
- Future 3D showcases can be lazy-loaded as optional, separate experiences once the static build has passed manual acceptance.

## R8 post-deployment visual regression fix

The initial R7 Pages deployment was visible but essentially unstyled: the separate Vite root caused Tailwind v4's automatic discovery to omit `src/` utility classes. The missing `.flex`, `.relative`, `.absolute`, viewport sizing and color utilities collapsed the canvas layout and left tiny plain text at the top of a black screen. The original Grok-hosted build was unaffected.

R8 changes **only the Pages stylesheet entry** to `pages-static/styles.css`, which imports the normal app stylesheet and explicitly scans both `../src` and the static source folder. `npm run check:pages` now fails if critical classes are missing, rather than merely asserting that a stylesheet exists.

R8 also adds **real headless Chromium smoke checks** before any Pages deployment. Run `npx playwright install --with-deps chromium && npm run check:pages:browser` after `npm run build:pages`. The browser test checks on desktop and mobile that the pixel canvas fills the viewport, the title uses the intended typography, no horizontal overflow occurs, and no unhandled browser exceptions fire. CI uploads screenshots as artifacts. These checks guard against this specific regression, not every game interaction or physical device.

After merging, GitHub Actions automatically rebuilds and deploys the static site. If an old page remains, wait for the **Gilt House Pages** deployment to succeed and hard-refresh Ctrl+Shift+R. Do not clear the browser's local storage; that would discard local-only game progress.

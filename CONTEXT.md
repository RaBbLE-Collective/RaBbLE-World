# CONTEXT.md — RaBbLE-World

```
epoch: 0 | status: active
last session: 2026-06-08 (Session 53)
```

RaBbLE-World is the public-facing surface of the RaBbLE Collective — the browser entry point where the entity lives and speaks.

---

## What We Are Building

A static web presence: landing page with full WM applet layout, chat interface, boot sequence reference, OS page, and NeBuLA demo. No bundler, no framework. Serve locally with `node ../RaBbLE-Grimoire/spells/dev-cdn.js` (maps `/aether/*` and `/nebula/*` CDN routes to member `dist/` folders; `DEV_PORT` env, default 8080); deployed to Cloudflare Workers.

## What Good Looks Like

- Aether CDN provides all visual identity — page CSS is layout-only
- No hex values in page CSS — all color references go through `RaBbLE-theme.css` vars
- The entity renders through NeBuLA — `<rabble-entity>` is defined in the NeBuLA bundle, not in World
- Bundle loaders (`RaBbLE-aether.js`, `RaBbLE-NeBuLA.js`) own CDN injection and failure detection — no inline scripts in HTML
- Architecture and heavy docs live in Grimoire, not in this repo
- Serve locally with `node ../RaBbLE-Grimoire/spells/dev-cdn.js` — plain `http.server` cannot serve the `/aether/*` / `/nebula/*` CDN routes (Aether failure banner)

## What to Avoid

- Visual rules (colors, glows, animations) in page CSS — those belong in Aether
- Duplicating Aether component classes in page CSS
- Raw hex values anywhere except `RaBbLE-theme.css` fallbacks
- Running `dev-cdn.js` or esbuild watch directly (orphans port 8000)
- Framework creep — this is intentionally static

## Script + CSS Loading Order (all pages)

```html
<!-- Synchronous loaders — run during parse, inject bundles from CDN -->
<script src="world/js/RaBbLE-aether.js"></script>   <!-- injects /aether/v0.0.0.0/aether.css -->
<script src="world/js/RaBbLE-NeBuLA.js"></script>   <!-- injects /nebula/v0.0.0.0/nebula.iife.js -->

<!-- CSS (Aether injected above; theme + chrome + page load here) -->
<link rel="stylesheet" href="[path/]css/RaBbLE-theme.css">   <!-- alias bridge -->
<link rel="stylesheet" href="[path/]css/RaBbLE-chrome.css">  <!-- shared chrome: global ◈ nav -->
<link rel="stylesheet" href="[path/]css/RaBbLE-[page].css">  <!-- layout only -->
```

Every page sets `<body data-page-id="…">` (ids from `RaBbLE-pages.js`) and loads
`RaBbLE-pages.js` + `RaBbLE-page-runtime.js` — the runtime auto-mounts the global
◈ page navigator (bottom-right) with the current page highlighted.

`aether.css` is the dev file (built by `build:watch`). `aether.min.css` is production-only.
Both loaders show a visible failure banner if their bundle fails to load.

## Structure

| Path | What |
|---|---|
| `index.html` | Landing page — entity stage, WM applet layout, chat input |
| `world/RaBbLE-Boot.html` | Boot sequence reference (Plymouth spec artifact) |
| `world/RaBbLE-Chat.html` | Chat surface |
| `world/RaBbLE-Collective.html` | Community surface — explain the Collective and provide a join path |
| `world/RaBbLE-OS.html` | RaBbLE-OS bootstrap and expansion cards |
| `world/RaBbLE-NeBuLA-Demo.html` | NeBuLA Canvas2D + Three.js demo |
| `world/css/RaBbLE-theme.css` | Aether alias bridge — short names with fallbacks |
| `world/css/RaBbLE-landing.css` | Landing page layout (1400+ lines, layout only) |
| `world/css/RaBbLE-wm.css` | WM grid structure (layout only — visual rules in Aether) |
| `world/css/RaBbLE-demo.css` | NeBuLA demo layout |
| `world/js/RaBbLE-aether.js` | Aether loader + monitor — injects CSS bundle, shows failure banner |
| `world/js/RaBbLE-NeBuLA.js` | NeBuLA loader + monitor — injects JS bundle, shows failure banner |
| `world/js/RaBbLE-landing.js` | Alpine.js landing component |
| `world/js/RaBbLE-page-runtime.js` | Shared page runtime helpers — background, clipboard, entity mini mounting |
| `world/js/RaBbLE-wm.js` | WM keyboard shortcuts and layout presets |
| `world/js/RaBbLE-bg.js` | Ambient background (particles, grid, cursor) |

## Active Tracks

| Track | Status |
|---|---|
| Landing page with WM applet layout | **Done** |
| Aether CDN integration (all pages) | **Done** — loader injects `aether.css`; failure banner visible |
| NeBuLA CDN integration | **Done** — loader injects `nebula.iife.js`; failure banner visible |
| `<rabble-entity>` owned by NeBuLA | **Done** — element defined in bundle; `RaBbLE-entity.js` deleted |
| World as scaffold (no embedded visual logic) | **Done** — CRT overlays, floor, horizon all in Aether |
| NeBuLA Canvas2D entity on landing | **Done** |
| RaBbLE-Collective community page | **Done** — visitor orientation + join path on its own page |
| Shared page runtime for World pages | **Done** — start background, copy CTA text, mount NeBuLA minis |
| Global ◈ page nav on every surface | **Done** — `RaBbLE-chrome.css` + runtime auto-mount via `data-page-id` |
| Docs page on standard stack | **Done** — rebuilt: Aether loader, theme vars, current content (was rogue React-prototype docs) |
| NeBuLA demo page (Layer 1 + Layer 2) | **Done** |
| Fonts moved to Aether bundle (all pages) | **Done** — no Google Fonts links in HTML; Aether bundle owns Orbitron, Exo 2, Share Tech Mono |
| `cast-cdn.sh` spell — build + stage + wrangler deploy | **Done** — `RaBbLE-Grimoire/spells/cast-cdn.sh`; Cloudflare Git integration disconnected |
| Episode 2 landing — The Liminal (`world/RaBbLE-Liminal.html`) | In progress — branch `ep2/liminal-world`: orbit engine, transmissions feed, entity state machine |
| Chat surface wired to sCoRE intent endpoint | Pending (Episode 1 dependency) |
| Production deploy | Pending — `joinrabble.world` still on pre-refactor code |
| Audit `RaBbLE-chat.css` / `RaBbLE-OS.css` for visual rules to move to Aether | Pending |
| Refactor World/Aether/NeBuLA modular boundaries | In progress — base layer + page runtime + shared NeBuLA UID helper landed |

## Reading Order for a New Session

1. This file — you are here
2. `AGENT.md` — rules and workspace map
3. `../RaBbLE-Grimoire/RaBbLE-World/RaBbLE-World-Architecture.md` — layer stack, CSS rules
4. `world/css/RaBbLE-theme.css` — alias bridge (read before touching any CSS)
5. For Collective context → `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Collective.md`

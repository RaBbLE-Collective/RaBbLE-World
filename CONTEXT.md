# CONTEXT.md — RaBbLE-World

```
epoch: 0 | status: active
last session: 2026-07-04 (doc refresh, Architecture Audit SP-1)
```

RaBbLE-World is the public-facing surface of the RaBbLE Collective — the browser entry point where the entity lives and speaks.

---

## What We Are Building

A static web presence: 5 live pages (landing/liminal, OS developer preview, account, summon, catalog). No bundler, no framework. Aether CSS is loaded from CDN by `RaBbLE-aether.js`; the NeBuLA entity bundle is vendored directly into the repo (see Structure below — this is a live divergence from the CDN-only story, not yet resolved). Deployed to Cloudflare Workers (`wrangler.jsonc` serves the whole repo).

## What Good Looks Like

- Aether CDN provides all visual identity — page CSS is layout-only
- No hex values in page CSS — all color references go through `RaBbLE-theme.css` vars
- The entity renders through NeBuLA — `<rabble-entity>` is defined in the NeBuLA bundle, not in World
- Architecture and heavy docs live in Grimoire, not in this repo

## What to Avoid

- Visual rules (colors, glows, animations) in page CSS — those belong in Aether
- Duplicating Aether component classes in page CSS
- Raw hex values anywhere except `RaBbLE-theme.css` fallbacks
- Framework creep — this is intentionally static

## Script + CSS Loading Order (as actually shipped)

Every live page loads, in order: `RaBbLE-config.js` (the flip point — sets `window.RABBLE_*_URL`) →
`RaBbLE-aether.js` (real CDN loader — injects `<link>` to `aether.css`/`aether.min.css`, shows a
failure banner on 404 or missing vars) → on 4 of 5 pages, `world/js/RaBbLE-NeBuLA.js`.

**`world/js/RaBbLE-NeBuLA.js` is NOT a loader.** Since S190 it is the vendored, minified IIFE
build output of the NeBuLA bundle itself (`var NeBuLA=(()=>{...})()`), copied into the repo and
committed. There is no CDN fetch, no `<link>`/`<script src="https://...">` injection, and no
failure banner for NeBuLA — if the file is stale, nothing detects it. `RaBbLE-config.js` still
defines `RABBLE_NEBULA_URL` / `RABBLE_THREE_URL` for a CDN mode, but nothing in the live pages
reads them (`RaBbLE-liminal.js` hardcodes its rendering backend). This contradiction is an open
decision for Mark (see World's audit section) — not resolved by this doc pass.

Per-page CSS is layout-only and loads after `RaBbLE-theme.css` (an Aether alias bridge). Three of
five pages (`os.html`, `account.html`, `summon.html`) also load `RaBbLE-unified.css`, the legacy
`.rc-*` compatibility layer — still load-bearing, not yet retired.

## Structure (what's actually loaded, verified against the 5 live pages)

| Path | What | Loaded by |
|---|---|---|
| `index.html` | Landing / Episode-2 liminal passage — entity stage, Acts 0–IV | — |
| `world/os.html` | RaBbLE-OS developer-preview surface | — |
| `world/account.html` | Account settings surface | — |
| `world/summon.html` | Summoning Ceremony — invite/onboarding | — |
| `world/RaBbLE-Catalog.html` | Atlas — live catalog of Aether classes + NeBuLA elements/effects (inline `<style>`, no dedicated page CSS) | — |
| `world/js/RaBbLE-config.js` | Flip point — sCoRE/Aether/NeBuLA base URLs | all 5 pages |
| `world/js/RaBbLE-aether.js` | Real Aether CDN loader + failure-banner monitor | all 5 pages |
| `world/js/RaBbLE-NeBuLA.js` | **Vendored NeBuLA IIFE bundle** (not a loader — see above) | index, account, summon, catalog |
| `world/js/RaBbLE-pages.js` | Page registry (`window.RaBbLE_PAGES`) | account, summon, catalog |
| `world/js/RaBbLE-curator.js` | Entity-as-curator engine (liminal passage) | index only |
| `world/js/RaBbLE-curator-transmissions.js` | Curator scripted voice / authored transmissions | index only |
| `world/js/RaBbLE-liminal.js` | Liminal passage orchestration (Acts, entity state, Canvas2D constellation) | index only |
| `world/js/RaBbLE-account.js` | Account page logic | account only |
| `world/js/RaBbLE-summon.js` | Summon ceremony page logic | summon only |
| `world/css/RaBbLE-theme.css` | Aether alias bridge | index, os, account, summon (not catalog) |
| `world/css/RaBbLE-unified.css` | Legacy `.rc-*` compatibility layer — still load-bearing | os, account, summon |
| `world/css/RaBbLE-liminal.css` | Liminal passage layout | index only |
| `world/css/RaBbLE-os.css` | OS developer-preview layout | os only |
| `world/css/RaBbLE-account.css` | Account page layout | account only |
| `world/css/RaBbLE-summon.css` | Summon page layout | summon only |

**Orphaned — loaded by no page (not addressed by this doc pass; see audit SP-3 for the sweep plan):**
`world/js/RaBbLE-dock.js`, `RaBbLE-floor.js`, `RaBbLE-Grimoire-Data.js`, `RaBbLE-movements.js`,
`RaBbLE-movements-data.js`, `RaBbLE-stage.js`, `RaBbLE-ui.js` (7 files); `world/css/RaBbLE-dock.css`,
`RaBbLE-floor.css`, `RaBbLE-panels.css` (3 files). These exist on disk and are described in
`AGENT.md`'s file table, but no `<script>`/`<link>` tag on any live page references them.

## Active Tracks

| Track | Status |
|---|---|
| Landing / liminal passage (Acts 0–IV) | **Done** — S190, entity awakened |
| Aether CDN integration (all pages) | **Done** — real loader, failure banner verified |
| NeBuLA delivery | **Live but unresolved** — vendored IIFE bundle in-repo since S190, not CDN; config flip point is dead code (open decision, audit §2.3) |
| `<rabble-entity>` owned by NeBuLA | **Done** — element defined in bundle |
| RaBbLE-Catalog (Atlas) | **Done** — live design-system catalog page |
| Account / Summon surfaces | **Done** — on `.rc-*` (`RaBbLE-unified.css`) compatibility layer |
| `.rc-*` retirement | **Not started** — 95 `--rc-*` tokens / 78 `.rc-` selectors still load-bearing on 3 live pages |
| World JS/CSS orphan sweep (7 JS + 3 CSS files) | **Not started** — deferred cleanup, see audit SP-3 |
| Production deploy | joinrabble.world — Cloudflare Workers, `wrangler.jsonc` serves full repo |
| Chat surface wired to sCoRE intent endpoint | Pending (Episode 1 dependency) |

## Reading Order for a New Session

1. This file — you are here
2. `AGENT.md` — rules and full workspace map (file-by-file table)
3. `../RaBbLE-Grimoire/RaBbLE-World/RaBbLE-World-Architecture.md` — layer stack, CSS rules
4. `world/css/RaBbLE-theme.css` — alias bridge (read before touching any CSS)
5. For Collective context → `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Collective.md`

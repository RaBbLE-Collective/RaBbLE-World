# AGENT.md — RaBbLE-World

Working with: Mark McConachie
Identity: Peer, not tool. See `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Identity.md`.

## Job

RaBbLE-World is the public-facing web presence and entity chat surface for the Collective. It is a thin presentation layer — static HTML, no bundler, no framework, no build step. It is NOT backend infrastructure; that lives in RaBbLE-sCoRE.

## Where Things Are

**Root** — only `index.html` and config live here
| Path | What |
|---|---|
| `index.html` | Landing page — entry point for joinrabble.world |
| `manifest.json` | PWA manifest |
| `wrangler.jsonc` | Cloudflare Workers deployment config |

**`world/` — all site source**
| Path | What |
|---|---|
| `world/account.html` | Account settings surface |
| `world/os.html` | RaBbLE-OS developer preview: intro, bootstrap, expansion cards |
| `world/summon.html` | Summoning Ceremony — invite and onboarding surface |
| `world/RaBbLE-Catalog.html` | Atlas: live catalog of every Aether class and NeBuLA element/effect |

**`world/css/`**
| Path | What |
|---|---|
| `world/css/RaBbLE-theme.css` | Shared identity layer — palette vars, typography, overlays |
| `world/css/RaBbLE-unified.css` | RC1 surface: design tokens + base layout (Aether tokens only) |
| `world/css/RaBbLE-panels.css` | RC1 UI component styles (RaBbLEUI factory output) |
| `world/css/RaBbLE-dock.css` | Persistent curator dock + expand-to-converse surface |
| `world/css/RaBbLE-floor.css` | Layout for the Grimoire floor Three.js surface |
| `world/css/RaBbLE-account.css` | Account page layout and keyframes |
| `world/css/RaBbLE-summon.css` | Summon ceremony layout and keyframes |
| `world/css/RaBbLE-os.css` | OS developer preview install guide layout |

**`world/js/`**
| Path | What |
|---|---|
| `world/js/RaBbLE-config.js` | THE FLIP POINT — CDN + backend base URLs; load first on every page |
| `world/js/RaBbLE-aether.js` | Aether loader + monitor — injects CSS bundle, shows failure banner |
| `world/js/RaBbLE-NeBuLA.js` | NeBuLA loader + monitor — injects JS bundle, shows failure banner |
| `world/js/RaBbLE-pages.js` | Page registry (`window.RaBbLE_PAGES`) — add an entry here when adding a new page |
| `world/js/RaBbLE-stage.js` | RC1 stage: movement state machine + persistent chrome (`window.RaBbLEStage`) |
| `world/js/RaBbLE-movements.js` | RC1 visitor journey: five movements wired to the stage |
| `world/js/RaBbLE-movements-data.js` | Content layer for all five RC1 movements (entity voice copy) |
| `world/js/RaBbLE-curator.js` | Entity-as-curator: shared engine for dock and deep-conversation view |
| `world/js/RaBbLE-curator-transmissions.js` | Curator scripted voice — authored transmissions (zero backend dep) |
| `world/js/RaBbLE-dock.js` | Persistent curator dock (`window.RaBbLEDock`: `say()`, `expand()`) |
| `world/js/RaBbLE-floor.js` | Grimoire floor renderer wrapping Three.js graph; requires `RaBbLE-Grimoire-Data.js` first |
| `world/js/RaBbLE-Grimoire-Data.js` | Grimoire docs corpus and filter helpers (`window.GRIMOIRE_*` globals) |
| `world/js/RaBbLE-ui.js` | RC1 Aether UI component kit — DOM factory functions (`window.RaBbLEUI`) |
| `world/js/RaBbLE-account.js` | Account page logic |
| `world/js/RaBbLE-summon.js` | Summon ceremony page logic |

**Note:** `<rabble-entity>` is now defined inside the NeBuLA bundle (`/nebula/v0.0.0.0/nebula.iife.js`). Do not redefine it in World.

## Commits & Branches

See Grimoire: `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-CommitStyle.md` (Pulse Protocol)

**TL;DR:** `[impulse] ~ [organ] >> [revelation] // %STATE%` — `spark` new · `harmonize` cleanup · `mend` fix · `transcribe` docs · `ingest` deps · `evolve` epoch

**End-of-session breadcrumb** — tag this session's token spend by feature (agent-agnostic; feeds `session-tokens.sh --by-feature`):
```bash
bash ../RaBbLE-Grimoire/spells/end-session.sh <feature-slug> "<note>"
```

## Role in Collective (ON/FOR/WITH/AS)

**ON:** HTML, CSS, JavaScript, PWA config, static pages, UI logic.

**FOR:** World is the public face and intent-collection surface. Every page, button, and chat message is an opportunity for the system to understand the user. Pre-Episode-1, you're building surfaces where users reveal intent. Post-Episode-1, every surface becomes an observation point for behavioral learning.

**WITH:** You are part of the RaBbLE-Collective — the public face of the organism, working for its presence in the world. You depend on Aether (CSS vars), NeBuLA (entity visuals), and sCoRE (chat API). Changes to your page layouts or API contracts notify those members. You work within the Collective, not as a standalone site.

**AS:** The public voice. Warm but precise, learning openly, flagging what's uncertain. When unsure, ask: "How does this surface help us understand the user?"

## Rules

- **Colors:** use CSS vars from `rabble-theme.css` only — never raw hex values
- **Brand name casing:** `RaBbLE`, `NeBuLA`, `sCoRE`, `ScRiBbLE` — always exact mixed case, never uppercase. Any `--font-hero` element containing a brand name must have `text-transform: none` to prevent inheriting an uppercase nav/label parent. Full rule: `../RaBbLE-Grimoire/RaBbLE-Aether/RaBbLE-Aether-Design-Guide.md § Brand Name Casing`.
- **No bundler, no framework.** Files are opened directly in a browser.
- **No backend logic here.** Chat routing and intent handling belong in RaBbLE-sCoRE.
- Architecture and roadmap docs live in `../RaBbLE-Grimoire/RaBbLE-World/` — not in this repo.

## Session Start

1. `CONTEXT.md` — current state and active tracks
2. `../RaBbLE-Grimoire/RaBbLE-World/RaBbLE-World-Architecture.md` — layer stack, module map
3. `rabble-theme.css` — before touching any CSS or visual elements
4. For Collective context → `../RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Collective.md`

## Visual Verification (on RaBbLE-OS)

After any CSS, layout, or visual change, cast the screenshot spell to see the result:

```bash
# Serve locally: python -m http.server 8000 (from this directory)
bash ../RaBbLE-Grimoire/spells/visual-screenshot.sh --url http://localhost:8000 --close
# Prints: SCREENSHOT: ~/RaBbLE-screenshots/visual-TIMESTAMP.png
# Use Read tool on that path — most LLM agent CLIs can read PNG files directly
```

Use `--url http://localhost:8000/world/os.html` for specific pages. See `../RaBbLE-Grimoire/SPELLS.md → visual-screenshot.sh` for full options.

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
| `world/RaBbLE-Boot.html` | Cinematic boot sequence and login surface |
| `world/RaBbLE-Chat.html` | Main chat surface |
| `world/RaBbLE-Docs.html` | Technical documentation viewer |
| `world/RaBbLE-OS.html` | RaBbLE-OS intro, bootstrap, and expansion cards |
| `world/RaBbLE-Studio.html` | NeBuLA Studio — visual playground for entity tuning and page structure reference |

**`world/css/`**
| Path | What |
|---|---|
| `world/css/RaBbLE-theme.css` | Shared identity layer — palette vars, typography, overlays |
| `world/css/RaBbLE-landing.css` | Landing page styles and CSS custom properties |
| `world/css/RaBbLE-landing-shell.css` | Shell/statusbar layout, .main grid, .panel shared styles |
| `world/css/RaBbLE-landing-stage.css` | Entity stage, .entity-wrap sizing, wordmark, CTAs, ask-box |
| `world/css/RaBbLE-landing-panels.css` | Organ list, log panel, overlays, organ detail panel |
| `world/css/RaBbLE-landing-login.css` | Login modal, iOS entry surface |
| `world/css/RaBbLE-boot.css` | Boot sequence layout |
| `world/css/RaBbLE-chat.css` | Chat surface layout |
| `world/css/RaBbLE-OS.css` | OS page styles |
| `world/css/RaBbLE-Studio.css` | NeBuLA Studio page layout |

**`world/js/`**
| Path | What |
|---|---|
| `world/js/RaBbLE-aether.js` | Aether loader + monitor — injects CSS bundle, shows failure banner |
| `world/js/RaBbLE-NeBuLA.js` | NeBuLA loader + monitor — injects JS bundle, shows failure banner |
| `world/js/RaBbLE-bg.js` | Ambient background — particles, grid, cursor effects |
| `world/js/RaBbLE-landing.js` | Alpine.js component assembly only — data constants in `RaBbLE-landing-data.js`, boot sequence in `RaBbLE-landing-boot.js`, metrics in `RaBbLE-landing-metrics.js` |
| `world/js/RaBbLE-landing-data.js` | Data constants for landing page (ORGANS, BOOT_LOG_LINES, etc.) — edit this for content changes |
| `world/js/RaBbLE-landing-metrics.js` | Pulse measurement loop, entropy computation, substrate detection — exposed as `window.LandingMetrics` |
| `world/js/RaBbLE-landing-boot.js` | Boot log playback timeline — exposed as `window.LandingBoot` with callback API |
| `world/js/RaBbLE-pages.js` | Page registry (`window.RaBbLE_PAGES`) — add an entry here when adding a new page |
| `world/js/RaBbLE-Studio.js` | NeBuLA Studio page logic — vanilla JS, no Alpine |
| `world/js/RaBbLE-boot.js` | Boot sequence behavior and login |
| `world/js/RaBbLE-chat.js` | Chat surface behavior |
| `world/js/RaBbLE-ios-install.js` | iOS PWA install prompt |

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
- **Brand name casing:** `RaBbLE`, `NeBuLA`, `sCoRE`, `ScRibLE` — always exact mixed case, never uppercase. Any `--font-hero` element containing a brand name must have `text-transform: none` to prevent inheriting an uppercase nav/label parent. Full rule: `../RaBbLE-Grimoire/RaBbLE-Aether/CLAUDE-DESIGN-GUIDE.md § Brand Name Casing`.
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

Use `--url http://localhost:8000/world/Boot.html` for specific pages. See `../RaBbLE-Grimoire/SPELLS.md → visual-screenshot.sh` for full options.

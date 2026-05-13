# AGENT.md — RaBbLE-World

Working with: Mark McConachie
Identity: Peer, not tool. See `../RaBbLE-Grimoire/common/RaBbLE-Identity.md`.

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

**`world/css/`**
| Path | What |
|---|---|
| `world/css/RaBbLE-theme.css` | Shared identity layer — palette vars, typography, overlays |
| `world/css/RaBbLE-landing.css` | Landing page styles and CSS custom properties |
| `world/css/RaBbLE-boot.css` | Boot sequence layout |
| `world/css/RaBbLE-chat.css` | Chat surface layout |
| `world/css/RaBbLE-OS.css` | OS page styles |

**`world/js/`**
| Path | What |
|---|---|
| `world/js/RaBbLE-entity.js` | `<rabble-entity>` custom element — shared across all pages |
| `world/js/RaBbLE-bg.js` | Ambient background — particles, grid, cursor effects |
| `world/js/RaBbLE-landing.js` | Alpine.js component for landing (wakeup sequence, boot, OS nav) |
| `world/js/RaBbLE-boot.js` | Boot sequence behavior and login |
| `world/js/RaBbLE-chat.js` | Chat surface behavior |
| `world/js/RaBbLE-ios-install.js` | iOS PWA install prompt |

## Pulse Protocol — Commits

```
[impulse] ~ [organ] >> [revelation] // %SYSTEM_STATE%
```
`spark` new · `harmonize` cleanup · `mend` fix · `transcribe` docs · `ingest` deps · `evolve` epoch
Full spec: `../RaBbLE-Grimoire/common/RaBbLE-CommitStyle.md`
**Branch rule:** Work on a named branch. Commit per session. `main` only receives complete, tagged episodes.

## Rules

- **Colors:** use CSS vars from `rabble-theme.css` only — never raw hex values
- **No bundler, no framework.** Files are opened directly in a browser.
- **No backend logic here.** Chat routing and intent handling belong in RaBbLE-sCoRE.
- Architecture and roadmap docs live in `../RaBbLE-Grimoire/RaBbLE-World/` — not in this repo.

## Session Start

1. `CONTEXT.md` — current state and active tracks
2. `../RaBbLE-Grimoire/RaBbLE-World/RaBbLE-World-Architecture.md` — layer stack, module map
3. `rabble-theme.css` — before touching any CSS or visual elements
4. For Collective context → `../RaBbLE-Grimoire/common/RaBbLE-Collective.md`

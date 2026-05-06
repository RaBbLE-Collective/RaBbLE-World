# CONTEXT.md — RaBbLE-World

```
epoch: 0 | status: active
```

RaBbLE-World is the public-facing surface of the RaBbLE Collective — the browser entry point where the entity lives and speaks.

---

## What We Are Building

A minimal static web presence: a cinematic boot sequence, a chat interface for interacting with the RaBbLE entity, and a documentation viewer. No bundler, no framework. Files open directly in a browser or serve from `python3 -m http.server`.

## What Good Looks Like

- Any page opens without a build step or server dependency
- The entity expresses itself visually through `rabble-entity.js` on every surface
- No hex color values in page CSS — all palette references go through `rabble-theme.css` vars
- Architecture and heavy docs live in Grimoire, not in this repo
- The chat surface posts intents to RaBbLE-sCoRE — it is not the backend

## What to Avoid

- Framework creep (React, Vue, bundlers — this is intentionally static)
- Duplicating documentation that belongs in `../RaBbLE-Grimoire/RaBbLE-World/`
- Business logic or routing in the frontend — that belongs in RaBbLE-sCoRE
- Raw hex values outside of `rabble-theme.css`
- Adding a build step

## Structure

| Path | What |
|---|---|
| `RaBbLE-Boot.html` | Entry point — boot sequence and login |
| `RaBbLE.html` | Main chat surface |
| `RaBbLE-Docs.html` | Documentation viewer |
| `index.html` | Redirect to `RaBbLE-Boot.html` |
| `rabble-theme.css` | Shared identity layer — must load first |
| `rabble-entity.js` | Entity canvas custom element |
| `rabble-bg.js` | Ambient background canvas layer |
| `chat.js` / `chat.css` | Chat behavior and layout |
| `boot.js` / `boot.css` | Boot sequence behavior and layout |

## Active Tracks

| Track | Status |
|---|---|
| Static pages live at joinrabble.world | Done |
| Chat surface wired to sCoRE intent endpoint | Pending (Episode 1 dependency) |
| NeBuLA entity renderer integration | Pending (NeBuLA rebuild dependency) |

## Reading Order for a New Session

1. This file — you are here
2. `AGENT.md` — rules and workspace map
3. `../RaBbLE-Grimoire/RaBbLE-World/RaBbLE-World-Architecture.md` — layer stack, module map
4. `rabble-theme.css` — if touching any visual element
5. For Collective context → `../RaBbLE-Grimoire/common/RaBbLE-Collective.md`

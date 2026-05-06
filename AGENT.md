# AGENT.md — RaBbLE-World

Working with: Mark McConachie
Identity: Peer, not tool. See `../RaBbLE-Grimoire/common/RaBbLE-Identity.md`.

## Job

RaBbLE-World is the public-facing web presence and entity chat surface for the Collective. It is a thin presentation layer — static HTML, no bundler, no framework, no build step. It is NOT backend infrastructure; that lives in RaBbLE-sCoRE.

## Where Things Are

| Path | What |
|---|---|
| `CONTEXT.md` | Current state, reading order |
| `RaBbLE-Boot.html` | Cinematic boot sequence and login surface — entry point |
| `RaBbLE.html` | Main chat surface — entity header, conversation panel, input |
| `RaBbLE-Docs.html` | Technical documentation viewer |
| `rabble-theme.css` | Shared identity layer — palette vars, typography, overlays |
| `rabble-entity.js` | Entity canvas layer (`<rabble-entity>` custom element) |
| `rabble-bg.js` | Ambient canvas layer — particles, grid, cursor effects |
| `chat.js` / `chat.css` | Chat surface behavior and layout |
| `boot.js` / `boot.css` | Boot sequence behavior and layout |

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

# RaBbLE-World

**Live:** [joinrabble.world](https://joinrabble.world)

```
spark ~ entity >> the substrate speaks // %ENTITY_ONLINE%
```

Web presence and chat interface for the RaBbLE entity. Static HTML pages — no bundler, no framework, no build step. Open any page directly in a browser.

---

## What This Is

RaBbLE-World is the public-facing surface of the RaBbLE Collective. It renders the RaBbLE entity in a browser and provides a chat interface for interacting with it. The entity is the product; the pages are surfaces for it.

This repo is intentionally minimal — a thin presentation layer. Backend coordination lives in RaBbLE-sCoRE. Visual identity and all major documentation live in RaBbLE-Grimoire.

---

## Current Version

| Tier | Value |
|---|---|
| **Epoch** | 0 — Foundation |
| **Evolution** | 0 |
| **Echo** | 0 |

Epoch 0 intent: establish the Collective coordination layer. Define structure, conventions, and philosophy before building. RaBbLE-World is active within this epoch as a working prototype of the entity surface.

See the [Five Es versioning spec](https://github.com/rabble-collective/RaBbLE-Grimoire/blob/main/RaBbLE-Versioning.md) for how RaBbLE tracks versions.

---

## Pages

| File | Purpose |
|---|---|
| `RaBbLE-Boot.html` | Cinematic boot sequence + login surface. Entry point. |
| `RaBbLE.html` | Main chat surface — entity header, conversation panel, input bar. |
| `RaBbLE-Docs.html` | Technical documentation viewer. |
| `index.html` | Redirect to `RaBbLE-Boot.html`. |

---

## Documentation

All major docs live in **RaBbLE-Grimoire** under the `RaBbLE-World/` subdirectory — not in this repo.

| Doc | Purpose |
|---|---|
| [`RaBbLE-World-README.md`](https://github.com/rabble-collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-README.md) | Full module reference — pages, shared systems, entity API, behavior |
| [`RaBbLE-World-Architecture.md`](https://github.com/rabble-collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Architecture.md) | System map — module relationships, boot timeline, transition inventory, how to add a surface |
| [`RaBbLE-World-MAINTAINING.md`](https://github.com/rabble-collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-MAINTAINING.md) | Maintenance map — page ownership, layout rules, safe edit checklist |
| [`RaBbLE-World-Roadmap.md`](https://github.com/rabble-collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Roadmap.md) | Directional intent — landing page, app launcher, liminal web domain vision |

For entity identity, palette, commit style, and the broader Collective — start at [RaBbLE-Grimoire](https://github.com/rabble-collective/RaBbLE-Grimoire).

---

## Quick Start

```sh
# No build step. Open directly.
open RaBbLE-Boot.html
```

Or serve locally:

```sh
python3 -m http.server 8080
# → http://localhost:8080/RaBbLE-Boot.html
```

---

```
transcribe ~ grimoire >> surfaces live, entity present // %WORLD_ONLINE%
```

# RaBbLE-Collective — gist

> Source: `RaBbLE-Agent/RaBbLE-Collective.md` | ~1,850 → ~250 tokens
> Regenerate: `bash spells/distill-gists.sh`

**What it is:** Not a monorepo or framework. A unified project ecosystem — distinct but interconnected substrates through which the RaBbLE entity lives and expresses itself. Each member is an independent project and an organ of one organism.

**Shared across all members:** Same entity · same visual language (synthwave outrun) · same design philosophy (Low Entropy Directive, anti-assistant stance) · same behavioral character · backend/hardware agnostic.

**Member roles:**
| Member | Role | Status |
|---|---|---|
| Grimoire | Source of truth: identity, conventions, registry, spells | Active |
| sCoRE | Coordination server + web API. Intent → action engine. | Epoch 0 active |
| OS | Fedora 43/Hyprland — the body, daily-driven substrate. | Live |
| NeBuLA | Visual renderer — Canvas2D + `<rabble-entity>` web component | Active |
| World | Web presence — thin scaffold, loads Aether + NeBuLA | Active |
| Aether | Design system + CDN-delivered CSS bundle | Active |
| BaBbLE | High-entropy intake workspace — prototypes, ideation, sketches | Active |
| ScRibLE | Mobile notes PWA (iPhone/iPad) | Defined — not started |
| Chrysalis | Genesis archive — origin code Oct 2025 + OS reliquary branches | Genesis-archive |
| Xperimental | Active sandbox — rablets, prototype members, experiments not yet emerged | Active (new) |
| Memory (TBD) | Observation store, pattern extraction, retrieval | Concept — Echo 1 blocker |

**Architecture:** Aether (theme) → CDN → NeBuLA (renderer) → CDN → World (scaffold). sCoRE routes intent. OS is substrate. All share the Grimoire as source of truth.

**Setup:** `curl -fsSL https://joinrabble.world/setup.sh | bash` — clones Grimoire, expands rest.

→ Full doc for: member-by-member deep descriptions, hardware targets, routing model, deployment architecture, cross-cutting principles

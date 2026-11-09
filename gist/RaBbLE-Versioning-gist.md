# RaBbLE-Versioning Gist

**Source:** `/RaBbLE-Grimoire/RaBbLE-Versioning.md`  
**Token estimate:** ~1,771 tokens  
**Regenerate:** `bash spells/distill-gists.sh`

---

RaBbLE uses evolutionary, not semantic, versioning. The **Five Es** mark resonance thresholds named *after* they're crossed, not targets set in advance.

## The Five Es (smallest to largest)

| Tier | Meaning | Analogy |
|---|---|---|
| **Event** | Single commit | A note |
| **Episode** | Coherent arc with start/end | A jam session |
| **Echo** | Stable, reproducible state — tagged in git | A recording |
| **Evolution** | Architectural shift or identity refinement | A new sound |
| **Epoch** | Broadest era — complete vertical slice functional | An album |

Movement between tiers is **vibe-based**. No formula. Rubric: *does it feel crossed?*

## Version String Format

```
v{Epoch}.{Evolution}.{Echo}.{Episode}.{Event}
```

Drop trailing tiers when unknown. Examples: `v0` (Epoch only), `v0.0.2` (Echo level), `v0.0.0.1.23` (full precision).

## Episode Synchronization (Lockstep Model)

**Episodes are Collective-wide synchronization points.** All members air simultaneously with guaranteed protocol/API stability throughout that Episode. Breaking changes happen at Echo boundaries.

**Current state (pre-Episode-1):**
```
Epoch 0 — Foundation
  Evolution 0 — Scaffold
    Echo 0 — Establishing
      Episode 1 — Genesis (pending, not yet aired)
      
Version: v0.0.0.0
```

When Episode 1 airs, all members jump to v0.0.0.1 simultaneously.

## Impulse Vocabulary

| Verb | Tier |
|---|---|
| `spark` | Event — something started |
| `ingest` | Event — something added |
| `mend` | Event — something fixed |
| `harmonize` | Event/Episode — brought coherence |
| `transcribe` | Event — documented |
| `evolve` | Evolution — epoch landed |
| `crystallize` | Echo — stable state named |

---

→ Full doc for: Detailed Episode/Echo/Evolution definitions, boundary criteria, post-Episode-1 cadence roadmap, authoritative Collective position registry

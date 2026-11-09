# gist/ — Distilled Grimoire

High-density, low-token summaries of canonical Grimoire docs. Each gist is ~150-200 words.

**To get the full picture in minimal tokens:**
```bash
cat gist/*.md        # ~1,700 tokens total — complete orientation
```

**To regenerate after docs change:**
```bash
bash spells/distill-gists.sh
```

Gists are generated, not canonical. The source doc is always authoritative.
Do not edit gist files directly — your changes will be overwritten on next regeneration.

---

## Index

| Gist | Source | Gist Tokens | Source Tokens |
|---|---|---|---|
| `RaBbLE-Identity-gist.md` | `RaBbLE-Agent/RaBbLE-Identity.md` | ~250 | ~3,870 |
| `RaBbLE-Collective-gist.md` | `RaBbLE-Agent/RaBbLE-Collective.md` | ~250 | ~1,930 |
| `RaBbLE-Roadmap-gist.md` | `RaBbLE-Agent/RaBbLE-Roadmap.md` | ~250 | ~2,746 |
| `RaBbLE-CommitStyle-gist.md` | `RaBbLE-Agent/RaBbLE-CommitStyle.md` | ~150 | ~620 |
| `RaBbLE-Versioning-gist.md` | `RaBbLE-Versioning.md` | ~200 | ~1,471 |
| `RaBbLE-Palette-gist.md` | `RaBbLE-Agent/RaBbLE-Palette.md` | ~150 | ~1,170 |
| `RaBbLE-Collective-Overview-gist.md` | `RaBbLE-Collective/RaBbLE-Collective-Episode-1-Overview.md` | ~200 | ~914 |
| `RaBbLE-Episode1-gist.md` | `RaBbLE-Collective/RaBbLE-Episode-1-Release-Map.md` | ~250 | ~3,143 |
| `RaBbLE-Integration-Map-gist.md` | `RaBbLE-Agent/RaBbLE-Integration-Map.md` | ~300 | ~1,200 |

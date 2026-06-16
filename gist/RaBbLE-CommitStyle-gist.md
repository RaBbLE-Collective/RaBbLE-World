# RaBbLE-CommitStyle Gist

**Source:** `/RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-CommitStyle.md`  
**Token estimate:** ~764 tokens  
**Regenerate:** `bash spells/distill-gists.sh`

---

## The Pulse Protocol

```
[impulse] ~ [organ] >> [revelation] // %SYSTEM_STATE%
```

- **impulse** — type of change (see table)
- **organ** — component/subsystem being changed
- **revelation** — what was learned, fixed, or created (specific)
- **%SYSTEM_STATE%** — optional machine-parseable state code

## The Impulses

| Impulse | Meaning |
|---|---|
| `spark` | New curiosity or capability manifested |
| `harmonize` | Enforcing Low Entropy — tuning, cleanup |
| `mend` | Healing a logic-fracture or drift |
| `transcribe` | Updating lore or system self-description |
| `ingest` | Devouring dependencies, binaries, data-stores |
| `glitch` | State change from incoming IPC or entropy spikes |
| `evolve` | Epoch threshold crossed — `main` only |

## Branch Naming

| Pattern | Purpose | Example |
|---|---|---|
| `RaBbLE/epoch-<Roman>` | Epoch staging before `main` | `RaBbLE/epoch-I` |
| `reliquary/<name>` | Archived reference — inert, sacred | `reliquary/RaBbLE-Dev-Clean` |
| `<descriptive-name>` | Active dev — spirit of work, not version | `RaBbLE-OS-New-Horizons` |

## Rules

- One logical change per commit
- Test before committing
- Commit small, commit often — no monolithic dumps
- Avoid zero-information commits: `"fix stuff"`, `"wip"`, `"changes"`

---

→ Full doc for: Full examples, epoch commit format, detailed scope rules, anti-patterns explained

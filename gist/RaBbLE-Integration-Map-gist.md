# RaBbLE Integration Map — gist

> Source: `RaBbLE-Agent/RaBbLE-Integration-Map.md` | ~1,200 → ~300 tokens
> Regenerate: `bash spells/distill-gists.sh`

**What it is:** The wiring diagram of the Collective — how members exchange data, assets, and intent.

**Data flow:**
```
User → World (web UI) → sCoRE (intent routing) → Claude/LLM (delegation)
                ↑                    ↑
            Aether (CSS)        OS (system state)
            NeBuLA (renderer)   Memory (future — observation store)
```

**Integration patterns:**
| Pattern | From → To | Mechanism | Status |
|---|---|---|---|
| Visual theming | Aether → World, NeBuLA | CDN CSS bundle | Live |
| Entity rendering | NeBuLA → World | CDN IIFE, `<rabble-entity>` | Live |
| Intent routing | World → sCoRE | HTTP/REST | Planned (Ep1) |
| LLM delegation | sCoRE → Claude/Groq | Subprocess or API | Planned (Ep1) |
| System observation | OS → sCoRE | Ambient state | Post-Ep1 |
| Knowledge | Grimoire → All | Filesystem + sync spell | Live |
| Pattern store | sCoRE ↔ Memory | Observation loop | Concept (Echo 1+) |

**CDN chain:** `Aether src/ → esbuild → R2 → World <link>` · `NeBuLA src/ → esbuild → R2 → World <script>`. Local dev: `dev-serve.sh` mocks CDN.

**Key boundaries:** World never imports source (CDN only) · sCoRE is the only external API caller · Grimoire never runs · OS is read-only substrate · NeBuLA owns rendering · Aether owns CSS.

→ Full doc for: dependency graph, post-Ep1 integration points, local dev workflow, boundary rationale

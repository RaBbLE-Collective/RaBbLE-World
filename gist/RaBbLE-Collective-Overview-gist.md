# RaBbLE-Collective Episode 1 Overview Gist

**Source:** `/RaBbLE-Grimoire/RaBbLE-Collective/RaBbLE-Collective-Episode-1-Overview.md`  
**Token estimate:** ~1,312 tokens  
**Regenerate:** `bash spells/distill-gists.sh`

---

## Three-Layer Architecture

### Layer 1: Aether (Design System)

**Role:** Theme + look/feel — canonical visual identity  
**Delivery:** CSS bundle via CDN (v0.0.0 pre-Episode-1)  

Dev workflow: `npm install && npm run build` → `dist/aether.min.css`  
CDN paths: `cdn/aether/v0.0.0/aether.min.css`  
**Always use `dev-serve.sh`; never run `dev-cdn.js` directly**

### Layer 2: NeBuLA (Rendering Engine)

**Role:** Flare + animations + embedded visuals — entity interaction  
**Delivery:** JavaScript (IIFE + ESM) via CDN  

API: `window.NeBuLA.createPuppet({ canvas, ... })`  
Status: Phase 1 ✅ Build complete; Phase 2–3 (Palette + Canvas2D) 🔄 in progress  
Canvas2D ships for Episode 1; Three.js deferred to Episode 2

### Layer 3: RaBbLE-World (Frontend App)

**Role:** Orchestration — pulls Aether + NeBuLA into deployable pages  
**Delivery:** Static HTML + CDN-loaded CSS/JS (no build step)  

Pattern: New pages = ~70% HTML (Aether classes) + ~30% logic  
Zero CSS/JS duplication — everything reuses Aether + NeBuLA

## Easy Page Template

```html
<link rel="stylesheet" href="https://cdn.joinrabble.world/aether/v0.0.0/aether.min.css">
<script src="https://cdn.joinrabble.world/nebula/v0.0.0/nebula.iife.js"></script>
<!-- Use Aether classes + window.NeBuLA API -->
```

## Versioning & CDN Deployment

All three layers tag **v0.0.0.1 simultaneously** when Episode 1 airs (lockstep).

Pre-Episode-1: v0.0.0 across all members  
Post-Episode-1: v0.0.0.1 (Episode increment)  
Echo boundaries introduce breaking changes with migration guides

## Pre-sCoRE (No Backend Yet)

Pages use mock JSON/localStorage for state. When sCoRE API ready: wire entity state to responses.

---

→ Full doc for: Implementation priority table, CDN deployment workflow, per-layer doc index, phase breakdown

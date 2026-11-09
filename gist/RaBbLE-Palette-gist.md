# RaBbLE-Palette Gist

**Source:** `/RaBbLE-Grimoire/RaBbLE-Agent/RaBbLE-Palette.md`  
**Token estimate:** ~1,673 tokens  
**Regenerate:** `bash spells/distill-gists.sh`

---

**Single source of truth.** Change values here first, propagate everywhere second.

## Design Philosophy

**Synthwave outrun aesthetic:** Void-dark backgrounds + saturated neons + bright off-white text. Hierarchy via luminosity. No pastels, earth tones, or grey-on-grey.

## Core Neons (Primary Identity)

| Role | Hex | Description |
|---|---|---|
| **Hot Magenta** | `#ff2d78` | Primary neon — borders, highlights, active elements, prompt accent |
| **Electric Cyan** | `#00f5ff` | Secondary neon — links, git status, info, secondary highlights |
| **Soft Violet** | `#bf5fff` | Tertiary neon — taglines, decorative elements, mild accents |
| **Outrun Pink** | `#ff79c6` | Grid/horizon color — untracked files, warnings, soft highlights |

## Backgrounds (The Void)

| Role | Hex | Description |
|---|---|---|
| **Deep Void** | `#0a0010` | Primary background — near-black with deep purple tint |
| **Surface** | `#12132a` | Slightly elevated — panels, sidebars, inactive areas |
| **Raised** | `#1a1b2e` | Input fields, cards, popups — distinctly above bg |
| **Border** | `#2a2840` | Inactive borders, dividers |

## Text (The Signal)

| Role | Hex | Description |
|---|---|---|
| **Primary Text** | `#e8e6f0` | Main readable text — bright off-white, cool tint |
| **Muted Text** | `#6b6880` | Secondary, dimmed, comments — readable but recedes |

## Semantic

| Role | Hex | Description |
|---|---|---|
| **Error/Urgent** | `#e05c6f` | Errors, destructive actions, critical alerts |
| **Success** | `#50fa7b` | Success states, clean diff, OK status |
| **Warning** | `#f1fa8c` | Warnings, staged changes, caution |

**Glow effect:** Applied at application layer via CSS text-shadow/outline/DropShadow — not by changing hex values.

---

→ Full doc for: Ansible variable deployment block, glow effect implementation per layer, detailed component mapping, cross-reference links

# RaBbLE-World

> The public face of the RaBbLE entity on the web.

**Version:** `0.1.0` (Genesis, from `VERSION`) · **Live:** [joinrabble.world](https://joinrabble.world) · **Versioning:** [semver, per member](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-Versioning.md)

```
spark ~ entity >> the substrate speaks // %ENTITY_ONLINE%
```

---

## What World is

RaBbLE-World is where people meet RaBbLE in a browser. The entity is the product and the page is the surface for it: one face, in five beats (Arrive, Boot, Meet, Summon, Enter), around `<rabble-entity backend="alive">`, with chat answered by [RaBbLE-sCoRE](https://github.com/RaBbLE-Collective/RaBbLE-sCoRE).

World is a thin presentation layer: static HTML and plain JavaScript, no bundler, no framework, no build step. It renders nothing itself. The entity comes from [RaBbLE-NeBuLA](https://github.com/RaBbLE-Collective/RaBbLE-NeBuLA), the styles from [RaBbLE-Aether](https://github.com/RaBbLE-Collective/RaBbLE-Aether), and both load from their CDNs at pinned versions.

## Pages

| Path | What |
|---|---|
| `index.html` | The face: the five beats and the chat |
| `world/os.html` | RaBbLE-OS developer preview: what it is, how to install it |
| `world/RaBbLE-Catalog.html` | Atlas: a live catalog of every Aether class and NeBuLA element and effect |

## Which bundles it loads

`world/js/RaBbLE-config.js` decides. On `joinrabble.world` it loads the pinned CDN versions:

| Member | Pinned path |
|---|---|
| Aether | `aether.joinrabble.world/v0.1.0/aether.min.css` |
| NeBuLA | `nebula.joinrabble.world/v0.1.0/nebula.iife.js` |

On `localhost` it loads the local builds through the Collective's dev server. Bump a pin only after that version is live on its CDN.

## Run it locally

From the Collective root (World is cloned inside `RaBbLE-Collective/`):

```sh
bash RaBbLE-Grimoire/spells/dev-serve.sh
# → http://localhost:8000
```

`dev-serve.sh` builds Aether and NeBuLA and serves them with World, so local pages see local bundles.

## Deployment

Cloudflare Workers, by GitHub Actions (`.github/workflows/deploy.yml`):

| Push to | Deploys |
|---|---|
| `main` or a `v*` tag | production, `joinrabble.world` |
| `new-horizons` | preview, `dev.joinrabble.world` |

`main` is stable: it receives `release/X.Y.Z` branches by pull request and carries the `vX.Y.Z` tags. A merge into `main` is a production deploy.

## Documentation

Docs live in the Grimoire, not here: [RaBbLE-World-README](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-README.md) (module reference) · [Architecture](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Architecture.md) · [Maintaining](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-MAINTAINING.md) · [Roadmap](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Roadmap.md).

## Licence

RaBbLE-World is under the **RaBbLE Sovereign Accord**: source-available, not open source. Personal use encouraged, commercial use reserved, the name and the face reserved. See [LICENSE](LICENSE).

---

```
transcribe ~ world >> surfaces live, entity present // %GENESIS%
```

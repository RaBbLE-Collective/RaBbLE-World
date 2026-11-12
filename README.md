# RaBbLE-World

The website where people meet RaBbLE: an animated face you can wake up and chat with. It is plain HTML and JavaScript, with no build step. The face comes from [RaBbLE-NeBuLA](https://github.com/RaBbLE-Collective/RaBbLE-NeBuLA), the styling from [RaBbLE-Aether](https://github.com/RaBbLE-Collective/RaBbLE-Aether), and chat answers from [RaBbLE-sCoRE](https://github.com/RaBbLE-Collective/RaBbLE-sCoRE).

**Genesis release `0.1.0`** · Live at [joinrabble.world](https://joinrabble.world)

## Quickstart

World is cloned inside the Collective folder, next to Aether and NeBuLA. From the Collective root:

```sh
bash RaBbLE-Grimoire/spells/dev-serve.sh
```

Open <http://localhost:8000>. The script builds Aether and NeBuLA and serves them with World, so you see your local changes.

## Pages

| Path | What |
|---|---|
| `index.html` | The face and the chat |
| `world/os.html` | RaBbLE-OS developer preview |
| `world/RaBbLE-Catalog.html` | Live catalog of every Aether class and NeBuLA element |

## Which versions it loads

`world/js/RaBbLE-config.js` decides. On `joinrabble.world` it loads the pinned releases, `aether.joinrabble.world/v0.1.0/aether.min.css` and `nebula.joinrabble.world/v0.1.0/nebula.iife.js`. On `localhost` it loads the local builds. Change a pin only after that version is live on its CDN.

## Deploying

A push to `new-horizons` deploys the preview at `dev.joinrabble.world`. A merge into `main`, or a `v*` tag, deploys `joinrabble.world`. `main` only receives release pull requests.

## More

[Module reference](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-README.md) · [Architecture](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Architecture.md) · [Roadmap](https://github.com/RaBbLE-Collective/RaBbLE-Grimoire/blob/main/RaBbLE-World/RaBbLE-World-Roadmap.md)

## Licence

Source-available under the RaBbLE Sovereign Accord: free for personal use, commercial use by agreement. See [LICENSE](LICENSE).

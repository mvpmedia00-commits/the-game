# MVP Media: Las Vegas — The Underground Cut

**Play the full game:** serve this repository and open `/world/`, or use the landing page at `/`. The optional single-mission tutorial is `/world/?demo=1`. See [GRAPHICS.md](GRAPHICS.md) and [VELVET-BLOCK.md](VELVET-BLOCK.md) for the latest visual upgrades and verification limits.

Live game: https://mvp-velvet-hours.cocoakoala6.chatgpt.site/world/ (owner-private). This checkout includes the published artwork and local PBR texture files.

MVP Media's games, playable in the browser. No build step. **Read [GAME.md](GAME.md) for the full game guide [STORE.md](STORE.md) for the store page copy, and [CODE.md](CODE.md) for how the code works.**

| Folder | What it is |
|---|---|
| `world/` | The playable HD world: Las Vegas Blvd x Fremont Ave at night, third person, traffic and pedestrians, MVP Studios interior, starter mission with Ruby |
| `hd-demo/` | HD character demo (three r160): studio and pool sets, bloom, spring-bone physics (Off / Natural / Xtreme), photo mode, drag-and-drop `.glb` loading |
| `beyond-the-frame/` | MVP: Beyond the Frame, the 3D open-world prototype (desktop + iPhone touch controls) |
| `assets/characters/` | Finished characters (`mvp.glb`, `ruby.glb`) that the demo loads automatically; see its README |
| `uploads/` | Raw exports (FBX/GLB) waiting to be converted |
| `tools/optimize-character.sh` | FBX → GLB conversion and compression (meshopt + WebP) |

## Play it online (GitHub Pages)

Settings → Pages → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
After a minute the games are live at `https://mvpmedia00-commits.github.io/the-game/`.

## Run it locally

ES modules need a web server, so opening the file directly will not work:

```
npx --yes http-server@14.1.1 . -p 8080
```

Then open http://localhost:8080.

## Content

Mature themes, non-explicit. All characters are adults. If a character is modeled on a real person, get their written consent first.

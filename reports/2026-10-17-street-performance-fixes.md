# Street performance fixes (2026-10-17)

Follow-up to [2026-10-17-fps-and-velvet-hours.md](2026-10-17-fps-and-velvet-hours.md). Same laptop: Intel Iris Plus Graphics (integrated), ANGLE / Direct3D 11, Chrome, Windows 11, window 1490 × 806 CSS px, devicePixelRatio 1.5.

## What changed

| # | Problem | Fix | Where |
|---|---|---|---|
| 1 | Integrated GPUs start on Balanced (≈13 fps outdoors) | On first launch (no saved `mvp_graphics_quality`), an Intel / UHD / Iris renderer starts on **Performance**. Apple M1, NVIDIA and AMD still start on Balanced. | `integratedIntel()` in `world/main.js` |
| 2 | Below 20 fps the game runs in slow motion (`dt` capped at 0.05) | A long frame runs as several updates of at most 0.05 s (up to 0.2 s per frame). Physics, car collision and chase ramming still step at most 0.05 s, as before. | `frame()` in `world/main.js` |
| 3 | ~900 main + ~530 reflection draw calls on the street | Static batching: unmoving meshes that share a material are merged per 64 m cell; building blocks are split per material first. Small non-glowing props are kept out of the reflection pass. Traffic cars use pre-merged wheels and lamps. | `world/lib/batch.js`, `carParts()` in `world/lib/npcs.js` |
| 4 | GPU-bound on the street even in Performance | 14 fixed street point lights now drive 5 real lights near the camera (`LightPool`). Every point light was paid for by every lit pixel. | `world/lib/lightpool.js` |
| 5 | Regular 100–180 ms frames | All LED boards redrew and re-uploaded their 512 px canvases on the same frame. Now at most two redraw per frame (the stalest first), and the Crown pylon's two jackpot screens share one canvas. | `world/lib/strip.js` |

Draw calls from `__world.probe()` at the spawn point, Balanced: **627 → 501** for the main view (including the shadow pass) and **332 → 228** for reflections. Facing down the boulevard: **892 → 544** and **528 → 242**. The scene has 2,068 meshes before and about 1,570 after.

## FPS before / after

Measured back to back: the original build (`aa4071f`) served on one port, this branch on another, both in the same freshly launched Chrome profile with background throttling off. Each run is 5 s: the camera turning (street, club), or full throttle from the car's parking spot (driving). Slow frames = 95th-percentile frame time. Hitches = frames over 100 ms in the 5 s.

| Scene | PERFORMANCE before → after | BALANCED before → after | CINEMATIC before → after |
|---|---|---|---|
| Street | **23.2 → 30.2 fps** · 84 → 66 ms · 2 → 1 hitches | **11.7 → 13.6 fps** · 183 → 100 ms · 25 → 4 | **11.0 → 13.8 fps** · 183 → 100 ms · 24 → 7 |
| Club | 60 → 60 fps · 17 → 17 ms | 38.5 → 36.7 fps · 34 → 34 ms | 36.5 → 36.1 fps · 34 → 34 ms |
| Driving | **18.7 → 23.4 fps** · 117 → 67 ms · 11 → 0 | **10.0 → 10.7 fps** · 150 → 117 ms · 25 → 15 | **8.8 → 10.9 fps** · 183 → 104 ms · 23 → 10 |

An earlier pair of runs, when the laptop was less loaded, gave the same picture: street Performance 27.3 → 36.7, Balanced 13.0 → 16.2, Cinematic 11.7 → 16.1; driving Performance 23.2 → 29.3, Balanced 10.2 → 13.5. The club doesn't change, as expected: none of these fixes touch the interior. Club differences are within run-to-run noise.

**This laptop now starts on Performance:** about 30–37 fps on the street instead of 12–13 fps on Balanced.

### Game speed at low frame rates
Holding Shift + W on the sidewalk for 4 s on Balanced (about 10–19 fps):

| | Before | After | Design speed |
|---|---|---|---|
| Run speed | 3.1–4.3 m/s | **5.6 m/s** | 5.6 m/s |
| Car, 5 s full throttle on Balanced | 21 m | **66 m** | — |

## What the trace showed
- **Performance mode:** the main thread spent about 7 ms per frame (median), while the GPU process was busy for most of the trace. The street is GPU-bound. Rendering at a quarter of the resolution nearly doubled the frame rate, and cutting to 6 point lights gave about +28%.
- **Balanced:** about 50 ms of main-thread time per game frame, mostly three.js matrix updates, culling and draw submission across the main, shadow and reflection passes. Batching cuts that work roughly in half. Balanced is still GPU-bound at pixel ratio 1.5: pixel ratio 1 alone gave 12 → 19 fps. Freezing the shadow map gained nothing, and neither did turning off bloom or the color grade.
- **Hitches:** there was no single long main-thread task. The 100–180 ms frames were GPU-bound frames. Above that baseline, the LED boards (all redrawn on the same frame, each with a mipmapped texture upload) were the regular spike. Shadow-map updates were not a cause.

## Checks
- `node tests/demo-flow.cjs` passes.
- No page errors or console errors in any mode.
- Screenshots of five fixed viewpoints (two at sidewalk level, an aerial view of the boulevard, two toward the Crown and the LED towers) look the same before and after, apart from where the traffic is.
- Not run: `tools/check-graphics.cjs` (needs `@napi-rs/canvas`, not installed on this machine). Not measured: the M1 Mac and phones.

## Still open
- Balanced and Cinematic stay at 11–16 fps outdoors on Iris Plus, because the GPU fill rate at pixel ratio 1.5 is the limit. Options: a lower pixel ratio for Balanced on integrated GPUs, or dynamic resolution.
- Cinematic is still the same as Balanced on screens with devicePixelRatio ≤ 1.5 (from the first report).

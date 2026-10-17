# FPS by graphics mode + Velvet Hours playtest (2026-10-17)

Tested on `main` @ `427269b` in real Chrome, served with `npx http-server . -p 8080`.

| | |
|---|---|
| GPU | Intel Iris Plus Graphics (integrated), ANGLE / Direct3D 11 |
| Browser | Chrome 155, Windows 11 |
| Viewport | 1504 × 834 CSS px, devicePixelRatio 1.5 |

## 1. FPS

Real frame rate measured with `requestAnimationFrame` over 5 s per run, the camera turning slowly (street, club) or the car at full throttle (driving). "Slow frames" is the 95th-percentile frame time.

| Scene | PERFORMANCE | BALANCED | CINEMATIC |
|---|---|---|---|
| Street (on foot, Las Vegas Blvd) | **31 fps** · slow frames 67 ms | **13 fps** · 167 ms | **12 fps** · 183 ms |
| Velvet Room (club interior) | **58 fps** · 17 ms | **41 fps** · 34 ms | **43 fps** · 34 ms |
| Driving (boulevard, up to 72 mph) | **28 fps** · 84 ms | **13 fps** · 150 ms | **13 fps** · 150 ms |

Cross-check: I also timed each frame directly (game update, render, then wait for the GPU). It shows the same pattern: street 18 / 11 / 11 fps, club 58 / 28 / 30 fps, driving 29 / 11 / 12 fps.

### Where it drops

1. **Outdoors in BALANCED and CINEMATIC (13 fps or less).** Switching from PERFORMANCE costs more than half the frame rate on the street and while driving. In the club the same switch costs only about 30%. The difference is the wet-street reflection pass, which only runs outdoors and draws the city a second time.
2. **Too many draw calls on the street.** `__world.probe()` reports about **1,700 draw calls** for the main view and **about 1,050** for the reflection pass. CODE.md §12b lists 1,130 + 540. Even in PERFORMANCE (no reflections) the street costs about 1,400 calls and 24 ms of CPU just to submit a frame, so the street is CPU-bound before the GPU does any work.
3. **Hitches outdoors.** Even when the average is fine, there are regular 100–180 ms frames on the street and while driving, in every mode. The club has none of them in PERFORMANCE (worst 19 ms in 99% of frames).
4. **CINEMATIC is the same as BALANCED on this screen.** Both end up at pixel ratio 1.5, because CINEMATIC's cap of 2 is limited by the screen's devicePixelRatio of 1.5. The only real difference is reflection resolution, so the two modes measure the same.

### Side effect: below 20 fps the whole game runs in slow motion
`frame()` caps `dt` at 0.05 s. At 10–13 fps, game time runs at about 50–65% of real time. While running (Shift + W, run speed 5.6 m/s), MVP covered only **about 2.9 m/s**. Walking, driving, traffic, the dance beat and mission timers all slow down with it. On integrated GPUs BALANCED (the default) feels sluggish rather than just choppy.

### Suggestions (not done in this PR)
- Default to PERFORMANCE on integrated GPUs: check `WEBGL_debug_renderer_info` for "Intel" / "UHD" / "Iris" on first launch.
- Cut street draw calls: merge the static storefronts, signs and street clutter per block, and skip small props in the reflection pass (by layer or distance).
- Find the 100–180 ms hitches: look first at the LED-board canvas texture uploads (12 fps) and at shadow-map updates when the moon light follows the player. Use a Chrome Performance trace on the street.
- Give CINEMATIC something BALANCED doesn't have when the screen's pixel ratio is 1.5 or less, or hide the mode there.

## 2. Velvet Hours playtest

Fresh save, played start to finish: 18+ screen → intro video → Tony's call → walk to the club → enter → 4 photos → contact sheet → outro → choice ("License the marquee shots") → Mission complete. Rewards were right: $250 + $80 bonus + $900 = **$1,230**, Respect 8 + 3 = **11**, Ruby signed with loyalty **60**, rung **Vendor**. No console errors. `node tests/demo-flow.cjs` passes.

### Looks or feels wrong
| # | What | Where | Severity |
|---|---|---|---|
| 1 | **Slow motion at the default setting** (see above). The run to the club takes about twice as long as it should. | Street, BALANCED | High |
| 2 | **The clock leaves the night behind.** At 2 game-minutes per second, the first mission ends around **9 AM on Day 2**, but the sky, the lights and the GDD's "it's 11:40 PM" are always night. Midnight comes about 10 s after you load in, so the HUD reads DAY 2 almost at once. | HUD clock | Medium |
| 3 | **The HUD is hard to read over bright backgrounds.** "RESPECT 0 · STREET 0" (and the rung text) has no shadow or backing and disappears against the lit facades and neon outside the club. | Top-left HUD | Medium |
| 4 | **MVP and the crowd are flat black silhouettes in the club.** Lit only from behind, MVP (seen from behind, filling the center of the screen) and the crowd have no visible detail. MVP blocks the view of the stage until you zoom. | Velvet Room | Medium |
| 5 | **Ruby's dance looks stiff.** Seen through the viewfinder at full zoom, she mostly holds an arms-out, almost-A pose, with small movement. It reads as a rest pose more than a headliner set. | Velvet Room stage | Medium |
| 6 | **Rewards show before the story beat.** As soon as you press "Send the photos", the HUD jumps to $1,230 / Vendor and the objective changes to "Proof Run: meet Tony Velvet", while Ruby's outro is still playing. The Mission complete card comes three dialogue boxes and a choice later. | Mission end | Low |
| 7 | **The objective lags during the call.** While Tony's call plays, the objective still says "Answer the phone". | Opening | Low |
| 8 | **Pedestrians walk right up against MVP** at the spawn point during the opening call. They don't step aside while the dialogue is up. They are also simple capsule people next to the real MVP model, which stands out up close. | Spawn point | Low |
| 9 | **Tony speaks in the club without being there**, with no 📞 icon. His reply to the choice plays while you stand inside, but he isn't in the scene. | Choice reply | Low |
| 10 | **The framing-coach tip covers the club's neon sign** in the viewfinder. | Velvet Room | Cosmetic |

### Things that worked well
- The intro video, the 18+ screen and the incoming call flow are clean.
- The beacon, objective and "E Enter The Velvet Room" prompt make the route obvious.
- The framing coach is clear: the circle, the gold points and tips like "Zoom in", "Keep her feet in the frame" and "Wait for her pose" all react correctly.
- The contact sheet thumbnails match the frames that were scored.
- The choice panel, its toast ("+3 Respect · Ruby trusts you more") and the Mission complete card with "Promoted: Vendor" all work.

## How these numbers were taken
In the browser console on `/world/`:
```js
// real FPS over n seconds
const measure = s => new Promise(res => { const ts = []; let last = performance.now(), t0 = last;
  (function f(now) { ts.push(now - last); last = now; now - t0 < s * 1000 ? requestAnimationFrame(f)
    : res(1000 / (ts.slice(1).reduce((a, b) => a + b) / (ts.length - 1))); })(last); });
await measure(5);
__world.probe();   // draw calls: { main, reflect }
```
Switch modes with the quality button (bottom right). For the club use `__world.enter('club')`. For driving use `__world.enterCar()` and hold W. Keep the Chrome window in front: if it's behind another window, Chrome throttles the tab to 1 fps.

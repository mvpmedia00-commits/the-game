# Graphics update 2

Full campaign: /world/. Guided single-assignment mode: /world/?demo=1. Primary landing-page links now open the full campaign. All eight story missions and existing economy/save keys are preserved.

## Visual changes

- Procedural skin micro-bump and soft sheen; woven suit bump maps; raised lapels/buttons; iris/pupil/catchlight detail; smoother limb surfaces. Existing models and animations remain procedural.
- 64 instanced reflective puddles using the existing environment map (not ray tracing), drainage grates, reflective road studs, floor reveals and building plinths. No collision changes.
- Textured road and sidewalk relief, directional texture filtering, soft character fill/rim lights, more readable distance haze.
- Polished club floor and velvet sheen. Cinematic-only animated vent steam.
- Subtle shadow tint/vignette and controlled bloom. Touch devices use FXAA. Composer pixel ratio now follows the selected renderer resolution.
- Persistent graphics selection. Balanced defaults to 1.25 pixel-ratio cap on touch and 1.5 on desktop; Cinematic caps at 1.5 on touch/2 on desktop. Performance uses 1, disables shadows/bloom/grading/fill lights, and retains cheap instanced street details.

## Checks

JavaScript syntax and whitespace checks pass. Real Three.js r160 geometry/material smoke test builds both heroes, the district, club, and visuals; checks finite geometry coordinates, preset updates, and eight-mission story structure. Result: 1,248 mesh nodes, 68,709 base vertices (before instancing), 64 physical-material uses, 64 puddles. Demo-flow regression passes for mission progression, rewards, replay and isolated saves.

Browser/GPU visual checks and phone FPS testing remain unverified: the browser-control capability is unavailable in this environment. Shader compilation, rendered appearance, and device performance must be checked in the live build.

The geometry smoke check can be reproduced with a downloaded three r160 ESM file and @napi-rs/canvas:

```sh
THREE_MODULE=/absolute/path/three.module.mjs CANVAS_MODULE=/absolute/path/node_modules/@napi-rs/canvas node tools/check-graphics.cjs
```

# Graphics update 3: the world

Full guide in [CODE.md §12b](CODE.md). The missions, collision layout, economy and save keys are unchanged.

- **Buildings:** new PBR facade sets with real floor spacing. Windows show lit rooms with curtains, blinds and silhouettes, and the glass reflects. Each building gets its own window pattern and light tint, and the walls catch warm light from the street. Towers over 40 m step back above a podium. Roofs have parapets, mechanical rooms, HVAC units, water tanks, antennas and blinking aircraft lights.
- **Sky:** a shader night sky with city light pollution, drifting clouds lit from below, and a moon lined up with the shadow light. Streetlights get soft haze cones.
- **Wet streets:** real planar reflections of the city in the asphalt, sidewalks and puddles, smeared vertically and driven by a puddle mask. On in Cinematic, and in Balanced on desktop.
- **Vegas details:**
  - four animated LED video boards;
  - chasing-bulb marquees;
  - the Crown Casino pylon with a jackpot screen;
  - a glass skybridge over the boulevard;
  - parking meters, trash cans, news boxes and a bus shelter;
  - median shrubs and uplit palms;
  - taxis, plus headlight and taillight flares.

## Checks

- `node tests/demo-flow.cjs` passes.
- `tools/check-graphics.cjs` passes. It now also builds the strip, the reflection setup and the sky; the run found 82 ground objects for the reflection pass to hide.
- Headless Chromium (SwiftShader) screenshots at street, casino, motel, skybridge, pylon, Fremont and aerial viewpoints show no page errors in any of the three presets. The club interior enter/exit also works.
- Real-GPU frame rate on phones has not been measured.

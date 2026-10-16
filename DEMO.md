# Velvet Hours — playable demo

The landing page at `/` introduces MVP Media: Las Vegas — The Underground Cut and links to `/world/?demo=1`.

The demo is the first photography assignment: Tony's call → walk to The Velvet Room → enter → photograph Ruby four times → contact sheet → payout → Ruby's closing dialogue → demo ending. Players can explore or replay afterward. Later story missions are gated in demo mode. The eight-mission development campaign remains at `/world/`.

## Run

Serve the repository over HTTP, for example:

```sh
python -m http.server 8080
```

Open `http://localhost:8080/` and choose **Play the free demo**. Three.js loads from the existing jsDelivr import map, so a network connection and WebGL are required.

## Demo features

- Dedicated title, first-assignment guide, completion screen, replay, and phone menu.
- Separate `mvp_velvet_demo_v1` storage. Existing `mvp_world_v2` campaign saves are preserved.
- Saves retain demo completion and player stats/location. An unfinished assignment restarts at Tony's call after reload; in-mission steps and photos are not saved.
- Performance: 1× pixel-ratio cap, no shadows or bloom. Default on coarse-pointer devices.
- Balanced: 1.5× cap, shadows, restrained bloom. Default on desktop.
- Cinematic: 2× cap, shadows, slightly stronger bloom. This is a graphics preset, not a claim of console-quality assets.
- More reflective asphalt using the existing environment map, exponential camera smoothing, reduced-motion camera shake handling, cleared input on focus loss, hidden-tab suspension, and startup/WebGL error messages.

## Validation

```sh
node tests/demo-flow.cjs
node --input-type=module --check < world/main.js
node --input-type=module --check < world/lib/district.js
git diff --check
```

The automated flow test exercises real mission and demo functions with rendering/DOM boundaries stubbed: entry dialogue, mission steps, payout, ending, campaign gating, replay reset, and separate storage keys. It does not validate rendering or physical movement through the district.

Browser visual and touch playtests remain required. The development environment did not have a browser installed, and its browser download failed.

Manual acceptance: desktop and iPhone portrait/landscape; start, dismiss Tony's three lines, follow beacon, enter club, frame Ruby, take four shots, send contact sheet, finish dialogue, explore, replay, reload. Check all graphics presets, focus loss, phone-menu pause, and campaign-save preservation.

## Content direction

Matthew “MVP” Phillips climbs from hired photographer to studio owner. Photography, paid talent, productions, royalties, ownership of masters, and Silas Crane's piracy form the main campaign. The store/landing page distinguishes the current demo from that larger direction. The demo has mature themes and non-explicit visuals, with procedural characters; no scanned models, mocap, voice acting, or additional 3D assets have been added.

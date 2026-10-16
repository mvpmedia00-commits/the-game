# Las Vegas · The World

Third-person HD district built on three r160 (no build step). Shares the characters, studio set and spring physics with `../hd-demo/lib/`.

## The district (metres; x = east, z = south)

| Block | Places |
|---|---|
| North-west | Crown Casino (podium, 104 m tower with crown, porte-cochère, fountain), Pawn & Gold |
| North-east | The Velvet Room (velvet rope, bouncer, Ruby), Lens & Light (Dee), Scarlet Lounge, MVP MEDIA billboard |
| South-west | Desert Rose Motel (two-storey wings, night pool courtyard, Room 12 save point, pole sign) |
| South-east | MVP Studios (enterable: studio set interior), Chapel of Love, Diamond Diner |
| Streets | Las Vegas Blvd (palm median) x Fremont Ave, signal-controlled traffic, pedestrians, street lights, skyline and tower on the horizon |

## Controls

Desktop: WASD move, Shift run, mouse look (click to lock), E talk/enter, P photo.
Touch: left thumb joystick (push fully to run), right thumb look, ACT, SHOOT.

## Starter mission

1. Find Ruby outside The Velvet Room.
2. Walk her to MVP Studios (she follows you).
3. Take 3 promo photos of her on Stage A.

Progress saves in the browser; Room 12 at the Desert Rose saves your position.

## Code map

- `lib/district.js`: geometry, colliders, points of interest, zones, walk paths, traffic signals
- `lib/npcs.js`: traffic (signals, queueing, stops for the player) and pedestrians
- `main.js`: player controller, camera, interiors, mission, dialog, minimap, photo mode, touch input

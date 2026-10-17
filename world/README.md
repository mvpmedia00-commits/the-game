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

Desktop: WASD move/drive, Shift run, mouse look (click to lock), E talk/enter, F car, Space brake, P photo, Tab phone.
Touch: left thumb joystick (push fully to run, or drive), right thumb look, ACT, CAR, BRAKE, SHOOT, PHONE, II PAUSE, and + / − to zoom during a shoot.

## Story (10 missions, 3 endings)

| # | Mission | Giver | What you do |
|---|---|---|---|
| 1 | Velvet Hours | Phone (Tony Velvet) | Go into The Velvet Room, shoot Ruby's headliner set (4 photos) |
| 2 | Proof Run | Tony, club door | Get the proofs to the editor at Crown Casino in 75 s (drive) |
| 3 | Snatch & Grab | Editor, Crown Casino | Chase and ram the Neon Kings coupe |
| 4 | Pool Party Cover | Dee, Lens & Light | Reach the Desert Rose pool in 120 s, shoot Nova (5 photos) |
| 5 | Keys to the Kingdom | Landlord, Room 12 | Buy MVP Studios ($3,500) |
| 6 | First Feature | Jade, outside the studio | Produce your first film on Stage A |
| 7 | Bootleg Boulevard | Coco, Scarlet Lounge | Stop the bootleg van on Fremont |
| 8 | Lex's Terms | Lex Vaughn, outside the chapel | Shoot Lex live on her stream (4 photos), then negotiate her contract |
| 9 | Street Tax | Phone (Dutch, Neon Kings) | Pay protection money, or refuse and run his truck off the boulevard |
| 10 | Beyond the Frame | Ruby, outside the studio | Premiere red carpet (6 photos), then stop Silas Crane |

Most missions end on a choice that moves your **Respect**, **Street** and your talent's **loyalty**. These decide the ending: The Legit Mogul, King of Fremont, Empire of One, or Own the Frame.

Between missions: photo gigs (phone), Dee's gear shop (photo score, top speed), talent roster (sign Coco and Lex with rep), one studio production per day with daily royalties.
Photos are scored on composition (face on a thirds point), how much of the frame she fills, and catching the pose; the average sets a quality bonus.

## Driving

Your red MVP car is parked outside MVP Studios. F (or CAR) gets in and out; W/S throttle and brake, A/D steer, Space handbrake. Las Vegas Blvd runs about 600 m and Fremont about 500 m, with traffic lights, traffic that queues and brakes, and road-closed barricades at the ends.

Progress saves in the browser (phone > Save, or Room 12 at the Desert Rose).

## Code map

- `lib/district.js`: geometry, colliders, points of interest, zones, walk paths, traffic signals
- `lib/npcs.js`: traffic (signals, queueing, stops for the player) and pedestrians
- `lib/car.js`: player car physics and the getaway-driver AI
- `lib/club.js`: The Velvet Room interior
- `lib/story.js`: missions, gigs, gear, sets and production tuning
- `main.js`: player and car control, cameras, interiors, NPC placement, mission runner, photo scoring, phone menus, production, saves

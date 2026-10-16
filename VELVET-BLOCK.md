# Velvet Room block upgrade

Published source includes a more detailed Art Deco exterior and an expanded interior finish. The main landing links open the full campaign, not the one-mission tutorial.

## Built

- Replaced the generic club shopfront with an authored entrance: facade opening, stepped stone and metal trim, recessed double doors, approach-driven sliding door visuals, a bulb marquee, inset windows, sconces, and Ruby residency posters.
- Kept the original entrance coordinates and mission trigger. Aligned the building collider with the new frontage so decorative walls do not become walk-through surfaces.
- Added ceiling coffers, bronze wall panelling, a stepped stage fan, upholstered booth inserts, pendant fixtures, glassware, and table rims inside the existing interior bounds.
- Installed six verified 1K local PBR maps (color, OpenGL normal, roughness) for asphalt and concrete. Texture image payload totals approximately 3.7 MB. Standard sRGB color handling and linear data maps are configured.
- Preserved all eight missions, studio systems and save keys.

## Asset provenance

Asphalt 02 and Concrete Floor 02 from Poly Haven, CC0-1.0. Original URLs and verified MD5 values are recorded in `dist/assets/materials/sources.json`. License: https://polyhaven.com/license . Individual asset pages: https://polyhaven.com/a/asphalt_02 and https://polyhaven.com/a/concrete_floor_02 .

## Verification

Real Three.js r160 geometry/material scene-building test passes, including finite geometry, both updated venues, door updates, reachable original entrance coordinates, interior animation and eight-mission story structure. Mission-flow regression passes for the first assignment, payout, ending, replay, separate saves and access to later campaign missions. JavaScript syntax and whitespace checks pass.

Browser/GPU visual checks and phone frame rate remain unverified because browser control is unavailable. The project continues to use the existing procedural people and vehicles. This is an environment upgrade, not a completed AAA asset replacement or an Unreal migration.

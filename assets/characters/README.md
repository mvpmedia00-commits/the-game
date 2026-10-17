# Characters

Put finished characters here. The HD demo loads these automatically:

| File | Slot |
|---|---|
| `mvp.glb` | MVP |
| `mvp.glb` | Tripo AI (HD model, T-pose), by Matthew | Reduced from 62.6 MB / 1.9M triangles to 1.05 MB / 67k triangles, then auto-rigged with the game's joint names (hips, spine, head, shL/elL/shR/elR, hpL/knL/hpR/knR). The HD demo drives him with the same poses, walk and dance as the code-built characters. |
| `ruby.glb` | Ruby |

## Sending a new character

1. Build the character in **Character Creator 4** (or Meshy / Tripo / Rodin for a quick test). Keep the full skeleton, including breast, hair and skirt bones.
2. Export:
   - Character Creator 4: **FBX**, Unity or Blender preset, textures embedded.
   - Meshy / Tripo / Rodin: **GLB**.
3. Upload the raw file to `uploads/` in this repo (github.com → Add file → Upload files). The website accepts files up to 25 MB; use GitHub Desktop for files up to 100 MB.
4. Tell Claude "uploaded". It converts and compresses the file with `tools/optimize-character.sh` and saves the result here.

Optional: animation clips (idle, walk, dance, poses) exported the same way, named like `ruby_dance.fbx`.

## How the physics finds bones

Bones whose names contain these words get spring physics automatically:

| Word in bone name | Motion |
|---|---|
| breast, bust | chest |
| hair, braid, ponytail, bang | hair |
| skirt, dress, tutu, cloth | skirt and cloth |
| earring, hoop | earrings |

Character Creator 4 names its chest bones `CC_Base_L_Breast` / `CC_Base_R_Breast`, so they are picked up with no extra setup.

## Current files

| File | Source | Notes |
|---|---|---|
| `mvp.glb` | Tripo AI, T-pose, Mixamo rig, by Matthew | 1.54 MB: textures 2K WebP + meshopt. Driven by the game's poses/walk/dance through `hd-demo/lib/retarget.js`. |
| `ruby.glb` | Tripo AI, T-pose, Mixamo rig, by Matthew | 1.40 MB. Knees separated: 631 vertices shared by both legs below the tutu re-weighted to one side, 71 triangles joining the knees removed. |

### Recipe for new characters
Tripo: Image to 3D from a **T-pose** picture → Smart Mesh, Quad, 8k → HD texture → Rig: **Biped**, skeleton **Mixamo** → export **GLB**.
Any Mixamo-rigged GLB works: the HD demo detects `mixamorig` bones and drives them with the game's own animations.

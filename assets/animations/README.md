# Animations

`mocap.glb`: animation-only motion capture, with no meshes. Clips: `idle`, `walk`, `run`, `agree`, `headShake`, `sad_pose`, `sneak_pose`.
Source: the three.js example `Xbot.glb`, which uses Mixamo animations. Mixamo animations are free to use in commercial games.

To add more moves:
1. Download from mixamo.com: FBX, "Without Skin", 30 fps.
2. In Blender, import the FBX and export a GLB with animation only.
3. Merge it into this file with `gltf-transform merge`.

The game plays any clip by name: `rig.mocap.play('clipName')`.

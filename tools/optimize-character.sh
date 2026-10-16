#!/usr/bin/env bash
# Convert (FBX) and compress a character for the browser demo.
# Usage: tools/optimize-character.sh <input.fbx|input.glb> <output.glb>
# Example: tools/optimize-character.sh uploads/ruby.fbx assets/characters/ruby.glb
set -euo pipefail
in="$1"; out="$2"
case "$in" in
  *.fbx|*.FBX)
    tmpdir="$(mktemp -d)"
    npx --yes fbx2gltf@0.9.7-p1 --binary --input "$in" --output "$tmpdir/model"
    in="$tmpdir/model.glb" ;;
esac
# meshopt geometry compression + WebP textures capped at 2K keeps a full character around 10-20 MB
npx --yes @gltf-transform/cli@4.5.1 optimize "$in" "$out" --compress meshopt --texture-compress webp --texture-size 2048
npx --yes @gltf-transform/cli@4.5.1 inspect "$out" | head -40

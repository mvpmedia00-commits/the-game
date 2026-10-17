// Load a rigged character model (.glb with a Mixamo skeleton) as a game rig: same joint handles as the
// code-built characters (setPose / walkPose / DANCE all work), plus apply() to copy the pose onto the
// model's bones, and real hand bones so props (MVP's camera) follow the hands.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mixamoRig } from './retarget.js';

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);

// The file itself, or (on hosts that can't serve .glb) a base64 copy in "<url>.js".
export async function fetchModel(url) {
  url = new URL(url, typeof location !== 'undefined' ? location.href : import.meta.url).href; // relative to the page, not this module
  try { const r = await fetch(url, { cache: 'no-cache' }); if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) return await r.arrayBuffer(); } catch (e) {}
  const b64 = (await import(/* @vite-ignore */ url + '.js')).default;
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

// Bounds of the model as it stands (rigged meshes measured through their skeleton).
export function restBox(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(), b = new THREE.Box3();
  root.traverse(o => {
    if (!o.isMesh) return;
    if (o.isSkinnedMesh) { o.frustumCulled = false; o.skeleton.update(); o.computeBoundingBox(); box.union(b.copy(o.boundingBox).applyMatrix4(o.matrixWorld)); return; }
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
  });
  return box;
}

// opts: height (metres), armPitch (see retarget.js). Resolves to a rig, or null if the file has no Mixamo skeleton.
export async function loadCharacter(url, opts = {}) {
  const gltf = await loader.parseAsync(await fetchModel(url), '');
  const model = gltf.scene;
  model.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = 1; } });
  const rig = mixamoRig(model, { armPitch: opts.armPitch });
  if (!rig) return null;
  // feet on the ground, centred, scaled to the character's height
  const box = restBox(model), k = (opts.height || 1.7) / Math.max(0.01, box.max.y - box.min.y);
  model.scale.multiplyScalar(k);
  const b2 = restBox(model), c = b2.getCenter(new THREE.Vector3());
  model.position.x -= c.x; model.position.z -= c.z; model.position.y -= b2.min.y;
  const root = new THREE.Group(); root.name = opts.name || 'character'; root.add(model);
  rig.root = root; rig.modelRoot = model;
  const bones = {}; model.traverse(o => { if (o.isBone) bones[o.name.replace(/^mixamorig\d*[:_]?/i, '')] = o; });
  rig.handL = bones.LeftHand; rig.handR = bones.RightHand; rig.headBone = bones.Head;
  rig.bones = bones;
  rig.springs = []; // spring bones are found by name with SpringSystem.scan(rig.modelRoot)
  return rig;
}

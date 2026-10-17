// Drive a Mixamo-rigged model (Tripo, Mixamo, ActorCore exports with mixamorig bones) with the game's own
// pose system. The game's poses, walk cycle and dances rotate a set of invisible "proxy" joints laid out like
// the code-built characters (arms hanging at rotation 0); apply() copies their rotations onto the model's
// bones as world-space rotation deltas, so any rest pose (T-pose, A-pose) and any bone orientation works.
import * as THREE from 'three';

const MAP = { hips: 'Hips', spine: 'Spine', head: 'Head', shL: 'LeftArm', elL: 'LeftForeArm', shR: 'RightArm', elR: 'RightForeArm', hpL: 'LeftUpLeg', knL: 'LeftLeg', hpR: 'RightUpLeg', knR: 'RightLeg' };
const PARENT = { hips: null, spine: 'hips', head: 'spine', shL: 'spine', elL: 'shL', shR: 'spine', elR: 'shR', hpL: 'hips', knL: 'hpL', hpR: 'hips', knR: 'hpR' };
const ORDER = Object.keys(MAP);
const strip = name => name.replace(/^mixamorig\d*[:_]?/i, '');

// root-relative world quaternion of a node (product of local quaternions from just below root down to obj)
function relQ(obj, root, out) {
  const chain = []; for (let o = obj; o && o !== root; o = o.parent) chain.push(o);
  out.identity(); for (let i = chain.length - 1; i >= 0; i--) out.multiply(chain[i].quaternion);
  return out;
}

export function mixamoRig(root, opts = {}) {
  const bones = {};
  root.traverse(o => { if (o.isBone) bones[strip(o.name)] = o; });
  if (!ORDER.every(k => bones[MAP[k]])) return null;
  const B = Object.fromEntries(ORDER.map(k => [k, bones[MAP[k]]]));
  const restLocal = new Map(); root.traverse(o => { if (o.isBone) restLocal.set(o, [o.quaternion.clone(), o.position.clone()]); }); // true rest pose, for later add-ons (mocap)
  root.updateMatrixWorld(true);
  // face +z like every other character (left arm on +x)
  const l = B.shL.getWorldPosition(new THREE.Vector3()), r = B.shR.getWorldPosition(new THREE.Vector3());
  root.worldToLocal(l); root.worldToLocal(r);
  if (l.x < r.x) { root.rotation.y += Math.PI; root.updateMatrixWorld(true); }
  // proxy joints in the model's rest pose: arms out sideways if the rest pose is a T-pose
  const proxy = {};
  for (const k of ORDER) { proxy[k] = new THREE.Object3D(); if (PARENT[k]) proxy[PARENT[k]].add(proxy[k]); }
  const armOut = side => { // angle of the upper arm from straight down, in the body's frontal plane
    const a = B['sh' + side].getWorldPosition(new THREE.Vector3()), b = B['el' + side].getWorldPosition(new THREE.Vector3());
    root.worldToLocal(a); root.worldToLocal(b); const d = b.sub(a);
    return Math.atan2(Math.abs(d.x), -d.y);
  };
  proxy.shL.rotation.z = armOut('L'); proxy.shR.rotation.z = -armOut('R');
  const pw = {}, offset = {}, tq = new THREE.Quaternion(), pq = new THREE.Quaternion();
  const proxyWorld = () => { for (const k of ORDER) pw[k] = (PARENT[k] ? pw[PARENT[k]].clone() : new THREE.Quaternion()).multiply(proxy[k].quaternion); };
  proxyWorld();
  for (const k of ORDER) offset[k] = pw[k].clone().invert().multiply(relQ(B[k], root, new THREE.Quaternion()));
  // poses are absolute: start the proxies from the game's rest (arms down)
  for (const k of ORDER) proxy[k].rotation.set(0, 0, 0);
  const rig = { root, cur: null, model: B, bobNode: new THREE.Object3D(), retarget: true, restLocal };
  for (const k of ORDER) rig[k] = proxy[k];
  rig.armPitch = opts.armPitch || 0; // per-model correction: swing the arms forward (negative) or back at the shoulder
  rig.apply = () => {
    if (rig.armPitch) { proxy.shL.rotation.x += rig.armPitch; proxy.shR.rotation.x += rig.armPitch; } // setPose rewrites these every frame
    proxyWorld();
    for (const k of ORDER) {
      tq.copy(pw[k]).multiply(offset[k]);                    // desired root-relative rotation of the bone
      relQ(B[k].parent, root, pq);                           // its parent's current root-relative rotation
      B[k].quaternion.copy(pq.invert().multiply(tq));
    }
  };
  return rig;
}

// Motion-capture driver: plays recorded Mixamo clips (idle, walk, run, ...) on any character with a Mixamo
// skeleton, even when its bones are oriented differently (Tripo, Mixamo, ActorCore exports).
// The clips play on an invisible copy of the source skeleton; every frame each bone's rotation *relative to the
// source rest pose* is transferred onto the matching bone of the character (relative to its own rest pose).
// The game's hand-made poses (dances, photo poses, mannerisms) can be blended on top with a weight.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { fetchModel } from './glbchar.js';

const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const strip = n => n.replace(/^mixamorig\d*[:_]?/i, '');
const PROC = ['Hips', 'Spine', 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']; // bones the game's poses drive

function relQ(obj, root, out) { const chain = []; for (let o = obj; o && o !== root; o = o.parent) chain.push(o); out.identity(); for (let i = chain.length - 1; i >= 0; i--) out.multiply(chain[i].quaternion); return out; }
function relPos(obj, root) { root.updateMatrixWorld(true); return obj.getWorldPosition(new THREE.Vector3()).applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert()); }

export async function loadMocap(url) {
  const gltf = await loader.parseAsync(await fetchModel(url), '');
  return { scene: gltf.scene, clips: Object.fromEntries(gltf.animations.map(c => [c.name, c])) };
}

export class MocapDriver {
  constructor(rig, lib) {
    this.rig = rig; this.model = rig.modelRoot; this.src = lib.scene.clone(true);
    this.mixer = new THREE.AnimationMixer(this.src); this.actions = {};
    for (const [n, c] of Object.entries(lib.clips)) this.actions[n] = this.mixer.clipAction(c);
    const sb = {}; this.src.traverse(o => { if (o.name) sb[strip(o.name)] = o; });
    // matching bones, parents first
    this.pairs = [];
    this.model.traverse(o => { if (!o.isBone) return; const k = strip(o.name); if (sb[k] && !/_End$|Toe_End|HeadTop/.test(k)) this.pairs.push({ k, t: o, s: sb[k] }); });
    // rest poses (root-relative rotations): measured on the rig's recorded rest pose, whatever it is doing right now
    const now = new Map(); if (rig.restLocal) for (const [b, [q, pos]] of rig.restLocal) { now.set(b, [b.quaternion.clone(), b.position.clone()]); b.quaternion.copy(q); b.position.copy(pos); }
    for (const p of this.pairs) { p.tRest = relQ(p.t, this.model, new THREE.Quaternion()); p.sRestInv = relQ(p.s, this.src, new THREE.Quaternion()).invert(); p.proc = PROC.includes(p.k); }
    // both skeletons should face the same way in their own frames; if not, mirror the deltas around Y
    const sL = relPos(sb.LeftArm, this.src).x - relPos(sb.RightArm, this.src).x, tL = relPos(rig.bones.LeftArm, this.model).x - relPos(rig.bones.RightArm, this.model).x;
    this.face = Math.sign(sL) === Math.sign(tL) ? null : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    // hips: transfer the vertical bob and side sway, scaled to this character's hip height
    // limbs: the two rest poses can differ (legs spread wider, arms angled back); rotate each target limb so its
    // rest direction matches the source's, so the recorded pose comes out the same on both skeletons
    const CHILD = { UpLeg: 'Leg', Leg: 'Foot', Foot: 'ToeBase', Arm: 'ForeArm', ForeArm: 'Hand' };
    for (const p of this.pairs) {
      const m = p.k.match(/^(Left|Right)(UpLeg|Leg|Foot|Arm|ForeArm)$/); if (!m) continue;
      const ck = m[1] + CHILD[m[2]], tc = rig.bones[ck], sc = sb[ck]; if (!tc || !sc) continue;
      const td = relPos(tc, this.model).sub(relPos(p.t, this.model)).normalize(), sd = relPos(sc, this.src).sub(relPos(p.s, this.src)).normalize();
      if (this.face) { sd.x = -sd.x; sd.z = -sd.z; }
      p.align = new THREE.Quaternion().setFromUnitVectors(td, sd);
    }
    const hs = this.pairs.find(p => p.k === 'Hips');
    this.hips = hs; this.sHip0 = relPos(hs.s, this.src); this.tHip0 = hs.t.position.clone();
    this.hipScale = relPos(hs.t, this.model).y / Math.max(1e-4, this.sHip0.y);
    for (const [b, [q, pos]] of now) { b.quaternion.copy(q); b.position.copy(pos); }
    this.cur = null; this.q = new THREE.Quaternion(); this.pq = new THREE.Quaternion(); this.saved = new Map();
  }
  play(name, fade = 0.3, timeScale = 1) {
    const a = this.actions[name]; if (!a) return;
    a.timeScale = timeScale;
    if (this.cur === a) return;
    a.reset().setEffectiveWeight(1).play();
    if (this.cur) a.crossFadeFrom(this.cur, fade, true);
    this.cur = a;
  }
  // procW: 0 = pure mocap, 1 = the game's own pose on the bones it drives (call rig.apply() first)
  update(dt, procW = 0) {
    this.mixer.update(dt);
    if (procW > 0) for (const p of this.pairs) if (p.proc) this.saved.set(p.t, p.t.quaternion.clone());
    for (const p of this.pairs) {
      if (p.proc && procW >= 0.999) continue;
      relQ(p.s, this.src, this.q).multiply(p.sRestInv);           // source rotation relative to its rest
      if (this.face) this.q.premultiply(this.face).multiply(this.pq.copy(this.face).invert());
      if (p.align) this.q.multiply(p.align);
      this.q.multiply(p.tRest);                                    // applied on top of the target's rest
      relQ(p.t.parent, this.model, this.pq).invert();
      const local = this.pq.multiply(this.q);
      if (p.proc && procW > 0) local.slerp(this.saved.get(p.t), procW);
      p.t.quaternion.copy(local);
    }
    // hip bob/sway (in the hips' parent space)
    const sNow = relPos(this.hips.s, this.src), d = sNow.sub(this.sHip0).multiplyScalar(this.hipScale * (1 - procW));
    if (this.face) d.x = -d.x;
    const parentRot = relQ(this.hips.t.parent, this.model, this.pq).invert();
    this.hips.t.position.copy(this.tHip0).add(new THREE.Vector3(d.x, d.y, 0).applyQuaternion(parentRot).divideScalar(this.hips.t.parent.getWorldScale(new THREE.Vector3()).x / this.model.getWorldScale(new THREE.Vector3()).x || 1));
  }
}

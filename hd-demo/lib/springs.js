// Spring-bone secondary motion (hair, skirts, earrings, chest) for any THREE.Object3D hierarchy.
// Each joint's tail is simulated as a damped point mass (verlet) that lags behind the body and
// springs back to its rest direction; the joint is then rotated to point at the simulated tail.
import * as THREE from 'three';

// [natural, xtreme] tuning per kind. s = spring strength, d = drag (0 = bouncy, 1 = no bounce),
// g = gravity, max = maximum swing in radians.
const PRESETS = {
  breast: [{ s: 0.34, d: 0.32, g: 0.02, max: 0.22 }, { s: 0.1, d: 0.075, g: 0.06, max: 0.5 }],
  hair:   [{ s: 0.16, d: 0.22, g: 0.22, max: 0.9 },  { s: 0.07, d: 0.1, g: 0.3, max: 1.2 }],
  skirt:  [{ s: 0.22, d: 0.26, g: 0.15, max: 0.6 },  { s: 0.09, d: 0.12, g: 0.18, max: 0.9 }],
  ear:    [{ s: 0.1, d: 0.12, g: 0.6, max: 1.0 },    { s: 0.05, d: 0.06, g: 0.7, max: 1.3 }],
};
const RULES = [ // auto-detect spring bones in imported rigs by name
  [/breast|boob|bust/i, 'breast'],
  [/hair|braid|ponytail|bang/i, 'hair'],
  [/skirt|dress|tutu|cloth|cape/i, 'skirt'],
  [/earring|ear_?ring|hoop/i, 'ear'],
];
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3();

export class SpringSystem {
  constructor() { this.joints = []; this.amount = 0.5; this.enabled = true; this.kick = new THREE.Vector3(); }
  clear() { this.joints = []; }
  add(obj, kind = 'hair', axis = null, len = 0) {
    let ax = axis ? axis.clone().normalize() : null, L = len;
    if (!ax) { // imported bone: point toward the first child bone, or along the bone's +Y
      const child = obj.children.find(c => c.isBone);
      if (child && child.position.lengthSq() > 1e-8) { ax = child.position.clone().normalize(); L = L || child.position.length(); }
      else { ax = new THREE.Vector3(0, 1, 0); L = L || 0.08; }
      obj.getWorldScale(_s); L *= _s.x; // bone lengths are local; convert to world metres
    }
    this.joints.push({ obj, kind, axis: ax, len: L, rest: obj.quaternion.clone(), cur: new THREE.Vector3(), prev: new THREE.Vector3(), init: false });
  }
  addRig(rig) { for (const s of rig.springs || []) this.add(s.obj, s.kind, s.axis, s.len); }
  // Find spring bones in an imported model; returns counts by kind.
  scan(root) {
    const found = {};
    root.traverse(o => {
      if (!o.isBone) return;
      for (const [re, kind] of RULES) if (re.test(o.name)) {
        // only the root of a chain gets the strongest motion; children are added too so chains bend
        this.add(o, kind); found[kind] = (found[kind] || 0) + 1; break;
      }
    });
    return found;
  }
  impulse(x, y, z) { this.kick.set(x, y, z); }
  update(dt) {
    dt = Math.min(dt, 1 / 30);
    const k = this.amount, kick = this.kick;
    for (const j of this.joints) {
      const o = j.obj, P = PRESETS[j.kind] || PRESETS.hair, a = P[0], b = P[1];
      if (!this.enabled || k <= 0) { o.quaternion.copy(j.rest); j.init = false; continue; }
      const t = Math.min(1, k), s = a.s + (b.s - a.s) * t, d = a.d + (b.d - a.d) * t, g = a.g + (b.g - a.g) * t, max = a.max + (b.max - a.max) * t;
      o.quaternion.copy(j.rest); o.updateMatrixWorld(true);
      const head = o.getWorldPosition(new THREE.Vector3());
      o.parent.getWorldQuaternion(_q1); _q2.copy(_q1).multiply(j.rest);
      const restDir = _v1.copy(j.axis).applyQuaternion(_q2).normalize();
      const restTail = _v2.copy(head).addScaledVector(restDir, j.len);
      if (!j.init) { j.cur.copy(restTail); j.prev.copy(restTail); j.init = true; }
      const step = dt * 60; // tuned at 60 fps
      const next = j.cur.clone()
        .addScaledVector(_s.copy(j.cur).sub(j.prev), 1 - d)              // inertia
        .addScaledVector(_s.copy(restTail).sub(j.cur), Math.min(1, s * step)) // spring back to rest
        .add(_s.set(0, -g * j.len * 0.05 * step, 0))                      // gravity
        .addScaledVector(kick, j.len * (j.kind === 'breast' ? 1 : 0.6));
      // keep bone length and clamp swing
      const dir = next.sub(head).normalize();
      const ang = dir.angleTo(restDir);
      if (ang > max) { const axis = _s.crossVectors(restDir, dir).normalize(); dir.copy(restDir).applyAxisAngle(axis, max); }
      j.prev.copy(j.cur); j.cur.copy(head).addScaledVector(dir, j.len);
      // rotate the joint so its axis points at the simulated tail
      const delta = new THREE.Quaternion().setFromUnitVectors(restDir, dir);
      const world = delta.multiply(_q2);
      o.quaternion.copy(_q1.invert().multiply(world));
    }
    kick.set(0, 0, 0);
  }
}

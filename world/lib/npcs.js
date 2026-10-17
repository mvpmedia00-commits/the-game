// Street life: signal-controlled traffic and sidewalk pedestrians.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, neon, glowTex, M, Rt, cylG, sphG } from '../../hd-demo/lib/characters.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- cars: extruded side profile + glass greenhouse, clearcoat paint
const paintCache = {};
const paint = c => paintCache[c] || (paintCache[c] = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.7, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 }));
let bodyGeo = null, glassGeo = null;
function carGeos() {
  if (bodyGeo) return;
  const s = new THREE.Shape();
  s.moveTo(-2.3, 0.32); s.lineTo(-2.32, 0.86); s.quadraticCurveTo(-2.25, 1.02, -1.95, 1.04); s.lineTo(-1.2, 1.06);
  s.lineTo(-0.72, 1.44); s.lineTo(0.5, 1.44); s.lineTo(1.12, 1.03); s.lineTo(2.08, 0.96); s.quadraticCurveTo(2.36, 0.9, 2.36, 0.62); s.lineTo(2.3, 0.32); s.lineTo(-2.3, 0.32);
  bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 10 }); bodyGeo.translate(0, 0, -0.85);
  const w = new THREE.Shape(); w.moveTo(-1.12, 1.07); w.lineTo(-0.68, 1.39); w.lineTo(0.47, 1.39); w.lineTo(1.04, 1.05); w.lineTo(-1.12, 1.07);
  glassGeo = new THREE.ExtrudeGeometry(w, { depth: 1.82, bevelEnabled: false }); glassGeo.translate(0, 0.005, -0.91);
}
const flareMat = {};
const flare = (c, k) => flareMat[c + k] || (flareMat[c + k] = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(c).multiplyScalar(k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
let taxiSign = null;
let parts = null, beamMat = null, beamGeo = null;
function carParts() {
  if (parts) return parts;
  const bake = list => mergeGeometries(list.map(([geo, x, y, z, rx = 0]) => geo.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(rx).setPosition(x, y, z))));
  const at = (geo, list, rx) => list.map(([x, y, z]) => [geo, x, y, z, rx]), corners = [[1.45, 0.36, 0.88], [1.45, 0.36, -0.88], [-1.45, 0.36, 0.88], [-1.45, 0.36, -0.88]];
  return (parts = {
    tires: bake(at(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), corners, Math.PI / 2)), rims: bake(at(new THREE.CylinderGeometry(0.24, 0.24, 0.27, 12), corners, Math.PI / 2)),
    head: bake(at(new THREE.BoxGeometry(0.06, 0.12, 0.42), [[2.36, 0.74, 0.58], [2.36, 0.74, -0.58]])), tail: bake(at(new THREE.BoxGeometry(0.06, 0.1, 0.5), [[-2.36, 0.8, 0.58], [-2.36, 0.8, -0.58]])),
    stripes: bake(at(new THREE.BoxGeometry(2.6, 0.08, 0.02), [[0, 0.72, 0.93], [0, 0.72, -0.93]])),
  });
}
export function carModel(color, mine, opts = {}) {
  carGeos();
  const g = new THREE.Group(), glass = mat('#0a1018', 0.05, 0.9), tire = mat('#0e0e10', 0.85), rim = mat('#c8c8d0', 0.25, 1);
  const body = new THREE.Mesh(bodyGeo, paint(color)); body.castShadow = true; g.add(body, new THREE.Mesh(glassGeo, glass));
  const wheels = [];
  if (mine) { // your car steers its front wheels
    for (const x of [1.45, -1.45]) for (const z of [0.88, -0.88]) {
      const wg = new THREE.Group(); wg.position.set(x, 0.36, z); g.add(wg); wheels.push(wg);
      wg.add(Rt(M(cylG(0.36, 0.36, 0.26, 20), tire), Math.PI / 2, 0, 0), Rt(M(cylG(0.24, 0.24, 0.27, 12), rim), Math.PI / 2, 0, 0));
    }
    for (const z of [0.58, -0.58]) g.add(M(new THREE.BoxGeometry(0.06, 0.12, 0.42), neon('#fff4d8', 9), 2.36, 0.74, z), M(new THREE.BoxGeometry(0.06, 0.1, 0.5), neon('#ff1a24', 5), -2.36, 0.8, z));
  } else { // other cars: same parts pre-merged per material (6 draw calls instead of 14); plain wheels look the same spinning or not
    const P = carParts();
    g.add(new THREE.Mesh(P.tires, tire), new THREE.Mesh(P.rims, rim), new THREE.Mesh(P.head, neon('#fff4d8', 9)), new THREE.Mesh(P.tail, neon('#ff1a24', 5)));
    for (let i = 0; i < 4; i++) wheels.push(new THREE.Object3D()); // traffic/chase code still turns these
  }
  beamMat = beamMat || new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(0.9, 0.85, 0.7), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const beam = Rt(M(beamGeo = beamGeo || new THREE.PlaneGeometry(10, 6), beamMat), -Math.PI / 2, 0, 0);
  beam.position.set(6.5, 0.05, 0); beam.scale.set(1, 0.6, 1); g.add(beam);
  if (mine) g.add(M(new THREE.BoxGeometry(0.02, 0.1, 0.32), neon('#ff2a3a', 3), -2.33, 0.55, 0));
  // lamp flares: soft halos that bloom and show in the wet-road reflection
  for (const z of [0.58, -0.58]) {
    const h = new THREE.Sprite(flare('#fff1d6', 2.2)); h.position.set(2.5, 0.74, z); h.scale.setScalar(0.9); g.add(h);
    const t = new THREE.Sprite(flare('#ff2020', 1.6)); t.position.set(-2.45, 0.8, z); t.scale.setScalar(0.7); g.add(t);
  }
  if (opts.taxi) { // roof sign + checker stripe
    taxiSign = taxiSign || new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2b0, emissiveIntensity: 0.9, roughness: 0.4 });
    g.add(M(new THREE.BoxGeometry(0.5, 0.22, 1.0), taxiSign, -0.1, 1.56, 0));
    g.add(new THREE.Mesh(carParts().stripes, mat('#141414', 0.5)));
  }
  g.userData.wheels = wheels;
  return g;
}

// ---------- traffic
const COLORS = ['#e8e2d8', '#1a1a22', '#6a7a8a', '#c8a040', '#2a4a7a', '#7a1a1a', '#1a3a2a', '#d0d0d8', '#3a3a42'];
export class Traffic {
  constructor(scene, signals) {
    this.scene = scene; this.signals = signals; this.cars = []; this.t = 0; this.phase = 0;
    const lanes = [{ axis: 'z', dir: 1, c: -3.2, span: 296 }, { axis: 'z', dir: -1, c: 3.2, span: 296 }, { axis: 'x', dir: 1, c: 4, span: 246 }, { axis: 'x', dir: -1, c: -4, span: 246 }];
    for (const L of lanes) { const n = L.axis === 'z' ? 11 : 6; for (let i = 0; i < n; i++) this.spawn(L, -L.span + (i + Math.random() * 0.5) * (2 * L.span / n)); }
  }
  spawn(L, s) {
    const taxi = Math.random() < 0.28, m = carModel(taxi ? '#f2b705' : pick(COLORS), false, { taxi }); this.scene.add(m);
    this.cars.push({ L, s, v: rand(9, 13), max: rand(11, 15), m });
  }
  // light state per axis: 'g' | 'y' | 'r'
  light(axis) { const t = this.t % 30; const zGreen = t < 14, zYellow = t >= 14 && t < 17, xGreen = t >= 17 && t < 27; if (axis === 'z') return zGreen ? 'g' : zYellow ? 'y' : 'r'; return xGreen ? 'g' : (t >= 27 ? 'y' : 'r'); }
  update(dt, player, extra = []) {
    this.t += dt;
    for (const sg of this.signals) { const st = this.light(sg.axis); sg.lamps.forEach((l, i) => l.m.color.copy(l.c).multiplyScalar((st === 'r' && i === 0) || (st === 'y' && i === 1) || (st === 'g' && i === 2) ? 6 : 0.08)); }
    for (const c of this.cars) {
      const { L } = c, pos = c.s * L.dir; // distance travelled along lane direction (s is signed coordinate)
      let target = c.max;
      // red light: stop before the line (line at 14 m before the intersection centre)
      const line = -14, dist = line - c.s * L.dir; // >0 while approaching
      const st = this.light(L.axis);
      if (st !== 'g' && dist > -1 && dist < 30) target = Math.min(target, Math.max(0, (dist - 1) * 0.8));
      // car ahead in same lane
      for (const o of this.cars) if (o !== c && o.L === L) { const gap = (o.s - c.s) * L.dir; if (gap > 0 && gap < 12) target = Math.min(target, Math.max(0, (gap - 6) * 1.2)); }
      // player in the lane ahead
      const px = L.axis === 'z' ? player.x : player.z, pz = L.axis === 'z' ? player.z : player.x;
      if (Math.abs(px - L.c) < 2 && (pz - c.s) * L.dir > 0 && (pz - c.s) * L.dir < 16) target = 0; // 16 m: enough to stop from top speed
      for (const e of extra) { const ex = L.axis === 'z' ? e.x : e.z, ez = L.axis === 'z' ? e.z : e.x; if (Math.abs(ex - L.c) < 2.4 && (ez - c.s) * L.dir > 0 && (ez - c.s) * L.dir < 14) target = Math.min(target, 0); }
      if (c.stun > 0) { c.stun -= dt; target = 0; }
      if (c.stun > 0) c.v *= 0.9;
      c.v += Math.sign(target - c.v) * Math.min(Math.abs(target - c.v), (target < c.v ? 9 : 3) * dt);
      c.s += c.v * L.dir * dt;
      if (c.s * L.dir > L.span) c.s = -L.span * L.dir;
      const x = L.axis === 'z' ? L.c : c.s, z = L.axis === 'z' ? c.s : L.c;
      c.m.position.set(x, 0, z);
      const dx = L.axis === 'x' ? L.dir : 0, dz = L.axis === 'z' ? L.dir : 0; c.m.rotation.y = Math.atan2(-dz, dx);
      for (const w of c.m.userData.wheels) w.rotation.z -= c.v * dt / 0.36;
    }
  }
  // cars as moving obstacles for the player
  hit(x, z, r) { const c = this.blocks(x, z, r); if (c) { c.stun = 1.5; c.v = 0; } return c; }
  blocks(x, z, r) { for (const c of this.cars) { const dx = x - c.m.position.x, dz = z - c.m.position.z, ax = c.L.axis === 'x'; if (Math.abs(ax ? dx : dz) < 2.4 + r && Math.abs(ax ? dz : dx) < 1.0 + r) return c; } return null; }
}

// ---------- pedestrians (light rigs: capsule body, swinging limbs)
const SKIN = ['#4a2a1c', '#6a3e2a', '#8a5636', '#b07a52', '#d8a882', '#e8c0a0'];
const CLOTH = ['#e0e0e0', '#1a1a1a', '#c8141f', '#2a4a7a', '#ff4fd8', '#3ad7ff', '#e8b64c', '#2a6a4a', '#5a2a6a', '#d87a3a'];
export function pedModel() {
  const g = new THREE.Group(), skin = mat(pick(SKIN), 0.55), top = mat(pick(CLOTH), 0.7), bot = mat(pick(['#1a1a22', '#2a3a5a', '#3a2a20', '#d8d0c0']), 0.7);
  const body = M(new THREE.CapsuleGeometry(0.2, 0.55, 4, 10), top, 0, 1.25, 0); body.scale.z = 0.7;
  const head = M(sphG(0.12, 14, 10), skin, 0, 1.72, 0);
  const hair = M(sphG(0.125, 14, 8, 0, Math.PI * 0.55), mat(pick(['#120c0a', '#3a2014', '#a3121c', '#d8c070']), 0.8), 0, 1.74, -0.01);
  g.add(body, head, hair);
  const limb = (x, y, len, r, m) => { const p = new THREE.Group(); p.position.set(x, y, 0); const l = M(new THREE.CapsuleGeometry(r, len, 3, 8), m, 0, -len / 2 - r, 0); p.add(l); g.add(p); return p; };
  const legs = [limb(0.1, 0.92, 0.72, 0.075, bot), limb(-0.1, 0.92, 0.72, 0.075, bot)], arms = [limb(0.27, 1.5, 0.52, 0.055, top), limb(-0.27, 1.5, 0.52, 0.055, top)];
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root: g, legs, arms };
}
export class Pedestrians {
  constructor(scene, walks, n = 26) {
    this.peds = [];
    for (let i = 0; i < n; i++) {
      const w = pick(walks), ped = pedModel(); scene.add(ped.root);
      const len = Math.hypot(w[2] - w[0], w[3] - w[1]);
      this.peds.push({ w, len, t: Math.random() * len, dir: Math.random() < 0.5 ? 1 : -1, off: rand(-1.4, 1.4), v: rand(1.1, 1.6), ph: Math.random() * 6, wait: 0, ...ped });
    }
  }
  update(dt, player, car) {
    for (const p of this.peds) {
      const [x0, z0, x1, z1] = p.w, ux = (x1 - x0) / p.len, uz = (z1 - z0) / p.len;
      const px = x0 + ux * p.t - uz * p.off, pz = z0 + uz * p.t + ux * p.off;
      const toP = Math.hypot(player.x - px, player.z - pz), ahead = ((player.x - px) * ux + (player.z - pz) * uz) * p.dir;
      let speed = p.v;
      if (toP < 1.3 && ahead > 0) { speed = 0; p.off += (p.off > 0 ? 1 : -1) * dt * 0.8; p.off = Math.max(-2, Math.min(2, p.off)); }
      if (car && Math.abs(car.v) > 3) { const cd = Math.hypot(car.x - px, car.z - pz); if (cd < 5) { p.off += (p.off >= 0 ? 1 : -1) * dt * 6; p.off = Math.max(-2.2, Math.min(2.2, p.off)); speed = 0; if (cd < 2.2) { p.dir = -p.dir; p.off = -p.off; } } }
      p.t += speed * p.dir * dt;
      if (p.t > p.len) { p.t = p.len; p.dir = -1; } if (p.t < 0) { p.t = 0; p.dir = 1; }
      p.root.position.set(px, 0.16, pz); p.root.rotation.y = Math.atan2(ux * p.dir, uz * p.dir);
      p.ph += dt * speed * 4.2; const s = Math.sin(p.ph) * (speed > 0 ? 0.55 : 0);
      p.legs[0].rotation.x = s; p.legs[1].rotation.x = -s; p.arms[0].rotation.x = -s * 0.8; p.arms[1].rotation.x = s * 0.8;
      p.root.position.y = 0.16 + Math.abs(Math.cos(p.ph)) * 0.03 * (speed > 0 ? 1 : 0);
    }
  }
}

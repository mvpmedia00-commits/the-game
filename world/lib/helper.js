// Ruby at MVP Studios: she works her way through a list of jobs (studiohq.js → jobs), walking between them along the
// aisle in front of the stage, and plays a matching pose with a prop: broom, rag, gear box or coffee cup.
// attend(x, z) makes her stop and face someone (the player talking to her).
import * as THREE from 'three';
import { mat, cylG, boxG, M } from '../../hd-demo/lib/characters.js';

const S = Math.sin, PI = Math.PI;
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
// work poses (joint keys as in setPose: shoulder x<0 = arm forward, z = out (L +, R -), elbow x<0 = bend)
const POSES = {
  sweep: t => ({ sp: [0.22, 0.18 * S(t * 2.4), 0], hips: [0, 0.1 * S(t * 2.4), 0], hd: [0.25, 0, 0], shR: [-0.9 + 0.22 * S(t * 2.4), 0, -0.12], elR: [-0.55, 0, 0], shL: [-1.1 + 0.22 * S(t * 2.4), 0, 0.38], elL: [-0.9, 0, 0], knL: [0.15, 0, 0], knR: [0.15, 0, 0] }),
  wipe: t => ({ sp: [0.05, 0, 0], hd: [0.05, 0, 0], shR: [-1.45 + 0.18 * S(t * 4), 0, -0.25 + 0.22 * Math.cos(t * 4)], elR: [-0.55, 0, 0], shL: [0.05, 0, 0.2], elL: [-0.3, 0, 0], hips: [0, 0, 0.04] }),
  fold: t => ({ sp: [0.15, 0, 0], hd: [0.2, 0.15 * S(t * 0.7), 0], shL: [-0.85, 0, 0.12 + 0.12 * S(t * 3)], elL: [-1.35, 0, 0], shR: [-0.85, 0, -0.12 - 0.12 * S(t * 3)], elR: [-1.35, 0, 0] }),
  carry: () => ({ shL: [-0.85, 0, 0.32], elL: [-1.15, 0, 0], shR: [-0.85, 0, -0.32], elR: [-1.15, 0, 0], sp: [-0.04, 0, 0] }),
  adjust: t => ({ sp: [-0.08, 0, 0], hd: [-0.35, 0, 0], shL: [-2.0 + 0.08 * S(t * 3), 0, 0.25], elL: [-0.55, 0, 0], shR: [-2.0 - 0.08 * S(t * 3), 0, -0.25], elR: [-0.55, 0, 0] }),
  type: t => ({ sp: [0.12, 0, 0], hd: [0.18, 0.25 * S(t * 0.4), 0], shL: [-0.55, 0, 0.2], elL: [-1.15 + 0.06 * S(t * 13), 0, 0], shR: [-0.55, 0, -0.2], elR: [-1.15 + 0.06 * S(t * 11 + 1), 0, 0] }),
  dust: t => ({ sp: [-0.05, 0.12 * S(t * 3), 0], hd: [-0.2, 0, 0], shR: [-2.6, 0, -0.5 + 0.35 * S(t * 3.5)], elR: [-0.2, 0, 0], shL: [0.05, 0, 0.25], elL: [-0.4, 0, 0] }),
  coffee: t => { const sip = Math.max(0, S(t * 0.9)) ** 2; return { shR: [-0.55 - 0.7 * sip, 0, -0.18], elR: [-1.55 - 0.3 * sip, 0, 0], hd: [-0.15 * sip, 0.2 * S(t * 0.3), 0], shL: [0, 0, 0.12], elL: [-0.2, 0, 0], hips: [0, 0.06 * S(t * 0.4), 0.03] }; },
  idle: t => ({ sp: [0.02, 0, 0], hd: [0, 0, 0], shL: [0.03, 0, 0.12], elL: [-0.25, 0, 0], shR: [0.03, 0, -0.12], elR: [-0.25, 0, 0], hips: [0, 0.05 * S(t * 0.5), 0] }),
};
const PROP_OF = { sweep: 'broom', wipe: 'rag', dust: 'rag', coffee: 'cup', carry: 'box' };

export class StudioHelper {
  constructor(jobs, aisleZ, scene) {
    this.jobs = jobs; this.aisle = aisleZ; this.job = jobs[0];
    this.pl = { scene: 'studio', x: this.job.x, z: this.job.z, ry: this.job.ry, pose: 'helper' };
    this.mode = 'work'; this.t = 0; this.workFor = 10; this.path = []; this.carry = false; this.ph = 0; this.attendT = 0; this.face = 0; this.walkAmt = 0;
    // props
    const black = mat('#141214', 0.6), straw = mat('#c4a060', 0.9), cardboard = mat('#a7814f', 0.85), white = mat('#f2ece6', 0.5), pink = mat('#ff6ea8', 0.7);
    this.props = {
      broom: new THREE.Group(), rag: M(boxG(0.14, 0.03, 0.1), pink), box: new THREE.Group(), cup: M(cylG(0.04, 0.034, 0.1, 12), white),
    };
    this.stick = M(cylG(0.012, 0.012, 1, 6), black); this.stick.geometry = this.stick.geometry.clone(); this.stick.geometry.translate(0, 0.5, 0);
    this.head = M(boxG(0.32, 0.09, 0.08), straw); this.props.broom.add(this.stick, this.head);
    this.props.box.add(M(boxG(0.42, 0.3, 0.32), cardboard), M(boxG(0.43, 0.02, 0.05), mat('#3a2a1a', 0.8), 0, 0.15, 0));
    for (const p of Object.values(this.props)) { p.visible = false; scene.add(p); }
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
  }
  get doing() { return this.mode === 'walk' ? (this.carry ? 'Bringing gear to the stage' : 'On her way to the next job') : this.mode === 'attend' ? 'Talking to you' : this.job.say; }
  route(a, b) { const pts = []; if (Math.abs(a.z - this.aisle) > 0.3) pts.push({ x: a.x, z: this.aisle }); pts.push({ x: b.x, z: this.aisle }, { x: b.x, z: b.z }); return pts; }
  next() {
    let j; do j = this.jobs[Math.floor(Math.random() * this.jobs.length)]; while (j === this.job && this.jobs.length > 1);
    this.job = j; this.carry = false;
    this.path = j.carryFrom ? [...this.route(this.pl, j.carryFrom), { pickup: true }, ...this.route(j.carryFrom, j)] : this.route(this.pl, j);
    this.mode = 'walk';
  }
  attend(x, z, secs = 8) { if (this.mode !== 'attend') this.attendLen = secs; this.attendT = secs; this.face = Math.atan2(x - this.pl.x, z - this.pl.z); if (this.mode !== 'attend') { this.before = this.mode; this.mode = 'attend'; } }
  // movement (runs even when the player is elsewhere, so she's somewhere new when you come back)
  tick(dt) {
    const pl = this.pl;
    if (this.mode === 'attend') { this.attendT -= dt; pl.ry += angDiff(pl.ry, this.face) * Math.min(1, dt * 6); if (this.attendT <= 0) this.mode = this.before === 'walk' ? 'walk' : 'work'; return; }
    if (this.mode === 'work') { this.t += dt; pl.ry += angDiff(pl.ry, this.job.ry) * Math.min(1, dt * 4); if (this.t > this.workFor) { this.t = 0; this.workFor = this.job.act === 'stack' ? 4 : this.job.act === 'dance' ? 18 : 9 + Math.random() * 6; this.next(); } return; }
    // walking
    let tgt = this.path[0];
    while (tgt && tgt.pickup) { this.carry = true; this.path.shift(); tgt = this.path[0]; }
    if (!tgt) { this.mode = 'work'; this.t = 0; this.workFor = this.job.act === 'stack' ? 4 : this.job.act === 'dance' ? 18 : 9 + Math.random() * 6; return; }
    const dx = tgt.x - pl.x, dz = tgt.z - pl.z, d = Math.hypot(dx, dz), step = 1.25 * dt;
    if (d <= step) { pl.x = tgt.x; pl.z = tgt.z; this.path.shift(); }
    else { pl.x += dx / d * step; pl.z += dz / d * step; pl.ry += angDiff(pl.ry, Math.atan2(dx, dz)) * Math.min(1, dt * 8); }
    this.ph += dt * 7.2;
  }
  // animation + props (only while the player is in the studio)
  pose(C, rig, dt, t) {
    const walking = this.mode === 'walk';
    // recorded clips from Ruby's own file: dance rehearsal on Stage A, and a nod when you come over to talk
    if (rig.dance && ((this.mode === 'work' && this.job.act === 'dance') || (this.mode === 'attend' && this.attendT > this.attendLen - 3.5))) {
      if (!this.dancing) { rig.dance.mixer.stopAllAction(); rig.dance.cur = null; this.dancing = true; } // start each clip clean
      rig.dance.play(this.mode === 'attend' ? 'nod' : 'twerk', 0.35); rig.dance.update(dt, 0); this.hideProps(); return;
    }
    this.dancing = false;
    this.walkAmt += ((walking ? 1 : 0) - this.walkAmt) * Math.min(1, dt * 6);
    let act = walking ? (this.carry ? 'carry' : null) : this.mode === 'attend' ? 'idle' : this.job.act;
    if (act === 'stack') act = this.t < 1.6 ? 'carry' : 'adjust'; // set the box down, then square it up
    if (walking && !this.carry) {
      C.walkPose(rig, this.ph, 0.85, Math.min(1, dt * 10));
      if (rig.apply) rig.apply();
      if (rig.mocap) { rig.mocap.play('walk', 0.3, 1.0); rig.mocap.update(dt, 0); }
    } else {
      const p = POSES[act](t);
      if (walking) { const s = S(this.ph), c = Math.cos(this.ph); Object.assign(p, { hpL: [-s * 0.45, 0, 0], hpR: [s * 0.45, 0, 0], knL: [Math.max(0, c) * 0.85, 0, 0], knR: [Math.max(0, -c) * 0.85, 0, 0], hips: [0, s * 0.06, 0] }); }
      C.setPose(rig, p, Math.min(1, dt * 7));
      if (rig.apply) rig.apply();
      if (rig.mocap) { rig.mocap.play(walking ? 'walk' : 'idle', 0.3); rig.mocap.update(dt, 1); }
    }
    this.placeProps(rig, act, t);
  }
  hideProps() { for (const p of Object.values(this.props)) p.visible = false; }
  placeProps(rig, act, t) {
    const want = PROP_OF[act] || null, P = this.props;
    for (const [k, p] of Object.entries(P)) p.visible = k === want && !!rig.handR;
    if (!want || !rig.handR) return;
    rig.root.updateMatrixWorld(true);
    const hr = rig.handR.getWorldPosition(this.v), ry = this.pl.ry, fx = S(ry), fz = Math.cos(ry);
    if (want === 'broom') { // stick from her hands to the floor in front of her, swishing side to side
      const sw = 0.25 * S(t * 2.4), fl = this.v2.set(this.pl.x + fx * 0.55 + fz * sw, 0.03, this.pl.z + fz * 0.55 - fx * sw);
      const dir = hr.clone().sub(fl), len = dir.length();
      P.broom.position.copy(fl); this.stick.scale.set(1, len + 0.15, 1); this.stick.quaternion.setFromUnitVectors(this.up, dir.normalize());
      this.head.position.set(0, 0.04, 0); this.head.rotation.set(0, ry + PI / 2, 0); P.broom.rotation.set(0, 0, 0);
    } else if (want === 'box') {
      const hl = rig.handL.getWorldPosition(this.v2); P.box.position.copy(hr).add(hl).multiplyScalar(0.5); P.box.position.y -= 0.05; P.box.rotation.set(0, ry, 0);
    } else { const p = P[want]; p.position.copy(hr); p.rotation.set(0, ry, 0); }
  }
}

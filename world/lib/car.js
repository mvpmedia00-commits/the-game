// Driving: the player's car and the getaway cars in chase missions.
// Heading `a` follows the character convention: forward = (sin a, cos a) on the x/z plane.
import * as THREE from 'three';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const HL = 2.3, HW = 1.0; // half length / half width (m)

export class PlayerCar {
  constructor(model, x, z, a) { this.m = model; this.x = x; this.z = z; this.a = a; this.v = 0; this.steer = 0; this.bump = 0; this.place(); }
  place() { this.m.position.set(this.x, 0, this.z); this.m.rotation.y = Math.atan2(-Math.cos(this.a), Math.sin(this.a)); }
  corners(x, z, a) { const fx = Math.sin(a), fz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a); return [[HL, HW], [HL, -HW], [-HL, HW], [-HL, -HW], [HL, 0], [-HL, 0]].map(([f, r]) => [x + fx * f + rx * r, z + fz * f + rz * r]); }
  blocked(x, z, a, D) {
    for (const [px, pz] of this.corners(x, z, a)) {
      if (!D.inBounds(px, pz)) return true;
      for (const c of D.colliders) if (px > c.minX && px < c.maxX && pz > c.minZ && pz < c.maxZ) return true;
      for (const c of D.circles) if ((px - c.x) ** 2 + (pz - c.z) ** 2 < c.r * c.r) return true;
    }
    return false;
  }
  // input: f (-1..1 throttle/brake), r (-1..1 steer), brake (handbrake bool)
  update(dt, input, D, traffic, maxSpeed = 32) {
    const { f, r, brake } = input;
    if (f > 0.05) this.v += (this.v < 0 ? 22 : 9.5) * f * dt;
    else if (f < -0.05) this.v -= (this.v > 0 ? 20 : 6) * -f * dt;
    else this.v -= Math.sign(this.v) * Math.min(Math.abs(this.v), 3.2 * dt);
    if (brake) this.v -= Math.sign(this.v) * Math.min(Math.abs(this.v), 24 * dt);
    this.v = clamp(this.v, -9, maxSpeed);
    this.steer += (r - this.steer) * Math.min(1, dt * 6);
    const turn = this.steer * (brake ? 2.6 : 1.9) * clamp(this.v / 7, -1, 1) * (1 - Math.min(0.45, Math.abs(this.v) / 80));
    const px0 = this.x, pz0 = this.z;
    const na = this.a - turn * dt, nx = this.x + Math.sin(na) * this.v * dt, nz = this.z + Math.cos(na) * this.v * dt;
    this.bump = Math.max(0, this.bump - dt);
    let hit = 0;
    if (!this.blocked(nx, nz, na, D)) { this.x = nx; this.z = nz; this.a = na; }
    else if (!this.blocked(nx, this.z, na, D)) { this.x = nx; this.a = na; this.v *= 0.94; }
    else if (!this.blocked(this.x, nz, na, D)) { this.z = nz; this.a = na; this.v *= 0.94; }
    else { hit = Math.abs(this.v); this.v *= -0.25; }
    // traffic: only the bumper in the direction of travel collides, and a hit puts you back where you were with a
    // small bounce, so you can always back away or steer round (no more sticking to a car you touched)
    const dir = this.v >= 0 ? 1 : -1;
    const other = traffic && Math.abs(this.v) > 0.05 && traffic.blocks(this.x + Math.sin(this.a) * 1.6 * dir, this.z + Math.cos(this.a) * 1.6 * dir, 1.1);
    if (other) {
      hit = Math.max(hit, Math.abs(this.v)); this.x = px0; this.z = pz0; this.v *= -0.25; // keep the new heading: you can steer off it
      if (hit > 3) { other.stun = 1.5; other.v = 0; } // a real crash stops the other car; a nudge doesn't, so it drives off and frees you
    }
    this.place();
    for (const w of this.m.userData.wheels) w.rotation.z -= this.v * dt / 0.36;
    if (this.m.userData.wheels) { this.m.userData.wheels[0].rotation.y = this.m.userData.wheels[1].rotation.y = this.steer * 0.45; }
    return hit;
  }
}

// Getaway driver: follows the road network (boulevard + Fremont) and turns away from the player at the crossing.
const NODES = { C: [0, 0], N: [0, -290], S: [0, 290], E: [240, 0], W: [-240, 0] };
export class Chaser {
  constructor(model, opts) {
    this.m = model; this.hp = this.maxHp = opts.hp; this.speed = opts.speed; this.v = 0; this.hitCd = 0;
    this.from = opts.from || 'C'; this.to = opts.to || 'N'; this.t = 0; this.x = NODES[this.from][0]; this.z = NODES[this.from][1]; this.a = 0; this.done = false;
    if (opts.x !== undefined) { this.x = opts.x; this.z = opts.z; }
  }
  lane(from, to) { // right-hand lane offset for travel from->to
    const [x0, z0] = NODES[from], [x1, z1] = NODES[to], dx = Math.sign(x1 - x0), dz = Math.sign(z1 - z0);
    return { ox: dz ? -dz * 3.2 : 0, oz: dx ? dx * 4 : 0 };
  }
  pickNext(player) {
    if (this.to !== 'C') { this.from = this.to; this.to = 'C'; return; }
    const options = ['N', 'S', 'E', 'W'].filter(k => k !== this.from);
    options.sort((a, b) => Math.hypot(NODES[b][0] - player.x, NODES[b][1] - player.z) - Math.hypot(NODES[a][0] - player.x, NODES[a][1] - player.z) + (Math.random() - 0.5) * 120);
    this.from = 'C'; this.to = options[0];
  }
  update(dt, player, traffic) {
    if (this.hp <= 0) { this.v *= 0.94; } else this.v += (this.speed - this.v) * Math.min(1, dt * 1.5);
    const { ox, oz } = this.lane(this.from, this.to), tx = NODES[this.to][0] + ox, tz = NODES[this.to][1] + oz;
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 6 && this.hp > 0) this.pickNext(player);
    const want = Math.atan2(dx, dz); this.a += angDiff(this.a, want) * Math.min(1, dt * 4);
    this.x += Math.sin(this.a) * this.v * dt; this.z += Math.cos(this.a) * this.v * dt;
    if (traffic) traffic.hit(this.x + Math.sin(this.a) * 2, this.z + Math.cos(this.a) * 2, 1);
    this.m.position.set(this.x, 0, this.z); this.m.rotation.y = Math.atan2(-Math.cos(this.a), Math.sin(this.a));
    for (const w of this.m.userData.wheels) w.rotation.z -= this.v * dt / 0.36;
    this.hitCd = Math.max(0, this.hitCd - dt);
  }
  // ram check against the player's car; returns damage dealt
  ram(car) {
    const d = Math.hypot(car.x - this.x, car.z - this.z);
    if (d > 4.2 || this.hitCd > 0 || this.hp <= 0) return 0;
    const rel = Math.abs(car.v - this.v * Math.cos(angDiff(car.a, this.a))) + Math.abs(car.v) * 0.3;
    const dmg = Math.round(10 + Math.min(40, rel * 1.4));
    this.hp -= dmg; this.hitCd = 0.6; car.v *= 0.55;
    const push = 4.2 - d; car.x += (car.x - this.x) / (d || 1) * push; car.z += (car.z - this.z) / (d || 1) * push;
    return dmg;
  }
}

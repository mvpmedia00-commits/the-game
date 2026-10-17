// Every point light in a scene is paid for by every lit pixel, near or far. The street has 14 fixed ones
// (shop doors, the Crown canopy, the fountain, the pool, the LED-board spill), but only the few near the
// camera visibly light anything. LightPool keeps their settings as "virtual" lights and drives a small,
// fixed number of real lights from the ones closest to the view, fading them in and out when the set changes.
// The real light count never changes, so no shader ever recompiles.
import * as THREE from 'three';

export class LightPool {
  constructor(scene, lights, slots = 5) {
    this.v = lights.map(l => { l.updateWorldMatrix(true, false);
      const v = { pos: l.getWorldPosition(new THREE.Vector3()), color: l.color.clone(), intensity: l.intensity, distance: l.distance, decay: l.decay };
      l.parent.remove(l); return v; });
    this.slots = Array.from({ length: Math.min(slots, this.v.length) }, () => { const light = new THREE.PointLight(0xffffff, 0, 1, 2); scene.add(light); return { light, v: null, k: 0 }; });
    this.focus = new THREE.Vector3(); this.dir = new THREE.Vector3(); this.first = true;
  }
  // focus: a point a little ahead of the camera, where lighting is most visible
  update(dt, camera) {
    camera.getWorldDirection(this.dir); this.focus.copy(camera.position).addScaledVector(this.dir, 12);
    const f = this.focus, score = v => v.pos.distanceTo(f) - v.distance * 0.5;
    const want = this.v.slice().sort((a, b) => score(a) - score(b)).slice(0, this.slots.length);
    for (const s of this.slots) {
      if (s.v && want.includes(s.v)) s.k = Math.min(1, s.k + dt * 3);
      else if (s.v && s.k > 0 && !this.first) s.k -= dt * 3;
      else { s.v = want.find(v => !this.slots.some(o => o.v === v)) || null; s.k = this.first ? 1 : 0;
        if (s.v) { s.light.position.copy(s.v.pos); s.light.color.copy(s.v.color); s.light.distance = s.v.distance; s.light.decay = s.v.decay; } }
      s.light.intensity = s.v ? s.v.intensity * Math.max(0, s.k) : 0;
    }
    this.first = false;
  }
}

// The Velvet Room: club interior for Ruby's headliner set.
import * as THREE from 'three';
import { mat, neon, signMesh, canvasTex, M, Rt, boxG, cylG, sphG } from '../../hd-demo/lib/characters.js';
import { pedModel } from './npcs.js';

export function buildClub(sc) {
  sc.background = new THREE.Color(0x070306); sc.fog = new THREE.FogExp2(0x12060a, 0.035);
  const colliders = [], circles = [];
  const velvet = canvasTex(512, 256, (g) => { for (let i = 0; i < 32; i++) { const v = i % 2 ? 0.55 : 0.85; g.fillStyle = `rgb(${120 * v | 0},${8 * v | 0},${22 * v | 0})`; g.fillRect(i * 16, 0, 16, 256); } const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); });
  velvet.wrapS = THREE.RepeatWrapping; velvet.repeat.set(6, 1);
  const tiles = canvasTex(256, 256, (g) => { g.fillStyle = '#060406'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#141014' : '#0c080c'; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(12, 14);
  const floor = Rt(M(new THREE.PlaneGeometry(26, 30), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.18, metalness: 0.4 })), -Math.PI / 2, 0, 0); floor.receiveShadow = true; sc.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ map: velvet, roughness: 0.95 });
  for (const [x, z, w, ry] of [[0, -15, 26, 0], [-13, 0, 30, Math.PI / 2], [13, 0, 30, -Math.PI / 2], [0, 15, 26, Math.PI]]) { const wl = M(new THREE.PlaneGeometry(w, 8), wallM, x, 4, z); wl.rotation.y = ry; sc.add(wl); }
  sc.add(Rt(M(new THREE.PlaneGeometry(26, 30), mat('#050304', 1)), Math.PI / 2, 0, 0)); sc.children[sc.children.length - 1].position.y = 8;
  // stage
  const stage = new THREE.Group(); stage.position.set(0, 0, -7); sc.add(stage);
  stage.add(Object.assign(M(cylG(3.4, 3.5, 0.6, 48), mat('#0e0408', 0.12, 0.6), 0, 0.3, 0), { receiveShadow: true }));
  stage.add(Rt(M(new THREE.TorusGeometry(3.45, 0.04, 8, 80), neon('#ff2a4a', 6), 0, 0.6, 0), Math.PI / 2, 0, 0));
  stage.add(Rt(M(new THREE.TorusGeometry(3.52, 0.03, 8, 80), neon('#ff4fd8', 4), 0, 0.05, 0), Math.PI / 2, 0, 0));
  stage.add(M(cylG(0.045, 0.045, 7.4, 16), mat('#e8e8f0', 0.06, 1), 0, 4.3, -1.6));
  const back = M(new THREE.PlaneGeometry(10, 7.4), new THREE.MeshStandardMaterial({ map: velvet.clone(), roughness: 0.9 }), 0, 3.7, -3.6); back.material.map.repeat.set(3, 1); back.material.map.needsUpdate = true; stage.add(back);
  const sign = signMesh('THE VELVET ROOM', '#ff2a4a', 8, 1.5); sign.position.set(0, 6.3, -3.5); stage.add(sign);
  circles.push({ x: 0, z: -7, r: 3.7 });
  // moving spotlights with visible beams
  const spots = [];
  for (const [x, c] of [[-4.5, 0xff2a4a], [0, 0xffffff], [4.5, 0xff4fd8]]) {
    const s = new THREE.SpotLight(c, 260, 22, 0.32, 0.5, 1.5); s.position.set(x, 7.6, -2); s.target.position.set(0, 1, -7); sc.add(s, s.target);
    if (c === 0xffffff) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0005; }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(0.35), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.geometry.translate(0, -3.5, 0); beam.position.copy(s.position); sc.add(beam);
    spots.push({ s, beam, x, ph: Math.random() * 6 });
  }
  sc.add(new THREE.HemisphereLight(0x5a2a3a, 0x0a0406, 0.6));
  // bar along the right wall
  const bar = new THREE.Group(); bar.position.set(10.5, 0, 2); sc.add(bar);
  bar.add(M(boxG(1.2, 1.1, 12), mat('#1a0a0c', 0.3, 0.4), 0, 0.55, 0), M(boxG(1.4, 0.08, 12.2), mat('#c8a050', 0.2, 1), 0, 1.12, 0), M(boxG(0.06, 0.06, 12), neon('#ff2a4a', 4), -0.62, 0.15, 0));
  for (let k = 0; k < 3; k++) { bar.add(M(boxG(0.4, 0.05, 11), mat('#2a1a10', 0.5), 2.2, 1.6 + k * 0.8, 0), M(boxG(0.04, 0.04, 11), neon('#ffcc66', 3), 2.05, 1.58 + k * 0.8, 0));
    for (let z = -5.2; z <= 5.2; z += 0.35) bar.add(M(cylG(0.05, 0.06, 0.32, 8), new THREE.MeshStandardMaterial({ color: ['#3a7a3a', '#8a5a1a', '#d8d0c0', '#5a1a2a'][Math.floor(Math.random() * 4)], roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }), 2.2, 1.79 + k * 0.8, z)); }
  for (let z = -4.5; z <= 4.5; z += 1.5) { bar.add(M(cylG(0.25, 0.25, 0.08, 16), mat('#8a0a14', 0.7), -1.4, 0.8, z), M(cylG(0.04, 0.04, 0.8, 8), mat('#c8c8d0', 0.2, 1), -1.4, 0.4, z)); }
  colliders.push({ minX: 9.6, maxX: 13, minZ: -4.2, maxZ: 8.2 });
  const barLight = new THREE.PointLight(0xffb060, 30, 10, 2); barLight.position.set(11, 3, 2); sc.add(barLight);
  // booths on the left wall
  for (const z of [-2, 3, 8]) {
    const b = new THREE.Group(); b.position.set(-11.2, 0, z); sc.add(b);
    b.add(M(boxG(1.4, 0.5, 3.2), mat('#6a0a18', 0.6), 0, 0.25, 0), M(boxG(0.4, 1.2, 3.2), mat('#6a0a18', 0.6), -0.7, 0.6, 0), M(cylG(0.5, 0.5, 0.06, 20), mat('#1a1a1a', 0.2, 0.6), 1.4, 0.72, 0), M(cylG(0.05, 0.05, 0.7, 8), mat('#888', 0.3, 0.9), 1.4, 0.36, 0));
    b.add(M(sphG(0.09, 10, 8), neon('#ffd27a', 4), 1.4, 0.82, 0));
    colliders.push({ minX: -13, maxX: -9.4, minZ: z - 1.7, maxZ: z + 1.7 });
  }
  // crowd facing the stage
  const crowd = [];
  for (let i = 0; i < 18; i++) {
    const a = -1.15 + (i / 17) * 2.3 + (Math.random() - 0.5) * 0.12, r = 4.9 + Math.random() * 2.6;
    const x = Math.sin(a) * r, z = -7 + Math.cos(a) * r;
    if (Math.abs(x) < 1.4 && z > -3) continue; // keep a lane open for the photographer
    const p = pedModel(); p.root.position.set(x, 0, z); p.root.rotation.y = Math.atan2(-x, -7 - z); sc.add(p.root);
    crowd.push({ ...p, ph: Math.random() * 6 }); circles.push({ x, z, r: 0.4 });
  }
  const bounds = { minX: -12.4, maxX: 12.4, minZ: -14.4, maxZ: 14 };
  const exit = { x: 0, z: 13.2 };
  const update = (t) => {
    for (const s of spots) { const tx = Math.sin(t * 0.7 + s.ph) * 2.2, tz = -7 + Math.cos(t * 0.5 + s.ph) * 1.4; s.s.target.position.set(tx, 1, tz); const dir = new THREE.Vector3(tx - s.s.position.x, 1 - s.s.position.y, tz - s.s.position.z).normalize(); s.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); }
    for (const c of crowd) { const b = Math.max(0, Math.sin(t * 7 + c.ph)); c.root.position.y = b * 0.06; const up = Math.sin(c.ph) > 0.2; c.arms[0].rotation.x = up ? -2.5 - b * 0.4 : -0.2 - b * 0.3; c.arms[1].rotation.x = -0.15 - b * 0.25; }
  };
  return { colliders, circles, bounds, exit, stageSpot: { x: 0, y: 0.6, z: -7 }, update };
}

// MVP Studios set (cyclorama, softboxes, LED tubes, road cases) ported from Beyond the Frame.
import * as THREE from 'three';
import { mat, cylG, sphG, boxG, planeG, M, Sc, Rt, canvasTex, signMesh, neon, makeDSLR } from './characters.js';
// ------------------------------------------------------------ MVP STUDIOS SET (title screen + studio shoots)

function cycGeo(w = 18) {
  const pts = [];
  for (let i = 0; i <= 5; i++) pts.push([3 - i, 0]);
  for (let i = 1; i <= 14; i++) { const t = i / 14 * Math.PI / 2; pts.push([-2 - 2.4 * Math.sin(t), 2.4 - 2.4 * Math.cos(t)]); }
  for (let i = 1; i <= 4; i++) pts.push([-4.4, 2.4 + i * 2]);
  const nx = 10, pos = [], uv = [], idx = [];
  pts.forEach(([z, y], j) => { for (let i = 0; i <= nx; i++) { pos.push(-w / 2 + w * i / nx, y, z); uv.push(i / nx, j / (pts.length - 1)); } });
  for (let j = 0; j < pts.length - 1; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + nx + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function cStand(x, z, h) {
  const g = new THREE.Group(), chrome = mat('#b8b8c0', 0.25, 1); g.position.set(x, 0, z);
  g.add(M(cylG(0.018, 0.022, h, 8), chrome, 0, h / 2, 0));
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, l = Rt(M(cylG(0.012, 0.012, 0.75, 6), chrome, Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28), 0, -a, 0); l.rotation.z = 1.0 * (Math.cos(a) >= 0 ? -1 : 1); l.rotation.set(Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0); g.add(l); g.add(M(sphG(0.03, 8, 6), mat('#111', 0.6), Math.cos(a) * 0.52, 0.03, Math.sin(a) * 0.52)); }
  return g;
}
function softbox(x, z, h, aimX, aimZ, w = 1.25, hh = 1.7) {
  const g = cStand(x, z, h - 0.6), head = new THREE.Group(); head.position.set(0, h, 0); g.add(head);
  head.add(M(boxG(w + 0.12, hh + 0.12, 0.4), mat('#0c0c0e', 0.6), 0, 0, -0.2));
  head.add(M(planeG(w, hh), neon('#fff8f0', 3.2), 0, 0, 0.005));
  head.add(M(boxG(w + 0.16, 0.05, 0.05), neon('#ff1a2a', 2), 0, -hh / 2 - 0.08, 0));
  head.lookAt(new THREE.Vector3(aimX - x, 1.1 - h, aimZ - z).add(head.position));
  return g;
}
function roadCase(x, z, w, h, d, ry, label = true) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  g.add(M(boxG(w, h, d), mat('#0e0e10', 0.5, 0.1), 0, h / 2 + 0.08, 0));
  const al = mat('#9a9aa2', 0.3, 1);
  for (const yy of [0.1, h + 0.06]) g.add(M(boxG(w + 0.02, 0.025, d + 0.02), al, 0, yy, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(M(boxG(0.03, h, 0.03), al, sx * w / 2, h / 2 + 0.08, sz * d / 2), M(cylG(0.045, 0.045, 0.04, 10), mat('#111', 0.7), sx * (w / 2 - 0.08), 0.04, sz * (d / 2 - 0.08)));
  if (label) { const s = signMesh('MVP MEDIA', '#ff2a3a', w * 0.7, w * 0.2); s.material = s.material.clone(); s.material.color.setScalar(1); s.position.set(0, h * 0.62 + 0.08, d / 2 + 0.012); g.add(s); }
  return g;
}
function buildStudio(sc, hero) {
  sc.background = new THREE.Color(0x0b0a0d); sc.fog = new THREE.Fog(0x0b0a0d, 14, 40);
  const rough = canvasTex(256, 256, (g) => { g.fillStyle = 'rgb(110,110,110)'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { const v = 70 + Math.random() * 110; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } });
  rough.colorSpace = THREE.NoColorSpace; rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.repeat.set(10, 10);
  const floor = Rt(M(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x3a3a40), roughness: 1, roughnessMap: rough, metalness: 0.3, envMapIntensity: 0.8 }), 0, -0.002, 0), -Math.PI / 2, 0, 0); floor.receiveShadow = true; sc.add(floor);
  const cyc = new THREE.Mesh(cycGeo(), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x6a6a72), roughness: 0.95, envMapIntensity: 0.5, side: THREE.DoubleSide })); cyc.receiveShadow = true; sc.add(cyc);
  sc.add(new THREE.HemisphereLight(0xdde0ff, 0x221418, 0.12));
  const key = new THREE.SpotLight(0xfff4ea, 1.7, 30, 0.42, 0.55, 1.2); key.position.set(-3.4, 4.2, 3.6); key.target.position.set(0, 1, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.radius = 4; sc.add(key, key.target);
  const fill = new THREE.SpotLight(0xfff0e8, 0.55, 30, 0.6, 0.8, 1.2); fill.position.set(4, 3.2, 4); fill.target.position.set(0, 1, 0); sc.add(fill, fill.target);
  const rim = new THREE.SpotLight(0xff2030, 2.6, 20, 0.5, 0.6, 1.2); rim.position.set(2.5, 3.5, -3); rim.target.position.set(0, 1.3, 0); sc.add(rim, rim.target);
  const rim2 = new THREE.SpotLight(0xff2030, 2, 20, 0.5, 0.6, 1.2); rim2.position.set(-3, 3, -2.8); rim2.target.position.set(0, 1.3, 0); sc.add(rim2, rim2.target);
  const back = new THREE.SpotLight(0xd8dcff, 0.9, 16, 0.7, 0.9, 1); back.position.set(0, 7, 1); back.target.position.set(0, 2, -4.4); sc.add(back, back.target);
  sc.add(softbox(-2.9, 0.9, 2.9, 0, 0), softbox(3.1, 0.2, 2.6, 0, 0, 1.0, 1.9));
  for (const [x, z] of [[-6.8, -2.6], [-6.2, -3.7], [6.8, -2.6], [6.2, -3.7]]) { sc.add(M(cylG(0.035, 0.035, 2.6, 10), neon('#ff1a2a', 4), x, 1.3, z)); const l = new THREE.PointLight(0xff1a2a, 0.8, 5); l.position.set(x, 1.3, z + 0.3); sc.add(l); }
  // overhead truss
  const truss = mat('#1a1a1e', 0.5, 0.7);
  for (const z of [-1, 2.5]) { sc.add(M(boxG(16, 0.06, 0.06), truss, 0, 6, z), M(boxG(16, 0.06, 0.06), truss, 0, 6.4, z)); for (let x = -8; x <= 8; x += 0.5) sc.add(Rt(M(boxG(0.02, 0.48, 0.02), truss, x, 6.2, z), 0, 0, 0.6)); }
  // gear: cart with lenses, road cases, laptop station
  const cart = new THREE.Group(); cart.position.set(-3.9, 0, -0.9); cart.rotation.y = 0.35; sc.add(cart);
  cart.add(M(boxG(1.5, 0.95, 0.65), mat('#0d0d0f', 0.45, 0.2), 0, 0.6, 0));
  for (let i = 0; i < 4; i++) cart.add(M(boxG(1.4, 0.01, 0.005), mat('#3a3a40', 0.4, 0.8), 0, 0.3 + i * 0.2, 0.327));
  const cl = signMesh('MVP MEDIA', '#ff2a3a', 0.9, 0.22); cl.position.set(0, 0.62, 0.33); cart.add(cl);
  for (let i = 0; i < 4; i++) cart.add(M(cylG(0.045, 0.045, 0.16 + i * 0.03, 16), mat('#141416', 0.35, 0.4), -0.5 + i * 0.22, 1.16 + i * 0.015, 0));
  const cm = makeDSLR(); cm.position.set(0.5, 1.13, 0); cm.rotation.y = 0.6; cart.add(cm);
  sc.add(roadCase(3.9, 1.2, 1.1, 0.8, 0.7, -0.5), roadCase(-4.3, -1.6, 0.9, 0.6, 0.6, 0.3, false), roadCase(4.6, -1.5, 0.8, 1.0, 0.6, -0.2, false));
  const lap = new THREE.Group(); lap.position.set(4.3, 0, -1.2); lap.rotation.y = -0.7; sc.add(lap);
  lap.add(cStand(0, 0, 1.0), M(boxG(0.6, 0.03, 0.45), mat('#151517', 0.4, 0.5), 0, 1.02, 0), M(boxG(0.42, 0.015, 0.3), mat('#2a2a2e', 0.3, 0.8), 0, 1.045, 0.03));
  const scr = canvasTex(512, 320, (g) => { g.fillStyle = '#121216'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#1e1e24'; g.fillRect(0, 0, 512, 24); g.fillStyle = '#e0202e'; g.fillRect(8, 8, 60, 8);
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#3a0a10', '#5a1018', '#2a2a32'][i % 3]; g.fillRect(14 + (i % 3) * 120, 40 + Math.floor(i / 3) * 130, 110, 120); g.fillStyle = '#c8141f'; g.fillRect(50 + (i % 3) * 120, 70 + Math.floor(i / 3) * 130, 20, 70); g.fillStyle = '#d8a882'; g.beginPath(); g.arc(60 + (i % 3) * 120, 62 + Math.floor(i / 3) * 130, 10, 0, 7); g.fill(); }
    g.fillStyle = '#26262c'; g.fillRect(390, 40, 110, 250); });
  const screen = M(planeG(0.42, 0.27), new THREE.MeshBasicMaterial({ map: scr }), 0, 1.2, -0.12); screen.rotation.x = -0.25; screen.material.color.setScalar(1.6); lap.add(screen, Rt(M(boxG(0.44, 0.29, 0.01), mat('#2a2a2e', 0.3, 0.8), 0, 1.2, -0.128), -0.25, 0, 0));
  sc.add(cStand(-2.2, -2.2, 3.4), cStand(2.6, -2.4, 3.0));
  return { key, rim, fill };
}
export { buildStudio };

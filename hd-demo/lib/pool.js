// Desert Rose rooftop pool at sunset: sky shader, animated water, palms, loungers, neon sign.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { mat, cylG, sphG, boxG, M, Sc, Rt, canvasTex, signMesh, neon } from './characters.js';

function tileTex(base, grout, n = 8, size = 512) {
  const t = canvasTex(size, size, (g) => {
    g.fillStyle = grout; g.fillRect(0, 0, size, size); const s = size / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = new THREE.Color(base); c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06); g.fillStyle = '#' + c.getHexString(); g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function waterNormals() { // tiling normal map from summed waves
  const size = 256, t = canvasTex(size, size, (g) => {
    const img = g.createImageData(size, size), h = (x, y) => Math.sin((x + y * 0.3) * 0.098) * 0.6 + Math.sin((x * 0.7 - y) * 0.147) * 0.4 + Math.sin((x * 0.2 + y * 1.3) * 0.245) * 0.3 + Math.sin((x - y * 0.5) * 0.393) * 0.15;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1), n = new THREE.Vector3(-dx, -dy, 1.4).normalize(), i = (y * size + x) * 4;
      img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function palm(x, z, h, lean) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const trunk = mat('#6a5240', 0.95), leaf = mat('#2a6a34', 0.8, 0, { side: THREE.DoubleSide });
  let px = 0, py = 0;
  for (let i = 0; i < 10; i++) { const seg = M(cylG(0.13 - i * 0.006, 0.15 - i * 0.006, h / 10, 8), trunk, px, py + h / 20, 0); seg.rotation.z = -lean * (i / 10); g.add(seg); px += Math.sin(lean * i / 10) * h / 10; py += Math.cos(lean * i / 10) * h / 10; }
  const crown = new THREE.Group(); crown.position.set(px, py, 0); g.add(crown);
  const fg = new THREE.PlaneGeometry(0.5, 2.6, 1, 6); fg.translate(0, 1.3, 0);
  const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -Math.pow(y / 2.6, 2) * 0.9); p.setX(i, p.getX(i) * Math.sin(Math.PI * y / 2.6 * 0.9 + 0.1)); } fg.computeVertexNormals();
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(fg, leaf); f.rotation.set(-1.1 + Math.random() * 0.3, i / 9 * Math.PI * 2, 0, 'YXZ'); f.castShadow = true; crown.add(f); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function lounger(x, z, ry, cushion) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  const frame = mat('#e8e4dc', 0.4, 0.3), cu = mat(cushion, 0.85);
  g.add(M(boxG(0.7, 0.08, 1.4), cu, 0, 0.38, 0.2), Rt(M(boxG(0.7, 0.08, 0.75), cu, 0, 0.6, -0.72), -0.75, 0, 0));
  for (const sx of [-0.32, 0.32]) for (const sz of [-0.6, 0.85]) g.add(M(boxG(0.05, 0.34, 0.05), frame, sx, 0.17, sz));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function umbrella(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const tex = canvasTex(512, 64, (c) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#f2eee8' : '#c40f1c'; c.fillRect(i * 32, 0, 32, 64); } });
  g.add(M(cylG(0.03, 0.03, 2.5, 8), mat('#d8d4cc', 0.4, 0.6), 0, 1.25, 0));
  const canopy = M(new THREE.ConeGeometry(1.5, 0.55, 16, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }), 0, 2.45, 0);
  g.add(canopy); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function buildPool(sc, renderer) {
  const sky = new Sky(); sky.scale.setScalar(4000); sc.add(sky);
  const u = sky.material.uniforms; u.turbidity.value = 9; u.rayleigh.value = 2.4; u.mieCoefficient.value = 0.006; u.mieDirectionalG.value = 0.86;
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(84), THREE.MathUtils.degToRad(105));
  u.sunPosition.value.copy(sunDir);
  // environment from the sky only (so reflections match the sunset)
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), sky2 = new Sky(); sky2.scale.setScalar(1000); Object.assign(sky2.material.uniforms, THREE.UniformsUtils.clone(u)); sky2.material.uniforms.sunPosition.value.copy(sunDir); envScene.add(sky2);
  sc.environment = pm.fromScene(envScene, 0.02).texture; pm.dispose();
  sc.fog = new THREE.Fog(0xc88a72, 60, 220);
  const sun = new THREE.DirectionalLight(0xffb07a, 3.2); sun.position.copy(sunDir).multiplyScalar(30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 80 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  sc.add(sun, new THREE.HemisphereLight(0xffc9a8, 0x5a3a4a, 0.45));
  // deck around the pool (pool: x -3.2..3.2, z -6.5..-2.5)
  const deckTex = tileTex('#d9cbb6', '#a99a86', 6); deckTex.repeat.set(10, 10);
  const deck = new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.75 });
  const slab = (x, z, w, d) => { const m = M(boxG(w, 0.2, d), deck, x, -0.1, z); m.receiveShadow = true; m.material = deck.clone(); m.material.map = deckTex.clone(); m.material.map.repeat.set(w / 2, d / 2); m.material.map.needsUpdate = true; sc.add(m); };
  slab(0, 6, 40, 17); slab(0, -16.5, 40, 20); slab(-11.6, -4.5, 16.8, 4); slab(11.6, -4.5, 16.8, 4);
  const poolTile = tileTex('#2a8fb8', '#e8f4f8', 10); poolTile.repeat.set(4, 2);
  const pt = new THREE.MeshStandardMaterial({ map: poolTile, roughness: 0.3 });
  sc.add(M(boxG(6.4, 0.05, 4), pt, 0, -1.4, -4.5));
  for (const [x, z, w, d] of [[0, -2.5, 6.4, 0.06], [0, -6.5, 6.4, 0.06], [-3.2, -4.5, 0.06, 4], [3.2, -4.5, 0.06, 4]]) sc.add(M(boxG(w, 1.4, d), pt, x, -0.7, z));
  for (const [x, z, w, d] of [[0, -2.42, 6.6, 0.18], [0, -6.58, 6.6, 0.18], [-3.28, -4.5, 0.18, 4.3], [3.28, -4.5, 0.18, 4.3]]) { const c = M(boxG(w, 0.06, d), mat('#efe8de', 0.5), x, 0.02, z); c.receiveShadow = true; sc.add(c); }
  const normals = waterNormals(); normals.repeat.set(3, 2);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), new THREE.MeshPhysicalMaterial({ color: 0x1a9ec8, roughness: 0.04, metalness: 0, normalMap: normals, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.82, clearcoat: 1, clearcoatRoughness: 0.02 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.12, -4.5); sc.add(water);
  const glow = new THREE.PointLight(0x3ad7ff, 6, 6, 2); glow.position.set(0, -0.6, -4.5); sc.add(glow);
  // back wall with Desert Rose neon, palms, loungers, umbrella, far mesas
  const wall = M(boxG(30, 3.2, 0.4), mat('#c9a68a', 0.95), 0, 1.6, -10); wall.receiveShadow = true; sc.add(wall);
  const sg = signMesh('DESERT ROSE', '#ff5a8a', 6, 1.3); sg.position.set(0, 2.3, -9.78); sc.add(sg);
  const sg2 = signMesh('POOL · MOTEL', '#3ad7ff', 3.2, 0.6); sg2.position.set(0, 1.4, -9.78); sc.add(sg2);
  sc.add(palm(-5.2, -8.2, 6.5, 0.18), palm(5.6, -8.4, 7.2, -0.22), palm(-8.5, -1.5, 5.8, 0.12), palm(8.2, 0.5, 6.2, -0.15));
  sc.add(lounger(-4.8, -0.6, 0.3, '#c40f1c'), lounger(-3.6, 0.1, 0.25, '#f2eee8'), lounger(4.6, -0.4, -0.35, '#c40f1c'), umbrella(-4.2, -1.6), umbrella(5.2, -1.8));
  for (let i = 0; i < 12; i++) { const s = 8 + Math.random() * 14; const m = M(new THREE.ConeGeometry(s, s * 0.5, 6), mat('#6a3a4a', 1), -90 + i * 16 + Math.random() * 6, s * 0.2, -90 - Math.random() * 30); m.scale.y = 0.6; sc.add(m); }
  return { update(t) { normals.offset.set(t * 0.02, t * 0.013); } };
}

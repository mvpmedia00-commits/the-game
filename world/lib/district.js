// The playable district: Las Vegas Blvd x Fremont Ave at night. Units are metres; x = east, z = south.
// Returns colliders, points of interest, walk paths and lanes for the simulation in main.js.
import * as THREE from 'three';
import { mat, neon, signMesh, canvasTex, glowTex, M, Sc, Rt, boxG, cylG, sphG, planeG, makeDSLR } from '../../hd-demo/lib/characters.js';

const rand = (a, b) => a + Math.random() * (b - a);
let seed = 7; const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- textures
function windowsTex(kind, emissive) {
  const pal = { warm: ['#ffd9a0', '#ffb070', '#fff0d0'], cool: ['#a8d8ff', '#d8ecff', '#ffd9a0'], casino: ['#ffd27a', '#ffe8b0', '#ffb040'] }[kind] || ['#ffd9a0', '#a8d8ff', '#ffb070'];
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = emissive ? '#000' : kind === 'casino' ? '#2a2018' : '#1f1a22'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
      const on = srand() < (kind === 'casino' ? 0.7 : 0.45), c = pal[Math.floor(srand() * pal.length)];
      g.fillStyle = emissive ? (on ? c : '#000') : (on ? c : '#10141e');
      g.fillRect(x * 42.6 + 6, y * 32 + 6, 31, 20);
      if (!emissive) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x * 42.6 + 4, y * 32 + 28, 35, 2); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function asphaltMats() {
  const rough = canvasTex(512, 512, (g) => {
    g.fillStyle = 'rgb(160,160,160)'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) { const v = 120 + Math.random() * 100; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    for (let i = 0; i < 14; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = 20 + Math.random() * 50, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(20,20,20,1)'); gr.addColorStop(1, 'rgba(20,20,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.7, r, Math.random() * 3, 0, 7); g.fill(); }
  });
  rough.colorSpace = THREE.NoColorSpace; rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.repeat.set(30, 30);
  const color = canvasTex(256, 256, (g) => { g.fillStyle = '#1c1a20'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 4000; i++) { const v = 20 + Math.random() * 22; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); } });
  color.wrapS = color.wrapT = THREE.RepeatWrapping; color.repeat.set(60, 60);
  return new THREE.MeshStandardMaterial({ map: color, roughnessMap: rough, roughness: 1, metalness: 0.15, envMapIntensity: 1.1 });
}
function pavers() {
  const t = canvasTex(256, 256, (g) => { g.fillStyle = '#3a3238'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 58 + Math.random() * 16; g.fillStyle = `rgb(${v},${v - 6},${v - 2})`; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 40);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.05 });
}

export function buildDistrict(scene) {
  const colliders = [], circles = [], pois = [], zones = [], spotLights = [];
  const box = (x0, x1, z0, z1) => colliders.push({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });
  const W = new THREE.Group(); scene.add(W);

  // ---------- ground: roads, sidewalks, markings
  const asphalt = asphaltMats();
  W.add(Rt(Object.assign(M(new THREE.PlaneGeometry(900, 900), asphalt), { receiveShadow: true }), -Math.PI / 2, 0, 0));
  const walk = pavers(), curb = mat('#5a5058', 0.7);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { // four raised blocks with curbs
    const cx = sx * (10 + 105), cz = sz * (8 + 125);
    const s = M(boxG(210, 0.16, 250), walk, cx, 0.08, cz); s.receiveShadow = true; W.add(s);
    W.add(M(boxG(0.3, 0.17, 250), curb, sx * 10.15, 0.085, cz), M(boxG(210, 0.17, 0.3), curb, cx, 0.085, sz * 8.15));
  }
  const paint = neon('#e8e2d0', 0.9), yellow = neon('#d8a822', 1.1);
  const dash = new THREE.PlaneGeometry(0.16, 3); dash.rotateX(-Math.PI / 2);
  const marks = [];
  for (let z = -300; z < 300; z += 9) if (Math.abs(z) > 14) { marks.push([5.5, z, 0, 0], [-5.5, z, 0, 0]); }
  for (let x = -300; x < 300; x += 9) if (Math.abs(x) > 16) marks.push([x, 0, 1, 0]);
  const im = new THREE.InstancedMesh(dash, paint, marks.length), o = new THREE.Object3D();
  marks.forEach(([x, z, r], i) => { o.position.set(x, 0.02, z); o.rotation.set(0, r ? Math.PI / 2 : 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); W.add(im);
  for (const s of [-1, 1]) { for (const zs of [-1, 1]) W.add(M(boxG(0.14, 0.01, 290), yellow, s * 0.35, 0.02, zs * 160)); }
  W.add(M(boxG(2.2, 0.3, 250), mat('#3a3a2e', 0.9), 0, 0.15, -136), M(boxG(2.2, 0.3, 250), mat('#3a3a2e', 0.9), 0, 0.15, 136)); // median planters
  const bars = [];
  for (const [cx, cz, along] of [[0, -10.5, 'x'], [0, 10.5, 'x'], [-12, 0, 'z'], [12, 0, 'z']]) for (let k = -9; k <= 9; k += 1.3) bars.push(along === 'x' ? [cx + k, cz, 0] : [cx, cz + k, 1]);
  const barG = new THREE.PlaneGeometry(0.6, 3.2); barG.rotateX(-Math.PI / 2);
  const cw = new THREE.InstancedMesh(barG, paint, bars.length); bars.forEach(([x, z, r], i) => { o.position.set(x, 0.021, z); o.rotation.set(0, r ? Math.PI / 2 : 0, 0); o.updateMatrix(); cw.setMatrixAt(i, o.matrix); }); W.add(cw);
  for (const [x, z, w, d] of [[-5, -14, 9.5, 0.45], [5, 14, 9.5, 0.45], [-16, 4, 0.45, 7.5], [16, -4, 0.45, 7.5]]) W.add(M(boxG(w, 0.01, d), paint, x, 0.022, z)); // stop lines

  // ---------- building kit
  const facades = { warm: [windowsTex('warm', false), windowsTex('warm', true)], cool: [windowsTex('cool', false), windowsTex('cool', true)], casino: [windowsTex('casino', false), windowsTex('casino', true)] };
  const facadeMat = (kind, w, h) => { const [m, e] = facades[kind]; const a = m.clone(), b = e.clone(); a.needsUpdate = b.needsUpdate = true; a.repeat.set(w / 14, h / 14); b.repeat.copy(a.repeat); return new THREE.MeshStandardMaterial({ map: a, emissiveMap: b, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.55, metalness: 0.2 }); };
  const roofM = mat('#18141a', 0.9);
  function building(x0, x1, z0, z1, h, kind = 'warm', trim = null, opts = {}) {
    const w = x1 - x0, d = z1 - z0, y0 = opts.y0 || 0;
    const fx = facadeMat(kind, d, h - (opts.ground ? 5 : 0)), fz = facadeMat(kind, w, h - (opts.ground ? 5 : 0));
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [fx, fx, roofM, roofM, fz, fz]); b.position.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); b.castShadow = b.receiveShadow = true; W.add(b);
    if (trim) for (const [x, z, ww, dd] of [[(x0 + x1) / 2, z0, w, 0.12], [(x0 + x1) / 2, z1, w, 0.12], [x0, (z0 + z1) / 2, 0.12, d], [x1, (z0 + z1) / 2, 0.12, d]]) W.add(M(boxG(ww + 0.12, 0.18, dd + 0.12), neon(trim, 4), x, y0 + h + 0.05, z));
    if (!opts.noCollide) box(x0, x1, z0, z1);
    return b;
  }
  // ground-floor shopfront on one face: glowing glass, door, awning, sign
  function shopfront(x0, x1, z0, z1, face, name, color, opts = {}) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, horiz = face === 'n' || face === 's';
    const len = horiz ? x1 - x0 : z1 - z0, sx = face === 'e' ? x1 : face === 'w' ? x0 : cx, sz = face === 's' ? z1 : face === 'n' ? z0 : cz;
    const out = { e: [1, 0], w: [-1, 0], s: [0, 1], n: [0, -1] }[face], ry = Math.atan2(out[0], out[1]);
    const g = new THREE.Group(); g.position.set(sx + out[0] * 0.02, 0, sz + out[1] * 0.02); g.rotation.y = ry; W.add(g);
    const glassT = canvasTex(512, 128, (c) => { const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, color); gr.addColorStop(1, '#0a0608'); c.fillStyle = gr; c.fillRect(0, 0, 512, 128); c.globalAlpha = 0.35; for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#fff' : '#000'; c.fillRect(Math.random() * 512, 40 + Math.random() * 70, 20 + Math.random() * 40, 30 + Math.random() * 40); } });
    const glass = new THREE.MeshStandardMaterial({ map: glassT, emissive: 0xffffff, emissiveMap: glassT, emissiveIntensity: 0.9, roughness: 0.08, metalness: 0.4 });
    g.add(M(planeG(len - 1.2, 3.6), glass, 0, 2.15, 0.06), M(boxG(len, 0.35, 0.3), mat('#0c0a0c', 0.4, 0.6), 0, 4.1, 0.15));
    g.add(M(boxG(1.6, 2.6, 0.1), mat('#0a0809', 0.25, 0.7), opts.door || 0, 1.3, 0.1));
    if (opts.awning !== false) { const aw = M(boxG(Math.min(len - 1, 10), 0.12, 2.2), mat(opts.awningC || color, 0.7), opts.door || 0, 3.4, 1.1); aw.rotation.x = 0.18; aw.castShadow = true; g.add(aw); }
    if (name) { const s = signMesh(name, color, Math.min(len - 1.5, opts.signW || 9), (opts.signH || 1.7)); s.position.set(0, opts.signY || 5.4, 0.25); g.add(s); }
    const glow = Rt(M(planeG(Math.min(len, 14), 6), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(color).multiplyScalar(0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.2, 2.6), -Math.PI / 2, 0, 0); g.add(glow);
    const doorWorld = new THREE.Vector3(opts.door || 0, 0, 1.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position);
    if (opts.light !== false) { const l = new THREE.PointLight(color, 28, 14, 2); l.position.set(doorWorld.x, 4, doorWorld.z); W.add(l); }
    return doorWorld;
  }

  // ---------- NW: Crown Casino (podium + tower + forecourt fountain)
  building(-95, -36, -110, -18, 16, 'casino', '#ffcc33');
  const tower = building(-82, -52, -96, -62, 104, 'casino', '#ffcc33', { y0: 0, noCollide: true });
  for (let i = 0; i < 6; i++) W.add(M(boxG(0.3, 100, 0.3), neon('#ffcc33', 3), -82 + i * 6, 52, -61.9));
  const crown = new THREE.Group(); crown.position.set(-67, 104, -79); W.add(crown);
  crown.add(Rt(M(new THREE.TorusGeometry(11, 0.8, 10, 40), mat('#e8b64c', 0.2, 1)), Math.PI / 2, 0, 0));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; crown.add(M(new THREE.ConeGeometry(1.4, 7, 10), mat('#e8b64c', 0.2, 1), Math.cos(a) * 11, 3.5, Math.sin(a) * 11), M(sphG(0.8, 12, 8), neon('#ff2a3a', 4), Math.cos(a) * 11, 7.4, Math.sin(a) * 11)); }
  const casinoSign = signMesh('CROWN', '#ffcc33', 26, 6); casinoSign.position.set(-67, 88, -61.6); W.add(casinoSign);
  const cs2 = signMesh('CROWN CASINO', '#ffcc33', 20, 3.4); cs2.position.set(-35.7, 11, -60); cs2.rotation.y = Math.PI / 2; W.add(cs2);
  // porte-cochère canopy with bulb grid
  const canopy = M(boxG(16, 0.8, 26), mat('#2a2010', 0.4, 0.8), -28, 7.2, -60); canopy.castShadow = true; W.add(canopy);
  const bulbs = []; for (let x = -35; x <= -21; x += 1.4) for (let z = -72; z <= -48; z += 1.4) bulbs.push([x, z]);
  const bm = new THREE.InstancedMesh(sphG(0.12, 6, 4), neon('#ffe0a0', 6), bulbs.length); bulbs.forEach(([x, z], i) => { o.position.set(x, 6.75, z); o.rotation.set(0, 0, 0); o.updateMatrix(); bm.setMatrixAt(i, o.matrix); }); W.add(bm);
  for (const z of [-72, -48]) for (const x of [-21.5]) { W.add(M(cylG(0.35, 0.35, 7, 12), mat('#e8b64c', 0.25, 1), x, 3.5, z)); circles.push({ x, z, r: 0.5 }); }
  const cl = new THREE.PointLight(0xffc870, 90, 30, 2); cl.position.set(-28, 5.5, -60); W.add(cl);
  // fountain
  const fountain = new THREE.Group(); fountain.position.set(-26, 0, -33); W.add(fountain);
  fountain.add(M(cylG(6, 6.3, 0.8, 40), mat('#d8cfc4', 0.5), 0, 0.4, 0), M(cylG(5.6, 5.6, 0.1, 40), new THREE.MeshStandardMaterial({ color: 0x1a6a8a, roughness: 0.05, metalness: 0.3, emissive: 0x0a3a5a, emissiveIntensity: 0.6 }), 0, 0.72, 0));
  const jets = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, j = M(new THREE.ConeGeometry(0.18, 3.2, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.9, 1.4), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), Math.cos(a) * 3.6, 2.3, Math.sin(a) * 3.6); j.rotation.x = Math.PI; fountain.add(j); jets.push(j); }
  const cj = M(new THREE.ConeGeometry(0.3, 6, 10, 1, true), jets[0].material, 0, 3.8, 0); cj.rotation.x = Math.PI; fountain.add(cj); jets.push(cj);
  circles.push({ x: -26, z: -33, r: 6.4 });
  const fl = new THREE.PointLight(0x5ad0ff, 40, 16, 2); fl.position.set(-26, 1.5, -33); W.add(fl);
  building(-36, -16, -110, -78, 9, 'warm', '#ff8a3a'); shopfront(-36, -16, -110, -78, 'e', 'PAWN & GOLD', '#ff8a3a');
  pois.push({ id: 'casino', name: 'Crown Casino', x: -21, z: -60, r: 4, prompt: 'Crown Casino', talk: [['Doorman', 'Premiere night is invitation only. Come back when you have a name on the list.']] });
  zones.push({ name: 'Crown Casino', minX: -95, maxX: -15, minZ: -110, maxZ: -15 });

  // ---------- NE: Velvet Room, Lens & Light, Scarlet Lounge, hotel
  building(15, 42, -44, -14, 12, 'cool', '#ff2a4a');
  const velvetDoor = shopfront(15, 42, -44, -14, 'w', 'THE VELVET ROOM', '#ff2a4a', { door: 2, signW: 13, signH: 2.4, signY: 7.2, awningC: '#5a0812' });
  for (let z = -36; z <= -29; z += 1.75) { W.add(M(cylG(0.05, 0.08, 1, 10), mat('#e8b64c', 0.2, 1), 12.6, 0.66, z), M(sphG(0.08, 8, 6), mat('#e8b64c', 0.2, 1), 12.6, 1.2, z)); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...Array(17)].map((_, i) => new THREE.Vector3(12.6, 1.08 - Math.abs(Math.sin(i / 16 * Math.PI * 4)) * 0.16, -36 + i * 7 / 16))), 64, 0.035, 8), mat('#8a0a14', 0.6)); W.add(rope);
  box(12.4, 12.8, -36, -29);
  building(15, 34, -66, -46, 9, 'warm', '#3ad7ff'); const lensDoor = shopfront(15, 34, -66, -46, 'w', 'LENS & LIGHT', '#3ad7ff', { door: -3 });
  const display = new THREE.Group(); display.position.set(14.5, 1.1, -54); display.rotation.y = -Math.PI / 2; W.add(display); for (let i = 0; i < 3; i++) { const c = makeDSLR(); c.scale.setScalar(4); c.position.set(-2 + i * 2, 0.5, 0.2); display.add(c); }
  building(15, 44, -100, -70, 15, 'cool', '#ff4fd8'); shopfront(15, 44, -100, -70, 'w', 'SCARLET LOUNGE', '#ff4fd8', { signW: 12, signH: 2.2, signY: 6.8 });
  building(50, 92, -108, -16, 62, 'cool', '#9b6bff');
  // MVP MEDIA billboard on the Velvet Room roof
  const bb = canvasTex(1024, 400, (g) => {
    const gr = g.createLinearGradient(0, 0, 1024, 400); gr.addColorStop(0, '#1a0206'); gr.addColorStop(1, '#3a0610'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 400);
    g.strokeStyle = '#e8b64c'; g.lineWidth = 6; g.beginPath(); g.moveTo(462, 92); g.lineTo(476, 40); g.lineTo(497, 70); g.lineTo(512, 30); g.lineTo(527, 70); g.lineTo(548, 40); g.lineTo(562, 92); g.closePath(); g.stroke();
    g.textAlign = 'center'; g.font = '900 150px Cinzel, Georgia, serif'; const tg = g.createLinearGradient(0, 110, 0, 250); tg.addColorStop(0, '#ff6a70'); tg.addColorStop(1, '#a00a14'); g.fillStyle = tg; g.fillText('MVP', 512, 240);
    g.font = '700 70px Cinzel, Georgia, serif'; g.fillStyle = '#e8e8f0'; g.fillText('MEDIA', 512, 318);
    g.font = '600 26px Montserrat, sans-serif'; g.fillStyle = '#f3e9e4'; g.fillText('O W N   T H E   F R A M E .', 512, 370);
  });
  const board = new THREE.Group(); board.position.set(20, 21, -29); board.rotation.y = -Math.PI / 2; W.add(board);
  board.add(M(new THREE.PlaneGeometry(22, 8.6), new THREE.MeshStandardMaterial({ map: bb, emissive: 0xffffff, emissiveMap: bb, emissiveIntensity: 1.3, roughness: 0.5 })), M(boxG(22.8, 9.4, 0.4), mat('#111', 0.5, 0.6), 0, 0, -0.25));
  for (const x of [-7, 7]) board.add(M(boxG(0.4, 9, 0.4), mat('#222', 0.5, 0.6), x, -8, -0.6));
  zones.push({ name: 'The Velvet Room', minX: 10, maxX: 44, minZ: -44, maxZ: -12 }, { name: 'Lens & Light', minX: 10, maxX: 44, minZ: -68, maxZ: -44 }, { name: 'Scarlet Lounge', minX: 10, maxX: 50, minZ: -110, maxZ: -68 });

  // ---------- SW: Desert Rose Motel with pool courtyard
  const motelFace = (x0, x1, z0, z1) => { building(x0, x1, z0, z1, 7.2, 'warm', '#ff5a8a'); };
  motelFace(-80, -24, 15, 24); motelFace(-80, -66, 24, 82); motelFace(-80, -24, 74, 84);
  for (const [z, face] of [[24, 's'], [74, 'n']]) for (let x = -62; x < -26; x += 4.5) { const d = M(boxG(1.1, 2.3, 0.08), mat('#c84a6a', 0.5), x, 1.2, z + (face === 's' ? 0.05 : -0.05)); W.add(d); const n = signMesh(String(Math.round((x + 66) / 4.5) + (z > 50 ? 20 : 1)), '#ffd9a0', 0.6, 0.3); n.position.set(x, 2.6, z + (face === 's' ? 0.07 : -0.07)); if (face === 'n') n.rotation.y = Math.PI; W.add(n); }
  for (const [z, face] of [[24, 1], [74, -1]]) { W.add(M(boxG(40, 0.25, 2), mat('#d8c8b8', 0.7), -46, 3.6, z + face * 1), M(boxG(40, 0.9, 0.06), mat('#e8e0d8', 0.4, 0.6), -46, 4.3, z + face * 2)); }
  const pool = M(boxG(16, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x18a8d8, roughness: 0.03, metalness: 0.1, emissive: 0x0a6a9a, emissiveIntensity: 1.2 }), -46, 0.12, 49); W.add(pool);
  W.add(M(boxG(17, 0.12, 21), mat('#efe8de', 0.5), -46, 0.1, 49)); box(-54, -38, 39, 59);
  const pl = new THREE.PointLight(0x3ad7ff, 60, 18, 2); pl.position.set(-46, 1.2, 49); W.add(pl);
  for (const [x, z] of [[-58, 40], [-58, 58], [-34, 66]]) { const ch = M(boxG(0.8, 0.35, 2), mat('#f2eee8', 0.8), x, 0.35, z); ch.castShadow = true; W.add(ch); box(x - 0.5, x + 0.5, z - 1.1, z + 1.1); }
  for (let z = 24; z <= 74; z += 2) if (z < 44 || z > 54) { W.add(M(boxG(0.06, 1.3, 2), mat('#2a2a30', 0.4, 0.8), -23, 0.8, z + 1)); }
  box(-23.3, -22.7, 24, 44); box(-23.3, -22.7, 54, 74);
  // pole sign
  W.add(M(cylG(0.35, 0.4, 16, 12), mat('#2a2a30', 0.4, 0.7), -13.5, 8, 30)); circles.push({ x: -13.5, z: 30, r: 0.5 });
  const ps = signMesh('DESERT ROSE', '#ff5a8a', 9, 2.2); ps.position.set(-13.5, 14, 30.25); ps.rotation.y = Math.PI / 2; W.add(ps);
  const ps2 = signMesh('MOTEL · POOL · VACANCY', '#3ad7ff', 8, 1.1); ps2.position.set(-13.5, 12, 30.25); ps2.rotation.y = Math.PI / 2; W.add(ps2);
  const ps3 = ps.clone(); ps3.rotation.y = -Math.PI / 2; ps3.position.x = -13.75; W.add(ps3);
  pois.push({ id: 'room12', name: 'Room 12 · Desert Rose', x: -51, z: 26, r: 2.5, prompt: 'Room 12 · save game' });
  pois.push({ id: 'poolspot', name: 'Desert Rose pool', x: -46, z: 37, r: 3, prompt: 'Photo spot · the pool' });
  zones.push({ name: 'Desert Rose Motel', minX: -82, maxX: -12, minZ: 12, maxZ: 86 });

  // ---------- SE: MVP Studios, chapel, diner
  building(15, 58, 16, 54, 13, 'cool', '#ff2a3a');
  const studioDoor = shopfront(15, 58, 16, 54, 'w', 'MVP STUDIOS', '#ff2a3a', { door: 6, signW: 14, signH: 2.8, signY: 8.6, awning: false });
  W.add(M(boxG(0.15, 6, 9), mat('#4a4a52', 0.5, 0.8), 14.95, 3, 24));
  for (const z of [20, 52]) W.add(M(boxG(0.2, 12, 0.2), neon('#ff2a3a', 4), 14.9, 6, z));
  building(15, 34, 60, 80, 9, 'warm', '#ff7ab8'); shopfront(15, 34, 60, 80, 'w', 'CHAPEL OF LOVE', '#ff7ab8', { signW: 12 });
  const heart = signMesh('♥', '#ff4f8a', 3, 3); heart.position.set(14.8, 10.5, 70); heart.rotation.y = -Math.PI / 2; W.add(heart);
  building(15, 40, 84, 104, 6, 'warm', '#ffcc33'); shopfront(15, 40, 84, 104, 'w', 'DIAMOND DINER', '#ffcc33');
  building(62, 96, 16, 108, 44, 'warm', '#3ad7ff');
  pois.push({ id: 'studio', name: 'MVP Studios', x: studioDoor.x, z: studioDoor.z, r: 3, prompt: 'Enter MVP Studios' });
  zones.push({ name: 'MVP Studios', minX: 10, maxX: 60, minZ: 12, maxZ: 56 }, { name: 'Chapel of Love', minX: 10, maxX: 40, minZ: 56, maxZ: 82 });
  zones.push({ name: 'Las Vegas Blvd', minX: -10, maxX: 10, minZ: -500, maxZ: 500 }, { name: 'Fremont Ave', minX: -500, maxX: 500, minZ: -8, maxZ: 8 });

  // ---------- street furniture: lights, palms, traffic lights, hydrants, benches
  const pole = mat('#26242a', 0.45, 0.7), lightPts = [];
  for (const sx of [-1, 1]) for (let z = -100; z <= 100; z += 20) if (Math.abs(z) > 12) lightPts.push([sx * 10.9, z, sx]);
  for (const sz of [-1, 1]) for (let x = -90; x <= 90; x += 20) if (Math.abs(x) > 14) lightPts.push([x, sz * 8.9, 0, sz]);
  const glowM = new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(1.0, 0.62, 0.32), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const [x, z, sx, sz] of lightPts) {
    W.add(M(cylG(0.11, 0.15, 8, 10), pole, x, 4, z)); circles.push({ x, z, r: 0.25 });
    const ax = sx ? -sx * 1.6 : 0, az = sz ? -sz * 1.6 : 0;
    W.add(Rt(M(boxG(Math.abs(ax) + 0.1 || 0.1, 0.1, Math.abs(az) + 0.1 || 0.1), pole, x + ax / 2, 8, z + az / 2), 0, 0, 0));
    W.add(M(boxG(0.7, 0.18, 0.4), pole, x + ax, 7.9, z + az), M(boxG(0.55, 0.05, 0.3), neon('#ffd9a0', 8), x + ax, 7.8, z + az));
    W.add(Rt(M(planeG(12, 12), glowM, x + ax, 0.19, z + az), -Math.PI / 2, 0, 0));
  }
  const trunk = mat('#5a4636', 0.95), leaf = mat('#1f5a2c', 0.8, 0, { side: THREE.DoubleSide });
  const frond = new THREE.PlaneGeometry(0.6, 3.2, 1, 6); frond.translate(0, 1.6, 0);
  { const p = frond.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -Math.pow(y / 3.2, 2) * 1.1); p.setX(i, p.getX(i) * Math.sin(Math.PI * y / 3.2 * 0.9 + 0.1)); } frond.computeVertexNormals(); }
  const palm = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.add(M(cylG(0.18, 0.28, h, 10), trunk, 0, h / 2, 0)); const cr = new THREE.Group(); cr.position.y = h; g.add(cr); for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(frond, leaf); f.rotation.set(-1.0 - srand() * 0.4, i / 10 * Math.PI * 2, 0, 'YXZ'); f.castShadow = true; cr.add(f); } W.add(g); circles.push({ x, z, r: 0.4 }); };
  for (let z = -130; z <= 130; z += 16) if (Math.abs(z) > 20) palm(0, z, 9 + srand() * 3);
  for (const [x, z] of [[-33, -45], [-33, -22], [-19, -45], [-30, 40], [-62, 32], [-62, 66], [-30, 68]]) palm(x, z, 8 + srand() * 3);
  // traffic lights at the four corners
  const signals = [];
  for (const [x, z, ry, axis] of [[-11, -9.5, 0, 'z'], [11, 9.5, Math.PI, 'z'], [-11.5, 9, Math.PI / 2, 'x'], [11.5, -9, -Math.PI / 2, 'x']]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.add(g); circles.push({ x, z, r: 0.3 });
    g.add(M(cylG(0.12, 0.14, 6.5, 10), pole, 0, 3.25, 0), M(boxG(0.12, 0.12, 6), pole, 0, 6.3, 3));
    const head = new THREE.Group(); head.position.set(0, 5.6, 5.5); g.add(head); head.add(M(boxG(0.45, 1.3, 0.35), mat('#141416', 0.5)));
    const lamps = ['#ff2a2a', '#ffb020', '#30ff70'].map((c, i) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(0.12) }); head.add(M(sphG(0.13, 10, 8), m, 0, 0.4 - i * 0.4, 0.18)); return { m, c: new THREE.Color(c) }; });
    signals.push({ axis, lamps });
  }
  for (const [x, z] of [[-12.2, -20], [12.2, 26], [-12.2, 44], [12.2, -60]]) { W.add(M(cylG(0.18, 0.2, 0.7, 10), mat('#b81c1c', 0.5, 0.3), x, 0.5, z)); circles.push({ x, z, r: 0.3 }); }
  for (const [x, z, ry] of [[13.8, -8 - 14, -Math.PI / 2], [-13.8, 40, Math.PI / 2]]) { const b = new THREE.Group(); b.position.set(x, 0.16, z); b.rotation.y = ry; b.add(M(boxG(2, 0.08, 0.5), mat('#3a2a20', 0.8), 0, 0.45, 0), M(boxG(2, 0.5, 0.08), mat('#3a2a20', 0.8), 0, 0.75, -0.25)); for (const sx of [-0.9, 0.9]) b.add(M(boxG(0.06, 0.45, 0.45), pole, sx, 0.22, 0)); W.add(b); box(x - 0.6, x + 0.6, z - 1.1, z + 1.1); }

  // ---------- distant skyline + mountains (not walkable)
  const skyFacade = facadeMat('cool', 14, 14); skyFacade.emissiveIntensity = 1.2;
  const towers = []; for (let i = 0; i < 70; i++) { const a = srand() * Math.PI * 2, r = 170 + srand() * 170, w = 14 + srand() * 22; towers.push([Math.cos(a) * r, Math.sin(a) * r, w, 30 + srand() * 140]); }
  const tg = new THREE.BoxGeometry(1, 1, 1); tg.translate(0, 0.5, 0);
  const ti = new THREE.InstancedMesh(tg, skyFacade, towers.length); towers.forEach(([x, z, w, h], i) => { o.position.set(x, 0, z); o.rotation.set(0, srand(), 0); o.scale.set(w, h, w); o.updateMatrix(); ti.setMatrixAt(i, o.matrix); }); W.add(ti);
  const needle = new THREE.Group(); needle.position.set(60, 0, -300); W.add(needle);
  needle.add(M(cylG(3, 6, 240, 16), mat('#8a8490', 0.5, 0.4), 0, 120, 0), M(cylG(16, 12, 14, 24), mat('#3a3440', 0.4, 0.6), 0, 240, 0), M(cylG(16.2, 16.2, 1, 24), neon('#ff2a4a', 5), 0, 244, 0), M(cylG(1, 0.2, 30, 8), mat('#aaa', 0.4, 0.8), 0, 262, 0));
  for (let i = 0; i < 9; i++) { const s = 60 + srand() * 90; const m = M(new THREE.ConeGeometry(s, s * 0.35, 7), mat('#1a0e18', 1), Math.cos(i / 9 * 6.28) * 480, s * 0.17, Math.sin(i / 9 * 6.28) * 480); m.scale.y = 0.7; W.add(m); }

  // invisible edge of the playable area: beyond it the boulevard keeps going into the haze
  const bounds = { minX: -98, maxX: 98, minZ: -112, maxZ: 112 };
  const NPC = { ruby: { x: 12.3, z: -24.5, ry: -Math.PI / 2 }, bouncer: { x: 13.6, z: velvetDoor.z + 0.8, ry: -Math.PI / 2 }, dee: { x: lensDoor.x - 0.4, z: lensDoor.z - 1.2, ry: -Math.PI / 2 } };
  const spawn = { x: 11.6, z: 30, yaw: -Math.PI / 2 }; // on the sidewalk by MVP Studios, next to the car
  const parked = [{ x: 7.6, z: 31, ry: Math.PI, color: '#c8141f', mine: true }, { x: -7.6, z: -44, ry: 0, color: '#1a1a22' }, { x: 7.6, z: -52, ry: Math.PI, color: '#e8e2d8' }, { x: -7.6, z: 58, ry: 0, color: '#3a5a8a' }];
  for (const p of parked) box(p.x - 1.05, p.x + 1.05, p.z - 2.3, p.z + 2.3);
  // pedestrians walk these sidewalk segments
  const walks = [[12.6, -100, 12.6, -12], [12.6, 12, 12.6, 104], [-12.6, -100, -12.6, -12], [-12.6, 12, -12.6, 104], [-90, -10.8, -14, -10.8], [14, -10.8, 48, -10.8], [-90, 10.8, -14, 10.8], [14, 10.8, 60, 10.8]];
  const update = (t) => {
    jets.forEach((j, i) => { j.scale.y = 0.85 + Math.sin(t * 3 + i) * 0.15; });
    crown.rotation.y = t * 0.05;
  };
  return { colliders, circles, pois, zones, bounds, NPC, spawn, parked, walks, signals, update };
}

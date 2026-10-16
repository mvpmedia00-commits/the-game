// Character + prop builders shared with MVP: Beyond the Frame (ported to three r160 ES modules).
// Each rig exposes joint groups (hips, spine, head, shoulders, elbows, hip joints, knees) and a list of
// spring points (`rig.springs`) that the spring-bone system turns into secondary motion.
import * as THREE from 'three';
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const matCache = {}, geoCache = {};
let skinDetail = null, clothDetail = null;
function microTexture(cloth = false) {
  if (cloth ? clothDetail : skinDetail) return cloth ? clothDetail : skinDetail;
  const size = 128, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const value = cloth ? 125 + ((x + y) % 4 < 2 ? 28 : -28) + Math.sin(y * 1.6) * 10 : 128 + Math.sin(x * 12.9898 + y * 78.233) * 24;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value; pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(cloth ? 3 : 2, cloth ? 3 : 2); texture.needsUpdate = true;
  if (cloth) clothDetail = texture; else skinDetail = texture; return texture;
}

function mat(color, rough = 0.6, metal = 0, extra) {
  const k = 's' + color + rough + metal + (extra ? Object.keys(extra).join() + Object.values(extra).join() : '');
  if (matCache[k]) return matCache[k];
  const skin = !metal && (rough === .44 || rough === .46), fabric = !metal && rough === .62;
  const options = Object.assign({ color: new THREE.Color(color), roughness: rough, metalness: metal }, extra || {});
  if (skin) Object.assign(options, { bumpMap: microTexture(), bumpScale: .0007, sheen: .12, sheenRoughness: .75, sheenColor: new THREE.Color('#bd8271') });
  if (fabric) Object.assign(options, { bumpMap: microTexture(true), bumpScale: .0014, sheen: .3, sheenRoughness: .8, sheenColor: new THREE.Color(color) });
  return (matCache[k] = skin || fabric ? new THREE.MeshPhysicalMaterial(options) : new THREE.MeshStandardMaterial(options));
}
function basic(color, extra) {
  const k = 'b' + color + (extra ? Object.keys(extra).join() + Object.values(extra).join() : '');
  return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(color) }, extra || {})));
}
const geo = (k, f) => geoCache[k] || (geoCache[k] = f());
const cylG = (rt, rb, h, s = 12, open = false) => geo(`c${rt},${rb},${h},${s},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open));
const sphG = (r, ws = 14, hs = 10, ts = 0, tl = Math.PI) => geo(`s${r},${ws},${hs},${ts},${tl}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, ts, tl));
const boxG = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const planeG = (w, h) => geo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));
function M(g, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; }
function Sc(o, x, y, z) { o.scale.set(x, y, z); return o; }
function Rt(o, x, y, z) { o.rotation.set(x, y, z); return o; }
function capsule(r, len, m, lite) {
  if (lite) return M(cylG(r, r * 0.9, len + r, 8), m);
  const g = new THREE.Group(); g.add(M(cylG(r, r, len, 12), m), M(sphG(r, 12, 8), m, 0, len / 2, 0), M(sphG(r, 12, 8), m, 0, -len / 2, 0)); return g;
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
const coneTex = canvasTex(128, 128, (g) => { const r = g.createLinearGradient(0, 0, 128, 0); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(0, 54); g.lineTo(128, 0); g.lineTo(128, 128); g.lineTo(0, 74); g.fill(); });
const glowMat = (color, op = 1) => basic(color, { map: glowTex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
function textTex(text, color, w = 1024, h = 200, font = 'Anton, Impact, sans-serif') {
  return canvasTex(w, h, (g) => {
    g.font = `${h * 0.62}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = h * 0.18; g.fillStyle = color;
    for (let i = 0; i < 2; i++) g.fillText(text.toUpperCase(), w / 2, h / 2 + 4, w - 20);
    g.shadowBlur = 0; g.fillStyle = '#fff6f0'; g.globalAlpha = 0.55; g.fillText(text.toUpperCase(), w / 2, h / 2 + 4, w - 20);
  });
}
function signMesh(text, color, w, h) {
  const t = textTex(text, color, 1024, Math.round(1024 * h / w));
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }); m.color.setScalar(2.4);
  return new THREE.Mesh(planeG(w, h), m);
}
function gradTex(top, bottom) { return canvasTex(4, 256, (g) => { const r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, top); r.addColorStop(1, bottom); g.fillStyle = r; g.fillRect(0, 0, 4, 256); }); }
function neon(color, k = 3, extra) {
  const key = 'n' + color + k + (extra ? Object.values(extra).join() : '');
  if (matCache[key]) return matCache[key];
  const m = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(color) }, extra || {})); m.color.multiplyScalar(k); return (matCache[key] = m);
}
const POSE_KEYS = ['sp', 'hd', 'shL', 'elL', 'shR', 'elR', 'hpL', 'hpR', 'knL', 'knR', 'hips'];
const REST = { sp: [0, 0, 0], hd: [0, 0, 0], shL: [0, 0, 0.1], elL: [-0.12, 0, 0], shR: [0, 0, -0.1], elR: [-0.12, 0, 0], hpL: [0, 0, 0], hpR: [0, 0, 0], knL: [0, 0, 0], knR: [0, 0, 0], hips: [0, 0, 0] };
const HOLD = { shL: [-0.42, 0, -0.16], elL: [-1.5, 0, 0], shR: [-0.42, 0, 0.16], elR: [-1.5, 0, 0] };
function setPose(rig, p, t) {
  if (!rig.cur) rig.cur = JSON.parse(JSON.stringify(REST));
  for (const k of POSE_KEYS) { const g = p[k] || REST[k], c = rig.cur[k]; for (let i = 0; i < 3; i++) c[i] = lerp(c[i], g[i], t); }
  const c = rig.cur;
  rig.spine.rotation.set(c.sp[0], c.sp[1], c.sp[2]); rig.head.rotation.set(c.hd[0], c.hd[1], c.hd[2]);
  rig.shL.rotation.set(c.shL[0], c.shL[1], c.shL[2]); rig.elL.rotation.set(c.elL[0], c.elL[1], c.elL[2]);
  rig.shR.rotation.set(c.shR[0], c.shR[1], c.shR[2]); rig.elR.rotation.set(c.elR[0], c.elR[1], c.elR[2]);
  rig.hpL.rotation.set(c.hpL[0], c.hpL[1], c.hpL[2]); rig.hpR.rotation.set(c.hpR[0], c.hpR[1], c.hpR[2]);
  rig.knL.rotation.set(c.knL[0], 0, 0); rig.knR.rotation.set(c.knR[0], 0, 0); rig.hips.rotation.set(c.hips[0], c.hips[1], c.hips[2]);
}
function walkPose(rig, ph, amt, t = 1) {
  const s = Math.sin(ph), c = Math.cos(ph);
  const p = { hpL: [-s * 0.55 * amt, 0, 0], hpR: [s * 0.55 * amt, 0, 0], knL: [Math.max(0, c) * 1.0 * amt, 0, 0], knR: [Math.max(0, -c) * 1.0 * amt, 0, 0],
    shL: [s * 0.5 * amt, 0, 0.1], shR: [-s * 0.5 * amt, 0, -0.1], elL: [-0.25 - 0.3 * amt, 0, 0], elR: [-0.25 - 0.3 * amt, 0, 0], sp: [0.06 * amt, 0, 0], hd: [-0.04 * amt, 0, 0], hips: [0, s * 0.08 * amt, 0] };
  if (rig.hold) Object.assign(p, HOLD);
  setPose(rig, p, t);
  rig.root.children[0].position.y = (rig.hips.userData.y0 ??= rig.hips.position.y) + Math.abs(c) * 0.035 * amt;
}
// Model poses for photo shoots
const POSES = [
  { name: 'Classic', shL: [0, 0, 0.2], elL: [-0.25, 0, 0], shR: [0, 0, -0.2], elR: [-0.25, 0, 0], hpL: [-0.08, 0, 0.04], knL: [0.15, 0, 0], hips: [0, 0.15, 0.03], hd: [0, -0.1, 0.04] },
  { name: 'Hand on hip', shL: [0.1, 0, 0.7], elL: [-0.4, 0, -1.7], shR: [0, 0, -0.15], elR: [-0.3, 0, 0], hips: [0, -0.25, -0.06], sp: [0, 0.15, 0.05], hpR: [-0.15, 0, -0.05], knR: [0.25, 0, 0], hd: [0.05, 0.2, -0.08] },
  { name: 'Arm up', shR: [0, 0, -2.75], elR: [0, 0, -1.4], shL: [0.1, 0, 0.6], elL: [-0.4, 0, -1.6], hips: [0, 0.2, 0.06], sp: [0, -0.1, -0.06], hd: [0.12, -0.1, 0.12], hpL: [-0.12, 0, 0], knL: [0.3, 0, 0] },
  { name: 'Three-quarter turn', hips: [0, 0.85, 0], sp: [0, 0.25, 0], hd: [0, -0.75, 0.05], shL: [0.3, 0, 0.15], elL: [-0.3, 0, 0], shR: [-0.2, 0, -0.5], elR: [-0.6, 0, 1.2], hpR: [-0.2, 0, 0], knR: [0.35, 0, 0] },
  { name: 'Hands on hips', shL: [0.15, 0, 0.75], elL: [-0.4, 0, -1.75], shR: [0.15, 0, -0.75], elR: [-0.4, 0, 1.75], hpL: [0, 0, 0.16], hpR: [0, 0, -0.16], hd: [0.08, 0, 0.1] },
  { name: 'Beret tilt', shL: [-2.3, 0, 0.5], elL: [-1.6, 0, 0], shR: [0, 0, -0.25], elR: [-0.3, 0, 0], hips: [0, -0.2, 0.05], sp: [0.04, 0.1, 0], hd: [0.08, 0.15, -0.14], hpL: [-0.2, 0, -0.04], knL: [0.25, 0, 0] },
  { name: 'Stride', hpL: [-0.4, 0, 0], knL: [0.25, 0, 0], hpR: [0.3, 0, 0], knR: [0.45, 0, 0], shL: [0.4, 0, 0.15], shR: [-0.35, 0, -0.15], elL: [-0.3, 0, 0], elR: [-0.5, 0, 0], sp: [0.03, -0.1, 0], hd: [0, 0.1, 0] },
];

// ------------------------------------------------------------ HERO CHARACTERS (high detail)
const TEXC = {};
// Wrap meshes in a pivot so the spring system can swing them. axis = rest direction pivot->tail (local), len in metres.
function springGroup(parent, list, kind, pivot, axis, len) {
  const g = new THREE.Group(); g.position.copy(pivot); parent.add(g);
  for (const o of list) { o.position.sub(pivot); g.add(o); }
  (parent.userData.springs ||= []).push({ obj: g, kind, axis: axis.clone().normalize(), len });
  return g;
}
const torsoPts = rs => rs.map((r, i) => [r, -0.14 + i * 0.05]);
const latheG = (key, pts, seg = 32) => geo('L' + key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, Math.PI, Math.PI * 2));
const limbPts = (rs, len) => rs.map((r, i) => [r, -len + i * len / (rs.length - 1)]);
const TORSO_F = [0.15, 0.165, 0.168, 0.158, 0.14, 0.122, 0.12, 0.128, 0.142, 0.153, 0.15, 0.142, 0.135, 0.108, 0.055];
const TORSO_M = [0.16, 0.165, 0.162, 0.155, 0.152, 0.155, 0.163, 0.177, 0.192, 0.202, 0.207, 0.203, 0.188, 0.142, 0.062];
function shade(hex, f) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return '#' + c.getHexString(); }
function noiseFill(g, w, h, a = 0.05) { for (let i = 0; i < w * h / 60; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
function tattoo(g, cx, cy, s) { // fine-line floral piece
  g.save(); g.strokeStyle = 'rgba(30,18,14,.7)'; g.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.35, cy + Math.sin(a) * s * 0.35, s * 0.3, s * 0.14, a, 0, Math.PI * 2); g.stroke(); }
  g.beginPath(); g.arc(cx, cy, s * 0.12, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(cx, cy + s * 0.5); g.bezierCurveTo(cx - s * 0.4, cy + s, cx + s * 0.4, cy + s * 1.4, cx, cy + s * 2); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(cx + (i % 2 ? 1 : -1) * s * 0.2, cy + s * (0.8 + i * 0.3), s * 0.15, s * 0.06, (i % 2 ? -1 : 1) * 0.6, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}
function torsoTex(L) {
  const key = 'T' + [L.outfit, L.color, L.skin, L.bottom, L.tattoo].join();
  if (TEXC[key]) return TEXC[key];
  const t = canvasTex(512, 512, (g) => {
    const Y = h => (1 - (h + 0.14) / 0.70) * 512;
    const band = (c, h0, h1) => { g.fillStyle = c; g.fillRect(0, Y(h1), 512, Y(h0) - Y(h1)); };
    g.fillStyle = L.skin; g.fillRect(0, 0, 512, 512);
    if (L.outfit === 'suit') {
      g.fillStyle = L.color; g.fillRect(0, 0, 512, 512); noiseFill(g, 512, 512, 0.06);
      g.fillStyle = '#0e0d11'; g.beginPath(); g.moveTo(256 - 82, Y(0.56)); g.lineTo(256 + 82, Y(0.56)); g.lineTo(256 + 44, Y(-0.01)); g.lineTo(256 - 44, Y(-0.01)); g.fill();
      g.fillStyle = L.skin; g.beginPath(); g.moveTo(256 - 30, Y(0.56)); g.lineTo(256 + 30, Y(0.56)); g.lineTo(256, Y(0.37)); g.fill();
      g.strokeStyle = shade(L.color, -0.18); g.lineWidth = 16; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 84, Y(0.55)); g.lineTo(256 + s * 58, Y(0.2)); g.stroke(); }
      g.fillStyle = '#26242a'; for (const h of [0.33, 0.24, 0.15, 0.06]) { g.beginPath(); g.arc(256, Y(h), 3.5, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ff2a36'; g.beginPath(); g.moveTo(320, Y(0.37)); g.lineTo(350, Y(0.37)); g.lineTo(344, Y(0.4)); g.lineTo(330, Y(0.41)); g.fill();
      band('#0b0b0d', -0.055, 0.0);
      g.fillStyle = '#d6a640'; g.fillRect(256 - 34, Y(0.005), 68, Y(-0.06) - Y(0.005));
      g.fillStyle = '#1a1206'; g.font = 'bold 26px Anton, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MVP', 256, (Y(0.005) + Y(-0.06)) / 2 + 1);
      band(L.bottom || L.color, -0.2, -0.055);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(118, 0, 20, 512); g.fillRect(374, 0, 20, 512);
    } else if (L.outfit === 'two') {
      if (L.tattoo) { tattoo(g, 60, Y(0.48), 46); tattoo(g, 450, Y(0.3), 38); }
      band(L.color, 0.27, 0.39);
      const gr = g.createLinearGradient(0, Y(0.39), 0, Y(0.27)); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,.35)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, Y(0.39), 512, Y(0.27) - Y(0.39));
      g.fillStyle = '#120a0a'; g.fillRect(0, Y(0.39), 512, 4); g.fillRect(0, Y(0.27) - 4, 512, 4);
      g.fillStyle = '#120a0a'; g.font = 'bold 34px Anton, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MVP', 256, (Y(0.39) + Y(0.27)) / 2 + 2);
      g.fillStyle = 'rgba(60,30,20,.45)'; g.beginPath(); g.ellipse(256, Y(0.09), 4, 6, 0, 0, Math.PI * 2); g.fill();
      band('#121012', -0.2, -0.05);
    } else if (L.outfit === 'gown' || L.outfit === 'dress') {
      band(L.color, -0.2, 0.4);
      g.fillStyle = L.color; g.beginPath(); g.moveTo(0, Y(0.4)); for (let x = 0; x <= 512; x += 16) g.lineTo(x, Y(0.4) - Math.abs(Math.sin(x / 512 * Math.PI * 2)) * 14); g.lineTo(512, Y(0.4)); g.fill();
      const gr = g.createLinearGradient(0, 0, 512, 0); for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)');
      g.fillStyle = gr; g.fillRect(0, Y(0.4), 512, 512);
    } else if (L.outfit === 'jump') {
      g.fillStyle = L.color; g.fillRect(0, 0, 512, 512); noiseFill(g, 512, 512, 0.05);
      g.fillStyle = L.skin; g.beginPath(); g.moveTo(256 - 40, Y(0.56)); g.lineTo(256 + 40, Y(0.56)); g.lineTo(256, Y(0.36)); g.fill();
      band('#d6a640', 0.07, 0.09);
    } else { // casual
      g.fillStyle = L.color; g.fillRect(0, 0, 512, 512); noiseFill(g, 512, 512, 0.06);
      g.fillStyle = L.skin; g.beginPath(); g.ellipse(256, Y(0.56), 50, 26, 0, 0, Math.PI * 2); g.fill();
      band(L.bottom || '#1b1b24', -0.2, -0.03);
    }
  });
  return (TEXC[key] = t);
}
function skinTatTex(L, s) {
  const key = 'ST' + L.skin + s; if (TEXC[key]) return TEXC[key];
  return (TEXC[key] = canvasTex(256, 256, (g) => { g.fillStyle = L.skin; g.fillRect(0, 0, 256, 256); tattoo(g, 128, 60, 40 * s); tattoo(g, 30, 150, 26 * s); }));
}
function heroMat(L, kind) { // material for a limb part
  const skin = mat(L.skin, 0.46);
  const sleeve = ['suit', 'casual', 'jump'].includes(L.outfit);
  if (kind === 'upperArm' || kind === 'foreArm') return sleeve ? mat(L.color, 0.62) : skin;
  if (kind === 'leg') return L.outfit === 'suit' || L.outfit === 'casual' ? mat(L.bottom || '#1b1b24', 0.62) : L.outfit === 'jump' ? mat(L.color, 0.62) : skin;
  return skin;
}
function heroHead(L, fem, head) {
  const skin = mat(L.skin, 0.44);
  const hg = geo('head' + (fem ? 'f' : 'm'), () => {
    const g = new THREE.SphereGeometry(0.115, 36, 28), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const ny = v.y / 0.115;
      if (ny < 0) { const k = -ny; v.x *= 1 - k * (fem ? 0.3 : 0.2); v.z *= 1 - k * 0.12; if (v.z > 0) v.z += k * 0.012; }
      if (v.z < 0) v.z *= 1.06; if (ny > 0.2) v.y *= 1.05;
      if (v.z > 0.07 && Math.abs(ny) < 0.25) v.x *= 1.03; // cheekbones
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  });
  head.add(Sc(M(hg, skin, 0, 0.11, 0), 0.9, 1.12, 1));
  const white = mat('#f4efe8', 0.18), iris = mat('#2a160c', 0.15, 0.1), dark = mat('#0b0707', 0.5);
  for (const s of [-1, 1]) {
    head.add(Sc(M(sphG(0.016, 14, 10), white, s * 0.039, 0.127, 0.088), 1.15, 0.75, 0.6));
    head.add(M(sphG(0.0085, 16, 12), iris, s * 0.039, 0.127, 0.0985));
    head.add(M(sphG(.004, 12, 8), mat('#050405', .1), s * .039, .127, .105));
    head.add(M(sphG(.0018, 8, 6), basic('#fff4e7'), s * .039 - .002, .130, .108));
    head.add(Rt(M(boxG(0.04, 0.0055, 0.01), dark, s * 0.04, 0.152, 0.098), 0, 0, s * (fem ? -0.18 : -0.08)));
    if (fem) head.add(Rt(M(boxG(0.034, 0.004, 0.006), dark, s * 0.04, 0.137, 0.1), 0, 0, s * -0.1));
    head.add(Sc(M(sphG(0.024, 10, 8), skin, s * 0.104, 0.112, -0.004), 0.45, 1, 0.75));
  }
  head.add(Sc(Rt(M(cylG(0.009, 0.016, 0.05, 8), skin, 0, 0.1, 0.108), -0.35, 0, 0), 1, 1, 0.8), Sc(M(sphG(0.017, 10, 8), skin, 0, 0.083, 0.115), 1.25, 0.8, 0.9));
  const lip = mat(L.lips || (fem ? '#8e1420' : '#5a2e26'), fem ? 0.25 : 0.5);
  head.add(Sc(M(sphG(0.02, 12, 8), lip, 0, 0.058, 0.103), 1.25, 0.38, 0.55), Sc(M(sphG(0.02, 12, 8), lip, 0, 0.048, 0.101), 1.15, 0.45, 0.55));
  if (L.beard) {
    const bm = mat('#0d0a09', 0.92);
    head.add(Sc(M(sphG(0.112, 28, 12, Math.PI * 0.7, Math.PI * 0.3), bm, 0, 0.11, 0.004), 0.9, 1.1, 1.02));
    head.add(Rt(M(boxG(0.062, 0.01, 0.014), bm, 0, 0.071, 0.104), 0.15, 0, 0), Sc(M(sphG(0.02, 10, 8), bm, 0, 0.026, 0.09), 1.3, 1.1, 0.8));
  }
  if (L.hoops) { const hm = mat('#e8b64c', 0.18, 1), tg = new THREE.TorusGeometry(0.03, 0.0035, 8, 24); for (const s of [-1, 1]) springGroup(head, [Rt(M(tg, hm, s * 0.106, 0.066, 0.004), 0, Math.PI / 2, 0)], 'ear', new THREE.Vector3(s * 0.106, 0.094, 0.004), new THREE.Vector3(0, -1, 0), 0.03); }
  // hair
  const hairM = mat(L.hairC || '#120c0a', 0.8, 0, { side: THREE.DoubleSide });
  const cap = (m = hairM) => { const g = new THREE.Group();
    g.add(Sc(M(geo('capTop', () => new THREE.SphereGeometry(0.121, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.3)), m, 0, 0.116, -0.006), 0.93, 1.07, 1.05));
    g.add(Sc(M(geo('capBack', () => new THREE.SphereGeometry(0.122, 24, 14, Math.PI * 0.82, Math.PI * 1.36, 0, Math.PI * 0.6)), m, 0, 0.116, -0.008), 0.94, 1.07, 1.05));
    return g; };
  if (L.hair === 'braids') {
    const tex = canvasTex(64, 256, (g) => { g.fillStyle = '#100b09'; g.fillRect(0, 0, 64, 256); g.strokeStyle = '#2a1c14'; g.lineWidth = 6; for (let y = -64; y < 320; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 24); g.stroke(); } });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const bm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 });
    head.add(cap(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })));
    const braids = [];
    for (let i = 0; i < 16; i++) {
      const a = -1.95 + i / 15 * 3.9, len = 0.24 + (Math.abs(a) < 1 ? 0.06 : 0);
      const b = M(cylG(0.011, 0.009, len, 7), bm, Math.sin(a) * 0.105, 0.12 - len / 2, -Math.cos(a) * 0.1 - 0.012);
      b.rotation.set(0.22, 0, -Math.sin(a) * 0.12); braids.push(b);
    }
    springGroup(head, braids, 'hair', new THREE.Vector3(0, 0.12, -0.09), new THREE.Vector3(0, -1, -0.2), 0.26);
  } else if (L.hair === 'afro') {
    const puff = [M(sphG(0.15, 18, 14), hairM, 0, 0.22, -0.1)]; head.add(cap());
    const n = 170, im = new THREE.InstancedMesh(geo('curl', () => new THREE.IcosahedronGeometry(0.042, 1)), new THREE.MeshStandardMaterial({ roughness: 0.85 }), n), o = new THREE.Object3D(), base = new THREE.Color(L.hairC);
    for (let i = 0; i < n; i++) {
      let x, y, z; do { x = rand(-1, 1); y = rand(-1, 1); z = rand(-1, 1); } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 0.55);
      const px = x * 0.2, py = 0.23 + y * 0.16, pz = -0.1 + z * 0.17;
      if (pz > 0.0 && py < 0.2) { i--; continue; }
      o.position.set(px, py, pz); o.rotation.set(rand(0, 6), rand(0, 6), 0); o.scale.setScalar(rand(0.7, 1.35)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, base.clone().offsetHSL(rand(-0.02, 0.02), 0, rand(-0.08, 0.06)));
    }
    im.castShadow = true; puff.push(im); springGroup(head, puff, 'hair', new THREE.Vector3(0, 0.17, -0.06), new THREE.Vector3(0, 1, -0.6), 0.16);
  } else if (L.hair === 'long') { head.add(cap()); springGroup(head, [Sc(M(sphG(0.13, 16, 12), hairM, 0, -0.03, -0.07), 1.08, 1.95, 0.62)], 'hair', new THREE.Vector3(0, 0.15, -0.07), new THREE.Vector3(0, -1, 0), 0.25); }
  else if (L.hair === 'bob') { head.add(cap(), M(cylG(0.128, 0.14, 0.15, 24, true), hairM, 0, 0.065, -0.014)); }
  else if (L.hair === 'bun') { head.add(cap(), M(sphG(0.064, 14, 10), hairM, 0, 0.245, -0.09)); }
  else head.add(cap());
  if (L.beret) {
    const b = new THREE.Group(); b.position.set(0.015, 0.205, -0.012); b.rotation.set(-0.12, 0, fem ? 0.32 : 0.24);
    const felt = mat('#c00d1a', 0.92);
    b.add(M(latheG('beret', [[0, 0], [0.1, 0.004], [0.142, 0.018], [0.152, 0.036], [0.138, 0.056], [0.09, 0.07], [0, 0.074]], 28), felt));
    b.add(M(cylG(0.112, 0.116, 0.022, 28, true), mat('#8a0812', 0.8), 0, 0.006, 0), M(cylG(0.006, 0.01, 0.022, 8), felt, 0, 0.083, 0));
    if (!fem) b.add(Rt(M(boxG(0.034, 0.034, 0.008), mat('#d6a640', 0.25, 0.9), -0.03, 0.03, 0.12), -0.3, 0, 0));
    head.add(b);
  }
}
function makeDSLR() {
  const c = new THREE.Group(), body = mat('#121214', 0.45, 0.2), rub = mat('#1c1c1e', 0.9);
  c.add(M(boxG(0.14, 0.095, 0.075), body), M(boxG(0.035, 0.1, 0.085), rub, -0.06, -0.003, 0.005), M(boxG(0.05, 0.035, 0.05), body, 0.0, 0.06, -0.005));
  c.add(Rt(M(cylG(0.038, 0.04, 0.05, 20), rub, 0.012, 0, 0.06), Math.PI / 2, 0, 0), Rt(M(cylG(0.042, 0.042, 0.06, 20), body, 0.012, 0, 0.115), Math.PI / 2, 0, 0));
  c.add(Rt(M(cylG(0.043, 0.043, 0.006, 20), mat('#c00d1a', 0.4), 0.012, 0, 0.088), Math.PI / 2, 0, 0));
  c.add(Rt(M(cylG(0.032, 0.032, 0.004, 20), mat('#1a2a4a', 0.02, 1), 0.012, 0, 0.146), Math.PI / 2, 0, 0));
  return c;
}
function makeHero(L) {
  const fem = L.fem !== false;
  const root = new THREE.Group(), hips = new THREE.Group(); hips.position.y = fem ? 0.93 : 0.97; root.add(hips);
  const pelvisM = L.outfit === 'suit' || L.outfit === 'casual' ? mat(L.bottom || '#1b1b24', 0.62) : L.outfit === 'two' ? mat('#121012', 0.55) : mat(L.color, 0.5);
  hips.add(Sc(M(sphG(0.15, 22, 16), pelvisM, 0, -0.02, 0), fem ? 1.1 : 1.12, 0.72, fem ? 0.8 : 0.78));
  const spine = new THREE.Group(); spine.position.y = 0.05; hips.add(spine);
  const torsoM = new THREE.MeshPhysicalMaterial({ map: torsoTex(L), roughness: L.outfit === 'two' ? 0.46 : 0.6, metalness: 0, bumpMap: microTexture(L.outfit !== 'two'), bumpScale: L.outfit === 'two' ? .0007 : .0012, sheen: .18, sheenRoughness: .75 });
  spine.add(Sc(M(latheG(fem ? 'tf' : 'tm', torsoPts(fem ? TORSO_F : TORSO_M), 28), torsoM), 1, 1, fem ? 0.7 : 0.63));
  const delt = heroMat(L, 'upperArm');
  for (const s of [-1, 1]) spine.add(Sc(M(sphG(fem ? 0.054 : 0.07, 16, 12), delt, s * (fem ? 0.15 : 0.205), 0.445, 0), 1, 0.9, 0.9));
  spine.add(M(latheG(fem ? 'nf' : 'nm', [[fem ? 0.052 : 0.068, 0], [fem ? 0.044 : 0.06, 0.06], [fem ? 0.046 : 0.062, 0.13]], 16), mat(L.skin, 0.44), 0, 0.52, -0.005));
  if (L.outfit === 'suit') { // open jacket skirt + collar
    const jk = mat(L.color, 0.62, 0, { side: THREE.DoubleSide });
    // Raised lapels and buttons give the suit depth beyond the painted torso texture.
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape(); shape.moveTo(side*.055,.54);shape.lineTo(side*.16,.48);shape.lineTo(side*.11,.36);shape.lineTo(side*.035,.24);shape.closePath();
      const lapel = new THREE.Mesh(new THREE.ShapeGeometry(shape), jk);lapel.position.z=.129;spine.add(lapel);
      for (let i=0;i<3;i++) spine.add(M(sphG(.006,10,8),mat('#151319',.3,.35),side*.065,.23-i*.065,.115));
    }
    hips.add(M(geo('jskirt', () => new THREE.CylinderGeometry(0.168, 0.188, 0.2, 28, 1, true, 0.42, Math.PI * 2 - 0.84)), jk, 0, -0.07, 0));
    spine.add(Sc(M(geo('collar', () => new THREE.CylinderGeometry(0.075, 0.1, 0.06, 24, 1, true, 0.6, Math.PI * 2 - 1.2)), mat('#0e0d11', 0.6, 0, { side: THREE.DoubleSide }), 0, 0.555, 0), 1, 1, 0.9));
  }
  const head = new THREE.Group(); head.position.y = 0.635; spine.add(head);
  heroHead(L, fem, head);
  const arm = side => {
    const sh = new THREE.Group(); sh.position.set(side * (fem ? 0.172 : 0.236), 0.445, 0); spine.add(sh);
    const ua = M(latheG(fem ? 'uaf' : 'uam', limbPts(fem ? [0.034, 0.036, 0.04, 0.044, 0.046, 0.045] : [0.046, 0.05, 0.058, 0.064, 0.067, 0.066], 0.3)), side > 0 && L.tattoo ? new THREE.MeshStandardMaterial({ map: skinTatTex(L, 1), roughness: 0.46 }) : heroMat(L, 'upperArm'));
    sh.add(ua);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    el.add(M(sphG(fem ? 0.033 : 0.045, 12, 10), heroMat(L, 'upperArm')));
    el.add(M(latheG(fem ? 'faf' : 'fam', limbPts(fem ? [0.022, 0.025, 0.031, 0.035, 0.034] : [0.032, 0.037, 0.046, 0.051, 0.048], 0.26)), heroMat(L, 'foreArm')));
    if (L.outfit === 'suit') el.add(M(cylG(0.036, 0.036, 0.03, 14), mat('#0e0d11', 0.6), 0, -0.245, 0));
    const hand = new THREE.Group(); hand.position.y = -0.28; el.add(hand);
    const sk = mat(L.skin, 0.46);
    hand.add(Sc(M(sphG(fem ? 0.036 : 0.046, 14, 10), sk, 0, -0.02, 0), 0.75, 1.15, 0.5), Sc(M(sphG(fem ? 0.03 : 0.038, 12, 8), sk, 0, -0.07, 0.004), 0.72, 1.05, 0.45));
    hand.add(Rt(M(cylG(0.011, 0.01, 0.05, 8), sk, side * -0.03, -0.03, 0.018), 0.3, 0, side * -0.5));
    if (L.nails) for (let i = 0; i < 4; i++) hand.add(M(sphG(0.006, 6, 4), mat(L.nails, 0.2), (i - 1.5) * 0.012, -0.105, 0.008));
    return { sh, el, hand };
  };
  const leg = side => {
    const hp = new THREE.Group(); hp.position.set(side * (fem ? 0.088 : 0.098), -0.03, 0); hips.add(hp);
    const legM = side < 0 && L.tattoo ? new THREE.MeshStandardMaterial({ map: skinTatTex(L, 1.6), roughness: 0.46 }) : heroMat(L, 'leg');
    hp.add(M(latheG(fem ? 'thf' : 'thm', limbPts(fem ? [0.05, 0.056, 0.064, 0.072, 0.079, 0.082] : [0.058, 0.064, 0.072, 0.08, 0.086, 0.09], 0.43)), legM));
    const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
    kn.add(M(sphG(fem ? 0.046 : 0.056, 12, 10), heroMat(L, 'leg')));
    kn.add(M(latheG(fem ? 'shf' : 'shm', limbPts(fem ? [0.027, 0.03, 0.039, 0.046, 0.045, 0.043] : [0.036, 0.04, 0.052, 0.058, 0.055, 0.052], 0.42)), heroMat(L, 'leg')));
    if (fem) { // stiletto pumps, red soles
      const pump = mat(L.shoe || '#0a0a0c', 0.15, 0.3), f = new THREE.Group(); f.position.set(0, -0.43, 0.03); f.rotation.x = -0.42; kn.add(f);
      f.add(Sc(M(sphG(0.04, 14, 10), pump, 0, 0, 0.03), 0.8, 0.6, 2.2), M(boxG(0.05, 0.005, 0.15), neon('#c40f1c', 1), 0, -0.022, 0.04));
      f.add(Rt(M(cylG(0.006, 0.004, 0.1, 8), pump, 0, -0.06, -0.035), 0.42, 0, 0));
    } else {
      const shoe = new THREE.MeshPhysicalMaterial({ color: 0x08080a, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
      kn.add(Sc(M(sphG(0.055, 16, 10), shoe, 0, -0.45, 0.045), 1, 0.62, 2.3), M(boxG(0.1, 0.018, 0.25), mat('#141414', 0.9), 0, -0.477, 0.045));
    }
    return { hp, kn };
  };
  const aL = arm(1), aR = arm(-1), lL = leg(1), lR = leg(-1);
  if (L.outfit === 'two') { // layered black tulle tutu
    const tul = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.7, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
    [[0.3, 0.13, -0.05], [0.34, 0.15, -0.09], [0.37, 0.15, -0.13]].forEach(([rb, h, y], k) => {
      const g = geo('tutu' + k, () => { const c = new THREE.CylinderGeometry(0.162, rb, h, 48, 1, true), p = c.attributes.position;
        for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) { const a = Math.atan2(p.getX(i), p.getZ(i)); p.setY(i, p.getY(i) + Math.sin(a * 23 + k) * 0.012); const s = 1 + Math.sin(a * 11 + k * 2) * 0.06; p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); }
        c.computeVertexNormals(); return c; });
      springGroup(hips, [M(g, tul, 0, y, 0)], 'skirt', new THREE.Vector3(0, y + 0.06, 0), new THREE.Vector3(0, -1, 0), 0.14 + k * 0.03);
    });
  }
  if (L.outfit === 'dress') springGroup(hips, [M(latheG('dress', [[0.32, -0.42], [0.27, -0.3], [0.22, -0.18], [0.18, -0.06], [0.165, 0.02]], 32), new THREE.MeshStandardMaterial({ color: new THREE.Color(L.color), roughness: 0.4, side: THREE.DoubleSide }))], 'skirt', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0), 0.4);
  if (L.outfit === 'gown') hips.add(M(latheG('gown', [[0.44, -0.92], [0.36, -0.7], [0.28, -0.46], [0.21, -0.22], [0.165, 0.02]], 36), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(L.color), roughness: 0.32, metalness: 0.35, clearcoat: 0.4, side: THREE.DoubleSide })));
  const rig = { root, hips, spine, head, shL: aL.sh, elL: aL.el, shR: aR.sh, elR: aR.el, hpL: lL.hp, knL: lL.kn, hpR: lR.hp, knR: lR.kn, handL: aL.hand, handR: aR.hand, cur: null, hold: !!L.camera };
  if (L.camera || L.handCam) { rig.prop = makeDSLR(); rig.propMode = L.handCam || 'both'; root.add(rig.prop); }
  root.traverse(o => { if (o.isMesh || o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = true; } });
  rig.springs = []; root.traverse(o => { if (o.userData.springs) rig.springs.push(...o.userData.springs); });
  if (L.scale) root.scale.setScalar(L.scale);
  return rig;
}
const _hv = new THREE.Vector3(), _hv2 = new THREE.Vector3();
function updProps(rig) {
  if (!rig.prop) return;
  rig.root.updateMatrixWorld(true);
  if (rig.propMode === 'L') rig.handL.getWorldPosition(_hv);
  else if (rig.propMode === 'R') rig.handR.getWorldPosition(_hv);
  else { rig.handL.getWorldPosition(_hv); rig.handR.getWorldPosition(_hv2); _hv.add(_hv2).multiplyScalar(0.5); }
  rig.root.worldToLocal(_hv); rig.prop.position.copy(_hv);
  const yaw = rig.hips.rotation.y + rig.spine.rotation.y;
  if (rig.propRot) rig.prop.rotation.set(rig.propRot[0], yaw + rig.propRot[1], rig.propRot[2]);
  else { rig.prop.rotation.set(0, yaw, 0); rig.prop.position.y -= 0.05; rig.prop.position.x += Math.sin(yaw) * 0.04; rig.prop.position.z += Math.cos(yaw) * 0.04; }
}

const MVP_SHOOT = { shR: [-1.25, 0, 0.32], elR: [-1.95, 0, 0], shL: [-1.25, 0, -0.32], elL: [-1.95, 0, 0], hd: [0.1, 0, 0], sp: [0.02, 0.1, 0], hpL: [-0.05, 0, 0.06], hpR: [0.05, 0, -0.06] };
const MVP_STAND = Object.assign({ sp: [0.01, 0.05, 0], hd: [0, -0.08, 0], hpL: [-0.06, 0, 0.07], hpR: [0.04, 0, -0.07], hips: [0, 0.05, 0] }, HOLD);
const RUBY_A = { shR: [0.1, 0, -0.72], elR: [-0.4, 0, 1.75], shL: [0.08, 0, 0.12], elL: [-0.15, 0, 0], hips: [0, -0.15, -0.05], sp: [0, 0.12, 0.04], hd: [0.04, 0.32, -0.08], hpR: [-0.18, 0, -0.02], knR: [0.32, 0, 0], hpL: [0.02, 0, 0.05] };
const RUBY_B = { shR: [-2.35, 0, -0.45], elR: [-1.55, 0, 0], shL: [0.08, 0, 0.12], elL: [-0.15, 0, 0], hips: [0, -0.25, 0.06], sp: [0.03, 0.15, -0.04], hd: [0.08, 0.25, 0.12], hpL: [-0.2, 0, -0.03], knL: [0.3, 0, 0] };
const TALENT = {
  ruby: { name: 'Ruby Monroe', age: 26, role: 'Featured dancer, The Velvet Room', star: 3, fee: 600, light: 'neon', mood: 'playful', req: 0,
    bio: 'Headliner at the Velvet Room. Red beret, sharper business sense than half the casino bosses on the Strip.',
    look: { skin: '#b07a52', hair: 'afro', hairC: '#bd1624', outfit: 'two', color: '#d0121e', beret: true, hoops: true, tattoo: true, lips: '#9a0e1a', nails: '#c40f1c' } },
  nova: { name: 'Nova Starr', age: 24, role: 'Glamour & fashion model', star: 3, fee: 700, light: 'warm', mood: 'romantic', req: 0,
    bio: 'Built a following one sunset at a time. Wants magazine covers and is willing to work for them.',
    look: { skin: '#c48a64', hair: 'long', hairC: '#2a1a12', outfit: 'gown', color: '#e8b64c' } },
  jade: { name: 'Jade Rivers', age: 31, role: 'Adult film actress & director', star: 5, fee: 1500, light: 'cool', mood: 'dramatic', req: 0,
    bio: 'Twenty features, three awards, and zero patience for bullshit. On her set everybody hits their marks.',
    look: { skin: '#5a3626', hair: 'bob', hairC: '#0e0a0a', outfit: 'jump', color: '#1fa37a' } },
  coco: { name: 'Coco Bellamy', age: 28, role: 'Burlesque performer, Scarlet Lounge', star: 2, fee: 400, light: 'warm', mood: 'playful', req: 25,
    bio: 'Feathers, rhinestones and comic timing. The Scarlet Lounge crowd comes for her.',
    look: { skin: '#9a6040', hair: 'bun', hairC: '#3a1a10', outfit: 'dress', color: '#ff4fd8' } },
  lex: { name: 'Alexis "Lex" Vaughn', age: 29, role: 'Adult performer & streamer', star: 4, fee: 1100, light: 'neon', mood: 'dramatic', req: 45,
    bio: 'Two million followers and her own production company. She only signs with people who have already proven they can sell.',
    look: { skin: '#e0b090', hair: 'long', hairC: '#d8c070', outfit: 'dress', color: '#3ad7ff' } },
};
const MVP_LOOK = { fem: false, skin: '#6a3e2a', color: '#d41b27', bottom: '#c51622', outfit: 'suit', hair: 'braids', beret: true, beard: true, camera: true, scale: 1.06 };

export { mat, basic, geo, cylG, sphG, boxG, planeG, M, Sc, Rt, canvasTex, glowTex, textTex, signMesh, gradTex, neon, setPose, walkPose, REST, HOLD, POSES, makeHero, makeDSLR, updProps, MVP_SHOOT, MVP_STAND, RUBY_A, RUBY_B, TALENT, MVP_LOOK, shade };

// Realistic building skins and rooftops for the district.
// Facades are generated once per style as a full PBR set (color, emissive, roughness, normal) covering
// 8 bays x 8 floors at 3.5 m each (28 m x 28 m), so window scale matches real buildings. Each building
// gets its own UV offset and light tint so neighbouring blocks never look stamped from the same tile.
import * as THREE from 'three';

const TILE = 28; // metres covered by one facade texture
const LOW = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const SIZE = LOW ? 512 : 1024;
let seed = 4242; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pickR = a => a[Math.floor(rnd() * a.length)];

function canvas2d(size) { const c = document.createElement('canvas'); c.width = c.height = size; return [c, c.getContext('2d')]; }
function toTex(c, color) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t;
}
// Height canvas (white = proud of the wall) -> tangent-space normal map.
function normalFromHeight(hc, strength) {
  const n = hc.width, src = hc.getContext('2d').getImageData(0, 0, n, n).data;
  const [c, g] = canvas2d(n), img = g.createImageData(n, n), d = img.data, h = (x, y) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return toTex(c, false);
}
function speckle(g, n, count, alpha, light) {
  for (let i = 0; i < count; i++) { const v = light ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${rnd() * alpha})`; g.fillRect(rnd() * n, rnd() * n, 1 + rnd() * 2, 1 + rnd() * 2); }
}
// A lit room seen through glass: ceiling glow, falloff, a few silhouettes of furniture.
function room(e, x, y, w, h, tone, kind) {
  const gr = e.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, tone[0]); gr.addColorStop(0.55, tone[1]); gr.addColorStop(1, tone[2]);
  e.fillStyle = gr; e.fillRect(x, y, w, h);
  if (kind === 'office') { // ceiling light panels in perspective rows
    e.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 3; k++) { const py = y + 4 + k * 5, pw = w * (0.5 - k * 0.12); e.fillRect(x + (w - pw) / 2 + (rnd() - 0.5) * 6, py, pw, 2); }
  }
  e.fillStyle = 'rgba(0,0,0,0.55)'; // furniture / people silhouettes in the lower part of the room
  for (let k = 0; k < 2 + rnd() * 3; k++) { const fw = w * (0.08 + rnd() * 0.22), fh = h * (0.15 + rnd() * 0.3); e.fillRect(x + rnd() * (w - fw), y + h - fh, fw, fh); }
}
const OFFICE = [['#f4f7ff', '#c9d6ec', '#7d8aa3'], ['#fff6e2', '#e8d6b0', '#8a7860'], ['#e6fbff', '#a9dbe6', '#5b7f88']];
const HOME = [['#ffd59a', '#f0a860', '#7a4220'], ['#ffe2b8', '#e8b07a', '#6a4028'], ['#ffc27a', '#d8803a', '#5a2a14'], ['#cfe0ff', '#7f9cd8', '#2a3460']];
const GOLD = [['#fff0c0', '#ffc860', '#8a5a18'], ['#ffe6a8', '#f0b048', '#7a4a10']];

function makeSet(style) {
  const n = SIZE, cell = n / 8, s = n / 1024;
  const [cc, c] = canvas2d(n), [ec, e] = canvas2d(n), [rc, r] = canvas2d(n), [hc, h] = canvas2d(n);
  e.fillStyle = '#000'; e.fillRect(0, 0, n, n);
  if (style === 'glass' || style === 'casino') {
    const gold = style === 'casino';
    c.fillStyle = gold ? '#2a2112' : '#121823'; c.fillRect(0, 0, n, n);
    r.fillStyle = '#141414'; r.fillRect(0, 0, n, n); // glass: very smooth -> reflects the city
    h.fillStyle = '#404040'; h.fillRect(0, 0, n, n);
    for (let fy = 0; fy < 8; fy++) {
      const y0 = fy * cell, span = cell * 0.26; // spandrel panel hiding the slab
      c.fillStyle = gold ? '#4a3618' : '#232934'; c.fillRect(0, y0 + cell - span, n, span);
      r.fillStyle = '#6a6a6a'; r.fillRect(0, y0 + cell - span, n, span);
      h.fillStyle = '#707070'; h.fillRect(0, y0 + cell - span, n, span);
      for (let bx = 0; bx < 8; bx++) {
        const x0 = bx * cell, lit = rnd() < (gold ? 0.62 : 0.3);
        if (lit) {
          const half = rnd() < 0.25, w = half ? cell / 2 : cell, xo = half && rnd() < 0.5 ? cell / 2 : 0;
          room(e, x0 + xo + 2, y0 + 2, w - 4, cell - span - 4, gold ? pickR(GOLD) : pickR(OFFICE), 'office');
          if (!gold && rnd() < 0.35) { e.fillStyle = 'rgba(0,0,0,0.5)'; for (let b = 0; b < (cell - span) / (6 * s); b++) e.fillRect(x0 + xo, y0 + b * 6 * s, w, 3 * s); } // blinds
        }
        // faint sky gradient in the glass so unlit floors are not flat black
        const gg = c.createLinearGradient(0, y0, 0, y0 + cell - span); gg.addColorStop(0, gold ? 'rgba(120,90,40,.25)' : 'rgba(80,100,140,.22)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg; c.fillRect(x0, y0, cell, cell - span);
      }
    }
    // mullions + transoms
    const mull = gold ? '#c49a48' : '#4a505c';
    for (let x = 0; x <= n; x += cell / 2) { const w = (x % cell === 0 ? 6 : 3) * s; for (const [g, col] of [[c, mull], [r, '#505050'], [h, '#d0d0d0']]) { g.fillStyle = col; g.fillRect(x - w / 2, 0, w, n); } e.fillStyle = '#000'; e.fillRect(x - w / 2, 0, w, n); }
    for (let y = 0; y <= n; y += cell) { const w = (gold ? 14 : 6) * s; for (const [g, col] of [[c, mull], [r, gold ? '#303030' : '#505050'], [h, '#ffffff']]) { g.fillStyle = col; g.fillRect(0, y - w / 2, n, w); } e.fillStyle = '#000'; e.fillRect(0, y - w / 2, n, w); }
  } else { // stucco / concrete with punched windows (hotels, motels, apartments)
    const wall = style === 'brick' ? '#4a2c24' : '#5a4e48';
    c.fillStyle = wall; c.fillRect(0, 0, n, n); speckle(c, n, 26000 * s * s, 0.12, true); speckle(c, n, 26000 * s * s, 0.18, false);
    r.fillStyle = '#d0d0d0'; r.fillRect(0, 0, n, n);
    h.fillStyle = '#808080'; h.fillRect(0, 0, n, n); speckle(h, n, 30000 * s * s, 0.25, true);
    if (style === 'brick') { c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < n; y += 8 * s) c.fillRect(0, y, n, 1.5 * s); }
    for (let fy = 0; fy < 8; fy++) for (let bx = 0; bx < 8; bx++) {
      const x0 = bx * cell, y0 = fy * cell, ww = cell * 0.52, wh = cell * 0.58, wx = x0 + (cell - ww) / 2, wy = y0 + cell * 0.16;
      // frame + sill (raised), glass (smooth, recessed)
      for (const [g, col] of [[c, '#b8b0a4'], [h, '#e0e0e0'], [r, '#909090']]) { g.fillStyle = col; g.fillRect(wx - 5 * s, wy - 5 * s, ww + 10 * s, wh + 10 * s); g.fillRect(wx - 9 * s, wy + wh + 3 * s, ww + 18 * s, 8 * s); }
      c.fillStyle = '#0d1116'; c.fillRect(wx, wy, ww, wh); h.fillStyle = '#202020'; h.fillRect(wx, wy, ww, wh); r.fillStyle = '#1a1a1a'; r.fillRect(wx, wy, ww, wh);
      const roll = rnd();
      if (roll < 0.36) {
        room(e, wx, wy, ww, wh, pickR(HOME), 'home');
        if (rnd() < 0.7) { // curtains glowing from behind
          const cur = pickR(['rgba(160,30,30,.75)', 'rgba(200,170,120,.7)', 'rgba(30,90,90,.7)', 'rgba(230,220,200,.6)']), cw = ww * (0.18 + rnd() * 0.22);
          e.fillStyle = cur; e.fillRect(wx, wy, cw, wh); e.fillRect(wx + ww - cw, wy, cw, wh);
          e.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < cw; k += 5 * s) { e.fillRect(wx + k, wy, 1.5 * s, wh); e.fillRect(wx + ww - k, wy, 1.5 * s, wh); }
        }
      } else if (roll < 0.42) { e.fillStyle = 'rgba(70,40,25,1)'; e.fillRect(wx, wy, ww, wh); } // dim lamp behind drawn blinds
      // mullion cross
      for (const [g, col] of [[c, '#9a948a'], [e, '#000'], [h, '#c0c0c0']]) { g.fillStyle = col; g.fillRect(wx + ww / 2 - 2 * s, wy, 4 * s, wh); }
      if (rnd() < 0.18) { // window AC unit
        for (const [g, col] of [[c, '#8a8a86'], [h, '#ffffff'], [r, '#707070']]) { g.fillStyle = col; g.fillRect(wx + ww * 0.55, wy + wh - 18 * s, ww * 0.36, 18 * s); }
        c.fillStyle = 'rgba(0,0,0,.4)'; for (let k = 0; k < 4; k++) c.fillRect(wx + ww * 0.57, wy + wh - 15 * s + k * 4 * s, ww * 0.32, 1.5 * s);
      }
      // grime streak under each sill
      const sg = c.createLinearGradient(0, wy + wh + 11 * s, 0, wy + wh + 50 * s); sg.addColorStop(0, 'rgba(0,0,0,.22)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.fillRect(wx - 6 * s, wy + wh + 11 * s, ww + 12 * s, 40 * s);
    }
    // slab line every floor
    for (let y = 0; y < n; y += cell) { for (const [g, col] of [[c, 'rgba(0,0,0,.25)'], [h, '#b0b0b0']]) { g.fillStyle = col; g.fillRect(0, y, n, 4 * s); } }
  }
  return { map: toTex(cc, true), emissiveMap: toTex(ec, true), roughnessMap: toTex(rc, false), normalMap: normalFromHeight(hc, style === 'glass' || style === 'casino' ? 2.5 : 3.5) };
}

const SETS = {};
const KIND_STYLE = { cool: 'glass', warm: 'stucco', casino: 'casino', brick: 'brick' };
const TINTS = [0xffffff, 0xfff1dc, 0xe8f0ff, 0xffe4c4, 0xffffff];
// Per-building material: shares the generated images, own UV offset (in whole bays) and light tint.
export function facadeMaterial(kind, w, h, opts = {}) {
  const style = KIND_STYLE[kind] || 'stucco', set = SETS[style] || (SETS[style] = makeSet(style));
  const ox = Math.floor(rnd() * 8) / 8, oy = Math.floor(rnd() * 8) / 8, rep = [w / TILE, h / TILE];
  const t = {};
  for (const k of ['map', 'emissiveMap', 'roughnessMap', 'normalMap']) { const x = set[k].clone(); x.needsUpdate = true; x.repeat.set(...rep); x.offset.set(ox, oy); t[k] = x; }
  const m = new THREE.MeshStandardMaterial({
    ...t, emissive: new THREE.Color(pickR(TINTS)), emissiveIntensity: (opts.glow ?? 1) * (0.75 + rnd() * 0.45),
    roughness: 1, metalness: style === 'casino' ? 0.35 : style === 'glass' ? 0.15 : 0.0, normalScale: new THREE.Vector2(0.9, 0.9), envMapIntensity: style === 'stucco' || style === 'brick' ? 0.5 : 1.3,
  });
  addStreetWash(m, opts.wash ?? (style === 'stucco' || style === 'brick' ? 1 : 0.6));
  return m;
}

// Light spilling up the walls from street level (shop windows, signs, headlights), fading with height,
// plus a faint glow from the light-polluted sky on upper floors. Cheap stand-in for bounced light.
const WASH = { low: new THREE.Color(1.0, 0.55, 0.42), sky: new THREE.Color(0.16, 0.12, 0.2) };
export function addStreetWash(m, k = 1) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.washLow = { value: WASH.low.clone().multiplyScalar(0.22 * k) }; sh.uniforms.washSky = { value: WASH.sky.clone().multiplyScalar(0.35 * k) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWashY;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 washP = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwashP = instanceMatrix * washP;\n#endif\nvWashY = (modelMatrix * washP).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWashY; uniform vec3 washLow; uniform vec3 washSky;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * (washLow * exp(-max(vWashY, 0.0) / 9.0) + washSky * smoothstep(10.0, 90.0, vWashY));');
  };
  m.customProgramCacheKey = () => 'street-wash';
}

// Rooftop dressing collected into a few instanced meshes: parapets, mechanical units, water tanks,
// antennas with blinking aircraft-warning lights.
export class RoofKit {
  constructor() { this.boxes = []; this.metal = []; this.tanks = []; this.masts = []; this.beacons = []; }
  parapet(x0, x1, z0, z1, top) {
    const w = x1 - x0, d = z1 - z0, t = 0.35, hgt = 1.1;
    this.boxes.push([(x0 + x1) / 2, top + hgt / 2, z0 + t / 2, w, hgt, t], [(x0 + x1) / 2, top + hgt / 2, z1 - t / 2, w, hgt, t], [x0 + t / 2, top + hgt / 2, (z0 + z1) / 2, t, hgt, d], [x1 - t / 2, top + hgt / 2, (z0 + z1) / 2, t, hgt, d]);
    this.metal.push([(x0 + x1) / 2, top + hgt + 0.04, z0 + t / 2, w + 0.1, 0.08, t + 0.1], [(x0 + x1) / 2, top + hgt + 0.04, z1 - t / 2, w + 0.1, 0.08, t + 0.1], [x0 + t / 2, top + hgt + 0.04, (z0 + z1) / 2, t + 0.1, 0.08, d], [x1 - t / 2, top + hgt + 0.04, (z0 + z1) / 2, t + 0.1, 0.08, d]);
  }
  clutter(x0, x1, z0, z1, top, tall) {
    const w = x1 - x0, d = z1 - z0, inset = 2.5;
    if (w < 8 || d < 8) return;
    const at = () => [x0 + inset + rnd() * (w - 2 * inset), z0 + inset + rnd() * (d - 2 * inset)];
    if (rnd() < 0.8) { const [x, z] = at(), bw = 4 + rnd() * 5, bd = 3 + rnd() * 4, bh = 3 + rnd() * 2; this.boxes.push([x, top + bh / 2, z, Math.min(bw, w - 5), bh, Math.min(bd, d - 5)]); } // stair / elevator room
    for (let i = 0, k = 1 + Math.floor(rnd() * 4); i < k; i++) { const [x, z] = at(); this.metal.push([x, top + 0.75, z, 1.8 + rnd() * 1.6, 1.5, 1.2 + rnd()]); } // HVAC units
    if (!tall && rnd() < 0.35) { const [x, z] = at(); this.tanks.push([x, top, z, 1.6 + rnd() * 0.8, 3 + rnd() * 2]); }
    if (tall || rnd() < 0.25) { const [x, z] = at(), mh = tall ? 10 + rnd() * 14 : 4 + rnd() * 4; this.masts.push([x, top + mh / 2, z, mh]); this.beacons.push([x, top + mh + 0.2, z]); }
  }
  build(parent) {
    const o = new THREE.Object3D(), unit = new THREE.BoxGeometry(1, 1, 1);
    const fill = (geo, mat, list, set) => { if (!list.length) return null; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((p, i) => { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); set(p); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = im.receiveShadow = true; parent.add(im); return im; };
    const box = ([x, y, z, w, h, d]) => { o.position.set(x, y, z); o.scale.set(w, h, d); };
    fill(unit, new THREE.MeshStandardMaterial({ color: 0x3a3438, roughness: 0.92 }), this.boxes, box);
    fill(unit, new THREE.MeshStandardMaterial({ color: 0x7a7c82, roughness: 0.45, metalness: 0.7 }), this.metal, box);
    const tankG = new THREE.CylinderGeometry(1, 1, 1, 16); tankG.translate(0, 0.5, 0);
    fill(tankG, new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.8 }), this.tanks, ([x, y, z, r, h]) => { o.position.set(x, y + 2.2, z); o.scale.set(r, h, r); });
    fill(new THREE.CylinderGeometry(0.06, 0.12, 1, 6), new THREE.MeshStandardMaterial({ color: 0x9a9aa0, roughness: 0.4, metalness: 0.8 }), this.masts, ([x, y, z, h]) => { o.position.set(x, y, z); o.scale.set(1, h, 1); });
    this.beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.2, 0.15), fog: false });
    fill(new THREE.SphereGeometry(0.28, 8, 6), this.beaconMat, this.beacons, ([x, y, z]) => o.position.set(x, y, z));
  }
  update(t) { if (this.beaconMat) { const on = (t % 1.6) < 0.5; this.beaconMat.color.setRGB(on ? 5 : 0.15, on ? 0.25 : 0.01, on ? 0.2 : 0.01); } }
}

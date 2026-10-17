// Las Vegas set dressing: animated LED video boards, chasing-bulb marquees, the Crown pylon sign,
// a pedestrian skybridge over the boulevard, curbside clutter and uplit palms.
// Pure scenery plus a few round colliders; missions, economy and saves are untouched.
import * as THREE from 'three';
import { mat, neon, signMesh, glowTex, M } from '../../hd-demo/lib/characters.js';

const TAU = Math.PI * 2;
let seed = 1337; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- LED video boards (canvas animated ~12 fps)
const LED_GRID = (() => { // pixel-pitch mask multiplied over every frame
  const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(3, 0, 1, 4); g.fillRect(0, 3, 4, 1); return c;
})();
const PROGRAMS = {
  mvp(g, w, h, t) {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#12020a'); gr.addColorStop(1, '#3a0610'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.strokeStyle = `rgba(255,40,60,${0.12 + 0.1 * Math.sin(t * 2 + i)})`; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.82, h * 0.5, 30 + ((t * 40 + i * 30) % 180), 0, TAU); g.stroke(); }
    g.textAlign = 'left'; g.font = `900 ${h * 0.34}px Cinzel, Georgia, serif`;
    const tg = g.createLinearGradient(0, h * 0.2, 0, h * 0.6); tg.addColorStop(0, '#ff7078'); tg.addColorStop(1, '#b00c18'); g.fillStyle = tg; g.fillText('MVP MEDIA', w * 0.05, h * 0.5);
    const sx = ((t * 0.35) % 1.6 - 0.3) * w; const sh = g.createLinearGradient(sx - 60, 0, sx + 60, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
    const lines = ['RUBY MONROE · LIVE AT THE VELVET ROOM', 'OWN THE FRAME. THEN OWN THE FILM.', 'NOW CASTING · MVP STUDIOS · LAS VEGAS BLVD'];
    const k = Math.floor(t / 4) % lines.length, a = Math.min(1, (t % 4) * 2, (4 - (t % 4)) * 2);
    g.globalAlpha = a; g.font = `600 ${h * 0.09}px Montserrat, sans-serif`; g.fillStyle = '#f3e9e4'; g.fillText(lines[k], w * 0.05, h * 0.74); g.globalAlpha = 1;
    g.fillStyle = '#e8b64c'; g.fillRect(w * 0.05, h * 0.58, w * 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3)), h * 0.015);
  },
  jackpot(g, w, h, t) {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#5a3a08'); gr.addColorStop(1, '#120a02'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(255,200,80,${0.08 + 0.06 * Math.sin(t * 3 + i)})`; g.beginPath(); g.moveTo(w / 2, h / 2); g.arc(w / 2, h / 2, w, (i / 24) * TAU + t * 0.2, ((i + 0.5) / 24) * TAU + t * 0.2); g.fill(); }
    g.textAlign = 'center'; g.font = `900 ${h * 0.16}px Cinzel, Georgia, serif`; g.fillStyle = '#ffe08a'; g.fillText('CROWN CASINO', w / 2, h * 0.2);
    const sym = ['7', 'BAR', '♦', '★', '♛'], rw = w * 0.2;
    for (let r = 0; r < 3; r++) {
      const x = w / 2 + (r - 1) * rw * 1.1; g.fillStyle = '#fff8e8'; g.fillRect(x - rw / 2, h * 0.27, rw, h * 0.38); g.strokeStyle = '#c89a40'; g.lineWidth = 6; g.strokeRect(x - rw / 2, h * 0.27, rw, h * 0.38);
      const spin = (t * (6 - r * 1.5)) % 10 < 7, s = sym[spin ? Math.floor(t * 14 + r * 3) % sym.length : 0];
      g.fillStyle = s === '7' ? '#d0101e' : '#2a1a08'; g.font = `900 ${h * (s.length > 1 ? 0.13 : 0.24)}px Georgia, serif`; g.fillText(s, x, h * 0.55);
    }
    const pot = 1000000 + Math.floor(t * 137) % 99999; g.font = `800 ${h * 0.14}px Montserrat, sans-serif`; g.fillStyle = Math.sin(t * 8) > 0 ? '#ffffff' : '#ffd060';
    g.fillText('$' + pot.toLocaleString('en-US') + ' JACKPOT', w / 2, h * 0.86);
  },
  scarlet(g, w, h, t) {
    for (let y = 0; y < h; y += 4) { const v = 0.5 + 0.5 * Math.sin(y * 0.03 + t * 2); g.fillStyle = `rgb(${120 + 120 * v},${20},${90 + 100 * (1 - v)})`; g.fillRect(0, y, w, 4); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.font = `italic 700 ${h * 0.24}px Georgia, serif`; g.fillStyle = '#ffd8f0'; g.fillText('Coco Bellamy', w / 2, h * 0.45);
    g.font = `600 ${h * 0.09}px Montserrat, sans-serif`; g.fillStyle = '#ffffff'; g.fillText('SCARLET LOUNGE · BURLESQUE NIGHTLY', w / 2, h * 0.64);
    const msg = '   FEATHERS · RHINESTONES · LATE SHOWS 11PM & 1AM · NO COVER BEFORE MIDNIGHT ·', tw = g.measureText(msg).width; g.textAlign = 'left'; g.fillStyle = '#ffcc33';
    const x = -((t * 120) % tw); g.fillText(msg + msg, x, h * 0.88);
  },
  weekly(g, w, h, t) {
    g.fillStyle = '#081420'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(58,215,255,${0.35 - i * 0.035})`; g.lineWidth = 8; g.beginPath(); g.arc(w * 0.72, h * 0.62, ((t * 60 + i * 40) % 360), 0, TAU); g.stroke(); }
    g.textAlign = 'left'; g.font = `800 ${h * 0.1}px Montserrat, sans-serif`; g.fillStyle = '#3ad7ff'; g.fillText('VEGAS NIGHTLIFE WEEKLY', w * 0.05, h * 0.18);
    g.font = `900 ${h * 0.24}px Cinzel, Georgia, serif`; g.fillStyle = '#ffd27a'; g.fillText('NOVA STARR', w * 0.05, h * 0.5);
    g.font = `600 ${h * 0.09}px Montserrat, sans-serif`; g.fillStyle = '#ffffff'; g.fillText('THE SWIM ISSUE · ON STANDS NOW', w * 0.05, h * 0.68);
    g.fillStyle = '#ff2a4a'; g.fillRect(w * 0.05, h * 0.78, w * 0.26, h * 0.1); g.fillStyle = '#fff'; g.font = `700 ${h * 0.065}px Montserrat, sans-serif`; g.fillText('PHOTOS: MVP MEDIA', w * 0.065, h * 0.855);
  },
};
const SPILL = { mvp: '#ff2a3a', jackpot: '#ffc860', scarlet: '#ff4fd8', weekly: '#3ad7ff' };
class LedBoard {
  constructor(parent, program, x, y, z, ry, wm, hm, spill = true) {
    this.c = document.createElement('canvas'); this.c.width = 512; this.c.height = Math.round(512 * hm / wm); this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4; this.program = PROGRAMS[program];
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; parent.add(grp);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(wm, hm), new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(1.7, 1.7, 1.7), toneMapped: true }));
    screen.position.z = 0.12; grp.add(screen, M(new THREE.BoxGeometry(wm + 0.8, hm + 0.8, 0.4), mat('#141216', 0.4, 0.8), 0, 0, -0.1));
    // cast a little of the screen's colour onto the street in front of it
    if (spill) { this.spill = new THREE.PointLight(0xffffff, 0, Math.max(wm, hm) * 1.6, 2); this.spill.position.set(0, -hm * 0.2, Math.max(wm, hm) * 0.5); grp.add(this.spill); }
    if (this.spill) { this.spill.color.set(SPILL[program]); this.spill.intensity = 45; }
    this.group = grp; this.t = -1; this.draw(0);
  }
  draw(t) {
    const g = this.g, w = this.c.width, h = this.c.height; this.program(g, w, h, t);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(LED_GRID, 'repeat'); g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
    this.tex.needsUpdate = true;
    
  }
  update(t) { if (t - this.t > 1 / 12) { this.t = t; this.draw(t); } }
}

// ---------- chasing bulb marquee around a rectangle (in a group's local XY plane)
class Marquee {
  constructor(parent, x, y, z, ry, w, h, spacing = 0.55, warm = true) {
    const pts = [];
    for (let s = 0; s < w; s += spacing) pts.push([-w / 2 + s, h / 2], [w / 2 - s, -h / 2]);
    for (let s = 0; s < h; s += spacing) pts.push([w / 2, h / 2 - s], [-w / 2, -h / 2 + s]);
    // order around the perimeter so the chase reads as motion
    pts.sort((a, b) => Math.atan2(a[1] / h, a[0] / w) - Math.atan2(b[1] / h, b[0] / w));
    this.im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), pts.length);
    const o = new THREE.Object3D(), grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; parent.add(grp);
    pts.forEach(([px, py], i) => { o.position.set(px, py, 0.25); o.updateMatrix(); this.im.setMatrixAt(i, o.matrix); });
    grp.add(this.im); this.n = pts.length; this.warm = warm; this.c = new THREE.Color(); this.step = -1; this.update(0);
  }
  update(t) {
    const step = Math.floor(t * 12); if (step === this.step) return; this.step = step;
    for (let i = 0; i < this.n; i++) {
      const on = (i + step) % 4 < 2;
      this.c.setRGB(on ? 5 : 0.35, on ? (this.warm ? 3.6 : 4.5) : 0.22, on ? (this.warm ? 1.6 : 4.5) : 0.08); this.im.setColorAt(i, this.c);
    }
    this.im.instanceColor.needsUpdate = true;
  }
}

export function buildStrip(scene, D) {
  const W = new THREE.Group(); W.name = 'Strip dressing'; scene.add(W);
  const boards = [], marquees = [], circle = (x, z, r) => D.circles.push({ x, z, r });
  const o = new THREE.Object3D();
  const inst = (geo, material, list, set, shadow = true) => { const im = new THREE.InstancedMesh(geo, material, list.length); list.forEach((p, i) => { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); set(o, p); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = shadow; im.receiveShadow = true; W.add(im); return im; };

  // LED boards on the towers flanking the strip
  boards.push(new LedBoard(W, 'mvp', 49.7, 30, -64, -Math.PI / 2, 30, 15));
  marquees.push(new Marquee(W, 49.7, 30, -64, -Math.PI / 2, 31.4, 16.4, 0.7, false));
  boards.push(new LedBoard(W, 'weekly', 61.7, 21, 62, -Math.PI / 2, 24, 12, false));
  boards.push(new LedBoard(W, 'scarlet', 14.7, 11.2, -85, -Math.PI / 2, 12, 5));
  marquees.push(new Marquee(W, 14.7, 11.2, -85, -Math.PI / 2, 12.8, 5.8, 0.45, true));

  // Crown pylon sign: twin gold legs, crown header, double-sided jackpot screen + bulbs
  const py = new THREE.Group(); py.position.set(-14.2, 0, -82); W.add(py);
  const gold = mat('#d8a840', 0.25, 1);
  for (const z of [-2.6, 2.6]) { py.add(M(new THREE.BoxGeometry(0.9, 22, 0.9), gold, 0, 11, z)); circle(-14.2, -82 + z, 0.7); }
  py.add(M(new THREE.BoxGeometry(1.2, 2.4, 7.4), mat('#1a1208', 0.4, 0.6), 0, 22.6, 0));
  const head = signMesh('CROWN', '#ffcc33', 7, 2); for (const s of [1, -1]) { const h2 = head.clone(); h2.position.set(0.62 * s, 22.6, 0); h2.rotation.y = s * Math.PI / 2; py.add(h2); }
  for (const s of [1, -1]) {
    const b = new LedBoard(py, 'jackpot', 0.45 * s, 15, 0, s * Math.PI / 2, 6.4, 7.6, s > 0); boards.push(b);
    marquees.push(new Marquee(py, 0.5 * s, 15, 0, s * Math.PI / 2, 7.2, 8.4, 0.4, true));
  }

  // pedestrian skybridge over the boulevard (clear height 7 m for traffic)
  const bz = -125, deckY = 7.6, glass = new THREE.MeshPhysicalMaterial({ color: 0x8ab4d8, roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.28, envMapIntensity: 2, side: THREE.DoubleSide });
  W.add(M(new THREE.BoxGeometry(30, 0.9, 4.6), mat('#3a3640', 0.6, 0.4), 0, deckY, bz));
  for (const s of [1, -1]) W.add(M(new THREE.BoxGeometry(30, 1.6, 0.06), glass, 0, deckY + 1.25, bz + s * 2.25), M(new THREE.BoxGeometry(30, 0.1, 0.12), mat('#c8c8d0', 0.3, 1), 0, deckY + 2.1, bz + s * 2.25));
  W.add(M(new THREE.BoxGeometry(30, 0.25, 5.2), mat('#2a2830', 0.5, 0.6), 0, deckY + 3.4, bz));
  for (const x of [-10, -5, 0, 5, 10]) for (const s of [1, -1]) W.add(M(new THREE.BoxGeometry(0.12, 3.3, 0.12), mat('#c8c8d0', 0.3, 1), x, deckY + 1.7, bz + s * 2.3));
  for (const s of [1, -1]) W.add(M(new THREE.BoxGeometry(30, 0.08, 0.08), neon(s > 0 ? '#ff4fd8' : '#3ad7ff', 5), 0, deckY - 0.48, bz + s * 2.2));
  for (const x of [-10.6, 10.6]) { W.add(M(new THREE.CylinderGeometry(0.35, 0.4, deckY - 0.4, 14), mat('#3a3640', 0.5, 0.5), x, (deckY - 0.4) / 2, bz)); circle(x, bz, 0.5); }
  for (const s of [1, -1]) { const sg = signMesh('CROWN  ⇄  THE STRIP', '#ffcc33', 10, 1.1); sg.position.set(0, deckY - 0.05, bz + s * 2.33); if (s < 0) sg.rotation.y = Math.PI; W.add(sg); }

  // curbside clutter: parking meters, trash cans, newspaper boxes, bus shelter
  const meters = [], cans = [], news = [];
  for (const sx of [-1, 1]) for (let z = -104; z <= 104; z += 7.3) {
    if (Math.abs(z) < 16) continue;
    if (Math.abs((z + 290) % 22) < 2.5 || Math.abs((z + 290) % 22) > 19.5) continue; // keep clear of lamp posts
    if (rnd() < 0.55) meters.push([sx * 10.55, z]);
    else if (rnd() < 0.5) cans.push([sx * 10.6, z]);
  }
  const NEWS = ['#c8141f', '#1f5ad0', '#e8b400', '#1a1a1a'];
  for (const [x, z] of [[-14.4, -48], [-14.4, -47.2], [14.4, 58], [14.4, 58.8], [-14.4, 92], [14.4, -64], [14.4, -63.2]]) news.push([x, z, NEWS[news.length % NEWS.length]]);
  const metal = mat('#5a5c62', 0.35, 0.8);
  inst(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), metal, meters, (o, [x, z]) => o.position.set(x, 0.76, z));
  inst(new THREE.BoxGeometry(0.22, 0.32, 0.16), mat('#2a2c30', 0.4, 0.7), meters, (o, [x, z]) => o.position.set(x, 1.45, z));
  inst(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 14), mat('#1e2a24', 0.55, 0.4), cans, (o, [x, z]) => o.position.set(x, 0.64, z));
  inst(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14), mat('#3a3a3e', 0.4, 0.8), cans, (o, [x, z]) => o.position.set(x, 1.13, z));
  const newsIm = inst(new THREE.BoxGeometry(0.5, 1.05, 0.45), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.3 }), news, (o, [x, z]) => o.position.set(x, 0.68, z));
  news.forEach(([, , c], i) => newsIm.setColorAt(i, new THREE.Color(c)));
  for (const [x, z] of [...meters, ...cans]) circle(x, z, 0.3);
  for (const [x, z] of news) circle(x, z, 0.4);
  // bus shelter with a backlit ad panel
  const bus = new THREE.Group(); bus.position.set(-14.2, 0.16, 64); W.add(bus);
  bus.add(M(new THREE.BoxGeometry(1.6, 0.08, 4.4), mat('#2a2a30', 0.4, 0.7), 0, 2.5, 0));
  for (const z of [-2.1, 2.1]) bus.add(M(new THREE.BoxGeometry(0.08, 2.5, 0.08), mat('#8a8a90', 0.3, 0.9), 0.7, 1.25, z), M(new THREE.BoxGeometry(0.08, 2.5, 0.08), mat('#8a8a90', 0.3, 0.9), -0.7, 1.25, z));
  bus.add(M(new THREE.BoxGeometry(0.04, 2.0, 4.1), new THREE.MeshPhysicalMaterial({ color: 0x9ab8d0, transparent: true, opacity: 0.22, roughness: 0.05 }), -0.72, 1.3, 0));
  const ad = signMesh('RUBY MONROE · THE VELVET ROOM', '#ff2a4a', 3.6, 0.5); ad.position.set(-0.68, 2.1, 0); ad.rotation.y = Math.PI / 2; bus.add(ad);
  const adPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, 1.2) })); adPanel.position.set(0.05, 1.2, 2.05); bus.add(adPanel);
  bus.add(M(new THREE.BoxGeometry(0.5, 0.06, 3.2), mat('#5a4636', 0.8), -0.4, 0.5, 0));
  D.colliders.push({ minX: -14.95, maxX: -13.45, minZ: 61.8, maxZ: 66.2 });

  // median shrubs between the palms + warm uplights on the palm trunks
  const shrubs = [], uplights = [];
  for (let z = -290; z <= 290; z += 3.2) if (Math.abs(z) > 16 && ((z + 290) % 18) > 1.5 && ((z + 290) % 18) < 16.5) shrubs.push([(rnd() - 0.5) * 0.9, z, 0.45 + rnd() * 0.35]);
  for (let z = -290; z <= 290; z += 18) if (Math.abs(z) > 20) uplights.push([0, z]);
  inst(new THREE.IcosahedronGeometry(1, 1), mat('#3d7040', 0.8), shrubs, (o, [x, z, s]) => { o.position.set(x, 0.3 + s * 0.5, z); o.scale.set(s, s * 0.8, s * 1.2); o.rotation.set(rnd(), rnd(), 0); });
  const upGlow = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.4, 0.9, 0.5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (const [x, z] of uplights) { const s = new THREE.Sprite(upGlow); s.position.set(x, 1.4, z); s.scale.set(1.6, 3.2, 1); W.add(s); }

  return { group: W, update(t) { for (const b of boards) b.update(t); for (const m of marquees) m.update(t); } };
}

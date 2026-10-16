// MVP MEDIA · The world: Las Vegas Blvd x Fremont Ave, playable in third person. three r160, no build step.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as C from '../hd-demo/lib/characters.js';
import { buildStudio } from '../hd-demo/lib/studio.js';
import { SpringSystem } from '../hd-demo/lib/springs.js';
import { buildDistrict } from './lib/district.js';
import { Traffic, Pedestrians, carModel } from './lib/npcs.js';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const canvas = $('#view');
const TOUCH = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !TOUCH, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1500);

// ---------- world scene: night sky, neon environment, moonlight
const world = new THREE.Scene();
const skyTex = C.canvasTex(8, 512, (g) => { const r = g.createLinearGradient(0, 0, 0, 512); r.addColorStop(0, '#05030c'); r.addColorStop(0.55, '#120a24'); r.addColorStop(0.8, '#3a1428'); r.addColorStop(1, '#6a2a2a'); g.fillStyle = r; g.fillRect(0, 0, 8, 512); });
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })); world.add(skyDome);
const starG = new THREE.BufferGeometry(), starP = []; for (let i = 0; i < 1500; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + 0.12, r = 1100; starP.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
starG.setAttribute('position', new THREE.Float32BufferAttribute(starP, 3)); world.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 })));
world.fog = new THREE.Fog(0x1a0c1c, 60, 420);
{ const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(); env.background = new THREE.Color(0x06030a);
  const panel = (c, k, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel('#ff2a4a', 3, -10, 3, 0, 6, 2); panel('#ff4fd8', 2, 8, 4, -6, 5, 2); panel('#3ad7ff', 2, 6, 3, 8, 4, 2); panel('#ffb070', 2.5, -6, 6, -8, 8, 4); panel('#ffcc33', 2, 0, 9, 10, 6, 2); panel('#2a1a3a', 1, 0, 14, 0, 30, 30);
  world.environment = pm.fromScene(env, 0.03).texture; pm.dispose(); }
world.add(new THREE.HemisphereLight(0x8a7aaa, 0x2a1418, 0.6));
const moon = new THREE.DirectionalLight(0xb8c4ff, 0.7); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.03;
world.add(moon, moon.target);
const D = buildDistrict(world);
const traffic = new Traffic(world, D.signals);
const peds = new Pedestrians(world, D.walks, TOUCH ? 16 : 26);
for (const p of D.parked) { const c = carModel(p.color, p.mine); c.position.set(p.x, 0, p.z); c.rotation.y = p.ry + Math.PI / 2; world.add(c); }

// ---------- studio interior
const studio = new THREE.Scene(); buildStudio(studio, true);
{ const pm = new THREE.PMREMGenerator(renderer); const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'); studio.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture; pm.dispose(); }
studio.traverse(o => { if (o.isLight) o.intensity *= o.isSpotLight || o.isPointLight ? Math.PI * 4 : Math.PI; });
const SCENES = { world: { scene: world, exposure: 0.85, bounds: D.bounds }, studio: { scene: studio, exposure: 0.9, bounds: { minX: -6.5, maxX: 6.5, minZ: -2.2, maxZ: 7.5 } } };
let where = 'world';

// ---------- post
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(world, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.65, 0.5, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- characters
const springs = new SpringSystem(); springs.amount = 0.5;
const mvp = C.makeHero(Object.assign({}, C.MVP_LOOK, { camera: true }));
world.add(mvp.root); springs.addRig(mvp);
const ruby = C.makeHero(Object.assign({ outfit: 'two' }, C.TALENT.ruby.look)); world.add(ruby.root); springs.addRig(ruby);
const bouncer = C.makeHero({ fem: false, skin: '#3a2216', color: '#121214', bottom: '#121214', outfit: 'suit', hair: 'short', beard: true, scale: 1.12 });
const dee = C.makeHero({ skin: '#8a5636', color: '#1fa3a0', bottom: '#2a3a5a', outfit: 'casual', hair: 'bun', hairC: '#120a08' });
for (const [rig, key] of [[bouncer, 'bouncer'], [dee, 'dee']]) { const n = D.NPC[key]; rig.root.position.set(n.x, 0.16, n.z); rig.root.rotation.y = n.ry; world.add(rig.root); }
C.setPose(bouncer, { shL: [-0.3, 0, -0.35], elL: [-1.3, 0, 0], shR: [-0.3, 0, 0.35], elR: [-1.3, 0, 0], hpL: [0, 0, 0.1], hpR: [0, 0, -0.1] }, 1);
const P = { x: D.spawn.x, z: D.spawn.z, a: D.spawn.yaw, ry: D.spawn.yaw, v: 0, walk: 0, move: 0 };
const R = { x: D.NPC.ruby.x, z: D.NPC.ruby.z, a: D.NPC.ruby.ry, ry: D.NPC.ruby.ry, walk: 0, move: 0, follow: false };
const cam = { yaw: D.spawn.yaw + Math.PI, pitch: 0.28, dist: 4.4 };

// ---------- save / mission
const SAVE_KEY = 'mvp_world_v1';
let save = { stage: 0, shots: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) save = Object.assign(save, s); } catch (e) {}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ stage: save.stage, shots: save.shots, x: P.x, z: P.z })); } catch (e) {} };
if (save.x !== undefined && save.stage !== 1) { P.x = save.x; P.z = save.z; }
if (save.stage === 1) save.stage = 0; // follower state does not survive a reload
const OBJ = ['Find Ruby outside The Velvet Room', 'Walk Ruby to MVP Studios', 'Take 3 promo photos of Ruby (SHOOT)', 'Free roam · Las Vegas after hours'];
function setStage(n) { save.stage = n; persist(); $('#objective').textContent = OBJ[n]; }

// ---------- collision
function collide(p, r, sceneName) {
  const b = SCENES[sceneName].bounds;
  if (sceneName === 'world') {
    for (const c of D.colliders) {
      const cx = clamp(p.x, c.minX, c.maxX), cz = clamp(p.z, c.minZ, c.maxZ), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) { if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; } else { const o = [p.x - c.minX, c.maxX - p.x, p.z - c.minZ, c.maxZ - p.z], m = Math.min(...o); if (m === o[0]) p.x = c.minX - r; else if (m === o[1]) p.x = c.maxX + r; else if (m === o[2]) p.z = c.minZ - r; else p.z = c.maxZ + r; } }
    }
    for (const c of D.circles) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = r + c.r; if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
  }
  p.x = clamp(p.x, b.minX, b.maxX); p.z = clamp(p.z, b.minZ, b.maxZ);
}
const insideAny = (x, z) => D.colliders.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);

// ---------- input
const keys = new Set(), pressed = new Set();
let locked = false, drag = null;
addEventListener('keydown', e => { if (e.repeat) return; keys.add(e.code); pressed.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('mousedown', e => { if (e.button === 0 && !TOUCH) { try { const r = canvas.requestPointerLock(); r && r.catch && r.catch(() => {}); } catch (err) {} } });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
addEventListener('mousemove', e => { if (locked) { cam.yaw -= e.movementX * 0.0025; cam.pitch = clamp(cam.pitch + e.movementY * 0.002, -0.15, 1.1); } });
// touch: left half joystick, right half look
const stick = { id: null, ox: 0, oy: 0, f: 0, r: 0 }, look = { id: null, x: 0, y: 0 };
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return; e.preventDefault();
  if (stick.id === null && e.clientX < innerWidth * 0.45) { stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; $('#stick').style.left = e.clientX + 'px'; $('#stick').style.top = e.clientY + 'px'; $('#stick').classList.add('on'); }
  else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
}, { passive: false });
canvas.addEventListener('pointermove', e => {
  if (e.pointerId === stick.id) { let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const l = Math.hypot(dx, dy); if (l > 54) { dx *= 54 / l; dy *= 54 / l; } stick.r = dx / 54; stick.f = -dy / 54; $('#knob').style.transform = `translate(${dx}px,${dy}px)`; }
  else if (e.pointerId === look.id) { cam.yaw -= (e.clientX - look.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - look.y) * 0.004, -0.15, 1.1); look.x = e.clientX; look.y = e.clientY; }
});
const endTouch = e => { if (e.pointerId === stick.id) { stick.id = null; stick.f = stick.r = 0; $('#knob').style.transform = ''; $('#stick').classList.remove('on'); } if (e.pointerId === look.id) look.id = null; };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
$('#act').addEventListener('click', () => pressed.add('KeyE'));
$('#shutter').addEventListener('click', () => pressed.add('KeyP'));
if (TOUCH) document.body.classList.add('touch');

// ---------- UI helpers
let dialog = null;
function talk(lines, done) { dialog = { lines, i: 0, done }; showLine(); }
function showLine() { const [who, text] = dialog.lines[dialog.i]; $('#dlg-who').textContent = who; $('#dlg-text').textContent = text; $('#dialog').hidden = false; }
function advance() { dialog.i++; if (dialog.i >= dialog.lines.length) { const d = dialog.done; dialog = null; $('#dialog').hidden = true; d && d(); } else showLine(); }
$('#dialog').addEventListener('click', () => dialog && advance());
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); }
let zoneName = '';
function setZone(name) { if (name === zoneName) return; zoneName = name; const z = $('#zone'); z.textContent = name; z.classList.remove('pop'); void z.offsetWidth; z.classList.add('pop'); }
function photo() {
  composer.render(); const url = canvas.toDataURL('image/jpeg', 0.9);
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  const img = document.createElement('img'); img.src = url; img.alt = 'Photo'; $('#strip').prepend(img); while ($('#strip').children.length > 8) $('#strip').lastChild.remove();
  if (where === 'studio' && save.stage === 2) {
    const v = new THREE.Vector3(ruby.root.position.x, 1.5, ruby.root.position.z).project(camera);
    if (Math.abs(v.x) < 0.8 && Math.abs(v.y) < 0.8 && v.z < 1) { save.shots++; toast(`Promo shot ${save.shots} / 3`); if (save.shots >= 3) { setStage(3); talk([['Ruby Monroe', 'Okay, those are going on the marquee tonight. Tony owes you nine hundred. I am telling everybody about MVP Media.'], ['MVP', 'Go tell them. The studio door is always open.']]); } }
    else toast('Get Ruby in the frame first.');
  }
}

// ---------- interiors
function enter(name) {
  const f = $('#fade'); f.classList.add('on');
  setTimeout(() => {
    where = name; const S = SCENES[name].scene; renderPass.scene = S;
    S.add(mvp.root);
    if (name === 'studio') { P.x = 0; P.z = 4.4; P.a = P.ry = Math.PI; cam.yaw = 0; if (save.stage >= 1) { studio.add(ruby.root); R.x = 0.4; R.z = 0.3; R.follow = false; if (save.stage === 1) { setStage(2); talk([['Ruby Monroe', 'So this is MVP Studios. Nice light. Where do you want me?'], ['MVP', 'Right on the mark. Three frames and we are done. Hit SHOOT when you are ready.']]); } } }
    else { const d = D.pois.find(p => p.id === 'studio'); P.x = d.x - 0.5; P.z = d.z; P.a = P.ry = -Math.PI / 2; cam.yaw = Math.PI / 2; world.add(ruby.root); if (save.stage >= 2) { R.x = D.NPC.ruby.x; R.z = D.NPC.ruby.z; R.a = R.ry = D.NPC.ruby.ry; R.follow = false; } }
    springs.joints.forEach(j => j.init = false); snapCam = true;
    f.classList.remove('on');
  }, 380);
}

// ---------- minimap (static layout + live markers)
const map = $('#map'), mctx = map.getContext('2d');
function drawMap(target) {
  const s = map.width, k = s / 230, cx = s / 2, cz = s / 2, X = x => cx + x * k, Z = z => cz + z * k;
  mctx.fillStyle = '#0d080c'; mctx.fillRect(0, 0, s, s);
  mctx.fillStyle = '#2a2430'; mctx.fillRect(X(-10), 0, 20 * k, s); mctx.fillRect(0, Z(-8), s, 16 * k);
  mctx.fillStyle = '#3a2a36'; for (const c of D.colliders) mctx.fillRect(X(c.minX), Z(c.minZ), (c.maxX - c.minX) * k, (c.maxZ - c.minZ) * k);
  for (const p of D.pois) { mctx.fillStyle = p.id === 'studio' ? '#ff2a3a' : '#e8b64c'; mctx.beginPath(); mctx.arc(X(p.x), Z(p.z), 3, 0, 7); mctx.fill(); }
  if (target) { mctx.strokeStyle = '#ff3b48'; mctx.lineWidth = 2; mctx.beginPath(); mctx.arc(X(target.x), Z(target.z), 5 + Math.sin(performance.now() / 200) * 1.5, 0, 7); mctx.stroke(); }
  mctx.save(); mctx.translate(X(P.x), Z(P.z)); mctx.rotate(-P.ry); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, 7); mctx.lineTo(-4.5, -4); mctx.lineTo(4.5, -4); mctx.fill(); mctx.restore();
}

// ---------- simulation
function moveChar(c, ix, iz, speed, dt, sceneName, rig) {
  const l = Math.hypot(ix, iz);
  c.move = lerp(c.move, l > 0.05 ? (speed > 3 ? 1 : 0.62) : 0, Math.min(1, dt * 8));
  if (l > 0.05) {
    ix /= l; iz /= l; c.a = Math.atan2(ix, iz);
    const nx = c.x + ix * speed * dt, nz = c.z + iz * speed * dt;
    if (!(sceneName === 'world' && traffic.blocks(nx, nz, 0.35))) { c.x = nx; c.z = nz; }
    collide(c, 0.38, sceneName);
    c.walk += dt * (speed > 3 ? 10 : 7);
  }
  c.ry += angDiff(c.ry, c.a) * Math.min(1, dt * 10);
  const y = sceneName === 'world' ? (Math.abs(c.x) > 10.1 || Math.abs(c.z) > 8.1 ? 0.16 : 0) : 0;
  rig.root.position.set(c.x, y, c.z); rig.root.rotation.y = c.ry;
  if (c.move > 0.05) C.walkPose(rig, c.walk, c.move, 1);
}
function nearestInteraction() {
  if (where === 'studio') return Math.hypot(P.x - 0, P.z - 7) < 2 ? { prompt: 'Exit to Las Vegas Blvd', act: () => enter('world') } : null;
  const opts = [];
  if (save.stage === 0 && Math.hypot(P.x - R.x, P.z - R.z) < 3.2) opts.push({ d: Math.hypot(P.x - R.x, P.z - R.z), prompt: 'Talk to Ruby', act: () => talk([['Ruby Monroe', 'There he is. Tony wants new promo shots for the marquee and he wants them tonight.'], ['Ruby Monroe', 'Your studio is right across the boulevard, red door. Lead the way, photographer.'], ['MVP', 'Stay close. Watch the traffic.']], () => { setStage(1); R.follow = true; }) });
  else if (Math.hypot(P.x - R.x, P.z - R.z) < 2.6 && !R.follow) opts.push({ d: 1, prompt: 'Talk to Ruby', act: () => talk([['Ruby Monroe', save.stage >= 3 ? 'The marquee looks amazing. Book me again, MVP.' : 'Studio first, flirting later.']]) });
  const bd = Math.hypot(P.x - D.NPC.bouncer.x, P.z - D.NPC.bouncer.z); if (bd < 2.6) opts.push({ d: bd, prompt: 'Talk to the bouncer', act: () => talk([['Bouncer', 'Velvet Room is at capacity. Headliner goes on at midnight. You on the list?'], ['MVP', 'I am the photographer.'], ['Bouncer', 'Then you will be inside soon enough. Not tonight.']]) });
  const dd = Math.hypot(P.x - D.NPC.dee.x, P.z - D.NPC.dee.z); if (dd < 2.6) opts.push({ d: dd, prompt: 'Talk to Dee', act: () => talk([['Dee', 'Lens & Light. Glass, gimbals, lighting kits. Come back with some money, MVP, and I will make your photos sing.']]) });
  for (const p of D.pois) { const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < p.r) opts.push({ d, prompt: p.prompt, act: () => {
    if (p.id === 'studio') enter('studio');
    else if (p.id === 'room12') { persist(); toast('Game saved in Room 12.'); }
    else if (p.id === 'poolspot') { cam.yaw = Math.PI / 2 * -1; cam.pitch = 0.15; toast('Photo spot: frame the pool and hit SHOOT.'); }
    else if (p.talk) talk(p.talk);
  } }); }
  opts.sort((a, b) => a.d - b.d); return opts[0] || null;
}
function objectiveTarget() {
  if (save.stage === 0) return { x: R.x, z: R.z };
  if (save.stage === 1) return D.pois.find(p => p.id === 'studio');
  return null;
}
const v3 = new THREE.Vector3(), lookAt = new THREE.Vector3(); let snapCam = true;
function update(dt, t) {
  const S = SCENES[where];
  if (dialog) { if (pressed.has('KeyE') || pressed.has('Space') || pressed.has('Enter')) advance(); moveChar(P, 0, 0, 0, dt, where, mvp); }
  else {
    let f = stick.f, r = stick.r;
    if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) r += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) r -= 1;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw); // camera forward on the ground
    const ix = fx * f - fz * r, iz = fz * f + fx * r;
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(stick.f, stick.r) > 0.92;
    moveChar(P, ix, iz, run ? 5.6 : 2.3, dt, where, mvp);
  }
  if (mvp.root.position && P.move <= 0.05) C.setPose(mvp, Object.assign({ sp: [0.02 + Math.sin(t * 1.6) * 0.015, 0, 0] }, C.HOLD), Math.min(1, dt * 8));
  C.updProps(mvp);
  // Ruby: idle pose at the club, or follow the player
  if (ruby.root.parent === S.scene) {
    if (R.follow && where === 'world') {
      const tx = P.x - Math.sin(P.ry) * 1.6 + Math.cos(P.ry) * 0.9, tz = P.z - Math.cos(P.ry) * 1.6 - Math.sin(P.ry) * 0.9, d = Math.hypot(tx - R.x, tz - R.z);
      moveChar(R, d > 0.6 ? tx - R.x : 0, d > 0.6 ? tz - R.z : 0, d > 6 ? 5.4 : 2.4, dt, 'world', ruby);
      if (R.move <= 0.05) C.setPose(ruby, C.RUBY_A, Math.min(1, dt * 4));
      if (d > 30) { R.x = tx; R.z = tz; }
    } else {
      ruby.root.position.set(R.x, where === 'world' ? 0.16 : 0, R.z); ruby.root.rotation.y = where === 'studio' ? 0.25 : R.ry;
      const list = where === 'studio' ? [C.RUBY_A, C.POSES[1], C.RUBY_B, C.POSES[3], C.POSES[5]] : [C.RUBY_A, C.RUBY_B];
      C.setPose(ruby, list[Math.floor(t / 3.4) % list.length], Math.min(1, dt * 3));
    }
  }
  if (where === 'world') {
    traffic.update(dt, P); peds.update(dt, P); D.update(t);
    C.setPose(dee, { sp: [0, Math.sin(t * 0.6) * 0.15, 0], hd: [0, Math.sin(t * 0.4) * 0.5, 0], shL: [0, 0, 0.6], elL: [-0.4, 0, -1.6] }, Math.min(1, dt * 3));
    const z = D.zones.find(z => P.x > z.minX && P.x < z.maxX && P.z > z.minZ && P.z < z.maxZ); setZone(z ? z.name : 'Las Vegas');
    moon.position.set(P.x - 30, 60, P.z + 20); moon.target.position.set(P.x, 0, P.z);
  } else setZone('MVP Studios · Stage A');
  springs.update(dt);
  // interaction
  const near = dialog ? null : nearestInteraction();
  $('#prompt').hidden = !near; if (near) $('#prompt-text').textContent = near.prompt;
  if (near && pressed.has('KeyE')) near.act();
  if (pressed.has('KeyP')) photo();
  // camera: orbit behind the player, pulled in before walls
  const target = new THREE.Vector3(P.x, 1.55, P.z);
  let dist = cam.dist * (where === 'studio' ? 0.95 : 1);
  if (where === 'world') for (let s = 0.4; s < dist; s += 0.25) { const x = P.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * s, z = P.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * s; if (insideAny(x, z)) { dist = Math.max(0.8, s - 0.35); break; } }
  v3.set(P.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist, 1.55 + Math.sin(cam.pitch) * dist, P.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist);
  // keep the player right of centre (over-the-shoulder)
  const side = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)).multiplyScalar(0.45);
  v3.add(side); if (snapCam) { camera.position.copy(v3); snapCam = false; } else camera.position.lerp(v3, Math.min(1, dt * 12)); lookAt.copy(target).add(side); camera.lookAt(lookAt);
  renderer.toneMappingExposure = S.exposure;
  drawMap(where === 'world' ? objectiveTarget() : null);
  // beacon over the objective
  const tgt = where === 'world' ? objectiveTarget() : null; beacon.visible = !!tgt; if (tgt) beacon.position.set(tgt.x, 0, tgt.z);
  const mm = (42 + Math.floor(t / 10)) % 60; $('#clock').textContent = `11:${String(mm).padStart(2, '0')} PM`;
}
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 40, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.25, 0.3), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beacon.geometry.translate(0, 20, 0); world.add(beacon);

// ---------- loop
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); camera.aspect = w / h; camera.updateProjectionMatrix(); const ms = Math.round(Math.min(170, w * 0.28) * Math.min(devicePixelRatio, 2)); map.width = map.height = ms; }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let T = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05); T += dt;
  update(dt, T); pressed.clear();
  composer.render();
}
setStage(save.stage);
if (save.stage >= 2) { /* already finished the studio scene earlier */ }
$('#loading').hidden = true;
if (save.stage === 0) setTimeout(() => toast('Ruby is waiting outside The Velvet Room. Follow the red beacon.'), 1200);
frame();
window.__world = { P, R, cam, save, enter, D, setStage, camera, composer, get where() { return where; } };

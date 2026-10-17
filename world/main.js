// MVP MEDIA · Las Vegas. Third-person HD world with driving, interiors and the full Beyond the Frame story. three r160, no build step.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildVisuals, CinemaGrade } from './lib/visuals.js';
import { makeNightSky } from './lib/sky.js';
import { WetReflections } from './lib/reflect.js';
import { buildStrip } from './lib/strip.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as C from '../hd-demo/lib/characters.js';
import { buildStudio } from '../hd-demo/lib/studio.js';
import { SpringSystem } from '../hd-demo/lib/springs.js';
import { loadCharacter } from '../hd-demo/lib/glbchar.js';
import { loadMocap, MocapDriver } from '../hd-demo/lib/mocap.js';
import { Music, Voices } from './lib/audio.js';
import { Mannerisms } from './lib/mannerisms.js';
import { buildDistrict } from './lib/district.js?v=block-3';
import { Traffic, Pedestrians, carModel } from './lib/npcs.js';
import { buildClub } from './lib/club.js?v=block-3';
import { PlayerCar, Chaser } from './lib/car.js';
import { buildStudioHQ } from './lib/studiohq.js';
import { StudioHelper } from './lib/helper.js';
import { RUBY_STUDIO, STORY, NPC_LOOKS, FREELANCE, FREE_LOOKS, GIG_SPOTS, GEAR, SETS, BUDGET, CALLS, FILM_TITLES, RUNGS, ATTITUDE } from './lib/story.js';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const onSidewalk = (x, z) => Math.abs(x) > 10.1 && Math.abs(z) > 8.1;
const canvas = $('#view');
const DEMO = new URLSearchParams(location.search).get('demo') === '1';
let demoStarted = !DEMO;
let quality = 'balanced';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(pointer: coarse)').matches;
if (TOUCH) document.body.classList.add('touch');

// ---------- renderer + post
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !TOUCH, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1500);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.65, 0.5, 0.9); composer.addPass(bloom);
const edgePass = new ShaderPass(FXAAShader); edgePass.enabled = TOUCH; composer.addPass(edgePass);
const gradePass = new ShaderPass(CinemaGrade); composer.addPass(gradePass);
composer.addPass(new OutputPass());

// ---------- audio (synth, starts on first input)
let AC = null, master = null, engine = null, music = null;
// sound settings (phone menu): background music and spoken dialogue
const soundPrefs = (() => { try { return Object.assign({ music: true, voices: true }, JSON.parse(localStorage.getItem('mvp_sound') || '{}')); } catch (e) { return { music: true, voices: true }; } })();
const voices = new Voices('../assets/voices/'); voices.on = soundPrefs.voices; // recorded lines live in assets/voices/
function setSound(k, v) { soundPrefs[k] = v; try { localStorage.setItem('mvp_sound', JSON.stringify(soundPrefs)); } catch (e) {} if (k === 'music' && music) music.setOn(v); if (k === 'voices') { voices.on = v; if (!v) voices.stop(); } }
function initAudio() {
  voices.unlock();
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination);
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = 40; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(master); o.start(); engine = { o, g };
    music = new Music(AC, master); music.setOn(soundPrefs.music); voices.attach(AC, AC.destination);
  } catch (e) { AC = null; }
}
function tone(f, d, type = 'sine', v = 0.1, slide = 0, delay = 0) { if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02); }
const SFX = { shutter: () => { tone(2400, 0.03, 'square', 0.07); tone(900, 0.06, 'square', 0.05, -300, 0.04); }, cash: () => [880, 1320, 1760].forEach((f, i) => tone(f, 0.12, 'triangle', 0.07, 0, i * 0.06)),
  bump: () => tone(90, 0.25, 'sawtooth', 0.14, -40), door: () => { tone(220, 0.08, 'square', 0.04); tone(330, 0.08, 'square', 0.04, 0, 0.06); }, win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, 0, i * 0.09)),
  fail: () => tone(300, 0.4, 'sawtooth', 0.09, -180), phone: () => [0, 0.25].forEach(d => { tone(1100, 0.12, 'sine', 0.06, 0, d); tone(1400, 0.12, 'sine', 0.05, 0, d + 0.12); }), click: () => tone(700, 0.03, 'square', 0.035) };
const sfx = n => { try { SFX[n](); } catch (e) {} };

// ---------- world
const world = new THREE.Scene();
const sky = makeNightSky(1200); sky.userData.update(0); world.add(sky);
{ const g = new THREE.BufferGeometry(), p = []; for (let i = 0; i < 1500; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + 0.12; p.push(Math.cos(a) * Math.cos(e) * 1100, Math.sin(e) * 1100, Math.sin(a) * Math.cos(e) * 1100); } g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); world.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 }))); }
world.fog = new THREE.Fog(0x141521, 95, 510);
{ const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(); env.background = new THREE.Color(0x06030a);
  const panel = (c, k, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel('#ff2a4a', 3, -10, 3, 0, 6, 2); panel('#ff4fd8', 2, 8, 4, -6, 5, 2); panel('#3ad7ff', 2, 6, 3, 8, 4, 2); panel('#ffb070', 2.5, -6, 6, -8, 8, 4); panel('#ffcc33', 2, 0, 9, 10, 6, 2); panel('#2a1a3a', 1, 0, 14, 0, 30, 30);
  world.environment = pm.fromScene(env, 0.03).texture; pm.dispose(); }
world.add(new THREE.HemisphereLight(0x9baccb, 0x30202a, 0.8));
const moon = new THREE.DirectionalLight(0xb8c4ff, 0.7); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.03; world.add(moon, moon.target);
const D = buildDistrict(world);
const visuals = buildVisuals(world, D);
const strip = buildStrip(world, D);
const traffic = new Traffic(world, D.signals);
const peds = new Pedestrians(world, D.walks, TOUCH ? 18 : 30);
for (const p of D.parked) { const c = carModel(p.color); c.position.set(p.x, 0, p.z); c.rotation.y = p.ry + Math.PI / 2; world.add(c); }
const carMesh = carModel('#c8141f', true); world.add(carMesh);
const car = new PlayerCar(carMesh, D.myCarSpot.x, D.myCarSpot.z, D.myCarSpot.a);
const wet = new WetReflections(); // rain-slick streets mirror the neon
wet.apply(D.groundMats.asphalt, 0.32, 0.68); wet.apply(D.groundMats.walk, 0.12, 0.3); wet.apply(visuals.puddles.material, 0.95, 0);
wet.collectGround(world);

// ---------- interiors
const studio = new THREE.Scene(); buildStudio(studio, true); const HQ = buildStudioHQ(studio); // Stage A + the rest of the building
const rubyHelp = new StudioHelper(HQ.jobs, HQ.aisleZ, studio); // Ruby's routine at the studio
{ const pm = new THREE.PMREMGenerator(renderer); studio.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture; pm.dispose(); }
studio.traverse(o => { if (o.isLight) o.intensity *= o.isSpotLight || o.isPointLight ? Math.PI * 4 : Math.PI; });
const club = new THREE.Scene(); const CLUB = buildClub(club);
// The club reflects its own room: dark velvet with the stage neon and the bar glow, not a bright white studio.
{ const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(); env.background = new THREE.Color(0x080204);
  const panel = (c, k, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel('#3a0610', 0.6, 0, 3, -14, 26, 8); panel('#3a0610', 0.6, -13, 3, 0, 30, 8); panel('#3a0610', 0.6, 13, 3, 0, 30, 8); panel('#3a0610', 0.5, 0, 3, 14, 26, 8);
  panel('#ff2a4a', 3, 0, 1, -7, 7, 0.4); panel('#ff4fd8', 2, 0, 6, -10, 8, 1.4); panel('#ffb060', 2.2, 11, 2.5, 2, 1, 6); panel('#ff2a3a', 2, 0, 3.6, 14, 1.6, 0.6); panel('#ffffff', 1.4, 0, 7.6, -2, 1, 1);
  club.environment = pm.fromScene(env, 0.04).texture; pm.dispose(); }
const SC = {
  world: { scene: world, exposure: 0.85, colliders: D.colliders, circles: D.circles },
  studio: { scene: studio, exposure: 0.9, colliders: HQ.colliders, circles: HQ.circles, bounds: HQ.bounds, exit: HQ.exit, zone: 'MVP Media Studios' },
  club: { scene: club, exposure: 0.95, colliders: CLUB.colliders, circles: CLUB.circles, bounds: CLUB.bounds, exit: CLUB.exit, zone: 'The Velvet Room' },
};
// Preserve detail on oblique roads, shop signs and costume textures.
const sampledTextures = new Set();
for (const scene of [world, studio, club]) scene.traverse(object => {
  for (const material of [].concat(object.material || [])) for (const field of ['map', 'bumpMap', 'roughnessMap', 'emissiveMap']) {
    const texture = material[field];
    if (texture && !sampledTextures.has(texture)) { texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); sampledTextures.add(texture); }
  }
});
let where = 'world';
renderPass.scene = world;

// ---------- save
const SAVE_KEY = DEMO ? 'mvp_velvet_demo_v1' : 'mvp_world_v2';
const fresh = () => ({ v: 2, street: 0, loyal: {}, choices: {}, dinner: {}, cash: 250, rep: 0, story: 0, studio: false, roster: [], gear: { stab: 0, lens: 0, light: 0, ride: 0 }, releases: [], day: 1, minute: 23 * 60 + 40, lastProduce: 0, shots: 0, introDone: false });
let save = fresh();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) {
  if (!s.v && s.story >= 8) s.story = 10; // saves from the 8-mission build: two missions now sit before the finale
  save = Object.assign(fresh(), s, { v: 2 }); save.gear = Object.assign(fresh().gear, s.gear || {}); } } catch (e) {}
// indoors, P holds room coordinates: save the street spot outside that building's door instead
const outsideDoor = from => { const d = D.pois.find(p => p.id === (from === 'club' ? 'velvet' : 'studio')); return { x: d.x - 1, z: d.z + d.r + 0.8 }; };
const persist = () => { try { const o = where === 'world' ? P : outsideDoor(where); save.x = o.x; save.z = o.z; localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };
const addRep = n => { save.rep = clamp(save.rep + n, 0, 100); };
// Street cred (0-100): earned on the street (chases, standing up to the Neon Kings). Respect is save.rep.
const addStreet = n => { save.street = clamp(save.street + n, 0, 100); };
// Talent loyalty (0-100, starts at 50): choices, paying people right and matching their taste on set.
const loyal = id => save.loyal[id] ?? 50;
const addLoyal = (id, n) => { save.loyal[id] = clamp(loyal(id) + n, 0, 100); };
const feeMul = id => loyal(id) >= 80 ? 0.85 : loyal(id) < 35 ? 1.25 : 1;
const talentFee = id => Math.round(C.TALENT[id].fee * feeMul(id));
const refuses = id => loyal(id) < 15;
const loyalWord = n => n >= 80 ? 'Ride or die' : n >= 60 ? 'Loyal' : n >= 35 ? 'Professional' : n >= 15 ? 'Unhappy' : 'Won\'t work with you';
function applyFx(fx = {}) {
  const out = [];
  if (fx.cash) { save.cash += fx.cash; out.push((fx.cash > 0 ? '+' : '-') + fmt(Math.abs(fx.cash))); }
  if (fx.rep) { addRep(fx.rep); out.push(`${fx.rep > 0 ? '+' : ''}${fx.rep} Respect`); }
  if (fx.street) { addStreet(fx.street); out.push(`${fx.street > 0 ? '+' : ''}${fx.street} Street`); }
  for (const [id, n] of Object.entries(fx.loyal || {})) { addLoyal(id, n); out.push(`${C.TALENT[id].name.split(' ')[0].replace(/"/g, '')} ${n > 0 ? 'trusts you more' : 'trusts you less'}`); }
  return out.join(' · ');
}

// ---------- characters
const springs = new SpringSystem(); springs.amount = 0.5;
const mvp = C.makeHero(Object.assign({}, C.MVP_LOOK, { camera: true })); world.add(mvp.root); springs.addRig(mvp);
const NPCS = {};
function npc(id, look) { const rig = C.makeHero(look); springs.addRig(rig); NPCS[id] = { id, rig, x: 0, z: 0, poseT: rand(0, 3), pose: 0, place: null }; return NPCS[id]; }
npc('ruby', Object.assign({ outfit: 'two' }, C.TALENT.ruby.look)); npc('nova', Object.assign({ outfit: 'gown' }, C.TALENT.nova.look)); npc('jade', Object.assign({ outfit: 'jump' }, C.TALENT.jade.look));
npc('coco', Object.assign({ outfit: 'dress' }, C.TALENT.coco.look)); npc('lex', Object.assign({ outfit: 'dress' }, C.TALENT.lex.look));
for (const k of ['tony', 'editor', 'dee', 'landlord', 'bouncer']) npc(k, NPC_LOOKS[k]);
// Layer 1 = drawn normally and casts shadows, but skipped by the wet-street reflection pass (keeps it cheap).
const noReflect = o => o.traverse(c => c.layers.set(1));
camera.layers.enable(1); moon.shadow.camera.layers.enable(1);
for (const n of Object.values(NPCS)) noReflect(n.rig.root);
for (const p of peds.peds) noReflect(p.root);
// Real character models (assets/characters/*.glb, Mixamo-rigged) take over from the code-built MVP and Ruby
// as soon as they load; the code-built versions stay as the fallback if a file is missing.
function adoptRig(old, next) {
  springs.joints = springs.joints.filter(j => { for (let o = j.obj; o; o = o.parent) if (o === old.root) return false; return true; });
  next.root.position.copy(old.root.position); next.root.rotation.copy(old.root.rotation); next.root.visible = old.root.visible;
  const parent = old.root.parent; if (parent) { parent.add(next.root); parent.remove(old.root); }
  springs.scan(next.modelRoot);
}
// recorded motion capture (idle / walk / run ...) for the model characters
const mocapLib = loadMocap('../assets/animations/mocap.glb').catch(e => { console.warn('Motion capture unavailable', e); return null; });
const danceLib = loadMocap('../assets/animations/ruby-dance.glb').catch(e => { console.warn('Ruby dance unavailable', e); return null; }); // Ruby's own clips: twerk, nod
// While the real models load, the code-built stand-ins stay hidden (no flash of the blocky version).
// If a model fails, or takes longer than 45 s (very slow connection), the stand-in is shown instead.
const hideStandIn = r => r.root.children.forEach(c => { c.userData.standIn = c.visible; c.visible = false; });
const showStandIn = r => r.root.children.forEach(c => { if ('standIn' in c.userData) c.visible = c.userData.standIn; });
const standInRuby = NPCS.ruby.rig, standInMvp = mvp.root; hideStandIn(standInRuby); hideStandIn(mvp);
// the loading screen stays up (and the story waits) until MVP himself is ready
let charsReady = false; const markReady = () => { if (charsReady) return; charsReady = true; const l = document.getElementById('loading'); if (l) l.hidden = true; };
setTimeout(() => { if (NPCS.ruby.rig === standInRuby) showStandIn(standInRuby); if (mvp.root === standInMvp) showStandIn(mvp); markReady(); }, 45000);
loadCharacter('../assets/characters/ruby.glb', { name: 'Ruby', height: 1.68, armPitch: -0.22 }).then(async rig => {
  if (!rig) return showStandIn(standInRuby);
  const [lib, dlib] = await Promise.all([mocapLib, danceLib]); if (lib) rig.mocap = new MocapDriver(rig, lib); if (dlib) rig.dance = new MocapDriver(rig, dlib); // before anything moves the bones
  const n = NPCS.ruby; adoptRig(n.rig, rig); noReflect(rig.root); n.rig = rig;
}).catch(e => { console.warn('Ruby model unavailable, using the code-built Ruby', e); showStandIn(standInRuby); });
loadCharacter('../assets/characters/mvp.glb', { name: 'MVP', height: 1.85 }).then(async rig => {
  if (!rig) { showStandIn(mvp); return markReady(); }
  const lib = await mocapLib; if (lib) rig.mocap = new MocapDriver(rig, lib);
  rig.prop = C.makeDSLR(); rig.propMode = 'both'; rig.hold = false; rig.root.add(rig.prop); // camera hangs on a neck strap; raised only to shoot
  rig.strap = [0, 1].map(() => { const g = new THREE.CylinderGeometry(0.007, 0.007, 1, 6); g.translate(0, 0.5, 0); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x141214, roughness: 0.7 })); rig.root.add(m); return m; });
  adoptRig(mvp, rig); for (const k of Object.keys(mvp)) delete mvp[k]; Object.assign(mvp, rig); markReady(); // same object: every mvp.* reference keeps working
}).catch(e => { console.warn('MVP model unavailable, using the code-built MVP', e); if (mvp.root === standInMvp) showStandIn(mvp); markReady(); });
let freeModel = null; // freelance model for gigs
const P = { x: save.x ?? D.spawn.x, z: save.z ?? D.spawn.z, a: D.spawn.yaw, ry: D.spawn.yaw, walk: 0, move: 0 };
if (!D.inBounds(P.x, P.z)) { P.x = D.spawn.x; P.z = D.spawn.z; }
const cam = { yaw: D.spawn.yaw + Math.PI, pitch: 0.28, dist: 4.4, lastLook: -9 };
let driving = false;

// ---------- mission state
let act = null; // { m, kind, i, timer, shots, lost }
const SPOTS = () => ({ velvet: D.pois.find(p => p.id === 'velvet'), poolspot: D.pois.find(p => p.id === 'poolspot'), editor: { ...D.NPC.editor, r: 3 }, carpet: { x: -20, z: D.NPC.carpet.z, r: 4 }, billboard: { x: 11.5, z: -18, r: 3 }, chapel: { x: 12.6, z: 70, r: 3 } });
const step = () => act ? act.m.steps[act.i] : null;
const nextStory = () => DEMO && save.story >= 1 ? null : STORY[save.story];

// Where each named character stands right now, given story progress.
function placement(id) {
  const s = save.story, inStory = act && act.kind === 'story' ? act.m.id : null;
  const carpetStep = inStory === 'finale' && act.i === 1, N = D.NPC;
  switch (id) {
    case 'ruby':
      if (carpetStep) return { scene: 'world', x: N.carpet.x - 3, z: N.carpet.z - 0.6, ry: Math.PI / 2, pose: 'pose' };
      if (save.studio) return rubyHelp.pl; // lives at MVP Studios once it's yours: cleaning, setting up, helping (world/lib/helper.js)
      if (s >= 1 || (inStory === 'velvet' && act.i >= 1)) return { scene: 'club', x: CLUB.stageSpot.x, z: CLUB.stageSpot.z, y: CLUB.stageSpot.y, ry: 0, pose: 'dance' };
      return { scene: 'world', x: N.ruby.x, z: N.ruby.z, ry: N.ruby.ry, pose: 'idle' };
    case 'nova':
      if (carpetStep) return { scene: 'world', x: N.carpet.x, z: N.carpet.z + 0.3, ry: Math.PI / 2, pose: 'pose' };
      if (inStory === 'golden' || s >= 4) return { scene: 'world', x: N.nova.x, z: N.nova.z, ry: N.nova.ry, pose: inStory === 'golden' ? 'pose' : 'idle' };
      return null;
    case 'jade':
      if (carpetStep) return { scene: 'world', x: N.carpet.x + 3, z: N.carpet.z - 0.3, ry: Math.PI / 2, pose: 'pose' };
      if (inStory === 'feature') return { scene: 'studio', x: -1.6, z: 1.2, ry: 0.5, pose: 'idle' };
      if (s === 5 && !act) return { scene: 'world', x: N.jade.x, z: N.jade.z, ry: N.jade.ry, pose: 'idle' };
      if (s >= 6) return { scene: 'studio', x: -2.2, z: 0.6, ry: 0.6, pose: 'idle' };
      return null;
    case 'coco': return { scene: 'world', x: N.coco.x, z: N.coco.z, ry: N.coco.ry, pose: 'idle' };
    case 'lex': return s >= 7 || inStory === 'lex' ? { scene: 'world', x: 12.6, z: 72, ry: -Math.PI / 2, pose: inStory === 'lex' && act.i === 0 ? 'pose' : 'idle' } : null; // streaming outside the chapel
    case 'tony': return { scene: 'world', x: N.tony.x, z: N.tony.z, ry: N.tony.ry, pose: 'idle' };
    case 'editor': return s >= 1 ? { scene: 'world', x: N.editor.x, z: N.editor.z, ry: N.editor.ry, pose: 'idle' } : null;
    case 'dee': return { scene: 'world', x: N.dee.x, z: N.dee.z, ry: N.dee.ry, pose: 'idle' };
    case 'landlord': return { scene: 'world', x: N.landlord.x, z: N.landlord.z, ry: N.landlord.ry, pose: 'idle' };
    case 'bouncer': return { scene: 'world', x: N.bouncer.x, z: N.bouncer.z, ry: N.bouncer.ry, pose: 'guard' };
  }
  return null;
}
const DANCE = (t) => ({ shL: [-0.3 + Math.sin(t * 4) * 0.4, 0, 0.9 + Math.sin(t * 4) * 0.5], elL: [-0.8, 0, -0.6], shR: [-0.3 - Math.sin(t * 4) * 0.4, 0, -0.9 + Math.sin(t * 4) * 0.5], elR: [-0.8, 0, 0.6],
  hips: [0, Math.sin(t * 4) * 0.25, Math.sin(t * 8) * 0.06], sp: [0.05, -Math.sin(t * 4) * 0.15, -Math.sin(t * 8) * 0.05], hd: [0, Math.sin(t * 4) * 0.2, 0.08 * Math.sin(t * 8)],
  hpL: [-0.15 - Math.max(0, Math.sin(t * 8)) * 0.25, 0, 0.08], knL: [Math.max(0, Math.sin(t * 8)) * 0.45, 0, 0], hpR: [-0.15 - Math.max(0, -Math.sin(t * 8)) * 0.25, 0, -0.08], knR: [Math.max(0, -Math.sin(t * 8)) * 0.45, 0, 0] });
const POSE_LIST = [C.RUBY_A, C.POSES[1], C.RUBY_B, C.POSES[3], C.POSES[5], C.POSES[2]];
function updateNPCs(dt, t) {
  const list = Object.values(NPCS); if (freeModel) list.push(freeModel);
  for (const n of list) {
    const pl = n === freeModel ? n.fixed : placement(n.id);
    if (n.id === 'ruby') { if (pl && pl.pose === 'helper') rubyHelp.tick(dt); else rubyHelp.hideProps(); }
    const sceneObj = pl ? SC[pl.scene].scene : null;
    if (n.rig.root.parent !== sceneObj) { if (n.rig.root.parent) n.rig.root.parent.remove(n.rig.root); if (sceneObj) sceneObj.add(n.rig.root); }
    n.place = pl; if (!pl) continue;
    n.x = pl.x; n.z = pl.z;
    n.rig.root.position.set(pl.x, (pl.y || 0) + (pl.scene === 'world' && onSidewalk(pl.x, pl.z) ? 0.16 : 0), pl.z); n.rig.root.rotation.y = pl.ry;
    if (pl.scene !== where) continue;
    n.poseT += dt;
    if (pl.pose === 'helper') { rubyHelp.pose(C, n.rig, dt, t); continue; }
    if (pl.pose === 'dance' && n.rig.dance) { n.rig.dance.play('twerk'); n.rig.dance.update(dt, 0); n.peak = Math.abs(Math.sin(t * 2.2)) > 0.8 ? 1 : 0.45; continue; } // recorded dance
    if (pl.pose === 'dance') { C.setPose(n.rig, DANCE(t), Math.min(1, dt * 12)); n.peak = Math.abs(Math.sin(t * 4)) > 0.85 ? 1 : 0.4; }
    else if (pl.pose === 'pose') { if (n.poseT > 3) { n.poseT = 0; n.pose = (n.pose + 1) % POSE_LIST.length; } C.setPose(n.rig, POSE_LIST[n.pose], Math.min(1, dt * 4)); n.peak = n.poseT > 0.9 && n.poseT < 2.6 ? 1 : 0.35; }
    else if (pl.pose === 'guard') C.setPose(n.rig, { shL: [-0.3, 0, -0.35], elL: [-1.3, 0, 0], shR: [-0.3, 0, 0.35], elR: [-1.3, 0, 0], hpL: [0, 0, 0.1], hpR: [0, 0, -0.1] }, Math.min(1, dt * 4));
    else C.setPose(n.rig, { sp: [0.01, Math.sin(t * 0.5 + n.poseT) * 0.12, 0], hd: [0, Math.sin(t * 0.4 + n.poseT) * 0.35, 0], shL: [0, 0, 0.55], elL: [-0.4, 0, -1.6], hpR: [-0.08, 0, 0], knR: [0.18, 0, 0] }, Math.min(1, dt * 3));
    if (n.rig.apply) n.rig.apply(); // model rigs: copy this frame's pose onto the bones
    if (n.rig.mocap) { n.rig.mocap.play('idle'); n.rig.mocap.update(dt, pl.pose === 'idle' ? 0 : 1); } // recorded idle; dances and poses stay hand-made
  }
}

// ---------- missions
function startMission(m, kind) { if (DEMO && kind === 'story' && m.id !== 'velvet') return; act = { m, kind, i: -1, timer: null, shots: [] }; nextStep(); }
function nextStep() {
  act.i++; act.timer = null; act.shots = []; removeChaser();
  if (act.i >= act.m.steps.length) return completeMission();
  const st = step(); if (st.time) act.timer = st.time;
  if (st.t === 'chase') spawnChaser(st);
  if (st.t === 'enter' && where === st.scene) return nextStep();
  toast(st.text); refreshHud();
  if (st.t === 'choice') { const a = act; choose(st.c, o => { if (act !== a) return; if (o.end) { act.ended = o; act.i = act.m.steps.length - 1; } nextStep(); }); }
}
function completeMission() {
  const m = act.m, kind = act.kind, ended = act.ended; act = null; removeChaser();
  const reward = ended ? { cash: 0, rep: 0 } : m.reward; // ended early by a choice (e.g. paying the street tax): no reward
  save.cash += reward.cash; addRep(reward.rep); if (reward.street) addStreet(reward.street);
  if (m.reward.sign && !(m.reward.sign in save.loyal)) save.loyal[m.reward.sign] = loyal(m.reward.sign);
  if (m.reward.sign && !save.roster.includes(m.reward.sign)) save.roster.push(m.reward.sign);
  const oldRung = RUNGS[Math.min(save.story, RUNGS.length - 1)][0];
  if (kind === 'story') save.story++;
  if (DEMO && kind === 'story' && m.id === 'velvet') {
    persist(); sfx('win'); refreshHud();
    return talk(m.outro || [], demoComplete);
  }
  const rung = RUNGS[Math.min(save.story, RUNGS.length - 1)];
  persist(); sfx('win'); refreshHud();
  const extra = `<p class="money">+${fmt(reward.cash)} · +${reward.rep} Respect${reward.street ? ` · +${reward.street} Street` : ''}${m.reward.sign ? ` · ${esc(C.TALENT[m.reward.sign].name)} signs with MVP Media` : ''}</p>${kind === 'story' && rung[0] !== oldRung ? `<p><b>Promoted: ${esc(rung[0])}</b> · ${esc(rung[1])}</p>` : ''}`;
  const done = () => panelCard(kind === 'story' ? 'Mission complete' : 'Gig complete', m.title, extra, save.story >= STORY.length && kind === 'story' ? [['Roll credits', openEnding]] : [['Continue', closePanel]]);
  talk(ended ? [] : m.outro || [], () => m.choice && kind === 'story' ? choose(m.choice, done) : done());
  if (kind === 'gig' && freeModel) { const f = freeModel; setTimeout(() => { if (f.rig.root.parent) f.rig.root.parent.remove(f.rig.root); }, 4000); freeModel = null; }
}
// a moral call: one panel, no way to wave it off; effects show as a toast, then the reply plays
function choose(c, done) {
  const opts = c.options.map(o => { const short = o.fx && o.fx.cash < 0 && save.cash < -o.fx.cash;
    return [esc(o.label), () => { if (short) return; closePanel(); save.choices[c.id] = o.id; const sum = applyFx(o.fx); persist(); refreshHud(); if (sum) toast(sum); sfx('click'); talk(o.reply || [], () => done && done(o)); }, { plain: true, disabled: short, small: short ? `You can't afford it (${fmt(-o.fx.cash)})` : o.small || '' }]; });
  panelCard('Your call', c.title, `<p>${esc(c.text)}</p>`, opts); panel.dataset.locked = 'true';
}
function failMission(why) {
  const m = act.m, kind = act.kind; act = null; removeChaser(); sfx('fail'); refreshHud();
  panelCard('Mission failed', m.title, `<p>${esc(why)}</p>`, [['Retry', () => { closePanel(); startMission(m, kind); }], ['Later', closePanel]]);
}
let chaser = null;
function spawnChaser(st) {
  st = Object.assign({}, st, { hp: Math.round(st.hp * (1 - save.street / 250)) }); // Street cred: the Neon Kings fold faster
  const m = carModel(st.color); world.add(m);
  chaser = new Chaser(m, { hp: st.hp, speed: st.speed, x: st.spawn.x, z: st.spawn.z, from: st.spawn.from, to: st.spawn.to });
  // a glowing marker rides above the target so it can be found at night from anywhere
  const mark = new THREE.Group(); mark.position.set(0, 3.4, 0); m.add(mark); m.userData.marker = mark;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.35, 0.35), depthTest: false, transparent: true }));
  cone.rotation.x = Math.PI; cone.renderOrder = 20; mark.add(cone);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: C.glowTex, color: new THREE.Color(2.2, 0.3, 0.3), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  halo.scale.setScalar(3.2); halo.renderOrder = 19; mark.add(halo);
  act.lost = 0;
  if (!driving) {
    if (Math.hypot(car.x - P.x, car.z - P.z) > 25) parkCarNear(P.x, P.z);
    toast(Math.hypot(car.x - P.x, car.z - P.z) < 25 ? 'Your car is at the kerb. Get in (F) and chase them down!' : 'Get in your car (F) and chase them down!');
  }
}
// Put MVP's car at the nearest kerb (boulevard or Fremont) beside a point, avoiding parked cars and traffic.
function parkCarNear(x, z) {
  const tries = [];
  if (Math.abs(x) < 40) for (const dz of [0, 6, -6, 12, -12, 18]) tries.push([x < 0 ? -7.6 : 7.6, z + dz, x < 0 ? 0 : Math.PI]);
  if (Math.abs(z) < 40) for (const dx of [0, 6, -6, 12, -12]) tries.push([x + dx, z < 0 ? -6.2 : 6.2, z < 0 ? -Math.PI / 2 : Math.PI / 2]);
  for (const [cx, cz, a] of tries) if (D.inBounds(cx, cz) && !car.blocked(cx, cz, a, D) && !traffic.blocks(cx, cz, 2)) { car.x = cx; car.z = cz; car.a = a; car.v = 0; car.place(); return true; }
  return false;
}
function removeChaser() { if (chaser) { world.remove(chaser.m); chaser = null; } $('#hpbar').hidden = true; }
function updMission(dt) {
  const st = step(); if (!st) return;
  if (act.timer != null) { act.timer -= dt; if (act.timer <= 0) return failMission('You ran out of time.'); }
  if (st.t === 'goto' && where === 'world') { const s = SPOTS()[st.to]; const me = driving ? car : P; if (Math.hypot(me.x - s.x, me.z - s.z) < (s.r || 3) + (driving ? 3 : 0)) nextStep(); return; }
  if (st.t === 'chase' && chaser && where === 'world') {
    chaser.hold = !driving; // waits at the kerb until you're behind the wheel
    chaser.update(dt, driving ? car : P, traffic);
    if (chaser.m.userData.marker) { const mk = chaser.m.userData.marker; mk.position.y = 3.4 + Math.sin(T * 4) * 0.25; mk.rotation.y += dt * 2; }
    if (driving) { const dmg = chaser.ram(car); if (dmg) { sfx('bump'); shake = 0.45; toast(`Rammed · -${dmg}`); } }
    $('#hpbar').hidden = false; $('#hpname').textContent = act.m.id === 'bootleg' ? 'Bootleg van' : act.m.id === 'finale' ? 'Silas Crane' : 'Neon Kings coupe'; $('#hpfill').style.transform = `scaleX(${Math.max(0, chaser.hp / chaser.maxHp)})`;
    if (chaser.hp <= 0 && Math.abs(chaser.v) < 2) { toast('Got them!'); sfx('cash'); nextStep(); return; }
    const me = driving ? car : P; if (driving && Math.hypot(me.x - chaser.x, me.z - chaser.z) > 230) { act.lost += dt; if (act.lost > 8) return failMission('They got away.'); } else act.lost = 0;
  }
}

// ---------- photo scoring
const shotBonus = () => (save.gear.stab + save.gear.lens) * 4 + save.gear.light * 3;
function shootTargets() {
  const st = step(); if (!st || st.t !== 'shoot' || st.scene !== where) return null;
  return st.subjects.map(id => id === 'free' ? freeModel : NPCS[id]).filter(n => n && n.place && n.place.scene === where);
}
function scoreShot(n) {
  n.rig.root.updateMatrixWorld(true);
  let head, top;
  if (n.rig.headBone) { head = n.rig.headBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0)); top = head.clone().add(new THREE.Vector3(0, 0.17, 0)); } // model rigs: real head bone
  else { head = new THREE.Vector3(0, 0.11, 0); n.rig.head.localToWorld(head); top = new THREE.Vector3(0, 0.28, 0); n.rig.head.localToWorld(top); }
  const h = head.clone().project(camera), tp = top.clone().project(camera), ft = n.rig.root.position.clone().project(camera);
  if (h.z > 1 || Math.abs(h.x) > 1 || Math.abs(h.y) > 1) return null;
  const u = (h.x + 1) / 2, v = (1 - h.y) / 2;
  let d = 9; for (const [a, b] of [[1 / 3, 1 / 3], [2 / 3, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 2 / 3]]) d = Math.min(d, Math.hypot(u - a, (v - b) * 0.8));
  const comp = clamp(1 - d / 0.3, 0, 1), frac = (tp.y - ft.y) / 2, cropped = ft.y < -1.02, fill = (frac > 1.2 ? 0.75 : frac >= 0.35 ? 1 : clamp(frac / 0.35, 0.15, 1)) * (cropped ? 0.5 : 1); // cutting off her feet costs points
  return { score: Math.round(clamp((comp * 0.45 + fill * 0.2 + (n.peak ?? 0.6) * 0.35) * 100 + shotBonus(), 0, 100)), comp, fill, peak: n.peak ?? 0.6, u, v, cropped };
}
const grade = n => n >= 88 ? 'A+' : n >= 78 ? 'A' : n >= 66 ? 'B' : n >= 52 ? 'C' : 'D';
function photo() {
  if (mvp.retarget && !driving) mvp.shootT = 0.9; // raise the camera to his eye for the shot
  composer.render(); const url = canvas.toDataURL('image/jpeg', 0.88);
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); sfx('shutter');
  const img = document.createElement('img'); img.src = url; img.alt = 'Photo'; $('#strip').prepend(img); while ($('#strip').children.length > 8) $('#strip').lastChild.remove();
  save.shots++;
  const targets = shootTargets(); if (!targets) return;
  let best = null; for (const n of targets) { const r = scoreShot(n); if (r && (!best || r.score > best.score)) best = r; }
  if (!best) { toast('Missed. Get her in the frame (follow the circle).'); return; }
  act.shots.push({ score: best.score, url });
  const st = step();
  toast(`${grade(best.score)} · ${best.score}${best.cropped ? ' · keep her feet in the frame' : best.fill < 0.75 ? ' · zoom in (Z / wheel / +)' : best.comp < 0.5 ? ' · put her face on a gold point' : best.peak < 0.9 ? ' · wait for the pose' : ''}  (${act.shots.length}/${st.shots})`);
  if (act.shots.length >= st.shots) contactSheet();
}
function contactSheet() {
  const shots = act.shots, avg = shots.reduce((a, b) => a + b.score, 0) / shots.length, bonus = Math.round(avg >= 78 ? 200 + save.rep * 4 : avg >= 60 ? 80 : 0);
  save.cash += bonus; if (avg >= 78) addRep(2); refreshHud();
  const th = shots.map((s, i) => `<figure><img src="${s.url}" alt="Shot ${i + 1}"><figcaption><span>#${i + 1}</span><b>${grade(s.score)} · ${s.score}</b></figcaption></figure>`).join('');
  panelCard('Contact sheet', act.m.title, `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div class="grade">${grade(avg)}</div><p>Average ${Math.round(avg)}. ${avg >= 78 ? 'The client is thrilled.' : avg >= 60 ? 'Usable set.' : 'They will take them, but nobody is framing these.'}${bonus ? ` <span class="money">Quality bonus +${fmt(bonus)}</span>` : ''}</p></div><div class="sheet">${th}</div>`, [['Send the photos', () => { closePanel(); nextStep(); }]], true);
}

// ---------- interiors
function enter(name, from) {
  const f = $('#fade'); f.classList.add('on'); sfx('door');
  setTimeout(() => {
    where = name; renderPass.scene = SC[name].scene; SC[name].scene.add(mvp.root);
    if (name === 'studio') { P.x = HQ.entry.x; P.z = HQ.entry.z; P.a = P.ry = Math.PI; cam.yaw = 0; cam.pitch = 0.22; HQ.setPosters(save.releases); }
    else if (name === 'club') { P.x = 0; P.z = 11.5; P.a = P.ry = Math.PI; cam.yaw = 0; cam.pitch = 0.18; }
    else { const o = outsideDoor(from); P.x = o.x; P.z = o.z; P.a = P.ry = -Math.PI / 2; cam.yaw = Math.PI / 2; }
    doorLock = performance.now() + 1000;
    springs.joints.forEach(j => j.init = false); snapCam = true;
    const st = step(); if (st && st.t === 'enter' && st.scene === name) nextStep();
    f.classList.remove('on'); refreshHud();
    const now = step(); if (name !== 'world' && !(now && now.scene === name)) // nothing to do in here right now: say where the story is
      setTimeout(() => toast(`${name === 'club' ? "Ruby's set is on, but there's no job in here right now." : 'No shoot booked in here right now.'} Next: ${$('#objective').textContent}`), 600);
  }, 380);
}

// ---------- input
const keys = new Set(), pressed = new Set();
let locked = false;
addEventListener('keydown', e => { initAudio(); if (e.repeat) return; keys.add(e.code); pressed.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
function clearInput() { keys.clear(); pressed.clear(); stick.f = stick.r = 0; stick.id = look.id = null; $('#knob').style.transform = ''; $('#stick').classList.remove('on'); }
addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', clearInput);
canvas.addEventListener('mousedown', e => { initAudio(); if (e.button === 0 && !TOUCH && panel.hidden) { try { const r = canvas.requestPointerLock(); r && r.catch && r.catch(() => {}); } catch (err) {} } });
document.addEventListener('pointerlockchange', () => { const was = locked; locked = document.pointerLockElement === canvas; if (was && !locked) pauseGame(); }); // Esc while the mouse is locked
addEventListener('mousemove', e => { if (locked) { cam.yaw -= e.movementX * 0.0025 / zoom; cam.pitch = clamp(cam.pitch + e.movementY * 0.002 / zoom, -0.15, 1.1); cam.lastLook = T; } });
const stick = { id: null, ox: 0, oy: 0, f: 0, r: 0 }, look = { id: null, x: 0, y: 0 };
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return; e.preventDefault(); initAudio();
  if (stick.id === null && e.clientX < innerWidth * 0.45) { stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; $('#stick').style.left = e.clientX + 'px'; $('#stick').style.top = e.clientY + 'px'; $('#stick').classList.add('on'); }
  else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
}, { passive: false });
canvas.addEventListener('pointermove', e => {
  if (e.pointerId === stick.id) { let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const l = Math.hypot(dx, dy); if (l > 54) { dx *= 54 / l; dy *= 54 / l; } stick.r = dx / 54; stick.f = -dy / 54; $('#knob').style.transform = `translate(${dx}px,${dy}px)`; }
  else if (e.pointerId === look.id) { cam.yaw -= (e.clientX - look.x) * 0.006 / zoom; cam.pitch = clamp(cam.pitch + (e.clientY - look.y) * 0.004 / zoom, -0.15, 1.1); look.x = e.clientX; look.y = e.clientY; cam.lastLook = T; }
});
const endTouch = e => { if (e.pointerId === stick.id) { stick.id = null; stick.f = stick.r = 0; $('#knob').style.transform = ''; $('#stick').classList.remove('on'); } if (e.pointerId === look.id) look.id = null; };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
$('#act').addEventListener('click', () => pressed.add('KeyE'));
$('#shutter').addEventListener('click', () => { initAudio(); pressed.add('KeyP'); });
$('#carbtn').addEventListener('click', () => pressed.add('KeyF'));
$('#phonebtn').addEventListener('click', () => { initAudio(); openPhone(); });
for (const ev of ['pointerdown', 'pointerup', 'pointercancel']) $('#brakebtn').addEventListener(ev, e => { e.preventDefault(); if (ev === 'pointerdown') keys.add('Space'); else keys.delete('Space'); });

// ---------- UI
let dialog = null;
function talk(lines, done, opts = {}) { if (!lines.length) { done && done(); return; } dialog = { lines, i: 0, done, phone: !!opts.phone }; showLine(); }
function showLine() { const [who, text] = dialog.lines[dialog.i], onPhone = dialog.phone && who !== 'MVP'; $('#dlg-who').textContent = (onPhone ? '📞 ' : '') + who; $('#dlg-text').textContent = text; $('#dialog').hidden = false;
  voices.say(who, text, () => music && music.setDuck(0.3), () => music && music.setDuck(1), { phone: onPhone }); } // read the line aloud, music ducks under it
function advance() { sfx('click'); voices.stop(); dialog.i++; if (dialog.i >= dialog.lines.length) { if (music) music.setDuck(1); const d = dialog.done; dialog = null; $('#dialog').hidden = true; d && d(); } else showLine(); }
$('#dialog').addEventListener('click', () => dialog && advance());
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3400); }
const panel = $('#panel'); let panelActs = [];
function showPanel(html, acts) { try { document.exitPointerLock(); } catch (e) {} panel.innerHTML = html; panel.dataset.dismissible = 'false'; panel.dataset.locked = 'false'; panel.hidden = false; panelActs = acts || []; const b = panel.querySelector('button.b:not([disabled])'); b && b.focus({ preventScroll: true }); }
function closePanel() { panel.hidden = true; panel.innerHTML = ''; panelActs = []; paused = false; }
// ---------- pause: Esc, the II button, losing mouse lock or switching tabs. Everything (timers included) stops.
let paused = false, pausedAt = 0;
function pauseGame() {
  if (paused || !panel.hidden || dialog || (DEMO && !demoStarted)) return;
  panelCard('Paused', 'Game paused', `<p class="muted">Missions, timers and traffic are frozen.</p><p class="muted">${esc((window.MVP_EDITION && window.MVP_EDITION.label) || '')}</p>`, [['Resume', closePanel], ['Phone menu', () => { closePanel(); openPhone(); }, { plain: true }]]);
  panel.dataset.dismissible = 'true'; paused = true; pausedAt = performance.now();
}
$('#pausebtn').addEventListener('click', pauseGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
// photo zoom (only while framing a shot)
let zoom = 1, framingNow = false, vfOn = false;
canvas.addEventListener('wheel', e => { if (!framingNow) return; e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, 5); }, { passive: false });
$('#zoomin').addEventListener('click', () => { zoom = clamp(zoom * 1.3, 1, 5); });
$('#zoomout').addEventListener('click', () => { zoom = clamp(zoom / 1.3, 1, 5); });
panel.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b || b.disabled) return; sfx('click'); const fn = panelActs[+b.dataset.i]; fn && fn(b); });
function panelCard(eyebrow, title, body, buttons, wide) {
  const acts = [], btns = buttons.map(([label, fn, opts = {}], i) => { acts.push(fn); return `<button class="b ${i === 0 && !opts.plain ? 'primary' : ''} ${opts.sel ? 'sel' : ''}" data-i="${i}" ${opts.disabled ? 'disabled' : ''}><span>${label}</span>${opts.small ? `<small>${opts.small}</small>` : ''}</button>`; }).join('');
  showPanel(`<div class="card ${wide ? 'wide' : ''}"><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2>${body}<div class="btns">${btns}</div></div>`, acts);
}
let zoneName = '';
function setZone(name) { if (name === zoneName) return; zoneName = name; const z = $('#zone'); z.textContent = name; z.classList.remove('pop'); void z.offsetWidth; z.classList.add('pop'); }
function refreshHud() {
  $('#money').innerHTML = `<b>${fmt(save.cash)}</b><i>${esc(RUNGS[Math.min(save.story, RUNGS.length - 1)][0].toUpperCase())} </i><i class="meters">RESPECT <em>${save.rep}</em> · STREET <em>${save.street}</em></i>`;
  const st = step(), n = nextStory();
  $('#objective').textContent = st ? st.text : n ? (n.giver === 'phone' ? 'Answer the phone (PHONE / Tab)' : `${n.title}: meet ${n.who}`) : 'Run your empire: gigs, films, royalties';
}

// phone menu: story, gigs, talent, studio, save
let gigs = [], gigsDay = 0;
function makeGig() {
  const spot = pick(GIG_SPOTS), name = pick(FREELANCE), look = pick(FREE_LOOKS), pay = Math.round((250 + save.rep * 12 + save.street * 5 + rand(0, 200)) / 10) * 10, rush = Math.random() < 0.4;
  return { id: 'gig', title: `${spot.label} · ${name}`, who: name, look, at: spot.at, place: spot.place, pay, rush,
    steps: [{ t: 'goto', to: spot.at, time: rush ? 90 : undefined, text: `${rush ? 'Rush: ' : ''}Meet ${name} at ${spot.place}` }, { t: 'shoot', scene: 'world', subjects: ['free'], shots: 4, text: `Shoot ${spot.label.toLowerCase()} with ${name} (4 photos)` }],
    reward: { cash: pay, rep: rush ? 4 : 3 }, outro: [[name, 'Love these. I am tagging MVP Media on everything.']] };
}
function startGig(g) {
  const s = SPOTS()[g.at], rig = C.makeHero(g.look); springs.addRig(rig);
  freeModel = { id: 'free', rig, poseT: 0, pose: 0, place: null, fixed: { scene: 'world', x: s.x + (g.at === 'carpet' ? 0 : 1.2), z: s.z, ry: g.at === 'carpet' ? Math.PI / 2 : g.at === 'poolspot' ? Math.PI : -Math.PI / 2, pose: 'pose' } };
  gigs = gigs.filter(x => x !== g); closePanel(); startMission(g, 'gig');
}
// wipe the save (after a confirm) and reload from the motel
// the phone rings: answer to hear the caller (the tap also lets phones play voices), or decline and call back later
let ringT = null, rangFor = null;
function incomingCall(n) {
  clearInterval(ringT); sfx('phone'); ringT = setInterval(() => sfx('phone'), 2200);
  const stop = () => { clearInterval(ringT); ringT = null; };
  panelCard('Incoming call', `📞 ${n.who}`, `<p class="muted">${esc(n.title)}</p>`, [
    ['Answer', () => { stop(); closePanel(); initAudio(); talk(n.intro, () => startMission(n, 'story'), { phone: true }); }],
    ['Decline', () => { stop(); closePanel(); toast('Call back any time from your PHONE.'); }, { plain: true }]]);
  panel.dataset.locked = 'true';
}
// Ruby at the studio: chat, have her prep the set (+6 quality on your next film), or take a break together
function openRuby() {
  const r = NPCS.ruby; rubyHelp.attend(P.x, P.z, 30);
  const prepped = !!save.rubyPrep, prepToday = save.rubyPrepDay === save.day, broke = save.rubyBreak === save.day, done = () => { rubyHelp.attend(P.x, P.z, 3); };
  panelCard('MVP Media Studios', 'Ruby Monroe', `<p class="muted">${esc(rubyHelp.before === 'walk' ? 'On her way to the next job' : rubyHelp.job.say)}. Loyalty ${loyal('ruby')} · ${loyalWord(loyal('ruby'))}</p>`, [
    ['Chat', () => { closePanel(); talk([['Ruby Monroe', pick(RUBY_STUDIO.chat)]], done); }],
    ['Prep the set for the next shoot', () => { if (prepped || prepToday) return; closePanel(); save.rubyPrep = true; save.rubyPrepDay = save.day; persist(); talk([['Ruby Monroe', RUBY_STUDIO.prep]], done); }, { plain: true, disabled: prepped || prepToday, small: prepped ? 'Done: +6 quality on your next film' : prepToday ? 'Once a day' : '+6 quality on your next film · once a day' }],
    ['Take a break together', () => { if (broke) return; closePanel(); save.rubyBreak = save.day; addLoyal('ruby', 3); persist(); toast('Ruby trusts you more'); talk([['Ruby Monroe', RUBY_STUDIO.brk]], done); }, { plain: true, disabled: broke, small: broke ? 'Already today' : 'Loyalty +3 · once a day' }],
    ['Let her work', () => { closePanel(); done(); }, { plain: true }]]);
}
function confirmNewGame() {
  panelCard('New game', 'Start over?', '<p>This erases your money, story progress, studio, talent and films. It can\'t be undone.</p>',
    [['Yes, start over', () => { removeEventListener('beforeunload', persist); try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }], ['Cancel', () => { closePanel(); openPhone(); }, { plain: true }]]);
  panel.dataset.dismissible = 'true';
}
function openPhone() {
  if (DEMO && (!demoStarted || dialog)) return;
  if (DEMO) return openDemoMenu();
  if (!panel.hidden) return closePanel();
  sfx('click');
  const n = nextStory(), st = step();
  const story = STORY.map((m, i) => `<div class="${i < save.story ? 'done' : i === save.story ? 'now' : ''}"><span>${i + 1}. ${esc(m.title)}</span><span>${i < save.story ? 'Done' : i === save.story ? (act && act.kind === 'story' ? 'In progress' : esc(m.giver === 'phone' ? 'Phone' : m.who)) : 'Locked'}</span></div>`).join('');
  panelCard(`Day ${save.day} · ${fmt(save.cash)} · Respect ${save.rep} · Street ${save.street}`, 'MVP Phone', `<div class="list">${story}</div><p class="muted">${st ? 'Now: ' + esc(st.text) : n ? `Next: ${esc(n.title)}, ${n.giver === 'phone' ? 'answer the call below' : 'find ' + esc(n.who) + ' (gold beacon)'}` : 'Story complete. Keep shooting, keep producing.'}</p>`, [
    ...(n && n.giver === 'phone' && !act ? [['Call back: ' + n.who, () => { closePanel(); sfx('phone'); talk(n.intro, () => startMission(n, 'story'), { phone: true }); }]] : []),
    ['Photo gigs', openGigs, { plain: true, small: act ? 'Finish your current job first' : '', disabled: !!act }],
    ['Talent roster', openRoster, { plain: true }],
    ['Catalog', openCatalog, { plain: true, small: save.releases.length ? `${save.releases.length} films · ${fmt(dailyRoyalty())}/day` : 'No releases yet' }],
    ['Studio productions', openStudio, { plain: true, small: save.studio ? (where === 'studio' ? '' : 'Go inside MVP Studios') : 'Buy the studio first' }],
    ...(where !== 'world' ? [['Step outside to Las Vegas Blvd', () => { closePanel(); enter('world', where); }, { plain: true }]] : []),
    ['Save game', () => { persist(); toast('Saved.'); }, { plain: true }],
    ['Start a new game', confirmNewGame, { plain: true }],
    ...(window.mvpCanInstall ? [['📲 Install as an app', () => { closePanel(); window.mvpInstall(); }, { plain: true, small: 'Home-screen icon, fullscreen, faster loading' }]] : []),
    [`Music: ${soundPrefs.music ? 'On' : 'Off'}`, () => { setSound('music', !soundPrefs.music); closePanel(); openPhone(); }, { plain: true }],
    [`Voices: ${soundPrefs.voices ? 'On' : 'Off'}`, () => { setSound('voices', !soundPrefs.voices); closePanel(); openPhone(); }, { plain: true }],
    ['Close', closePanel, { plain: true }],
  ]);
}
const bootleg = () => save.story === 6 || save.choices.bootleg === 'cut'; // pirated until Bootleg Boulevard is won, or forever if you took the cut
const bootlegShare = () => save.story === 6 ? 0.5 : 0.2;
const dailyRoyalty = () => Math.round(save.releases.reduce((s, r) => s + r.royalty, 0) * (bootleg() ? 1 - bootlegShare() : 1));
function openCatalog() {
  const rows = save.releases.map(r => `<div><span>${esc(r.title)}</span><span>Q ${r.q} · ${fmt(r.royalty)}/day</span></div>`).join('');
  panelCard('MVP Media', 'The catalog', `${rows ? `<div class="list">${rows}</div>` : '<p class="muted">Nothing released yet. Buy a room, cast it, light it, call it.</p>'}<p>Royalties <span class="money">${fmt(dailyRoyalty())}</span> per day${bootleg() ? ` · <b>bootlegs are eating ${Math.round(bootlegShare() * 100)}% of it</b>` : ''}</p>`, [['Back', openPhone, { plain: true }]]);
}
function openGigs() {
  if (gigsDay !== save.day || !gigs.length) { gigs = [makeGig(), makeGig(), makeGig()]; gigsDay = save.day; }
  panelCard('Gig board', 'Photo gigs tonight', '<p class="muted">Freelance shoots around the district. Better photos pay a quality bonus.</p>', [...gigs.map(g => [esc(g.title), () => startGig(g), { plain: true, small: `${fmt(g.pay)}${g.rush ? ' · rush' : ''}` }]), ['Back', openPhone, { plain: true }]]);
}
function openRoster() {
  const btns = Object.entries(C.TALENT).map(([id, t]) => {
    const signed = save.roster.includes(id), lexLock = id === 'lex' && save.releases.length < 2, can = !signed && !lexLock && t.req > 0 && save.rep >= t.req && save.cash >= t.fee * 2;
    return [`${esc(t.name)} <small>· ${t.age} · ${esc(t.role)}</small>`, () => { if (signed) return openTalent(id); if (!can) return; save.cash -= t.fee * 2; save.roster.push(id); save.loyal[id] = loyal(id); sfx('cash'); persist(); refreshHud(); openRoster(); }, { plain: true, sel: signed, disabled: !signed && !can, small: signed ? `Under contract · loyalty ${loyal(id)} · ${loyalWord(loyal(id))}` : t.req === 0 ? 'Meet her in the story' : lexLock ? 'Release 2 films first' : save.rep < t.req ? `Needs ${t.req} rep` : `Sign for ${fmt(t.fee * 2)}` }];
  });
  panelCard('Talent roster', 'Who works with MVP Media', '<p class="muted">Everybody knows what they are worth. Respect opens doors, cash closes deals, loyalty keeps them. Tap a signed performer to see how she feels about you.</p>', [...btns, ['Back', openPhone, { plain: true }]]);
}
function openTalent(id) {
  const t = C.TALENT[id], l = loyal(id), ate = save.dinner[id] === save.day;
  panelCard('Talent roster', t.name, `<p>${esc(t.bio || '')}</p><p>Loyalty <b>${l}</b> / 100 · ${loyalWord(l)}</p><p class="muted">Day rate ${fmt(talentFee(id))}${feeMul(id) < 1 ? ' (loyalty discount)' : feeMul(id) > 1 ? ' (she charges you extra)' : ''}. Loyalty goes up when you pay people right, protect their work and light them the way they like. Below 15 she won't work with you.</p>`,
    [[`Take her to dinner <small>${fmt(250)} · once a day</small>`, () => { if (ate || save.cash < 250) return; save.cash -= 250; save.dinner[id] = save.day; addLoyal(id, 8); sfx('cash'); persist(); refreshHud(); toast(`${t.name.split(' ')[0].replace(/"/g, '')} had a good night. Loyalty +8`); openTalent(id); }, { plain: true, disabled: ate || save.cash < 250, small: ate ? 'Already tonight' : '' }], ['Back', openRoster, { plain: true }]]);
}
function openShop() {
  const btns = GEAR.map(g => { const lv = save.gear[g.id], cost = Math.round(g.base * Math.pow(1.8, lv)), max = lv >= g.max; return [`${g.name} <small>Lv ${lv}/${g.max} · ${g.desc}</small>`, () => { if (max || save.cash < cost) return; save.cash -= cost; save.gear[g.id]++; sfx('cash'); persist(); refreshHud(); openShop(); }, { plain: true, disabled: max || save.cash < cost, small: max ? 'Maxed' : fmt(cost) }]; });
  panelCard('Lens & Light', "Dee's counter", `<p>"Better glass, better money."</p><p class="money">${fmt(save.cash)}</p>`, [...btns, ['Done', closePanel]]);
}

// studio productions (story step "produce" or once per day from the phone)
let prod = null;
function openStudio() {
  if (!save.studio) return toast('Buy MVP Studios first.');
  if (where !== 'studio') return toast('Go inside MVP Studios to run a production.');
  const st = step();
  if (save.lastProduce === save.day && !(st && st.t === 'produce')) return toast('One production per day. Come back tomorrow.');
  startProduction(!!(st && st.t === 'produce'));
}
function startProduction(story) { prod = { story, cast: story ? ['jade'] : [], set: 'stage', budget: story ? 0 : 1, calls: {} }; renderProd(); }
const prodCost = () => (prod.story ? 0 : prod.cast.reduce((s, id) => s + talentFee(id), 0)) + SETS[prod.set].cost + BUDGET[prod.budget].cost;
function renderProd() {
  const roster = [...new Set([...save.roster, ...(prod.story ? ['jade'] : [])])];
  const cost = prodCost(), ok = prod.cast.length && save.cash >= cost, b = [];
  b.push([`Lights, camera, action <small>${fmt(cost)}</small>`, () => { if (!ok) return; save.cash -= cost; refreshHud(); prod.stage = 0; renderCall(); }, { disabled: !ok }]);
  for (const id of roster) { const no = refuses(id) && !(prod.story && id === 'jade');
    b.push([`${esc(C.TALENT[id].name)} <small>${'★'.repeat(C.TALENT[id].star)}</small>`, () => { if (no) return; const i = prod.cast.indexOf(id); if (i >= 0) prod.cast.splice(i, 1); else if (prod.cast.length < 2) prod.cast.push(id); renderProd(); }, { plain: true, disabled: no, sel: prod.cast.includes(id), small: no ? "Won't work with you · take her to dinner" : (prod.story && id === 'jade' ? 'Working for points' : fmt(talentFee(id))) + ` · loyalty ${loyal(id)}` }]); }
  for (const [k, s] of Object.entries(SETS)) b.push([s.name, () => { prod.set = k; renderProd(); }, { plain: true, sel: prod.set === k, small: (s.cost ? fmt(s.cost) : 'Free') + ' · ' + esc(s.look) }]);
  BUDGET.forEach((bu, i) => b.push([`${bu.name} crew`, () => { prod.budget = i; renderProd(); }, { plain: true, sel: prod.budget === i, small: bu.cost ? fmt(bu.cost) : 'Free' }]));
  if (!prod.story) b.push(['Cancel', closePanel, { plain: true }]);
  panelCard('MVP Studios · pre-production', prod.story ? 'First feature' : 'New production', `<p class="muted">Cast it, light it, call it, wrap it. Pick up to 2 performers, a set and a crew. ${esc(SETS[prod.set].look)}${save.cash < cost ? ` You need ${fmt(cost - save.cash)} more.` : ''}</p>`, b, true);
}
function renderCall() {
  const [key, label, opts] = CALLS[prod.stage];
  const hint = prod.cast.map(id => C.TALENT[id]).map(t => key === 'light' ? `${t.name.split(' ')[0]} looks best in ${t.light} light.` : key === 'mood' ? `${t.name.split(' ')[0]} is feeling ${t.mood} today.` : '').filter(Boolean).join(' ');
  panelCard(`On set · ${SETS[prod.set].name}`, `Scene 1 · Take ${prod.stage + 1}`, `<p class="muted">Director's call: ${label}. ${esc(hint || 'Your call, director.')}</p>${prod.stage === 0 ? `<p class="muted">${esc(prod.cast.map(id => ATTITUDE[id]).filter(Boolean).join(' '))}</p>` : ''}`, opts.map(o => [o[0].toUpperCase() + o.slice(1), () => { prod.calls[key] = o; prod.stage++; if (prod.stage < CALLS.length) renderCall(); else wrapProd(); }, { plain: true }]));
}
function wrapProd() {
  const cast = prod.cast.map(id => C.TALENT[id]);
  let q = cast.reduce((s, t) => s + t.star * 12, 0) / cast.length + (cast.length === 2 ? 8 : 0) + SETS[prod.set].q + save.gear.light * 5;
  for (const t of cast) { if (t.light === prod.calls.light) q += 7; if (t.mood === prod.calls.mood) q += 7; }
  q += prod.cast.reduce((s, id) => s + (loyal(id) - 50) / 8, 0) / prod.cast.length; // loyal talent gives you more on set
  const rubyPrep = !!save.rubyPrep; if (rubyPrep) { q += 6; save.rubyPrep = false; } // Ruby prepped the set
  const loyNotes = prod.cast.map(id => { const t = C.TALENT[id], n = (t.light === prod.calls.light ? 3 : -2) + (t.mood === prod.calls.mood ? 3 : -2) + (prod.budget === 2 ? 2 : 0); addLoyal(id, n); return `${t.name.split(' ')[0].replace(/"/g, '')} ${n > 0 ? 'loved' : 'didn\'t love'} it (loyalty ${n > 0 ? '+' : ''}${n})`; });
  q += prod.calls.cam === 'dolly' ? 5 : prod.calls.cam === 'handheld' ? 3 : 1; q = Math.round(clamp(q * BUDGET[prod.budget].m, 10, 100));
  // film income: about a third of the original payout, so gigs, gear and missions still matter
  const gross = Math.round(q * (25 + save.rep) * 0.72), royalty = Math.round(gross * 0.05), title = FILM_TITLES[save.releases.length % FILM_TITLES.length] + (save.releases.length >= FILM_TITLES.length ? ' ' + (save.releases.length + 1) : '');
  panelCard('Wrap', "Cut! That's a wrap.", `<p>${q >= 75 ? 'The scene works. Everybody hit their marks and you can feel it in the dailies.' : q >= 50 ? 'Solid, sellable, nobody will remember it next year.' : 'It opens soft and dies at the box office. Listen to your talent next time.'}</p><h2>${esc(title)}</h2><p>Quality <b>${q}</b> / 100 · Opening sales <span class="money">${fmt(gross)}</span> · Royalties <span class="money">${fmt(royalty)}</span> per day</p><p class="muted">${esc([...(rubyPrep ? ['Ruby prepped the set (+6)'] : []), ...loyNotes].join(' · '))}</p>`,
    [['Release it', () => { save.cash += gross; save.releases.push({ title, royalty, q }); save.lastProduce = save.day; addRep(q >= 70 ? 5 : 2); sfx('win'); persist(); closePanel(); refreshHud(); toast(`${title} is out. ${fmt(gross)} in opening sales.`); const st = step(); const wasStory = prod.story; prod = null; if (wasStory && st && st.t === 'produce') nextStep(); }]]);
}
// three endings (plus the default), decided by how you played: Respect, Street and your talent's loyalty
function endingFor() {
  const ids = save.roster.length ? save.roster : ['ruby'], avg = ids.reduce((s, id) => s + loyal(id), 0) / ids.length;
  if (avg < 40) return ['Empire of One', 'You own the frame, the film and the building. Shame nobody wants to stand in front of your camera anymore. The talent took their calls elsewhere.'];
  if (save.street >= 50) return ['King of Fremont', 'The Neon Kings pull over when your car rolls by. Nobody bootlegs MVP Media twice. The studio runs on nerve, and the whole boulevard knows it.'];
  if (save.rep >= 70 && avg >= 60) return ['The Legit Mogul', 'Clean books, paid crews, performers who trust you with their names. Every agent on the Strip wants your number, and the catalog pays while you sleep.'];
  return ['Own the Frame', 'From room 12 at the Desert Rose to Mogul. You made the work, you kept the masters, and the town learned your name.'];
}
function openEnding() {
  const [title, text] = endingFor(), ids = save.roster;
  panelCard('MVP MEDIA · LAS VEGAS · ENDING', title, `<p><b>Own the frame. Then own the film.</b></p><p>${esc(text)}</p><p class="muted">Respect ${save.rep} · Street ${save.street} · ${ids.map(id => `${esc(C.TALENT[id].name.split(' ')[0].replace(/"/g, ''))} ${loyal(id)}`).join(' · ')}</p><p class="muted">${save.releases.length} films · ${save.shots} photos · ${fmt(save.cash)} in the bank. The story is complete, but the city keeps going: gigs, films and royalties are still on the table.</p>`, [['Keep playing', closePanel]]);
}

// ---------- collision + interaction
function collide(p, r) {
  const S = SC[where];
  for (const c of S.colliders) {
    const cx = clamp(p.x, c.minX, c.maxX), cz = clamp(p.z, c.minZ, c.maxZ), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) { if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; } else { const o = [p.x - c.minX, c.maxX - p.x, p.z - c.minZ, c.maxZ - p.z], m = Math.min(...o); if (m === o[0]) p.x = c.minX - r; else if (m === o[1]) p.x = c.maxX + r; else if (m === o[2]) p.z = c.minZ - r; else p.z = c.maxZ + r; } }
  }
  for (const c of S.circles) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = r + c.r; if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
  if (S.bounds) { p.x = clamp(p.x, S.bounds.minX, S.bounds.maxX); p.z = clamp(p.z, S.bounds.minZ, S.bounds.maxZ); }
}
const insideAny = (x, z) => D.colliders.some(c => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ);
function moveChar(c, ix, iz, speed, dt, rig) {
  const l = Math.hypot(ix, iz);
  c.move = lerp(c.move, l > 0.05 ? (speed > 3 ? 1 : 0.62) : 0, Math.min(1, dt * 8));
  if (l > 0.05) {
    ix /= l; iz /= l; c.a = Math.atan2(ix, iz);
    const px = c.x, pz = c.z, nx = c.x + ix * speed * dt, nz = c.z + iz * speed * dt;
    // traffic blocks walking into a car, but never walking away from one (a car that stopped against you can't trap you)
    const tb = where === 'world' ? traffic.blocks(nx, nz, 0.35) : null;
    const away = tb && Math.hypot(nx - tb.m.position.x, nz - tb.m.position.z) > Math.hypot(c.x - tb.m.position.x, c.z - tb.m.position.z);
    if (!tb || away) { c.x = nx; c.z = nz; }
    collide(c, 0.38);
    if (where === 'world' && !D.inBounds(c.x, c.z)) { c.x = px; c.z = pz; }
    c.walk += dt * (speed > 3 ? 10 : 7);
  }
  c.ry += angDiff(c.ry, c.a) * Math.min(1, dt * 10);
  rig.root.position.set(c.x, where === 'world' && onSidewalk(c.x, c.z) ? 0.16 : 0, c.z); rig.root.rotation.y = c.ry;
  if (c.move > 0.05) C.walkPose(rig, c.walk, c.move, 1);
}
function near(x, z, r) { return Math.hypot(P.x - x, P.z - z) < r; }
function interaction() {
  const st = step(), n = nextStory(), opts = [];
  const add = (d, prompt, fn, key) => opts.push({ d, prompt, fn, key });
  if (driving) return { prompt: 'Get out of the car', fn: exitCar, key: 'F' };
  if (where !== 'world') {
    const ex = SC[where].exit; if (performance.now() > doorLock && near(ex.x, ex.z, ex.r || 2.2)) add(0, 'Exit to Las Vegas Blvd', () => enter('world', where));
    if (n && !act && n.giver !== 'phone') { const g = NPCS[n.giver === 'ruby2' ? 'ruby' : n.giver]; if (g && g.place && g.place.scene === where) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < 3) add(d - 1, `${n.who}: ${n.title}`, () => talk(n.intro, () => startMission(n, 'story'))); } }
    if (where === 'studio') { const r = NPCS.ruby; if (r.place && r.place.pose === 'helper') { const d = Math.hypot(P.x - r.x, P.z - r.z); if (d < 2.6) add(d + 0.3, 'Talk to Ruby', openRuby); } }
    if (where === 'studio' && st && st.t === 'produce') { const j = NPCS.jade; if (j.place && j.place.scene === 'studio' && near(j.x, j.z, 3)) add(0.5, 'Talk to Jade: start the production', () => startProduction(true)); }
    return opts.sort((a, b) => a.d - b.d)[0] || null;
  }
  const dc = Math.hypot(P.x - car.x, P.z - car.z); if (dc < 3.6) add(dc + 0.5, 'Get in your car', enterCar, 'F');
  if (n && !act && n.giver !== 'phone') { const g = NPCS[n.giver === 'ruby2' ? 'ruby' : n.giver]; if (g && g.place && g.place.scene === 'world') { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < 3) add(d - 1, `${n.who}: ${n.title}`, () => talk(n.intro, () => startMission(n, 'story'))); } }
  if (st && st.t === 'buy') { const s = D.pois.find(p => p.id === 'studio'); if (near(s.x, s.z, 3.5)) add(0, `Buy MVP Studios (${fmt(st.cost)})`, () => { if (save.cash >= st.cost) { save.cash -= st.cost; save.studio = true; sfx('cash'); persist(); refreshHud(); nextStep(); } else toast(`You need ${fmt(st.cost - save.cash)} more. Take gigs from your phone.`); }); }
  const chat = (id, name, lines, r = 2.8) => { const p = NPCS[id]; if (p.place && p.place.scene === 'world') { const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < r) add(d + 0.2, `Talk to ${name}`, () => talk(lines)); } };
  if (!(n && n.giver === 'dee' && !act)) { const p = NPCS.dee; if (Math.hypot(P.x - p.x, P.z - p.z) < 2.8) add(0.8, "Shop at Dee's counter", openShop); }
  chat('bouncer', 'the bouncer', [['Bouncer', save.story >= 1 || (act && act.m.id === 'velvet') ? 'Go on in, MVP. Ruby is on.' : 'Headliner goes on at midnight. You on the list?']]);
  chat('tony', 'Tony Velvet', [['Tony Velvet', save.story >= 2 ? 'Marquee looks incredible. You are family here now.' : 'Get inside and shoot my headliner!']]);
  for (const p of D.pois) { const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < p.r && performance.now() > doorLock) {
    if (p.id === 'studio') add(d, save.studio ? 'Enter MVP Studios' : 'MVP Studios · for sale', () => save.studio ? enter('studio') : talk([['Sign', 'FOR SALE · Soundstage · $3,500 · ask at the Desert Rose office']]));
    else if (p.id === 'velvet') add(d, 'Enter The Velvet Room', () => enter('club'));
    else if (p.id === 'room12') add(d, 'Room 12 · save game', () => { persist(); toast('Game saved in Room 12.'); });
    else if (p.id === 'poolspot') add(d + 1, 'Photo spot · the pool', () => { cam.yaw = -Math.PI / 2; cam.pitch = 0.12; toast('Frame the pool and hit SHOOT.'); });
    else if (p.talk) add(d + 1, p.prompt, () => talk(p.talk));
  } }
  return opts.sort((a, b) => a.d - b.d)[0] || null;
}
function enterCar() { driving = true; document.body.classList.add('driving'); mvp.root.visible = false; cam.yaw = car.a + Math.PI; cam.pitch = 0.22; sfx('door'); $('#speedo').hidden = false; snapCam = true; }
function exitCar() {
  if (Math.abs(car.v) > 3) return toast('Slow down first.');
  for (const s of [1, -1]) { const x = car.x + Math.cos(car.a) * 1.9 * s, z = car.z - Math.sin(car.a) * 1.9 * s; if (D.inBounds(x, z) && !insideAny(x, z)) { P.x = x; P.z = z; break; } }
  driving = false; document.body.classList.remove('driving'); mvp.root.visible = true; car.v = 0; sfx('door'); $('#speedo').hidden = true; snapCam = true; cam.yaw = car.a + Math.PI;
}
function objectiveTarget() {
  if (where !== 'world') return null;
  const st = step(), n = nextStory();
  if (st) { if (st.t === 'goto') return SPOTS()[st.to]; if (st.t === 'chase') return chaser; if (st.t === 'enter') return st.scene === 'club' ? SPOTS().velvet : D.pois.find(p => p.id === 'studio'); if (st.t === 'buy' || st.t === 'produce') return D.pois.find(p => p.id === 'studio'); if (st.t === 'shoot') { const t = shootTargets(); return t && t[0]; } }
  if (n && !act && n.giver !== 'phone') { const g = NPCS[n.giver === 'ruby2' ? 'ruby' : n.giver]; return g && g.place ? (g.place.scene === 'world' ? g : g.place.scene === 'studio' ? D.pois.find(p => p.id === 'studio') : null) : null; }
  return null;
}

// ---------- minimap
const map = $('#map'), mctx = map.getContext('2d');
function drawMap(target) {
  const s = map.width, me = driving ? car : P, R = driving ? 170 : 90, k = s / (2 * R), X = x => s / 2 + (x - me.x) * k, Z = z => s / 2 + (z - me.z) * k;
  mctx.fillStyle = '#0d080c'; mctx.fillRect(0, 0, s, s);
  if (where !== 'world') { mctx.fillStyle = '#b8a3a0'; mctx.font = `600 ${Math.round(s * 0.09)}px Montserrat, sans-serif`; mctx.textAlign = 'center'; mctx.fillText('INSIDE', s / 2, s / 2); return; }
  mctx.fillStyle = '#2e2834'; mctx.fillRect(X(-10), Z(-300), 20 * k, 600 * k); mctx.fillRect(X(-250), Z(-8), 500 * k, 16 * k);
  mctx.fillStyle = '#3a2a36'; for (const c of D.colliders) if (c.maxX > me.x - R && c.minX < me.x + R && c.maxZ > me.z - R && c.minZ < me.z + R) mctx.fillRect(X(c.minX), Z(c.minZ), (c.maxX - c.minX) * k, (c.maxZ - c.minZ) * k);
  for (const p of D.pois) { mctx.fillStyle = p.id === 'studio' ? '#ff2a3a' : '#e8b64c'; mctx.beginPath(); mctx.arc(X(p.x), Z(p.z), 3, 0, 7); mctx.fill(); }
  if (!driving) { mctx.fillStyle = '#ff3b48'; mctx.fillRect(X(car.x) - 3, Z(car.z) - 2, 6, 4); }
  if (target) { const tx = clamp(X(target.x), 8, s - 8), tz = clamp(Z(target.z), 8, s - 8); mctx.strokeStyle = '#ff3b48'; mctx.lineWidth = 2.5; mctx.beginPath(); mctx.arc(tx, tz, 6 + Math.sin(performance.now() / 200) * 1.5, 0, 7); mctx.stroke(); }
  mctx.save(); mctx.translate(s / 2, s / 2); mctx.rotate(-(driving ? car.a : P.ry)); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, 8); mctx.lineTo(-5, -4); mctx.lineTo(5, -4); mctx.fill(); mctx.restore();
}

// ---------- MVP's camera: on a neck strap, raised to the eye only to shoot
const manner = new Mannerisms();
const _cv = new THREE.Vector3(), _cv2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function placeMvpCamera() {
  const r = mvp, b = r.bones; if (!r.prop || !b) return;
  r.root.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(Math.sin(P.ry), 0, Math.cos(P.ry)), right = new THREE.Vector3(Math.cos(P.ry), 0, -Math.sin(P.ry));
  const chest = (b.Spine2 || b.Spine1 || b.Spine).getWorldPosition(new THREE.Vector3());
  const hang = chest.clone().addScaledVector(fwd, 0.15).addScaledVector(_up, -0.06 + Math.sin(T * 9) * 0.006 * Math.min(1, P.move * 2));
  r.handL.getWorldPosition(_cv); r.handR.getWorldPosition(_cv2); const hands = _cv.add(_cv2).multiplyScalar(0.5).addScaledVector(fwd, 0.03);
  const pos = hang.lerp(hands, r.aim || 0);
  r.prop.position.copy(r.root.worldToLocal(pos.clone()));
  r.prop.rotation.set(-0.25 * (1 - (r.aim || 0)), 0, 0); // hangs tilted slightly down against the chest
  // strap: from either side of the neck down to the camera body
  const neck = (b.Neck || b.Head).getWorldPosition(new THREE.Vector3()).addScaledVector(fwd, -0.01);
  r.strap.forEach((m, i) => {
    const a = neck.clone().addScaledVector(right, i ? 0.065 : -0.065), c = pos.clone().addScaledVector(right, i ? 0.06 : -0.06).addScaledVector(_up, 0.03);
    const la = r.root.worldToLocal(a.clone()), lc = r.root.worldToLocal(c.clone()), d = lc.clone().sub(la);
    m.position.copy(la); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(_up, d.normalize());
  });
}

// ---------- main update
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.25, 0.3), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beacon.geometry.translate(0, 30, 0); world.add(beacon);
const v3 = new THREE.Vector3(), lookAt = new THREE.Vector3(); let snapCam = true, shake = 0, T = 0;
let debugCam = null, doorLock = 0;
function update(dt) {
  if (!window.mvpAgeOk || window.mvpIntroPlaying || !charsReady) return; // 18+ gate (assets/agegate.js) or the intro video (assets/intro.js) still up
  if (DEMO && !demoStarted) return;
  if (DEMO && !panel.hidden) { if ((pressed.has('Escape') || pressed.has('Tab')) && panel.dataset.dismissible === 'true') closePanel(); return; }
  if (paused) { if (pressed.has('Escape') && performance.now() - pausedAt > 300) { closePanel(); pressed.delete('Escape'); } return; }
  T += dt;
  save.minute += dt * 2; if (save.minute >= 1440) { save.minute -= 1440; save.day++; const roy = dailyRoyalty(); if (roy) { save.cash += roy; toast(`Royalties: your films earned ${fmt(roy)} today${bootleg() ? ' (after the bootleggers\' cut)' : ''}`); sfx('cash'); refreshHud(); } }
  const h = Math.floor(save.minute / 60), mi = Math.floor(save.minute % 60); $('#clock').textContent = `DAY ${save.day} · ${((h + 11) % 12) + 1}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  { const n = nextStory(); // story calls ring by themselves (once per session; decline and call back from the PHONE)
    if (!DEMO && T > 1.5 && n && n.giver === 'phone' && !act && !dialog && panel.hidden && rangFor !== n.id) { rangFor = n.id; save.introDone = true; persist(); incomingCall(n); } }
  const blocked = !!dialog || !panel.hidden;
  let f = stick.f, r = stick.r;
  if (!blocked) { if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) r += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) r -= 1; } else { f = r = 0; }
  if (dialog && (pressed.has('KeyE') || pressed.has('Space') || pressed.has('Enter'))) advance();
  if (pressed.has('Tab') || pressed.has('KeyM')) openPhone();
  if (pressed.has('Escape') && !panel.hidden) { if (panel.dataset.locked !== 'true') closePanel(); } else if (pressed.has('Escape') && !dialog) pauseGame();
  if (driving) {
    const hit = car.update(dt, { f: clamp(f, -1, 1), r: clamp(r, -1, 1), brake: keys.has('Space') && !blocked }, D, traffic, 32 + save.gear.ride * 4);
    if (hit > 6) { shake = Math.min(0.6, hit / 40); sfx('bump'); }
    P.x = car.x; P.z = car.z;
    $('#speedo').firstChild.textContent = Math.round(Math.abs(car.v) * 2.237);
    if (engine) { engine.o.frequency.value = 40 + Math.abs(car.v) * 4.5; engine.g.gain.value = 0.05 + Math.abs(car.v) / 600; }
  } else {
    if (engine) engine.g.gain.value = 0;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), run = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(stick.f, stick.r) > 0.92;
    moveChar(P, fx * f - fz * r, fz * f + fx * r, run ? 5.6 : 2.3, dt, mvp);
    if (mvp.retarget) { // model MVP: idle mannerisms, camera to the eye only to shoot (or while framing a shot)
      const s0 = step(), framing = s0 && s0.t === 'shoot' && s0.scene === where && P.move <= 0.05;
      mvp.shootT = Math.max(0, (mvp.shootT || 0) - dt);
      const aimTo = mvp.shootT > 0 || framing ? 1 : 0; mvp.aim = (mvp.aim || 0) + (aimTo - (mvp.aim || 0)) * Math.min(1, dt * 9);
      if (aimTo) C.setPose(mvp, C.MVP_SHOOT, Math.min(1, dt * 10));
      else if (P.move <= 0.05) C.setPose(mvp, manner.pose(dt, T), Math.min(1, dt * 3.5));
      if (P.move > 0.05 || aimTo) manner.reset();
      mvp.apply();
      if (mvp.mocap) { // recorded walk / run / idle; hand-made mannerisms and the camera raise blend over the top
        const moving = P.move > 0.05;
        mvp.mocap.play(moving ? (run ? 'run' : 'walk') : 'idle', 0.25, moving ? (run ? 1.2 : 1.35) : 1);
        const procTo = aimTo || manner.move ? 1 : 0; mvp.procW = (mvp.procW || 0) + (procTo - (mvp.procW || 0)) * Math.min(1, dt * 6);
        mvp.mocap.update(dt, mvp.procW < 0.02 ? 0 : mvp.procW);
      }
      placeMvpCamera();
    } else {
      if (P.move <= 0.05) C.setPose(mvp, Object.assign({ sp: [0.02 + Math.sin(T * 1.6) * 0.015, 0, 0] }, C.HOLD), Math.min(1, dt * 8));
      C.updProps(mvp);
    }
  }
  updateNPCs(dt, T);
  if (music) { const s0 = step(); music.setMood(where === 'club' ? 'club' : where === 'studio' ? 'studio' : s0 && s0.t === 'chase' ? 'chase' : 'street'); }
  if (!blocked) updMission(dt);
  else if (!dialog && act && act.timer != null) { act.timer -= dt; if (act.timer <= 0) { closePanel(); failMission('You ran out of time.'); } } // the phone doesn't stop the clock
  if (where === 'world') {
    traffic.update(dt, driving ? { x: 999, z: 999 } : P, [car, ...(chaser ? [chaser] : [])]); peds.update(dt, P, driving ? car : null); D.update(T, P);
    moon.position.set(P.x - 30, 35, P.z - 40); sky.userData.update(T, camera.position); strip.update(T); moon.target.position.set(P.x, 0, P.z);
    D.premiere.visible = (act && act.m.id === 'finale') || save.story >= 7;
    const z = D.zones.find(z => P.x > z.minX && P.x < z.maxX && P.z > z.minZ && P.z < z.maxZ); setZone(z ? z.name : 'The Strip');
  } else { if (where === 'club') CLUB.update(T); setZone(SC[where].zone); }
  springs.update(dt);
  const it = blocked ? null : interaction();
  const carNear = !blocked && !driving && where === 'world' && Math.hypot(P.x - car.x, P.z - car.z) < 3.6;
  $('#prompt').hidden = !it || vfOn; if (it) { $('#prompt-text').textContent = it.prompt + (carNear && it.key !== 'F' ? '  ·  F: get in the car' : ''); $('#prompt kbd').textContent = it.key || 'E'; }
  if (pressed.has('KeyF') && carNear) enterCar(); // F always means the car, even when a door or person is closer
  else if (it && (pressed.has('KeyE') || (pressed.has('KeyF') && it.key === 'F'))) it.fn();
  if (pressed.has('KeyP') && !blocked && !driving) photo();
  // camera
  if (driving) {
    if (T - cam.lastLook > 1.4 && Math.abs(car.v) > 1) cam.yaw += angDiff(cam.yaw, car.a + Math.PI) * Math.min(1, dt * 3);
    const dist = 7.6 + Math.min(2.5, Math.abs(car.v) / 12);
    v3.set(car.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist, 1.6 + Math.sin(cam.pitch) * dist, car.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist);
    if (snapCam) { camera.position.copy(v3); snapCam = false; } else camera.position.lerp(v3, 1 - Math.exp(-dt * 6));
    lookAt.set(car.x + Math.sin(car.a) * 2.5, 1.4, car.z + Math.cos(car.a) * 2.5);
    camera.fov = lerp(camera.fov, 60 + Math.min(14, Math.abs(car.v) * 0.5), Math.min(1, dt * 2));
  } else {
    let dist = cam.dist * (where === 'world' ? 1 : 0.95);
    if (where === 'world') for (let s = 0.4; s < dist; s += 0.25) { const x = P.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * s, z = P.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * s; if (insideAny(x, z)) { dist = Math.max(0.8, s - 0.35); break; } }
    else { const b = SC[where].bounds, m = 0.3; // interiors: keep the camera inside the room's walls
      for (let s = 0.4; s < dist; s += 0.2) { const x = P.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * s, z = P.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * s; if (x < b.minX - m || x > b.maxX + m || z < b.minZ - m || z > b.maxZ + m) { dist = Math.max(0.7, s - 0.25); break; } } }
    const side = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)).multiplyScalar(0.45);
    v3.set(P.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist, 1.55 + Math.sin(cam.pitch) * dist, P.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist).add(side);
    if (snapCam) { camera.position.copy(v3); snapCam = false; } else camera.position.lerp(v3, 1 - Math.exp(-dt * 12));
    lookAt.set(P.x, 1.55, P.z).add(side);
    const s1 = step(); framingNow = !blocked && !!(s1 && s1.t === 'shoot' && s1.scene === where);
    if (!framingNow) zoom = 1; else { if (keys.has('KeyZ')) zoom = clamp(zoom * (1 + dt * 1.6), 1, 5); if (keys.has('KeyX')) zoom = clamp(zoom / (1 + dt * 1.6), 1, 5); }
    camera.fov = lerp(camera.fov, 58 / zoom, Math.min(1, dt * (framingNow ? 8 : 3)));
    // zoomed in = looking through the viewfinder from MVP's eye (it opens aimed at the subject's face)
    const vf = framingNow && zoom > 1.05, eye = mvp.headBone ? mvp.headBone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.06, 0)) : new THREE.Vector3(P.x, 1.62, P.z);
    if (vf && !vfOn) { const t = shootTargets(), n = t && t[0]; if (n) { const h = n.rig.headBone ? n.rig.headBone.getWorldPosition(new THREE.Vector3()) : n.rig.root.position.clone().setY(1.5), d = h.sub(eye);
      cam.yaw = Math.atan2(-d.x, -d.z); cam.pitch = clamp(0.28 - Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.15, 1.1); } }
    vfOn = vf; mvp.root.visible = !vf;
    if (vf) { const e = 0.28 - cam.pitch, fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
      P.a = P.ry = cam.yaw + Math.PI; camera.position.set(eye.x + fx * 0.25, eye.y, eye.z + fz * 0.25);
      lookAt.set(camera.position.x + fx * Math.cos(e) * 10, camera.position.y + Math.sin(e) * 10, camera.position.z + fz * Math.cos(e) * 10); }
  }
  if (shake > 0 && !reducedMotion) { camera.position.x += rand(-1, 1) * shake * 0.3; camera.position.y += rand(-1, 1) * shake * 0.2; shake = Math.max(0, shake - dt * 2); }
  visuals.update(T, P, cam.yaw, where === 'world', reducedMotion);
  camera.lookAt(lookAt);
  if (debugCam) { camera.position.set(...debugCam.pos); camera.fov = debugCam.fov || 58; camera.lookAt(...debugCam.look); } // screenshot tooling
  camera.updateProjectionMatrix();
  renderer.toneMappingExposure = SC[where].exposure;
  $('#demo-guide').hidden = !DEMO || !!dialog;
  if (DEMO) {
    const target = objectiveTarget();
    const distance = target && where === 'world' ? ` · ${Math.round(Math.hypot(P.x - target.x, P.z - target.z))} m` : '';
    $('#demo-guide').textContent = save.story >= 1 ? 'Assignment complete · explore the district or replay from PHONE' : where === 'club' ? 'Frame Ruby with her head and feet visible. Press P or SHOOT. Take 4 photos.' : `Follow the gold beacon${distance} · E / ACT to enter · Shift to run`;
  }
  const tgt = objectiveTarget(), st = step();
  beacon.visible = !!tgt; if (tgt) beacon.position.set(tgt.x, 0, tgt.z);
  drawMap(tgt);
  if (act && act.timer != null) { $('#timer').hidden = false; $('#timer').textContent = Math.ceil(act.timer) + 's'; } else $('#timer').hidden = true;
  $('#grid').hidden = !(st && st.t === 'shoot' && st.scene === where);
  if (!$('#grid').hidden) updateFrameGuide();
}

// live framing coach: a circle on her face, green when the shot would grade A
function updateFrameGuide() {
  const dot = $('#frame-dot'), tip = $('#frame-tip'), t = shootTargets();
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  let best = null; if (t) for (const n of t) { const r = scoreShot(n); if (r && (!best || r.score > best.score)) best = r; }
  if (!best) { dot.hidden = true; tip.className = ''; tip.textContent = 'Turn toward her (mouse / drag)'; return; }
  window.__frame = best; // test hook
  const ok = best.score >= 78; dot.hidden = false; dot.style.left = (best.u * 100) + '%'; dot.style.top = (best.v * 100) + '%'; dot.classList.toggle('ok', ok);
  tip.className = ok ? 'ok' : '';
  tip.textContent = ok ? `${grade(best.score)} shot: press P / SHOOT now` : best.cropped ? 'Keep her feet in the frame: use an upper gold point or zoom out' : best.fill < 0.75 ? 'Zoom in: Z, mouse wheel or +' : best.comp < 0.5 ? 'Line the circle up with a gold point' : best.peak < 0.9 ? 'Wait for her pose…' : `${grade(best.score)} · get closer to a gold point`;
}

// ---------- demo presentation (the campaign remains available without ?demo=1)
function applyQuality(value) {
  quality = value;
  const high = value === 'cinematic', low = value === 'performance';
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : high ? (TOUCH ? 1.5 : 2) : (TOUCH ? 1.25 : 1.5)));
  composer.setPixelRatio(renderer.getPixelRatio());
  renderer.shadowMap.enabled = !low;
  bloom.enabled = !low; bloom.strength = high ? 0.55 : 0.4;
  bloom.threshold = 1.15; bloom.radius = 0.6;
  gradePass.enabled = !low; gradePass.uniforms.amount.value = high ? .9 : .6;
  visuals.mode = value; visuals.setQuality(value); wet.setQuality(value, TOUCH);
  try { localStorage.setItem('mvp_graphics_quality', value); } catch (_) {}
  resize();
  $('#quality').textContent = value.toUpperCase();
}
$('#quality').addEventListener('click', () => {
  const modes = ['performance', 'balanced', 'cinematic'];
  applyQuality(modes[(modes.indexOf(quality) + 1) % modes.length]);
});
function demoTitle() {
  demoStarted = false;
  panelCard('MVP MEDIA · PLAYABLE DEMO', 'Velvet Hours',
    `<img class="demo-cover" src="../assets/mvp-media-title.jpeg" alt="MVP and Ruby — MVP Media studio campaign artwork" width="1536" height="864"><p class="demo-tag">Own the frame. Then own the film.</p><p>Las Vegas. 11:40 PM. A borrowed lens, a motel room, and one call that could change everything.</p><p>You are Matthew “MVP” Phillips. Meet Ruby at The Velvet Room and deliver four headliner photographs. Your first client. Your first credit.</p><div class="demo-facts"><span>01 / PHOTOGRAPHY</span><span>02 / THE STRIP</span><span>03 / YOUR FIRST PAYDAY</span></div><p class="muted">Early playable prototype · procedural characters · mature themes, non-explicit visuals. Desktop and touch controls. Progress is separate from the campaign.</p>`,
    [[save.story >= 1 ? 'Explore after the assignment' : 'Start the assignment', () => beginDemo(false)],
     ...(save.story >= 1 ? [['Replay Velvet Hours', () => beginDemo(true), { plain: true }]] : [])], true);
}
function beginDemo(reset) {
  initAudio();
  if (reset) { save = fresh(); act = null; removeChaser(); if (driving) exitCar();
    SC[where].scene.remove(mvp.root); where = 'world'; world.add(mvp.root); renderPass.scene = world;
    P.x = D.spawn.x; P.z = D.spawn.z; cam.yaw = D.spawn.yaw + Math.PI; cam.pitch = 0.28; snapCam = true;
    car.x = D.myCarSpot.x; car.z = D.myCarSpot.z; car.a = D.myCarSpot.a; car.v = 0;
    $('#strip').replaceChildren(); persist(); }
  demoStarted = true; closePanel(); clearInput(); refreshHud();
  if (save.story === 0 && !act) { save.introDone = true; talk(STORY[0].intro, () => startMission(STORY[0], 'story'), { phone: true }); }
}
function demoComplete() {
  panelCard('VELVET HOURS · ASSIGNMENT COMPLETE', 'Your name is on the marquee.',
    `<p>You delivered Ruby’s headliner set and earned your first credit with MVP Media.</p><div class="demo-facts"><span>+$900 PAYDAY</span><span>+8 REPUTATION</span><span>RUBY SIGNED</span></div><p>The climb continues: deliver the proofs, land your first cover, buy a soundstage, and build a catalog you own. Silas Crane is already watching.</p><p class="muted">End of the demo story. Explore the district, take more photographs, or replay the assignment.</p>`,
    [['Explore the district', closePanel], ['Replay assignment', () => beginDemo(true), { plain: true }]], true);
}
function openDemoMenu() {
  if (!panel.hidden) return closePanel();
  panelCard('MVP PHONE · DEMO', 'Tonight’s assignment',
    `<p>${esc(save.story >= 1 ? 'Velvet Hours complete. The district is yours to explore.' : step()?.text || 'Meet Ruby at The Velvet Room.')}</p><p class="muted">Move: WASD / left thumb. Look: mouse / right thumb. E / ACT: interact. P / SHOOT: photo. F / CAR: drive. Graphics: tap the quality label.</p>`,
    [['Resume', closePanel], ...(where !== 'world' ? [['Step outside to Las Vegas Blvd', () => { closePanel(); enter('world', where); }, { plain: true }]] : []), ['Replay from the beginning', () => beginDemo(true), { plain: true }], ['Save progress', () => { persist(); closePanel(); toast('Demo progress saved.'); }, { plain: true }], [`Music: ${soundPrefs.music ? 'On' : 'Off'}`, () => { setSound('music', !soundPrefs.music); closePanel(); openDemoMenu(); }, { plain: true }], [`Voices: ${soundPrefs.voices ? 'On' : 'Off'}`, () => { setSound('voices', !soundPrefs.voices); closePanel(); openDemoMenu(); }, { plain: true }]]);
  panel.dataset.dismissible = 'true';
}
let contextLost = false;
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); contextLost = true; $('#loading').textContent = 'Graphics interrupted. Reload to restore your saved progress.'; $('#loading').hidden = false; });

// ---------- loop
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); edgePass.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio())); camera.aspect = w / h; gradePass.uniforms.aspect.value = w / h; camera.updateProjectionMatrix(); const ms = Math.round(Math.min(170, w * 0.28) * Math.min(devicePixelRatio, 2)); map.width = map.height = ms; }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), 0.05); if (document.hidden || contextLost) return; update(dt); pressed.clear(); if (where === 'world') wet.render(renderer, world, camera); composer.render(); }
let preferredQuality = 'balanced';
try { const stored = localStorage.getItem('mvp_graphics_quality'); if (['performance', 'balanced', 'cinematic'].includes(stored)) preferredQuality = stored; } catch (_) {}
applyQuality(preferredQuality);
refreshHud(); if (charsReady) $('#loading').hidden = true; if (DEMO) { demoStarted = true; update(0); demoTitle(); } frame();
addEventListener('beforeunload', persist);
window.__world = { SC, traffic, set debugCam(v) { debugCam = v; }, probe() { const r = renderer, out = {}; r.info.autoReset = false; const count = (k, f) => { r.info.reset(); f(); out[k] = r.info.render.calls; }; count('main', () => r.render(world, camera)); count('reflect', () => wet.render(renderer, world, camera)); const by = {}; world.traverse(o => { if (o.isMesh || o.isSprite || o.isPoints) { let p = o; while (p.parent && p.parent !== world) p = p.parent; const k = (p.name || p.type) + ':' + (o.isSprite ? 'sprite' : o.isInstancedMesh ? 'inst' : 'mesh'); by[k] = (by[k] || 0) + (Array.isArray(o.material) ? o.material.length : 1); } }); out.by = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14); r.info.autoReset = true; return out; }, renderFrame() { if (where === 'world') wet.render(renderer, world, camera); composer.render(); }, P, car, cam, get save() { return save; }, enter, D, NPCS, startMission, STORY, get act() { return act; }, nextStep, camera, composer, enterCar, exitCar, photo, get where() { return where; }, get chaser() { return chaser; }, refreshHud, update, voices, rubyHelp, tick(dt) { update(dt); pressed.clear(); }, persist, get mvp() { return mvp; }, get paused() { return paused; }, get driving() { return driving; } };

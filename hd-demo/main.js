// MVP MEDIA · HD character demo. three r160, ES modules, no build step.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as C from './lib/characters.js';
import { buildStudio } from './lib/studio.js';
import { buildPool } from './lib/pool.js';
import { SpringSystem } from './lib/springs.js';

const $ = s => document.querySelector(s);
const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 6000);
camera.position.set(0.6, 1.45, 6.2);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.05, 0); controls.enableDamping = true; controls.minDistance = 0.6; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI * 0.53;

// ---------- sets
const pm = new THREE.PMREMGenerator(renderer);
const studio = new THREE.Scene(); buildStudio(studio, true);
studio.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const pool = new THREE.Scene(); const poolFx = buildPool(pool, renderer);
// three r160 uses physical light units; the studio rig was authored in legacy units
studio.traverse(o => { if (o.isLight) o.intensity *= o.isSpotLight || o.isPointLight ? Math.PI * 4 : Math.PI; });
const SETS = { studio: { scene: studio, exposure: 0.9 }, pool: { scene: pool, exposure: 0.5 } };
let set = 'studio';

// ---------- post: bloom + filmic output
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(studio, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.4, 0.95); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- characters
const cast = new THREE.Group();
const SLOTS = {
  mvp: { label: 'MVP', file: '../assets/characters/mvp.glb', pos: [-0.45, 0, 0], ry: 0.18, height: 1.9, look: Object.assign({}, C.MVP_LOOK, { camera: false, handCam: 'both' }) },
  ruby: { label: 'Ruby', file: '../assets/characters/ruby.glb', pos: [0.42, 0, 0.28], ry: -0.42, height: 1.68, look: Object.assign({ outfit: 'two' }, C.TALENT.ruby.look, { handCam: 'L' }) },
};
for (const [key, s] of Object.entries(SLOTS)) {
  s.key = key; s.holder = new THREE.Group(); s.holder.position.set(...s.pos); s.holder.rotation.y = s.ry; cast.add(s.holder);
  s.springs = new SpringSystem();
}
function clearSlot(s) { if (s.model) s.holder.remove(s.model); s.model = null; s.rig = null; s.mixer = null; s.clips = []; s.springs.clear(); s.found = {}; }
function useStandIn(s) {
  clearSlot(s);
  const rig = C.makeHero(s.look); if (s.key === 'ruby') rig.propRot = [1.25, 0, 0];
  s.rig = rig; s.model = rig.root; s.holder.add(rig.root); s.springs.addRig(rig); s.kind = 'Stand-in (code-built)';
  s.found = {}; for (const sp of rig.springs) s.found[sp.kind] = (s.found[sp.kind] || 0) + 1;
  refreshUI();
}
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
function useGLTF(s, gltf, name) {
  clearSlot(s);
  const root = gltf.scene;
  root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = 1; } });
  // fit to the slot's height, feet on the floor, centred
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
  const k = s.height / Math.max(0.01, size.y); root.scale.setScalar(k);
  box.setFromObject(root); const c = box.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box.min.y;
  s.model = root; s.holder.add(root); root.updateMatrixWorld(true);
  s.found = s.springs.scan(root);
  s.clips = gltf.animations || [];
  s.animated = new Set(s.clips.flatMap(c => c.tracks.map(tr => tr.name.split('.')[0])));
  if (s.clips.length) { s.mixer = new THREE.AnimationMixer(root); s.action = s.mixer.clipAction(s.clips[0]); s.action.play(); s.clipIndex = 0; }
  s.kind = name; refreshUI(); toast(`${s.label}: loaded ${name}`);
}
function loadBuffer(s, buf, name) { loader.parse(buf, '', g => useGLTF(s, g, name), e => toast(`Could not read ${name}: ${e.message || e}`)); }
async function tryRepoModel(s) {
  try { const r = await fetch(s.file, { cache: 'no-cache' }); if (!r.ok) throw 0; loadBuffer(s, await r.arrayBuffer(), s.file.split('/').pop()); }
  catch (e) { useStandIn(s); }
}

// ---------- motion
let mode = 'pose', hopT = 0;
const DANCE = (t) => ({ shL: [-0.3 + Math.sin(t * 4) * 0.4, 0, 0.9 + Math.sin(t * 4) * 0.5], elL: [-0.8, 0, -0.6], shR: [-0.3 - Math.sin(t * 4) * 0.4, 0, -0.9 + Math.sin(t * 4) * 0.5], elR: [-0.8, 0, 0.6],
  hips: [0, Math.sin(t * 4) * 0.25, Math.sin(t * 8) * 0.06], sp: [0.05, -Math.sin(t * 4) * 0.15, -Math.sin(t * 8) * 0.05], hd: [0, Math.sin(t * 4) * 0.2, 0.08 * Math.sin(t * 8)],
  hpL: [-0.15 - Math.max(0, Math.sin(t * 8)) * 0.25, 0, 0.08], knL: [Math.max(0, Math.sin(t * 8)) * 0.45, 0, 0], hpR: [-0.15 - Math.max(0, -Math.sin(t * 8)) * 0.25, 0, -0.08], knR: [Math.max(0, -Math.sin(t * 8)) * 0.45, 0, 0] });
function animate(s, t, dt) {
  const r = s.rig, h = s.holder;
  let bob = 0, sway = 0;
  if (mode === 'hop' || hopT > 0) bob = Math.abs(Math.sin(t * 6.5)) * 0.14;
  if (mode === 'dance') { bob = Math.abs(Math.sin(t * 8)) * 0.05; sway = Math.sin(t * 4) * 0.05; }
  if (mode === 'walk') bob = Math.abs(Math.cos(t * 7.5)) * 0.03;
  h.position.set(s.pos[0] + sway, bob, s.pos[2]);
  if (s.mixer) { s.mixer.update(dt); for (const j of s.springs.joints) if (s.animated.has(j.obj.name)) j.rest.copy(j.obj.quaternion); }
  if (!r) { if (!s.mixer) h.rotation.z = mode === 'dance' ? Math.sin(t * 4) * 0.04 : 0; return; }
  h.rotation.z = 0;
  if (mode === 'walk') C.walkPose(r, t * 7.5, 0.9, 1);
  else if (mode === 'dance') C.setPose(r, DANCE(t), Math.min(1, dt * 12));
  else if (mode === 'idle' || mode === 'hop') C.setPose(r, Object.assign({ sp: [0.02 + Math.sin(t * 1.6) * 0.02, 0, 0], hips: [0, Math.sin(t * 0.5) * 0.08, Math.sin(t * 0.5) * 0.03] }, s.key === 'mvp' ? C.HOLD : {}), Math.min(1, dt * 6));
  else { // photo poses
    if (s.key === 'mvp') C.setPose(r, (t % 7) > 3.6 && (t % 7) < 5.4 ? C.MVP_SHOOT : C.MVP_STAND, Math.min(1, dt * 4));
    else { const list = [C.RUBY_A, C.POSES[1], C.RUBY_B, C.POSES[3], C.POSES[5], C.POSES[2]]; C.setPose(r, list[Math.floor(t / 3.2) % list.length], Math.min(1, dt * 3)); }
  }
  if (r.prop) C.updProps(r);
}

// ---------- UI
const ui = { phys: $('#phys'), physOut: $('#physOut') };
function physLabel(v) { return v <= 0 ? 'Off' : v < 0.4 ? 'Natural' : v < 0.8 ? 'Lively' : 'Xtreme'; }
function setPhysics(v) { for (const s of Object.values(SLOTS)) { s.springs.amount = v; } ui.phys.value = v; ui.physOut.textContent = physLabel(v); document.querySelectorAll('[data-phys]').forEach(b => b.classList.toggle('on', +b.dataset.phys === v)); try { localStorage.setItem('mvp_hd_phys', v); } catch (e) {} }
ui.phys.addEventListener('input', () => setPhysics(+ui.phys.value));
document.querySelectorAll('[data-phys]').forEach(b => b.addEventListener('click', () => setPhysics(+b.dataset.phys)));
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); }));
document.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => switchSet(b.dataset.set)));
$('#bounce').addEventListener('click', () => { hopT = 0.5; for (const s of Object.values(SLOTS)) s.springs.impulse(0, 0.35, 0.1); });
function switchSet(name) {
  set = name; SETS[name].scene.add(cast); renderPass.scene = SETS[name].scene;
  document.querySelectorAll('[data-set]').forEach(b => b.classList.toggle('on', b.dataset.set === name));
}
const VIEWS = { full: [[0.6, 1.45, 6.2], [0, 1.05, 0]], mvp: [[-0.35, 1.7, 1.6], [-0.45, 1.6, 0]], ruby: [[0.75, 1.5, 1.7], [0.42, 1.4, 0.28]], low: [[1.8, 0.4, 3.4], [0, 1.1, 0]] };
let tween = null;
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { const [p, t] = VIEWS[b.dataset.view]; tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; }));
$('#orbit').addEventListener('change', e => { controls.autoRotate = e.target.checked; controls.autoRotateSpeed = 0.6; });
let loadSlot = 'ruby';
document.querySelectorAll('input[name=slot]').forEach(r => r.addEventListener('change', () => { loadSlot = r.value; }));
$('#file').addEventListener('change', e => { const f = e.target.files[0]; if (f) f.arrayBuffer().then(b => loadBuffer(SLOTS[loadSlot], b, f.name)); e.target.value = ''; });
document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => useStandIn(SLOTS[b.dataset.reset])));
addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag'); });
addEventListener('dragleave', e => { if (e.target === document.documentElement || e.clientX <= 0) document.body.classList.remove('drag'); });
addEventListener('drop', e => { e.preventDefault(); document.body.classList.remove('drag'); const f = e.dataTransfer.files[0]; if (f && /\.(glb|gltf)$/i.test(f.name)) f.arrayBuffer().then(b => loadBuffer(SLOTS[loadSlot], b, f.name)); else if (f) toast('Drop a .glb file (export FBX from Character Creator, then send it to Claude to convert).'); });
function refreshUI() {
  for (const s of Object.values(SLOTS)) {
    const el = $(`#info-${s.key}`); if (!el) continue;
    const f = Object.entries(s.found || {}).map(([k, n]) => `${n} ${k}`).join(' · ') || 'no spring bones found';
    const clips = s.clips && s.clips.length ? `<label class="clip">Animation <select data-clip="${s.key}">${s.clips.map((c, i) => `<option value="${i}" ${i === s.clipIndex ? 'selected' : ''}>${c.name || 'Clip ' + (i + 1)}</option>`).join('')}</select></label>` : '';
    el.innerHTML = `<b>${s.label}</b> <span>${s.kind || ''}</span><small>Physics: ${f}</small>${clips}`;
  }
  document.querySelectorAll('[data-clip]').forEach(sel => sel.addEventListener('change', () => { const s = SLOTS[sel.dataset.clip]; s.action.stop(); s.clipIndex = +sel.value; s.action = s.mixer.clipAction(s.clips[s.clipIndex]); s.action.play(); }));
}
// photo mode
const shots = [];
$('#shutter').addEventListener('click', () => {
  composer.render();
  const url = canvas.toDataURL('image/jpeg', 0.92); shots.unshift(url);
  const flash = $('#flash'); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  const strip = $('#strip'); const a = document.createElement('a'); a.href = url; a.download = `mvp-media-${Date.now()}.jpg`; a.innerHTML = `<img src="${url}" alt="Photo">`;
  a.addEventListener('click', ev => { ev.preventDefault(); $('#lightbox img').src = url; $('#lightbox a').href = url; $('#lightbox').hidden = false; });
  strip.prepend(a); while (strip.children.length > 12) strip.lastChild.remove();
});
$('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox' || e.target.dataset.close !== undefined) $('#lightbox').hidden = true; });
$('#panelToggle').addEventListener('click', () => document.body.classList.toggle('panel-closed'));
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); }

// ---------- loop
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
const clock = new THREE.Clock(); let t = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05); t += dt; hopT = Math.max(0, hopT - dt);
  for (const s of Object.values(SLOTS)) { animate(s, t + (s.key === 'ruby' ? 0.7 : 0), dt); s.holder.updateMatrixWorld(true); s.springs.update(dt); }
  if (tween) { tween.k = Math.min(1, tween.k + dt * 1.6); const e = 1 - Math.pow(1 - tween.k, 3); camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e); if (tween.k >= 1) tween = null; }
  controls.update(); poolFx.update(t);
  renderer.toneMappingExposure = SETS[set].exposure;
  composer.render();
}
// boot
let saved = 0.5; try { const v = localStorage.getItem('mvp_hd_phys'); if (v !== null) saved = +v; } catch (e) {}
switchSet('studio'); resize(); setPhysics(saved);
Promise.all(Object.values(SLOTS).map(tryRepoModel)).then(() => { $('#loading').hidden = true; });
frame();
window.__demo = { SLOTS, switchSet, setPhysics, camera, controls, composer, renderer, get mode() { return mode; }, set mode(v) { mode = v; } };

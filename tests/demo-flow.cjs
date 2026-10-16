// Run with node tests/demo-flow.cjs. Tests real mission/demo functions with rendering and DOM boundaries stubbed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'world/main.js'), 'utf8');
const between = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
function fixture(demo) {
  const nodes = new Map(), writes = [];
  const scene = { add() {}, remove() {} };
  const sandbox = { console, Math, DEMO: demo, demoStarted: false, quality: '', devicePixelRatio: 2,
    localStorage: { getItem() { return null; }, setItem(k, v) { writes.push([k, JSON.parse(v)]); } },
    $: s => { if (!nodes.has(s)) nodes.set(s, { hidden: true, dataset: {}, addEventListener() {}, replaceChildren() {} }); return nodes.get(s); },
    P: { x: 1, z: 2 }, cam: {}, car: {}, driving: false, mvp: { root: {} },
    D: { spawn: {x: 11.6, z: 30, yaw: 0}, myCarSpot: {x: 14, z: 36, a: 0} },
    world: scene, SC: {world: {scene}, club: {scene}}, where: 'world', renderPass: {},
    initAudio() {}, clearInput() {}, refreshHud() {}, sfx() {}, toast() {}, removeChaser() {},
    clamp: (v,a,b) => Math.max(a, Math.min(b,v)),
    canvas: { addEventListener() {} }, snapCam: false,
    closePanel() { sandbox.$('#panel').hidden = true; },
    panelCard(...args) { sandbox.card = args; sandbox.$('#panel').hidden = false; },
    talk(lines, done) { sandbox.dialogue = lines; sandbox.done = done; },
    exitCar() { sandbox.driving = false; }, esc: String,
    renderer: { shadowMap: {}, setPixelRatio() {} }, bloom: {}, resize() {},
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'world/lib/story.js'),'utf8').replaceAll('export const ', 'const '),sandbox);
  vm.runInContext(between("const SAVE_KEY =", '// ---------- characters'),sandbox);
  vm.runInContext("let act = null; const step = () => act ? act.m.steps[act.i] : null;" + between('const nextStory =', '// Where each named'),sandbox);
  vm.runInContext(between('function startMission(', 'function failMission('),sandbox);
  vm.runInContext(between('function applyQuality(', '// ---------- loop'),sandbox);
  return { sandbox, writes, run: s => vm.runInContext(s,sandbox) };
}
const demo = fixture(true);
demo.run('demoTitle()'); assert.equal(demo.sandbox.card[1], 'Velvet Hours');
demo.run('beginDemo(false)'); assert.equal(demo.sandbox.demoStarted, true); assert.equal(demo.sandbox.dialogue.length, 3);
demo.sandbox.done(); assert.equal(demo.run('act.m.id'), 'velvet'); assert.equal(demo.run('act.i'), 0);
demo.run('nextStep()'); assert.equal(demo.run('step().t'), 'enter');
demo.run("where = 'club'; nextStep()"); assert.equal(demo.run('step().t'), 'shoot'); assert.equal(demo.run('step().shots'), 4);
demo.run('nextStep()'); assert.equal(demo.run('save.cash'),1150); assert.equal(demo.run('save.rep'),8); assert.equal(demo.run('save.roster[0]'),'ruby'); assert.equal(demo.run('act'),null); assert.equal(demo.run('nextStory()'),null);
demo.sandbox.done(); assert.equal(demo.sandbox.card[0],'VELVET HOURS · ASSIGNMENT COMPLETE');
demo.run("startMission(STORY[1], 'story')"); assert.equal(demo.run('act'),null);
demo.run('beginDemo(true)'); assert.equal(demo.run('save.cash'),250); assert.equal(demo.run('save.story'),0); assert.equal(demo.run('where'),'world'); assert.equal(demo.sandbox.car.v,0);
assert(demo.writes.every(([key])=>key==='mvp_velvet_demo_v1'));
const campaign=fixture(false); campaign.run("startMission(STORY[1], 'story')"); assert.equal(campaign.run('act.m.id'),'proof'); campaign.run('persist()'); assert.equal(campaign.writes[0][0],'mvp_world_v2');
console.log('PASS: demo entry, 3 mission steps, payout, ending, campaign lock, replay reset, isolated saves, campaign access');

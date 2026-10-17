// MVP Media Studios, the full building around Stage A (hd-demo/lib/studio.js builds the stage itself).
// Lobby with reception, lounge and the film wall; Hair & Makeup / Wardrobe on the left; Edit Bay & Office on the
// right; craft service by the stage. Returns walls/furniture colliders, the walkable bounds, the exit, Ruby's job
// spots and setPosters(releases) for the film wall.
import * as THREE from 'three';
import { mat, cylG, sphG, boxG, planeG, M, Rt, canvasTex, signMesh, neon } from '../../hd-demo/lib/characters.js';

const W = 14, BACK = -4.6, FRONT = 16, H = 7.6; // half width, back/front walls, ceiling

export function buildStudioHQ(sc) {
  const colliders = [], circles = [], add = (...o) => { sc.add(...o); return o[0]; };
  const block = (x0, x1, z0, z1) => colliders.push({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });

  // ---- shell: painted brick walls, dark ceiling, rugs
  const brick = canvasTex(512, 512, (g) => {
    g.fillStyle = '#1b1517'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) {
      const v = 34 + Math.random() * 14; g.fillStyle = `rgb(${v + 10},${v - 6},${v - 2})`;
      g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
    }
  });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(6, 2);
  const wallM = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.92 });
  for (const [x, z, w, ry] of [[0, BACK, 2 * W, 0], [-W, (BACK + FRONT) / 2, FRONT - BACK, Math.PI / 2], [W, (BACK + FRONT) / 2, FRONT - BACK, -Math.PI / 2], [0, FRONT, 2 * W, Math.PI]]) {
    const wl = M(planeG(w, H), wallM, x, H / 2, z); wl.rotation.y = ry; wl.receiveShadow = true; add(wl);
  }
  add(Rt(M(planeG(2 * W, FRONT - BACK), mat('#08070a', 1), 0, H, (BACK + FRONT) / 2), Math.PI / 2, 0, 0));
  // baseboard trim in brand red
  for (const [x, z, w, ry] of [[-W + 0.02, (BACK + FRONT) / 2, FRONT - BACK, Math.PI / 2], [W - 0.02, (BACK + FRONT) / 2, FRONT - BACK, -Math.PI / 2]]) { const t = M(planeG(w, 0.06), neon('#ff1a2a', 1.4), x, 0.12, z); t.rotation.y = ry; add(t); }
  const rug = (x, z, w, d, color) => add(Rt(M(planeG(w, d), mat(color, 0.95), x, 0.004, z), -Math.PI / 2, 0, 0));
  rug(0, 12.6, 9, 4.6, '#3a0c12'); rug(-11.6, 2.5, 4.2, 8, '#24181c'); rug(11.6, 2.5, 4.2, 8, '#16181f');

  // ---- front wall: door + big sign
  const doorFrame = mat('#0d0d10', 0.4, 0.6);
  add(M(boxG(2.8, 3.1, 0.2), doorFrame, 0, 1.55, FRONT - 0.1));
  add(M(planeG(2.4, 2.8), mat('#18080b', 0.5, 0.3), 0, 1.45, FRONT - 0.21)).rotation.y = Math.PI;
  const exitSign = signMesh('EXIT · LAS VEGAS BLVD', '#ff3344', 2.2, 0.3); exitSign.position.set(0, 3.35, FRONT - 0.22); exitSign.rotation.y = Math.PI; add(exitSign);
  const big = signMesh('MVP MEDIA STUDIOS', '#ff2a3d', 7.5, 1.1); big.position.set(0, 5.2, FRONT - 0.22); big.rotation.y = Math.PI; add(big);
  const glow = new THREE.PointLight(0xff2a3d, 1.2, 9); glow.position.set(0, 5, FRONT - 1.2); add(glow);

  // ---- lobby: reception desk, lounge, plants, pendant lights
  const red = mat('#8a0f1a', 0.55), black = mat('#0e0d10', 0.45, 0.3), gold = mat('#c9a35a', 0.3, 1), wood = mat('#3a2418', 0.7);
  const desk = new THREE.Group(); desk.position.set(-8, 0, 12.2); add(desk);
  desk.add(M(boxG(3.4, 1.05, 0.9), black, 0, 0.53, 0), M(boxG(3.5, 0.06, 1.0), gold, 0, 1.08, 0));
  const deskSign = signMesh('MVP MEDIA', '#ff2a3d', 2.2, 0.42); deskSign.position.set(0, 0.6, -0.46); deskSign.rotation.y = Math.PI; desk.add(deskSign);
  desk.add(M(boxG(0.5, 0.32, 0.03), mat('#1a1a20', 0.3, 0.6), 0.9, 1.27, 0.15)); // monitor
  block(-9.75, -6.25, 11.7, 12.7);
  // lounge: L-shaped red sofa, coffee table
  const sofa = new THREE.Group(); sofa.position.set(6.6, 0, 13.6); add(sofa);
  sofa.add(M(boxG(4, 0.42, 1), red, 0, 0.3, 0), M(boxG(4, 0.8, 0.25), red, 0, 0.7, 0.45), M(boxG(1, 0.42, 1.6), red, -1.5, 0.3, -1.3), M(boxG(0.25, 0.8, 1.6), red, -1.88, 0.7, -1.3));
  for (const [x, z] of [[-1.9, 0.4], [1.9, 0.4], [1.9, -0.4], [-1.9, -2]]) sofa.add(M(cylG(0.04, 0.04, 0.1, 8), gold, x, 0.05, z));
  block(4.5, 8.7, 13.0, 14.2); block(4.6, 5.7, 11.4, 13.0);
  add(M(cylG(0.55, 0.55, 0.05, 28), mat('#141216', 0.15, 0.6), 7, 0.42, 12.1), M(cylG(0.06, 0.06, 0.4, 10), gold, 7, 0.2, 12.1));
  circles.push({ x: 7, z: 12.1, r: 0.6 });
  for (const [x, z] of [[-12.9, 15.1], [12.9, 15.1], [-3.2, 15.2], [3.2, 15.2]]) {
    add(M(cylG(0.3, 0.22, 0.6, 14), black, x, 0.3, z));
    for (let i = 0; i < 6; i++) add(M(sphG(0.32 - i * 0.03, 10, 8), mat(i % 2 ? '#1e4a2a' : '#2a5e34', 0.8), x + Math.sin(i * 2.1) * 0.12, 0.85 + i * 0.22, z + Math.cos(i * 2.1) * 0.12));
    circles.push({ x, z, r: 0.42 });
  }
  for (const x of [-4, 0, 4]) { // pendant lamps
    add(M(cylG(0.01, 0.01, 2.2, 4), black, x, H - 1.1, 12.4), M(cylG(0.08, 0.32, 0.3, 18, true), gold, x, H - 2.3, 12.4), M(sphG(0.1, 10, 8), neon('#ffd9a8', 3), x, H - 2.4, 12.4));
  }
  const lobbyLight = new THREE.PointLight(0xffd2a0, 1.4, 16, 1.6); lobbyLight.position.set(0, 5, 12.4); add(lobbyLight);

  // ---- film wall: four frames each side of the lobby, filled with your releases
  const posters = [];
  for (const [x, z, ry] of [[-W + 0.06, 9.4, Math.PI / 2], [-W + 0.06, 12.6, Math.PI / 2], [W - 0.06, 9.4, -Math.PI / 2], [W - 0.06, 12.6, -Math.PI / 2]]) {
    const g = new THREE.Group(); g.position.set(x, 2.5, z); g.rotation.y = ry; add(g);
    g.add(M(boxG(1.5, 2.2, 0.06), gold, 0, 0, -0.02));
    const tex = canvasTex(300, 440, () => {}), face = M(planeG(1.36, 2.04), new THREE.MeshBasicMaterial({ map: tex }), 0, 0, 0.015); face.material.color.setScalar(1.15); g.add(face);
    const spot = new THREE.SpotLight(0xfff0dc, 1.1, 5, 0.5, 0.6, 1.2); spot.position.set(0, 1.9, 1.1); spot.target = face; g.add(spot);
    posters.push(tex);
  }
  const drawPoster = (tex, film, i) => {
    const g = tex.image.getContext('2d'), w = 300, h = 440;
    const hue = [352, 20, 330, 270][i % 4], gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, film ? `hsl(${hue},70%,22%)` : '#141218'); gr.addColorStop(1, '#060508'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#e6bd79'; g.font = '600 15px Montserrat, sans-serif'; g.fillText('MVP MEDIA PRESENTS', w / 2, 40);
    if (film) {
      g.fillStyle = `hsla(${hue},90%,55%,.35)`; g.beginPath(); g.arc(w / 2, 190, 95, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff2ea'; g.font = '900 34px Cinzel, Georgia, serif';
      const words = film.title.toUpperCase().split(' '); words.forEach((wd, k) => g.fillText(wd, w / 2, 170 + k * 40 - (words.length - 1) * 20));
      g.fillStyle = '#e6bd79'; g.font = '600 18px Montserrat, sans-serif'; g.fillText('★'.repeat(Math.max(1, Math.round(film.q / 20))), w / 2, 330);
      g.fillStyle = '#b1a8ae'; g.font = '500 13px Montserrat, sans-serif'; g.fillText(`QUALITY ${film.q} · NOW SHOWING`, w / 2, 360);
    } else { g.fillStyle = '#4a4248'; g.font = '700 22px Montserrat, sans-serif'; g.fillText('YOUR FILM', w / 2, 210); g.fillText('GOES HERE', w / 2, 240); }
    g.fillStyle = '#ff2a3d'; g.fillRect(40, 400, w - 80, 3);
    tex.needsUpdate = true;
  };
  const setPosters = releases => { const last = releases.slice(-4).reverse(); posters.forEach((t, i) => drawPoster(t, last[i], i)); };
  setPosters([]);

  // ---- left wing: Hair & Makeup / Wardrobe
  const wingSign = (text, x, z, ry, color) => { const s = signMesh(text, color, 3.6, 0.5); s.position.set(x, 5.3, z); s.rotation.y = ry; add(s); };
  wingSign('HAIR & MAKEUP', -W + 0.08, 1.5, Math.PI / 2, '#ff7ab0');
  const counter = new THREE.Group(); counter.position.set(-W + 0.45, 0, 1.2); add(counter);
  counter.add(M(boxG(0.8, 0.9, 5.2), black, 0, 0.45, 0), M(boxG(0.86, 0.05, 5.3), mat('#e8e2dc', 0.25, 0.1), 0, 0.92, 0));
  for (const dz of [-1.6, 0, 1.6]) { // lit mirrors
    counter.add(M(boxG(0.04, 1.1, 1.2), mat('#cfd6e0', 0.05, 1), -0.38, 1.75, dz));
    for (let k = 0; k < 6; k++) { const a = k / 5; counter.add(M(sphG(0.045, 8, 6), neon('#fff1d6', 2.2), -0.34, 1.22 + a * 1.06, dz - 0.66), M(sphG(0.045, 8, 6), neon('#fff1d6', 2.2), -0.34, 1.22 + a * 1.06, dz + 0.66)); }
    for (let k = 0; k < 4; k++) counter.add(M(cylG(0.025, 0.03, 0.12 + (k % 2) * 0.06, 8), mat(['#ff3a5c', '#e6bd79', '#f2f2f2', '#7a1a3a'][k], 0.3, 0.4), 0.05 + k * 0.08, 1.0, dz + 0.3));
  }
  block(-W, -W + 0.9, -1.5, 3.9);
  for (const dz of [-1.6, 0]) { // salon chairs (the third mirror is Ruby's to clean)
    const ch = new THREE.Group(); ch.position.set(-W + 1.6, 0, 1.2 + dz); ch.rotation.y = -Math.PI / 2; add(ch);
    ch.add(M(cylG(0.28, 0.32, 0.05, 16), gold, 0, 0.03, 0), M(cylG(0.04, 0.04, 0.4, 8), gold, 0, 0.25, 0), M(boxG(0.55, 0.12, 0.55), red, 0, 0.5, 0), M(boxG(0.55, 0.6, 0.1), red, 0, 0.85, 0.24));
  }
  const vanityLight = new THREE.PointLight(0xffe2bc, 0.55, 9, 1.6); vanityLight.position.set(-12, 2.6, 1.2); add(vanityLight);
  // wardrobe rack
  const rack = new THREE.Group(); rack.position.set(-10.5, 0, 5.6); add(rack);
  rack.add(M(cylG(0.02, 0.02, 2.6, 8), gold, 0, 1.75, 0)); rack.children[0].rotation.x = Math.PI / 2;
  for (const dz of [-1.3, 1.3]) rack.add(M(cylG(0.02, 0.02, 1.75, 8), gold, 0, 0.88, dz), M(boxG(0.5, 0.03, 0.05), gold, 0, 0.02, dz));
  const cloth = ['#c4142a', '#121214', '#e6bd79', '#ff6ea8', '#1e1e2a', '#8a0f1a', '#f2ece6', '#3a1a5a'];
  for (let k = 0; k < 11; k++) { const hgt = 0.9 + (k % 3) * 0.18; rack.add(M(boxG(0.42, hgt, 0.05), mat(cloth[k % cloth.length], 0.8), 0, 1.72 - hgt / 2, -1.15 + k * 0.23)); }
  block(-10.8, -10.2, 4.2, 7.0);

  // ---- right wing: Edit Bay & Office
  wingSign('EDIT BAY', W - 0.08, 1.5, -Math.PI / 2, '#5ad8ff');
  const ed = new THREE.Group(); ed.position.set(W - 0.8, 0, 1.2); add(ed);
  ed.add(M(boxG(1.1, 0.06, 3.4), mat('#151518', 0.35, 0.5), 0, 0.78, 0));
  for (const dz of [-1.5, 1.5]) ed.add(M(boxG(0.9, 0.75, 0.05), black, 0, 0.38, dz));
  const timeline = canvasTex(512, 288, (g) => {
    g.fillStyle = '#0d0e12'; g.fillRect(0, 0, 512, 288); g.fillStyle = '#1a1c24'; g.fillRect(0, 0, 512, 22);
    g.fillStyle = '#3a2028'; g.fillRect(10, 32, 300, 160); g.fillStyle = '#c8141f'; g.fillRect(120, 70, 70, 90);
    for (let t = 0; t < 4; t++) for (let k = 0; k < 9; k++) { g.fillStyle = ['#5a2a6a', '#2a5a7a', '#7a5a2a', '#2a7a4a'][t]; g.fillRect(8 + k * 56 + (t * 13) % 20, 206 + t * 20, 40 + (k * 7) % 14, 14); }
    g.fillStyle = '#ff2a3d'; g.fillRect(250, 200, 2, 86);
  });
  for (const dz of [-0.75, 0, 0.75]) {
    const scr = M(planeG(0.68, 0.4), new THREE.MeshBasicMaterial({ map: timeline }), -0.2, 1.22, dz); scr.rotation.y = -Math.PI / 2; scr.material.color.setScalar(1.5);
    ed.add(scr, M(boxG(0.03, 0.44, 0.72), black, -0.17, 1.22, dz), M(boxG(0.05, 0.3, 0.05), black, -0.12, 0.95, dz));
  }
  ed.add(M(boxG(0.25, 0.02, 0.6), mat('#222228', 0.4), -0.35, 0.82, 0)); // keyboard
  const chair = new THREE.Group(); chair.position.set(W - 1.9, 0, 1.2); chair.rotation.y = -Math.PI / 2; add(chair);
  chair.add(M(cylG(0.3, 0.3, 0.04, 5), black, 0, 0.06, 0), M(cylG(0.035, 0.035, 0.4, 8), gold, 0, 0.28, 0), M(boxG(0.55, 0.1, 0.52), black, 0, 0.5, 0), M(boxG(0.55, 0.75, 0.08), black, 0, 0.92, 0.26));
  block(W - 1.4, W, -0.6, 3.0);
  // award shelf with gold statuettes
  const shelf = new THREE.Group(); shelf.position.set(W - 0.2, 0, 5.6); add(shelf);
  for (const y of [1.3, 1.9, 2.5]) shelf.add(M(boxG(0.3, 0.04, 2.2), wood, 0, y, 0));
  for (let k = 0; k < 7; k++) { const y = [1.3, 1.9, 2.5][k % 3] + 0.02, dz = -0.9 + k * 0.3; shelf.add(M(cylG(0.05, 0.06, 0.06, 10), black, -0.05, y + 0.03, dz), M(cylG(0.02, 0.03, 0.22, 8), gold, -0.05, y + 0.17, dz), M(sphG(0.045, 10, 8), gold, -0.05, y + 0.31, dz)); }
  const editLight = new THREE.PointLight(0x9ad8ff, 1.0, 9, 1.6); editLight.position.set(12, 2.6, 1.2); add(editLight);

  // ---- craft service by the stage
  const craft = new THREE.Group(); craft.position.set(6.2, 0, 5.4); add(craft);
  craft.add(M(boxG(2.2, 0.06, 0.8), mat('#f2ece6', 0.6), 0, 0.85, 0));
  for (const dx of [-1, 1]) for (const dz of [-0.35, 0.35]) craft.add(M(cylG(0.02, 0.02, 0.84, 6), black, dx, 0.42, dz));
  craft.add(M(cylG(0.13, 0.15, 0.4, 14), mat('#1a1a1e', 0.3, 0.7), -0.7, 1.08, 0), M(boxG(0.5, 0.1, 0.35), mat('#c49a5a', 0.7), 0.1, 0.93, 0));
  for (let k = 0; k < 5; k++) craft.add(M(cylG(0.035, 0.03, 0.1, 10), mat(k % 2 ? '#f2f2f2' : '#ff2a3d', 0.5), 0.55 + (k % 3) * 0.1, 0.93, -0.15 + Math.floor(k / 3) * 0.2));
  block(5.0, 7.4, 4.9, 5.9);

  // the stage's own gear (from studio.js) is in the way of walking too
  block(-4.7, -3.1, -1.5, -0.3); block(3.3, 4.5, 0.8, 1.6); circles.push({ x: -2.9, z: 0.9, r: 0.5 }, { x: 3.1, z: 0.2, r: 0.5 });

  // ---- Ruby's jobs around the building: where she stands, which way she faces (0 = toward the entrance), what she does
  const jobs = [
    { id: 'sweep', x: 1.8, z: 11.2, ry: Math.PI * 0.85, act: 'sweep', say: 'Sweeping the lobby' },
    { id: 'sweep2', x: -3.4, z: 13.4, ry: -Math.PI * 0.6, act: 'sweep', say: 'Sweeping the lobby' },
    { id: 'mirror', x: -12.6, z: 2.8, ry: -Math.PI / 2, act: 'wipe', say: 'Cleaning the makeup mirrors' },
    { id: 'rack', x: -9.7, z: 5.6, ry: -Math.PI / 2, act: 'fold', say: 'Sorting the wardrobe' },
    { id: 'box', x: 3.9, z: 2.4, ry: Math.PI, act: 'stack', carryFrom: { x: -7, z: 10.9 }, say: 'Bringing gear to the stage' },
    { id: 'softbox', x: -2.4, z: 2.1, ry: Math.PI * 0.85, act: 'adjust', say: 'Setting up the lights' },
    { id: 'edit', x: 12.2, z: 1.2, ry: Math.PI / 2, act: 'type', say: 'Logging footage in the edit bay' },
    { id: 'posters', x: 12.9, z: 11, ry: Math.PI / 2, act: 'dust', say: 'Dusting the film wall' },
    { id: 'coffee', x: 6.2, z: 6.4, ry: Math.PI, act: 'coffee', say: 'Coffee break' },
  ];
  return {
    colliders, circles, setPosters, jobs, aisleZ: 7.9,
    bounds: { minX: -W + 0.5, maxX: W - 0.5, minZ: -2.2, maxZ: FRONT - 0.5 },
    exit: { x: 0, z: FRONT - 0.9, r: 2.2 }, entry: { x: 0, z: FRONT - 2.4 },
  };
}

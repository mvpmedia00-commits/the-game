// Static batching: merges the city's unmoving meshes that share a material into one mesh per
// map cell, so three.js submits a few hundred draws instead of ~1,000 per pass (main, shadow, reflection).
// Multi-material meshes (building blocks: facade, facade, roof...) are split per material first, so their
// roofs merge across buildings and each facade pair becomes one draw.
// Skipped: anything under an object with userData.dynamic, hidden subtrees, transparent materials,
// instanced/skinned meshes and meshes with children. Small, non-glowing props go to layer 1, so the
// wet-street reflection pass skips them (they still draw and cast shadows).
import * as THREE from 'three';

const ATTRS = ['position', 'normal', 'uv', 'color'];
const noop = THREE.Object3D.prototype.onBeforeRender;

export function mergeStatic(roots, target, { cell = 64, small = 1.2 } = {}) {
  const groups = new Map(), box = new THREE.Box3(), sphere = new THREE.Sphere(), split = new Set();
  for (const root of roots) {
    root.updateMatrixWorld(true);
    const walk = o => {
      if (o.userData.dynamic || !o.visible) return;
      for (const c of o.children) walk(c);
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.children.length) return;
      const g = o.geometry, multi = Array.isArray(o.material);
      if (o.morphTargetInfluences || o.onBeforeRender !== noop || !g.attributes.position) return;
      if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return;
      if (Object.keys(g.attributes).some(a => !ATTRS.includes(a))) return;
      // the pieces to draw: [material, first index, index count]
      const total = g.index ? g.index.count : g.attributes.position.count;
      const pieces = multi ? g.groups.map(gr => [o.material[gr.materialIndex], gr.start, Math.min(gr.count, total - gr.start)]) : [[o.material, 0, total]];
      if (!pieces.length || pieces.some(([m]) => !m || m.transparent)) return;
      const attrs = ATTRS.filter(a => g.attributes[a]);
      if (!g.boundingBox) g.computeBoundingBox();
      box.copy(g.boundingBox).applyMatrix4(o.matrixWorld); box.getBoundingSphere(sphere);
      const ground = box.max.y < 0.3 && box.max.x - box.min.x > 0.4; // see WetReflections.collectGround
      for (const [m, start, count] of pieces) {
        const glow = m.isMeshBasicMaterial || (m.emissive && m.emissive.getHex() !== 0 && m.emissiveIntensity > 0);
        const tiny = sphere.radius < small && !glow && o.layers.mask === 1;
        const key = [m.uuid, o.castShadow, o.receiveShadow, o.layers.mask, o.renderOrder, o.frustumCulled, !!o.userData.reflectAnyway,
          ground, tiny, attrs.map(a => a + g.attributes[a].itemSize).join(), Math.floor(sphere.center.x / cell), Math.floor(sphere.center.z / cell)].join('|');
        let grp = groups.get(key); if (!grp) groups.set(key, grp = { list: [], attrs, tiny, m });
        grp.list.push({ o, start, count });
      }
      if (multi) split.add(o);
    };
    walk(root);
  }
  let merged = 0, batches = 0; const gone = new Set();
  for (const { list, attrs, tiny, m } of groups.values()) {
    if (list.length < 2 && !split.has(list[0].o)) continue; // a lone single-material mesh stays as it is
    const geo = mergeInWorld(list, attrs), o0 = list[0].o;
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = 'static batch'; mesh.castShadow = o0.castShadow; mesh.receiveShadow = o0.receiveShadow; mesh.renderOrder = o0.renderOrder;
    mesh.frustumCulled = o0.frustumCulled; mesh.userData.reflectAnyway = o0.userData.reflectAnyway;
    mesh.layers.mask = tiny ? 2 : o0.layers.mask;
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    target.add(mesh); mesh.updateMatrixWorld(true);
    for (const { o } of list) gone.add(o);
    batches++;
  }
  for (const o of gone) { o.parent.remove(o); merged++; }
  return { merged, batches };
}

// One indexed geometry in world space (the target's matrix must be identity).
function mergeInWorld(list, attrs) {
  let verts = 0, idx = 0;
  for (const { o, count } of list) { verts += o.geometry.attributes.position.count; idx += count; }
  const size = a => list[0].o.geometry.attributes[a].itemSize;
  const out = {}; for (const a of attrs) out[a] = new Float32Array(verts * size(a));
  const index = verts > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  let vo = 0, io = 0;
  for (const { o, start, count } of list) {
    const g = o.geometry, n = g.attributes.position.count, M = o.matrixWorld; nm.getNormalMatrix(M);
    for (const a of attrs) {
      const src = g.attributes[a], s = src.itemSize, dst = out[a];
      for (let i = 0; i < n; i++) {
        const j = (vo + i) * s;
        if (a === 'position' || a === 'normal') {
          v.fromBufferAttribute(src, i); if (a === 'position') v.applyMatrix4(M); else v.applyMatrix3(nm).normalize();
          dst[j] = v.x; dst[j + 1] = v.y; dst[j + 2] = v.z;
        } else { dst[j] = src.getX(i); if (s > 1) dst[j + 1] = src.getY(i); if (s > 2) dst[j + 2] = src.getZ(i); if (s > 3) dst[j + 3] = src.getW(i); }
      }
    }
    const flip = M.determinant() < 0; // mirrored objects: keep the triangles facing out
    const at = i => (g.index ? g.index.getX(i) : i) + vo;
    for (let i = start; i + 2 < start + count; i += 3) { index[io++] = at(i); index[io++] = at(flip ? i + 2 : i + 1); index[io++] = at(flip ? i + 1 : i + 2); }
    vo += n;
  }
  const geo = new THREE.BufferGeometry();
  for (const a of attrs) geo.setAttribute(a, new THREE.BufferAttribute(out[a], size(a)));
  geo.setIndex(new THREE.BufferAttribute(io === idx ? index : index.slice(0, io), 1));
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  return geo;
}

// Wet-street planar reflections. The city is rendered once more from a camera mirrored under the
// road (at reduced resolution), then ground materials sample that image through a projective
// texture matrix. A world-space puddle mask decides where the street is mirror-wet vs. just damp,
// and samples are smeared vertically, like the long neon streaks real wet asphalt gives.
import * as THREE from 'three';

export class WetReflections {
  constructor() {
    this.target = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace });
    this.cam = new THREE.PerspectiveCamera();
    this.uniforms = {
      tReflect: { value: this.target.texture }, reflMatrix: { value: new THREE.Matrix4() },
      tWet: { value: puddleMask() }, reflOn: { value: 0 }, reflTexel: { value: new THREE.Vector2(1 / 16, 1 / 16) },
    };
    this.scale = 0.5; this.enabled = true; this.hidden = [];
  }
  // Objects lying on the ground would block the mirrored view from below: skip them in the pass.
  collectGround(scene) {
    const box = new THREE.Box3();
    scene.updateMatrixWorld(true);
    scene.traverse(o => {
      if (!o.isMesh || o.userData.reflectAnyway) return;
      if (o.isInstancedMesh) { o.computeBoundingBox(); box.copy(o.boundingBox).applyMatrix4(o.matrixWorld); }
      else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); }
      if (box.max.y < 0.3 && box.max.x - box.min.x > 0.4) this.hidden.push(o);
    });
  }
  // Inject the reflection into a ground material. wet: base wetness (0..1), puddles: how much the mask adds.
  apply(material, wet = 0.35, puddles = 0.65) {
    const U = this.uniforms, prev = material.onBeforeCompile;
    material.onBeforeCompile = (sh, r) => {
      prev && prev(sh, r);
      Object.assign(sh.uniforms, U, { wetBase: { value: wet }, wetPuddle: { value: puddles } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix; varying vec4 vReflCoord; varying vec2 vWetXZ;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vec4 reflW = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            reflW = instanceMatrix * reflW;
          #endif
          reflW = modelMatrix * reflW; vReflCoord = reflMatrix * reflW; vWetXZ = reflW.xz;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
          uniform sampler2D tReflect; uniform sampler2D tWet; uniform float reflOn, wetBase, wetPuddle; uniform vec2 reflTexel;
          varying vec4 vReflCoord; varying vec2 vWetXZ;
          float wetAmount(){ return clamp(wetBase + wetPuddle * smoothstep(0.45, 0.7, texture2D(tWet, vWetXZ / 41.0).r), 0.0, 1.0); }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          float wetK = wetAmount() * reflOn; diffuseColor.rgb *= 1.0 - 0.45 * wetK; roughnessFactor = mix(roughnessFactor, 0.12, wetK * 0.8);`)
        .replace('#include <opaque_fragment>', `
          if (reflOn > 0.5) {
            vec2 ruv = vReflCoord.xy / vReflCoord.w;
            vec2 ripple = (normal.xy) * 0.012;               // surface relief breaks up the mirror
            vec3 rc = vec3(0.0); float wsum = 0.0;
            for (int i = -3; i <= 3; i++) { float w = 1.0 - abs(float(i)) / 4.0; rc += texture2D(tReflect, ruv + ripple + vec2(0.0, float(i) * reflTexel.y * 3.0)).rgb * w; wsum += w; }
            rc /= wsum;
            float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
            float fres = 0.12 + 0.88 * pow(1.0 - ndv, 4.0);
            outgoingLight += rc * fres * wetK * 0.9;
          }
          #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => 'wet-' + (prev ? 'w' : '') + wet;
    material.needsUpdate = true;
  }
  setQuality(mode, touch = false) { this.enabled = mode === 'cinematic' || (mode === 'balanced' && !touch); this.scale = mode === 'cinematic' ? 0.5 : 0.33; this.uniforms.reflOn.value = this.enabled ? 1 : 0; }
  render(renderer, scene, camera) {
    if (!this.enabled) return;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(16, Math.round(size.x * this.scale)), h = Math.max(16, Math.round(size.y * this.scale));
    if (this.target.width !== w || this.target.height !== h) { this.target.setSize(w, h); this.uniforms.reflTexel.value.set(1 / w, 1 / h); }
    // mirror the camera across y = 0
    const c = this.cam; c.copy(camera); c.far = 600; c.layers.disable(1);
    const dir = camera.getWorldDirection(new THREE.Vector3()), pos = camera.position;
    c.position.set(pos.x, -pos.y, pos.z); c.up.set(0, -1, 0);
    c.lookAt(pos.x + dir.x, -(pos.y + dir.y), pos.z + dir.z); c.updateProjectionMatrix(); c.updateMatrixWorld();
    this.uniforms.reflMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    for (const o of this.hidden) o.userData.wasVisible = o.visible, o.visible = false;
    const auto = renderer.shadowMap.autoUpdate, fog = scene.fog; renderer.shadowMap.autoUpdate = false;
    const rt = renderer.getRenderTarget(); renderer.setRenderTarget(this.target); renderer.clear(); renderer.render(scene, c); renderer.setRenderTarget(rt);
    renderer.shadowMap.autoUpdate = auto; scene.fog = fog;
    for (const o of this.hidden) o.visible = o.userData.wasVisible;
  }
}

// Tileable low-frequency noise: bright = standing water.
function puddleMask(n = 256) {
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, n, n);
  let s = 99; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < 70; i++) {
    const x = r() * n, y = r() * n, rad = 8 + r() * 34;
    for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { // wrap so the tile is seamless
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + ox, y + oy, rad * (1 + r()), rad, r() * 3, 0, 7); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t;
}

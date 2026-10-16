// Las Vegas night sky: deep navy zenith, sodium/magenta light pollution on the horizon,
// slow fbm clouds lit from below by the city, a moon with a soft halo.
import * as THREE from 'three';

export function makeNightSky(radius = 1200) {
  const uniforms = {
    time: { value: 0 },
    moonDir: { value: new THREE.Vector3(-30, 35, -40).normalize() },
    zenith: { value: new THREE.Color(0.006, 0.008, 0.022) },
    mid: { value: new THREE.Color(0.03, 0.022, 0.06) },
    horizon: { value: new THREE.Color(0.32, 0.12, 0.13) },
    glow: { value: new THREE.Color(0.85, 0.42, 0.22) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform float time; uniform vec3 moonDir, zenith, mid, horizon, glow; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        vec3 d = normalize(vDir); float h = max(d.y, -0.05);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
        col = mix(col, zenith, smoothstep(0.15, 0.75, h));
        col += glow * 0.35 * exp(-max(h,0.0) * 18.0);                         // sodium haze right on the horizon
        // clouds on a dome: project the view ray onto a plane above the city
        vec2 uv = d.xz / max(d.y + 0.08, 0.04) * 1.6 + vec2(time * 0.004, time * 0.0015);
        float c = smoothstep(0.48, 0.82, fbm(uv * 1.3));
        float under = exp(-max(h,0.0) * 4.0);                                  // undersides lit by the Strip, brighter low in the sky
        vec3 cloudCol = mix(vec3(0.05,0.04,0.07), glow * 0.55 + vec3(0.12,0.04,0.1), under);
        col = mix(col, cloudCol, c * smoothstep(0.0, 0.08, h) * 0.85);
        // moon + halo (dimmed where clouds pass in front)
        float md = dot(d, moonDir);
        float disc = smoothstep(0.99955, 0.99975, md);
        float crater = fbm(d.xy * 900.0) * 0.25;
        col += vec3(1.0,0.97,0.9) * disc * (1.4 - crater) * (1.0 - c * 0.8);
        col += vec3(0.6,0.65,0.8) * pow(max(md,0.0), 600.0) * 0.5 * (1.0 - c * 0.5);
        col += vec3(0.3,0.32,0.45) * pow(max(md,0.0), 40.0) * 0.06;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  mesh.userData.update = (t, camPos) => { uniforms.time.value = t; if (camPos) mesh.position.copy(camPos); };
  return mesh;
}

// Soft visible light shafts under street lamps (additive, no extra lights). Fades toward the ground
// and at the cone's silhouette so it reads as haze, not geometry.
export function lightShafts(points, height = 7.6, radius = 3.0, color = new THREE.Color(1.0, 0.7, 0.42)) {
  const geo = new THREE.ConeGeometry(radius, height, 24, 1, true); geo.translate(0, -height / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { color: { value: color }, strength: { value: 0.11 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = -position.y / ${height.toFixed(2)};
      vec4 wp = modelMatrix * instanceMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 color; uniform float strength; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float fall = (1.0 - vY) * (1.0 - vY) * smoothstep(0.0, 0.08, vY) + 0.05 * (1.0 - vY);
        gl_FragColor = vec4(color * strength * edge * fall, 1.0); }`,
  });
  const im = new THREE.InstancedMesh(geo, mat, points.length), o = new THREE.Object3D();
  points.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.frustumCulled = false; im.renderOrder = 5; return im;
}

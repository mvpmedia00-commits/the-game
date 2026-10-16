// Visual dressing only: no changes to missions, collision, economy or saves.
import * as THREE from 'three';

function surfaceTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const v = 120 + Math.sin(x * 1.71 + y * 3.17) * 25 + Math.cos(y * .31) * 12;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
  return t;
}

export const CinemaGrade = {
  uniforms: { tDiffuse: { value: null }, amount: { value: .65 }, aspect: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float amount; uniform float aspect; varying vec2 vUv;
    void main(){
      vec4 original=texture2D(tDiffuse,vUv); vec3 c=original.rgb;
      float l=dot(c,vec3(.2126,.7152,.0722));
      c=mix(vec3(l),c,1.04);
      float shadow=1.0-smoothstep(.02,.4,l);
      c+=vec3(-.002,.003,.009)*shadow*amount;
      vec2 p=(vUv-.5)*vec2(min(aspect,1.6),1.0);
      float vignette=1.0-smoothstep(.24,.92,dot(p,p))* .17*amount;
      gl_FragColor=vec4(max(c,vec3(0.0))*vignette,original.a);
    }`
};

export function buildVisuals(scene, district) {
  const dressing = new THREE.Group(); dressing.name = 'Street finish and atmosphere'; scene.add(dressing);
  const detail = surfaceTexture(); detail.repeat.set(5, 5);
  const puddleMat = new THREE.MeshPhysicalMaterial({color:0x15141e, roughness:.13, metalness:.28,
    clearcoat:1, clearcoatRoughness:.06, envMapIntensity:1.6, bumpMap:detail, bumpScale:.009});
  const puddles = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 36), puddleMat, 64);
  const o = new THREE.Object3D();
  for (let i=0;i<64;i++) {
    const z=-270+i*8.4, side=i%2 ? 1 : -1;
    o.position.set(side*(7.6+Math.sin(i*2.3)*.9), .027, z);
    o.rotation.set(-Math.PI/2,0,i*1.7);o.scale.set(.45+(i%5)*.21,1.5+(i%4)*.6,1);o.updateMatrix();puddles.setMatrixAt(i,o.matrix);
  }
  puddles.receiveShadow=true;dressing.add(puddles);
  // Curb drainage, studs and utility covers are instanced to keep draw calls low.
  const drainMat = new THREE.MeshStandardMaterial({color:0x26232b,roughness:.5,metalness:.75});
  const drain = new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.025,.9),drainMat,40);
  for(let i=0;i<40;i++){o.position.set(i%2?9.65:-9.65,.032,-270+i*13.7);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();drain.setMatrixAt(i,o.matrix);}dressing.add(drain);
  const slots=new THREE.InstancedMesh(new THREE.BoxGeometry(.38,.005,.035),new THREE.MeshStandardMaterial({color:0x060609,roughness:.9}),240);
  for(let i=0;i<40;i++)for(let k=0;k<6;k++){o.position.set(i%2?9.65:-9.65,.048,-270+i*13.7+(k-2.5)*.12);o.updateMatrix();slots.setMatrixAt(i*6+k,o.matrix);}dressing.add(slots);
  const studs=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.025,.2),new THREE.MeshStandardMaterial({color:0xffd88c,emissive:0xffb33b,emissiveIntensity:.35,roughness:.3,metalness:.55}),112);
  for(let i=0;i<112;i++){o.position.set(i%2?-.54:.54,.035,-285+Math.floor(i/2)*10.4);o.updateMatrix();studs.setMatrixAt(i,o.matrix);}dressing.add(studs);
  // Soft ground pools reinforce the practical neon lights without extra light sources.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const g=canvas.getContext('2d'),gradient=g.createRadialGradient(64,64,2,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.55)');gradient.addColorStop(.4,'rgba(255,255,255,.14)');gradient.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gradient;g.fillRect(0,0,128,128);
  const glow=new THREE.CanvasTexture(canvas);
  for(const [x,z,c] of [[12,-28,0xff2449],[12,30,0xff253d],[-19,-57,0xffc878],[-46,48,0x45d7ff],[12,-80,0xa55aff]]){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(9,12),new THREE.MeshBasicMaterial({map:glow,color:c,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.175,z);dressing.add(m);
  }
  // A real lighting rig that follows the protagonist: soft fill plus cool separation.
  const fill = new THREE.PointLight(0xffd9bf, 7, 9, 2), rim = new THREE.PointLight(0x92caff, 11, 8, 2);
  fill.name='Character warm fill';rim.name='Character cool rim';scene.add(fill,rim);
  const steam=[];
  for(const [x,z] of [[-9.1,-39],[9.1,42],[-9.1,112],[9.1,-130]]){
    const material=new THREE.SpriteMaterial({map:glow,color:0xa4b4cb,transparent:true,opacity:.045,depthWrite:false});
    for(let i=0;i<4;i++){const sprite=new THREE.Sprite(material.clone());sprite.position.set(x,.4+i*.5,z);sprite.scale.set(1.2+i*.35,1.3+i*.3,1);dressing.add(sprite);steam.push({sprite,x,z,phase:i*.8});}
  }
  const key=new THREE.Vector3(),back=new THREE.Vector3();
  return {
    setQuality(mode){dressing.visible=true;puddles.visible=true;steam.forEach(s=>s.sprite.visible=mode==='cinematic');fill.visible=rim.visible=mode!=='performance';},
    update(t,player,camera,active,reducedMotion){
      fill.visible=rim.visible=active&&this.mode!=='performance';
      key.set(Math.cos(camera)*1.8,2.7,-Math.sin(camera)*1.8);back.set(-Math.sin(camera)*2,2.8,-Math.cos(camera)*2);
      fill.position.set(player.x+key.x,key.y,player.z+key.z);rim.position.set(player.x+back.x,back.y,player.z+back.z);
      if(!reducedMotion)for(const s of steam){const phase=(t*.18+s.phase)%2;s.sprite.position.set(s.x+Math.sin(t*.3+s.phase)*.2,.3+phase,s.z);s.sprite.material.opacity=Math.sin(phase*Math.PI/2)*.055;}
    },
    mode:'balanced',dressing,puddles,fill,rim
  };
}

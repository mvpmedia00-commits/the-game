// Authored Velvet Room architecture. All detail stays behind/above existing walking routes.
import * as THREE from 'three';
import { mat, neon, signMesh, canvasTex } from '../../hd-demo/lib/characters.js';
import { applySurface } from './materials.js';
const mesh = (parent, geometry, material, x=0,y=0,z=0) => {
  const m = new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
};
const box=(p,m,x,y,z,w,h,d)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
function batch(parent, geometry, material, entries) {
  const im=new THREE.InstancedMesh(geometry,material,entries.length),o=new THREE.Object3D();
  entries.forEach(([x,y,z,sx=1,sy=1,sz=1],i)=>{o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.castShadow=im.receiveShadow=true;parent.add(im);return im;
}
function archShape(cx,width,height,bottom=0) {
  const s=new THREE.Shape(),r=width/2,shoulder=height-r;
  s.moveTo(cx-r,bottom);s.lineTo(cx+r,bottom);s.lineTo(cx+r,shoulder);s.absarc(cx,shoulder,r,0,Math.PI,false);s.lineTo(cx-r,bottom);return s;
}
export function buildVelvetExterior(parent) {
  const root=new THREE.Group();root.name='Velvet Room • Art Deco entrance';root.position.set(14.78,.16,-29);root.rotation.y=-Math.PI/2;parent.add(root);
  const stone=applySurface(new THREE.MeshStandardMaterial({color:0x36333b,roughness:.78}), 'concrete_floor_02',.3,.3,.4);
  const dark=mat('#13131c',.4,.35),gold=mat('#bf9653',.28,.85),burgundy=mat('#480c21',.6),glass=new THREE.MeshPhysicalMaterial({color:0x181221,roughness:.12,metalness:.35,clearcoat:1,clearcoatRoughness:.08});
  // Facade with a real opening; the original world entrance interaction stays in place.
  const wall=new THREE.Shape();wall.moveTo(-15,0);wall.lineTo(15,0);wall.lineTo(15,11.5);wall.lineTo(-15,11.5);wall.closePath();
  const hole=new THREE.Path();hole.moveTo(.35,0);hole.lineTo(.35,3.6);hole.lineTo(3.65,3.6);hole.lineTo(3.65,0);hole.closePath();wall.holes.push(hole);
  mesh(root,new THREE.ExtrudeGeometry(wall,{depth:.28,bevelEnabled:false}),stone,0,0,-.32);
  for(const x of [-14.5,-9,-4,8,13.8]){box(root,dark,x,5.6,.16,.78,11.2,.45);box(root,gold,x-.29,5.6,.41,.045,11.2,.045);box(root,gold,x+.29,5.6,.41,.045,11.2,.045);}
  for(const y of [.3,4.6,9.9,11.35])box(root,gold,0,y,.24,30,.1,.18);
  // Raised arched portal and inset jambs.
  const outer=archShape(2,5.3,6),inner=new THREE.Path();inner.moveTo(.35,0);inner.lineTo(.35,3.6);inner.lineTo(3.65,3.6);inner.lineTo(3.65,0);inner.closePath();outer.holes.push(inner);
  mesh(root,new THREE.ExtrudeGeometry(outer,{depth:.36,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2}),burgundy,0,0,.02);
  for(const x of [.23,3.77])box(root,gold,x,1.8,.43,.09,3.6,.09);
  box(root,gold,2,3.62,.43,3.65,.09,.09);
  // Doors animate visually as the player approaches; there are no new blockers.
  const doors=[];
  for(const side of [-1,1]){
    const door=new THREE.Group();door.userData.dynamic=true;door.position.set(2+side*.805,0,-.03);root.add(door); // slides open: keep out of the static batches
    box(door,glass,0,1.75,0,1.57,3.5,.09);
    for(const x of [-.76,.76])box(door,gold,x,1.75,.08,.045,3.5,.055);
    box(door,gold,0,.08,.08,1.57,.09,.055);box(door,gold,0,3.46,.08,1.57,.09,.055);
    box(door,gold,-side*.52,1.55,.16,.04,.8,.07);doors.push({door,side});
  }
  box(root,mat('#120511',.85),2,1.8,-.28,3.25,3.6,.04);
  const welcome=signMesh('VELVET', '#ffd294',2.8,.45);welcome.position.set(2,2.7,-.2);root.add(welcome);
  // Cantilevered marquee, stepped fascia, and instanced warm bulbs.
  box(root,dark,2,4.38,1.05,8.8,.56,2.9);
  box(root,gold,2,4.09,1.05,9,.045,3.05);box(root,gold,2,4.7,1.05,8.65,.055,2.85);
  const bulbs=[];for(let x=-2.1;x<=6.1;x+=.46)for(const z of [-.2,2.4])bulbs.push([x,4.06,z]);
  batch(root,new THREE.SphereGeometry(.055,8,6),neon('#ffdc9c',3),bulbs);
  const title=signMesh('THE VELVET ROOM','#ffd59c',13,1.45);title.position.set(1,7.1,.55);root.add(title);
  const sub=signMesh('LIVE • AFTER HOURS','#f66482',7,.5);sub.position.set(1,5.65,.55);root.add(sub);
  const strips=[];
  for(const x of [-13,-11,-7,-5,9.5,11.5]){
    box(root,glass,x,2.2,.05,1.35,3.2,.08);
    for(const dx of [-.68,.68])strips.push([x+dx,2.2,.16,.035,3.3,.045]);
    strips.push([x,2.2,.17,1.36,.03,.045]);
  }
  batch(root,new THREE.BoxGeometry(1,1,1),gold,strips);
  const poster=canvasTex(256,512,g=>{const grad=g.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#52112a');grad.addColorStop(1,'#100b17');g.fillStyle=grad;g.fillRect(0,0,256,512);g.strokeStyle='#c69a56';g.lineWidth=3;g.strokeRect(12,12,232,488);g.textAlign='center';g.fillStyle='#f3d6ac';g.font='28px Georgia';g.fillText('RUBY',128,115);g.fillText('MONROE',128,155);g.font='14px sans-serif';g.fillText('MIDNIGHT RESIDENCY',128,365);g.fillText('THE VELVET ROOM',128,425);g.beginPath();g.arc(128,250,46,0,Math.PI*2);g.stroke();});
  for(const x of [-7,9.5]){box(root,gold,x,2.1,.23,1.36,2.6,.08);mesh(root,new THREE.PlaneGeometry(1.24,2.48),new THREE.MeshBasicMaterial({map:poster}),x,2.1,.281);}
  const sconces=[];for(const x of [-4,8]){box(root,gold,x,3.1,.55,.18,.9,.22);box(root,neon('#ffe0ae',2),x,3.1,.68,.1,.65,.06);sconces.push([x,3.1,.68]);}
  const entryLight=new THREE.PointLight(0xffcb96,35,9,2);entryLight.position.set(2,3.7,1.5);root.add(entryLight);
  const lintelLight=new THREE.PointLight(0xff355f,14,7,2);lintelLight.position.set(2,2.5,-.08);root.add(lintelLight);
  const windowPanels=[];
  for(const x of [-11.5,-6.5,8.8,12]){
    box(root,dark,x,8.1,.2,2.1,2.8,.28);box(root,glass,x,8.1,.36,1.85,2.55,.05);
    for(const dx of [-.98,0,.98])box(root,gold,x+dx,8.1,.42,.04,2.65,.04);
    box(root,mat('#342c37',.7),x,6.65,.43,2.3,.14,.7);windowPanels.push(x);
  }
  root.updateMatrixWorld(true);
  return {root,doors,update(t,player){if(!player)return;const distance=Math.hypot(player.x-13.1,player.z+27);const open=distance<4?Math.min(1,(4-distance)/1.8):0;for(const {door,side} of doors)door.position.x=2+side*(.805+open*.8);}};
}

export function dressVelvetInterior(scene) {
  const root=new THREE.Group();root.name='Velvet Room • interior finish';scene.add(root);
  const bronze=mat('#b38a50',.3,.8),black=mat('#111019',.45,.35),upholstery=new THREE.MeshPhysicalMaterial({color:0x511026,roughness:.85,sheen:.8,sheenColor:new THREE.Color('#8b2840'),sheenRoughness:.9});
  // Coffered ceiling, wall panelling and inset linear lighting.
  const bars=[];for(const x of [-12,-8,-4,0,4,8,12])bars.push([x,7.82,0,.14,.22,29]);
  for(const z of [-14,-10,-6,-2,2,6,10,14])bars.push([0,7.82,z,25,.22,.12]);batch(root,new THREE.BoxGeometry(1,1,1),black,bars);
  const trims=[];for(const side of [-1,1])for(let z=-13;z<=13;z+=3.25){trims.push([side*12.92,2.1,z,.04,3.8,.035]);trims.push([side*12.9,.35,z,.045,.045,3.2]);}
  batch(root,new THREE.BoxGeometry(1,1,1),bronze,trims);
  // Deco fan behind the stage: stepped gold rays, all above the performer.
  const rays=[];for(let i=0;i<17;i++){const theta=(-.8+i*.1),len=2.3+(1-Math.abs(i-8)/8)*1.3;const m=mesh(root,new THREE.BoxGeometry(.035,len,.06),bronze,Math.sin(theta)*2.3,4.5+Math.cos(theta)*1.4,-10.48);m.rotation.z=-theta;rays.push(m);}
  for(const x of [-6.2,6.2]){
    box(root,black,x,3.5,-10.5,.65,7,.7);box(root,bronze,x-.25,3.5,-10.12,.03,7,.03);box(root,bronze,x+.25,3.5,-10.12,.03,7,.03);
    box(root,neon('#ff657a',2),x,3.7,-10.09,.08,5,.04);
  }
  // Upholstered booth inserts, seam buttons, and polished table rims inside existing collision volumes.
  const buttons=[];
  for(const z of [-2,3,8]){
    for(let j=0;j<5;j++){
      const cushion=mesh(root,new THREE.CapsuleGeometry(.23,.5,4,12),upholstery,-11.2,.55,z-1.2+j*.6);cushion.rotation.x=Math.PI/2;cushion.scale.set(1.6,.65,.6);
      buttons.push([-11.67,.85,z-1.2+j*.6,.035,.035,.035]);
    }
    const rim=mesh(root,new THREE.TorusGeometry(.49,.014,8,40),bronze,-9.8,.76,z);rim.rotation.x=Math.PI/2;
  }
  batch(root,new THREE.SphereGeometry(1,8,6),bronze,buttons);
  // Warm pendant fixtures; luminous meshes share the existing bar and stage illumination.
  for(const z of [-2,3,8]){
    mesh(root,new THREE.CylinderGeometry(.007,.007,2.9,6),black,-8.6,6.35,z);
    mesh(root,new THREE.ConeGeometry(.35,.4,24,1,true),bronze,-8.6,4.7,z);
    mesh(root,new THREE.SphereGeometry(.095,12,8),neon('#ffddab',2),-8.6,4.5,z);
  }
  // Glassware adds highlights along the bar without blocking movement.
  const glass=new THREE.MeshPhysicalMaterial({color:0xc3b8b4,roughness:.07,metalness:.15,transparent:true,opacity:.38,clearcoat:1});
  for(let z=-3;z<=7;z+=2){mesh(root,new THREE.CylinderGeometry(.06,.04,.18,12,1,true),glass,10.1,1.26,z);mesh(root,new THREE.CylinderGeometry(.075,.075,.012,12),bronze,10.1,1.17,z);}
  return root;
}

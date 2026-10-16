// Node geometry/material smoke test. Requires THREE_MODULE (three r160 ESM file) and CANVAS_MODULE (@napi-rs/canvas).
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const {createCanvas}=require(process.env.CANVAS_MODULE);
 global.document={createElement:tag=>{assert.equal(tag,'canvas');return createCanvas(1,1)}};
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mvp-graphics-'));
 try{
  fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  const project=path.join(__dirname,'..');const root=fs.existsSync(path.join(project,'dist/world'))?path.join(project,'dist'):project;
  const files=['hd-demo/lib/characters.js','world/lib/district.js','world/lib/npcs.js','world/lib/club.js','world/lib/visuals.js','world/lib/story.js','world/lib/materials.js','world/lib/venue.js'];
  for(const f of files){const dest=path.join(tmp,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,fs.readFileSync(path.join(root,f),'utf8').replaceAll("from 'three'",`from '${pathToFileURL(process.env.THREE_MODULE).href}'`));}
  const THREE=await import(pathToFileURL(process.env.THREE_MODULE));
  const C=await import(pathToFileURL(path.join(tmp,files[0])));
  const {buildDistrict}=await import(pathToFileURL(path.join(tmp,files[1])));
  const {buildClub}=await import(pathToFileURL(path.join(tmp,files[3])));
  const {buildVisuals}=await import(pathToFileURL(path.join(tmp,files[4])));
  const {STORY}=await import(pathToFileURL(path.join(tmp,files[5])));
  const world=new THREE.Scene(),district=buildDistrict(world),club=new THREE.Scene();const clubInfo=buildClub(club);
  const originalDoor=district.pois.find(p=>p.id==='velvet'); assert(originalDoor);assert(Math.abs(originalDoor.x-12.78)<.001);assert(Math.abs(originalDoor.z+25.6)<.001);assert(!district.colliders.some(c=>originalDoor.x>c.minX-.38&&originalDoor.x<c.maxX+.38&&originalDoor.z>c.minZ-.38&&originalDoor.z<c.maxZ+.38),'entrance must stay reachable');
  const venue=world.getObjectByName('Velvet Room • Art Deco entrance');assert(venue);
  assert(club.getObjectByName('Velvet Room • interior finish'));
  district.update(1,{x:13.1,z:-27});district.update(2,{x:11,z:30});clubInfo.update(1);
  const mvp=C.makeHero(C.MVP_LOOK),ruby=C.makeHero(C.TALENT.ruby.look);world.add(mvp.root,ruby.root);
  const visuals=buildVisuals(world,district);
  for(const mode of ['performance','balanced','cinematic']){visuals.mode=mode;visuals.setQuality(mode);visuals.update(1,{x:11,z:30},1,true,false);assert(Number.isFinite(visuals.fill.position.x));}
  visuals.update(1,{x:11,z:30},1,false,false);assert.equal(visuals.fill.visible,false);
  let meshes=0,vertices=0,physical=0;
  for(const scene of [world,club]) scene.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes.position;if(a){vertices+=a.count;for(const v of a.array)assert(Number.isFinite(v),'nonfinite geometry');}for(const m of [].concat(o.material)){if(m.isMeshPhysicalMaterial)physical++;}}});
  assert.equal(STORY.length,8);assert.equal(STORY[0].steps[2].shots,4);assert.equal(STORY[7].steps[2].t,'chase');assert(physical>10);assert.equal(visuals.puddles.count,64);
  console.log(JSON.stringify({pass:true,meshes,vertices,physicalMaterialUses:physical,storyMissions:STORY.length,streetPuddles:64}));
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exit(1)});

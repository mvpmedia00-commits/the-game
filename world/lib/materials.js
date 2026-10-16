import * as THREE from 'three';
const textureCache = new Map();
// Local, versioned CC0 maps. Existing procedural materials remain usable if an image fails.
export function applySurface(material, asset, repeatX, repeatY, normalStrength = .5) {
  if (typeof document.createElementNS !== 'function') return material; // headless geometry tools
  const loader = new THREE.TextureLoader();
  const fields = [['color','map'], ['normal','normalMap'], ['roughness','roughnessMap']];
  for (const [suffix,field] of fields) {
    const key = `${asset}/${suffix}/${repeatX}/${repeatY}`;
    let texture = textureCache.get(key);
    if (!texture) {
      const url = new URL(`../../assets/materials/${asset}_${suffix}.jpg`, import.meta.url).href;
      texture = loader.load(url, () => { material.needsUpdate = true; }, undefined, () => console.warn(`Surface image unavailable: ${asset} ${suffix}`));
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = suffix === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4; textureCache.set(key, texture);
    }
    material[field] = texture;
  }
  material.normalScale = new THREE.Vector2(normalStrength, normalStrength);
  material.bumpMap = null;
  return material;
}

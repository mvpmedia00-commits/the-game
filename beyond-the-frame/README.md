# MVP: Beyond the Frame (browser prototype)

3D open-world RPG (Three.js r128) in a fictional, after-hours Las Vegas. You play Matthew "MVP" Phillips, a photographer building MVP Media from room 12 at the Desert Rose Motel into the biggest studio in town.

Open `index.html` in Chrome or iPhone Safari (WebGL required; Three.js loads from cdnjs and its post-processing passes from jsDelivr). One file, no install. Progress saves in the browser.

**Rating intent:** mature themes (nightlife, clubs, adult-film production as a business) with no explicit content. Productions cut to "That's a wrap." Every talent character is a named adult professional under a paid contract.

## What's in it
- 2026 render pipeline: HDR bloom on neon, filmic tone mapping and grade, image-based reflections, wet streets, clearcoat car paint (Settings > Graphics switches to a fast mode)
- Detailed hero models of MVP (braids, beard, beret, red suit with MVP buckle, DSLR) and Ruby (curly red afro, beret, hoops, MVP bandeau, tulle tutu, tattoos, red-sole heels), posed on a 3D MVP Studios set on the title screen
- Jointed 3D characters built in code: MVP (red suit, beret, camera), the talent, story contacts and pedestrians, with walk cycles and 7 photo poses
- Third-person camera on foot (mouse look) and a chase camera in the car
- Drivable 3D city (lit windows, neon trim, Crown Casino searchlights): traffic AI that follows lanes and turns at intersections, pedestrians who dodge, a desert road out to Red Rock Overlook, a minimap and an edge arrow pointing to your objective
- 8 story missions: club promo shoot, timed delivery, car chases (ram to stop), buying the studio, a first feature, bootleggers, and a red-carpet finale
- **Photo shoot minigame on 3D sets** (club stage, lounge, boneyard, rooftop, motel pool, desert, red carpet, studio): aim and zoom a real lens, frame the face on a thirds point, wait for the pose, fire in the focus window. Scored A+ to D, with a contact sheet built from real captures of your frames
- **Film production:** cast up to 2 signed performers, pick a set and crew budget, make 3 director's calls; release for opening sales plus daily royalties
- Talent roster with signing requirements, a gig board for repeatable shoots, and gear upgrades (gimbal, lens, lighting, engine)

## Controls
Mouse look · WASD walk/drive · F car · E interact · Space handbrake · Shift run · Esc pause · mouse + click in photo shoots

## Path to Steam
For the Steam build, swap the code-built characters for rigged models (Blender or Mixamo, exported as glTF) using the same joint names and poses.
Port to Godot 4 (2D) + GodotSteam: `STORY`, `TALENT`, `GEAR` and `SETS` tables become Resources, the save object becomes `user://` + Steam Cloud, and the shoot/production screens become their own scenes. Steam allows mature content, but it must be declared accurately in the store page's Content Survey.

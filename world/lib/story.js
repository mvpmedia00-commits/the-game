// Story, gigs, gear and studio production for the HD world (ported from Beyond the Frame).
// Step types: goto {to, time?} · enter {scene} · shoot {scene, subjects, shots} · chase {hp, speed, color, spawn} · buy {cost} · produce
export const STORY = [
  { id: 'velvet', title: 'Velvet Hours', giver: 'phone', who: 'Tony Velvet',
    intro: [['Tony Velvet', 'MVP! Tony Velvet, from the Velvet Room. My headliner goes on in ten minutes and I need new marquee shots tonight.'], ['Tony Velvet', 'Ruby asked for you by name. Get in here and shoot her set.'], ['MVP', 'On my way.']],
    steps: [{ t: 'goto', to: 'velvet', text: 'Go to The Velvet Room' }, { t: 'enter', scene: 'club', text: 'Head inside The Velvet Room' }, { t: 'shoot', scene: 'club', subjects: ['ruby'], shots: 4, text: "Shoot Ruby's headliner set (4 photos)" }],
    reward: { cash: 900, rep: 8, sign: 'ruby' },
    outro: [['Ruby Monroe', 'Okay. Those are the best photos anyone has taken of me. You ever think about running your own studio?'], ['MVP', 'Every night.'], ['Ruby Monroe', 'When you do, call me first.']] },
  { id: 'proof', title: 'Proof Run', giver: 'tony', who: 'Tony Velvet',
    intro: [['Tony Velvet', 'Vegas Nightlife Weekly wants your proofs for the cover. Their editor is at the Crown Casino entrance and she leaves in 75 seconds.'], ['MVP', 'Then I am driving.']],
    steps: [{ t: 'goto', to: 'editor', time: 75, text: 'Rush the proofs to the editor at Crown Casino' }],
    reward: { cash: 600, rep: 6 }, outro: [['Editor', 'Cover-ready. Put MVP Media on the credit line.']] },
  { id: 'snatch', title: 'Snatch & Grab', giver: 'editor', who: 'Editor',
    intro: [['Editor', 'One of the Neon Kings paparazzi just lifted your card wallet off the valet stand. Black coupe, heading down the boulevard.'], ['MVP', 'My clients are on those cards. He is not getting far.']],
    steps: [{ t: 'chase', hp: 100, speed: 21, color: '#16161c', spawn: { x: -3.2, z: -40, from: 'N', to: 'C' }, text: 'Ram the Neon Kings coupe and get the cards back' }],
    reward: { cash: 1000, rep: 10 }, outro: [['MVP', 'Cards are back. Somebody tell Silas Crane his boys need driving lessons.']] },
  { id: 'golden', title: 'Pool Party Cover', giver: 'dee', who: 'Dee at Lens & Light',
    intro: [['Dee', 'A swimwear brand needs a cover at the Desert Rose pool. Nova Starr is already there and the brand rep leaves in two minutes.'], ['Dee', 'Grab the shot and the job is yours.']],
    steps: [{ t: 'goto', to: 'poolspot', time: 120, text: 'Get to the Desert Rose pool' }, { t: 'shoot', scene: 'world', subjects: ['nova'], shots: 5, text: 'Shoot the cover with Nova (5 photos)' }],
    reward: { cash: 1500, rep: 10, sign: 'nova' }, outro: [['Nova Starr', 'You made a motel pool look like Monaco. If you open a studio, put me on the board.']] },
  { id: 'keys', title: 'Keys to the Kingdom', giver: 'landlord', who: 'Your landlord',
    intro: [['Landlord', 'The old soundstage across the boulevard is for sale. $3,500 cash. Better than shooting in room 12.'], ['MVP', 'MVP Studios. I like the sound of that.']],
    steps: [{ t: 'buy', cost: 3500, text: 'Buy the soundstage at MVP Studios ($3,500)' }],
    reward: { cash: 0, rep: 10 }, outro: [['MVP', 'Red lights over the door. My name on the wall. Time to make something.']] },
  { id: 'feature', title: 'First Feature', giver: 'jade', who: 'Jade Rivers',
    intro: [['Jade Rivers', 'Heard you bought the old stage. I have directed twenty features. Let us see if you can run a set.'], ['Jade Rivers', 'My rules: IDs checked, contracts signed before cameras roll, an intimacy coordinator on call, and nobody works for free.'], ['MVP', 'Those are my rules too.']],
    steps: [{ t: 'enter', scene: 'studio', text: 'Go inside MVP Studios' }, { t: 'produce', text: 'Produce your first film (talk to Jade on set)' }],
    reward: { cash: 0, rep: 12, sign: 'jade' }, outro: [['Jade Rivers', 'Clean set, happy talent, good footage. You will do fine in this town.']] },
  { id: 'bootleg', title: 'Bootleg Boulevard', giver: 'coco', who: 'Coco Bellamy',
    intro: [['Coco Bellamy', 'Sugar, your film is selling on burned discs out of a van on Fremont. Silas Crane is pirating you.'], ['MVP', 'He is stealing from my talent. That stops tonight.']],
    steps: [{ t: 'chase', hp: 140, speed: 22, color: '#4a3a5a', spawn: { x: 120, z: -4, from: 'E', to: 'C' }, text: 'Stop the bootleg van' }],
    reward: { cash: 2500, rep: 12, sign: 'coco' }, outro: [['Coco Bellamy', 'Van is busted, discs are in the trash. The whole Lounge is talking about you.']] },
  { id: 'finale', title: 'Beyond the Frame', giver: 'ruby2', who: 'Ruby Monroe',
    intro: [['Ruby Monroe', 'The premiere is at Crown Casino tonight. Red carpet, press, everyone. You are shooting it, boss.'], ['Jade Rivers', 'And Silas Crane bought a ticket. Watch him.']],
    steps: [{ t: 'goto', to: 'carpet', time: 90, text: 'Get to the premiere at Crown Casino' }, { t: 'shoot', scene: 'world', subjects: ['ruby', 'nova', 'jade'], shots: 6, text: 'Shoot the red carpet (6 photos)' },
      { t: 'chase', hp: 180, speed: 24, color: '#d8d8e0', spawn: { x: -3.2, z: -70, from: 'N', to: 'C' }, text: 'Silas grabbed the master drive. Stop his car!' }],
    reward: { cash: 5000, rep: 20 },
    outro: [['Silas Crane', 'Fine. Keep your drive. This town is yours, Phillips.'], ['Ruby Monroe', 'From room 12 at the Desert Rose to the biggest studio in Vegas.'], ['MVP', 'And we are just getting started.']] },
];
// where givers stand (matches district NPC spots)
export const GIVER_SPOT = { tony: 'tony', editor: 'editor', dee: 'dee', landlord: 'landlord', jade: 'jade', coco: 'coco', ruby2: 'jade2' };
export const NPC_LOOKS = {
  tony: { fem: false, skin: '#c48a64', color: '#4a1a5a', bottom: '#1a1a22', outfit: 'suit', hair: 'short', hairC: '#1a1210' },
  editor: { skin: '#e0b090', color: '#5a5a66', bottom: '#2a2a32', outfit: 'casual', hair: 'bob', hairC: '#3a2014' },
  dee: { skin: '#8a5636', color: '#1fa3a0', bottom: '#2a3a5a', outfit: 'casual', hair: 'bun', hairC: '#120a08' },
  landlord: { fem: false, skin: '#d8a882', color: '#6a5a40', bottom: '#3a3228', outfit: 'casual', hair: 'short', hairC: '#888888' },
  bouncer: { fem: false, skin: '#3a2216', color: '#121214', bottom: '#121214', outfit: 'suit', hair: 'short', beard: true, scale: 1.12 },
};
export const FREELANCE = ['Tasha', 'Monique', 'Valentina', 'Brielle', 'Kenya', 'Dani', 'Mariah', 'Simone'];
export const FREE_LOOKS = [
  { skin: '#6a3e2a', hair: 'afro', hairC: '#1a0e0a', outfit: 'dress', color: '#ff2a4a' }, { skin: '#d8a882', hair: 'long', hairC: '#6a3018', outfit: 'gown', color: '#9b6bff' },
  { skin: '#8a5636', hair: 'bun', hairC: '#120a08', outfit: 'jump', color: '#ffcc33' }, { skin: '#b07a52', hair: 'bob', hairC: '#3a2014', outfit: 'dress', color: '#3ad7ff' },
];
export const GIG_SPOTS = [
  { at: 'poolspot', label: 'Poolside lookbook', place: 'Desert Rose pool' }, { at: 'carpet', label: 'Casino glamour', place: 'Crown Casino forecourt' },
  { at: 'billboard', label: 'Neon street editorial', place: 'Under the MVP billboard' }, { at: 'chapel', label: 'Chapel of Love bridal', place: 'Chapel of Love' },
];
export const GEAR = [
  { id: 'stab', name: 'Gimbal Stabilizer', desc: '+4 photo score', base: 400, max: 3 },
  { id: 'lens', name: 'Fast Prime Lens', desc: '+4 photo score', base: 500, max: 3 },
  { id: 'light', name: 'Lighting Kit', desc: '+ photo and film quality', base: 600, max: 3 },
  { id: 'ride', name: 'Engine Tune', desc: '+ top speed', base: 700, max: 2 },
];
export const SETS = { stage: { name: 'Stage A', cost: 0, q: 6 }, pool: { name: 'Desert Rose pool', cost: 200, q: 9 }, club: { name: 'Velvet Room after hours', cost: 400, q: 12 }, pent: { name: 'Crown penthouse', cost: 600, q: 15 } };
export const BUDGET = [{ name: 'Lean', cost: 0, m: 0.9 }, { name: 'Standard', cost: 800, m: 1.1 }, { name: 'Premium', cost: 2000, m: 1.35 }];
export const CALLS = [['light', 'Lighting', ['warm', 'cool', 'neon']], ['mood', 'Mood', ['playful', 'romantic', 'dramatic']], ['cam', 'Camera', ['handheld', 'dolly', 'locked-off']]];
export const FILM_TITLES = ['Neon Confessions', 'After Hours', 'Red Room', 'Desert Heat', 'Velvet Rope', 'High Roller', 'Last Call', 'Room 12', 'Midnight on Fremont', 'Double Down'];

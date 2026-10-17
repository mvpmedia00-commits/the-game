// Story, gigs, gear and studio production for the HD world: "The Underground Cut".
// Step types: goto {to, time?} · enter {scene} · shoot {scene, subjects, shots} · chase {hp, speed, color, spawn} · buy {cost} · produce · choice {c}
// choice: the player picks one option. fx changes cash, rep (Respect), street (Street cred) and loyal (per performer);
// end: true finishes the mission there with no reward. A mission's own `choice` comes after its outro.
export const STORY = [
  { id: 'velvet', title: 'Velvet Hours', giver: 'phone', who: 'Tony Velvet',
    intro: [['Tony Velvet', 'MVP! Tony Velvet. My headliner goes on in ten minutes and the marquee looks like shit. I need new shots tonight.'], ['Tony Velvet', 'Ruby asked for you by name. Do not make me regret it.'], ['MVP', 'On my way.']],
    steps: [{ t: 'goto', to: 'velvet', text: 'Go to The Velvet Room' }, { t: 'enter', scene: 'club', text: 'Head inside The Velvet Room' }, { t: 'shoot', scene: 'club', subjects: ['ruby'], shots: 4, text: "Shoot Ruby's headliner set (4 photos)" }],
    reward: { cash: 900, rep: 8, sign: 'ruby' },
    outro: [['Ruby Monroe', 'Not bad, camera guy. You actually waited for the shot instead of spraying and praying.'], ['MVP', 'You made me earn it.'], ['Ruby Monroe', 'I make everybody earn it. When you open your own place, call me first. I know exactly what I am worth.']],
    choice: { id: 'velvet', title: 'Who owns the shots?', text: 'Tony wants the raw files and every right to them, forever, for an extra $400. Ruby is in every frame.', options: [
      { id: 'license', label: 'License the marquee shots. Keep the rights.', fx: { rep: 3, loyal: { ruby: 10 } }, reply: [['Tony Velvet', 'Marquee only. You drive a hard bargain for a kid with a borrowed lens.'], ['Ruby Monroe', 'Keeping your masters? Smart. I like smart.']] },
      { id: 'sell', label: 'Sell him everything', small: '+$400', fx: { cash: 400, rep: -2, loyal: { ruby: -10 } }, reply: [['Tony Velvet', 'Pleasure doing business.'], ['Ruby Monroe', 'Those were my photos too, camera guy. Remember that.']] }] } },
  { id: 'proof', title: 'Proof Run', giver: 'tony', who: 'Tony Velvet',
    intro: [['Tony Velvet', 'Vegas Nightlife Weekly wants your proofs for the cover. Their editor is at the Crown entrance and she walks in 75 seconds.'], ['MVP', 'Then I am driving.']],
    steps: [{ t: 'goto', to: 'editor', time: 75, text: 'Rush the proofs to the editor at Crown Casino' }],
    reward: { cash: 600, rep: 6 }, outro: [['Editor', 'Cover-ready. Put MVP Media on the credit line. Your name is on something now.']],
    choice: { id: 'proof', title: 'The crop', text: 'The editor wants to run a crop of Ruby that makes it look like a wardrobe slip. "Sells twice the copies. I will pay you $500 extra."', options: [
      { id: 'clean', label: 'No. Run the cover as shot.', fx: { rep: 4, loyal: { ruby: 10 } }, reply: [['Editor', 'Principles. Cute. Fine, we run it clean.'], ['MVP', 'My talent, my frame.']] },
      { id: 'crop', label: 'Run the crop', small: '+$500', fx: { cash: 500, rep: -6, loyal: { ruby: -20 } }, reply: [['Editor', 'Now you are thinking like a publisher.'], ['MVP', 'Ruby is going to see this.']] }] } },
  { id: 'snatch', title: 'Snatch & Grab', giver: 'editor', who: 'Editor',
    intro: [['Editor', 'One of Silas Crane\'s Neon Kings just lifted your card wallet off the valet stand. Black coupe, heading down the boulevard.'], ['MVP', 'Every client I have is on those cards. He is not getting far.']],
    steps: [{ t: 'chase', hp: 100, speed: 21, color: '#16161c', spawn: { x: -3.2, z: -40, from: 'N', to: 'C' }, text: 'Ram the Neon Kings coupe and get the cards back' }],
    reward: { cash: 1000, rep: 10, street: 6 }, outro: [['MVP', 'Cards are back. Somebody tell Silas his boys need driving lessons.']],
    choice: { id: 'snatch', title: 'The driver', text: 'The Neon Kings driver is shaking in the wreck. "Silas makes us do it, man. Please."', options: [
      { id: 'message', label: 'Let him go with a message for Silas', fx: { street: 8 }, reply: [['MVP', 'Tell Silas the next one walks home.'], ['Driver', 'Yeah. Yeah, I will tell him.']] },
      { id: 'police', label: 'Hand him to the police', fx: { rep: 5, street: -4 }, reply: [['MVP', 'Officer, he is all yours.'], ['Driver', 'Silas is gonna remember this, Phillips.']] },
      { id: 'shake', label: 'Shake him down', small: '+$300', fx: { cash: 300, street: 4, rep: -4 }, reply: [['MVP', 'Wallet. Now. Call it a late fee.']] }] } },
  { id: 'golden', title: 'Pool Party Cover', giver: 'dee', who: 'Dee at Lens & Light',
    intro: [['Dee', 'Swimwear brand needs a cover at the Desert Rose pool. Nova Starr is already poolside and the brand rep leaves in two minutes.'], ['Dee', 'Nail it and your byline is on a cover. Miss it and you are back to shooting bar mitzvahs.']],
    steps: [{ t: 'goto', to: 'poolspot', time: 120, text: 'Get to the Desert Rose pool' }, { t: 'shoot', scene: 'world', subjects: ['nova'], shots: 5, text: 'Shoot the cover with Nova (5 photos)' }],
    reward: { cash: 1500, rep: 10, sign: 'nova' }, outro: [['Nova Starr', 'The camera loves me. You just proved you know how to listen to it.'], ['Nova Starr', 'Get yourself a real room and put me on the board.']],
    choice: { id: 'golden', title: 'The retouch', text: 'The brand rep wants to reshape Nova\'s body in post without asking her. "Nobody looks like that anyway."', options: [
      { id: 'back', label: 'Back Nova: no edits without her sign-off', small: '-$300 from your fee', fx: { cash: -300, rep: 3, loyal: { nova: 15 } }, reply: [['Nova Starr', 'You told a client no. For me.'], ['Brand rep', 'Fine. We run them as shot, and we pay less.']] },
      { id: 'brand', label: 'Give the brand what it wants', small: '+$300', fx: { cash: 300, loyal: { nova: -15 } }, reply: [['Nova Starr', 'I saw the proofs. That is not my body, MVP.']] }] } },
  { id: 'keys', title: 'Keys to the Kingdom', giver: 'landlord', who: 'Your landlord',
    intro: [['Landlord', 'That dead soundstage across the boulevard is for sale. $3,500 cash and it is yours. Beats shooting out of room 12.'], ['MVP', 'A room is where films get made. MVP Studios.']],
    steps: [{ t: 'buy', cost: 3500, text: 'Buy the soundstage at MVP Studios ($3,500)' }],
    reward: { cash: 0, rep: 10 }, outro: [['MVP', 'Red light over the door. My name on the wall. Time to stop renting myself out.']],
    choice: { id: 'keys', title: 'The old crew', text: 'Three grips from the last owner are still sleeping in the soundstage. They want jobs.', options: [
      { id: 'hire', label: 'Hire them on', small: '-$300', fx: { cash: -300, rep: 3, street: 2 }, reply: [['Grip', 'You will not regret it, boss. We know every outlet in this place.']] },
      { id: 'clear', label: 'Clear them out', fx: { rep: -1, street: -2 }, reply: [['Landlord', 'Cold. But it is your building now.']] }] } },
  { id: 'feature', title: 'First Feature', giver: 'jade', who: 'Jade Rivers',
    intro: [['Jade Rivers', 'Heard you bought the old stage. I have run twenty features. I have seen every ego, every set and every bullshit move in this town.'], ['Jade Rivers', 'On my set everybody hits their marks. Cast it, light it, call it. I will be watching.'], ['MVP', 'Then let\'s make something that sells.']],
    steps: [{ t: 'enter', scene: 'studio', text: 'Go inside MVP Studios' }, { t: 'produce', text: 'Produce your first film (talk to Jade on set)' }],
    reward: { cash: 0, rep: 12, sign: 'jade' }, outro: [['Jade Rivers', 'Good instincts. You listened to your talent. Do that every time and the catalog builds itself.']],
    choice: { id: 'feature', title: 'Overtime', text: 'The shoot ran four hours long. Jade and the crew want overtime. Your accountant says nobody would notice if you skipped it.', options: [
      { id: 'pay', label: 'Pay everybody tonight', small: '-$400', fx: { cash: -400, rep: 4, loyal: { jade: 12 } }, reply: [['Jade Rivers', 'Paid the night it happened. You would be amazed how rare that is.']] },
      { id: 'skip', label: 'Skip it', fx: { rep: -5, loyal: { jade: -15 } }, reply: [['Jade Rivers', 'I have walked off sets for less. Do not make it a habit.']] }] } },
  { id: 'bootleg', title: 'Bootleg Boulevard', giver: 'coco', who: 'Coco Bellamy',
    intro: [['Coco Bellamy', 'Sugar, your film is selling on burned discs out of a van on Fremont. Silas Crane is eating your royalties.'], ['MVP', 'He is stealing from my stable. That stops tonight.']],
    steps: [{ t: 'chase', hp: 140, speed: 22, color: '#4a3a5a', spawn: { x: 120, z: -4, from: 'E', to: 'C' }, text: 'Stop the bootleg van' }],
    reward: { cash: 2500, rep: 12, street: 6, sign: 'coco' }, outro: [['Coco Bellamy', 'Van is busted and the discs are in the gutter.'], ['Coco Bellamy', 'A man who protects his work? Oh, I could get used to working with you.']],
    choice: { id: 'bootleg', title: 'The offer', text: 'The van driver offers you a cut: "Let us keep a few corners on Fremont and $1,500 lands in your pocket tonight."', options: [
      { id: 'shut', label: 'Shut it all down', fx: { rep: 4, street: 6, loyal: { coco: 10 } }, reply: [['Coco Bellamy', 'Every disc in the gutter. That is my kind of man.']] },
      { id: 'cut', label: 'Take the cut', small: '+$1,500 · bootlegs keep 20% of your royalties', fx: { cash: 1500, rep: -8, street: 2, loyal: { coco: -15 } }, reply: [['Coco Bellamy', 'You took his money? Over our films?'], ['MVP', 'It is business.']] }] } },
  { id: 'lex', title: "Lex's Terms", giver: 'lex', who: 'Lex Vaughn',
    intro: [['Lex Vaughn', 'Two million followers, my own company and zero patience. Everybody in this town wants me on their slate.'], ['Lex Vaughn', 'I am streaming outside the chapel tonight. Shoot me live in front of my chat, and do not embarrass me.'], ['MVP', 'Your chat is about to see a professional.']],
    steps: [{ t: 'shoot', scene: 'world', subjects: ['lex'], shots: 4, text: 'Shoot Lex live on her stream (4 photos)' },
      { t: 'choice', text: 'Lex is reading your contract to her chat', c: { id: 'lex', title: 'Her terms', text: 'Lex reads your contract out loud to two million people. "Fifty-fifty on my scenes and final say on my edits. Or I walk."', options: [
        { id: 'fair', label: 'Fifty-fifty. Final cut is hers.', fx: { rep: 6, loyal: { lex: 15 } }, reply: [['Lex Vaughn', 'Chat, say hi to my new partner.']] },
        { id: 'lowball', label: 'Counter: 70/30 to the house', small: '+$800', fx: { cash: 800, rep: -5, loyal: { lex: -20 } }, reply: [['Lex Vaughn', 'Fine. I will sign. But my chat saw that, and so did I.']] }] } }],
    reward: { cash: 1200, rep: 8, sign: 'lex' }, outro: [['Lex Vaughn', 'The clips are already trending. Do not get comfortable.']] },
  { id: 'tax', title: 'Street Tax', giver: 'phone', who: 'Dutch, Neon Kings',
    intro: [['Dutch', 'Phillips. Dutch, Neon Kings. Nice little studio. Be a shame if the lights went out.'], ['Dutch', 'Fifteen hundred and nobody touches your building. Silas sends his regards.']],
    steps: [{ t: 'choice', text: 'Dutch wants $1,500 in protection money', c: { id: 'tax', title: 'Protection', text: 'Dutch\'s truck idles outside MVP Studios. Pay the street tax, or make him leave.', options: [
        { id: 'pay', label: 'Pay him', small: '-$1,500', end: true, fx: { cash: -1500, rep: -2, street: -10 }, reply: [['Dutch', 'Smart man. See you next month.']] },
        { id: 'refuse', label: 'Refuse', fx: { street: 4 }, reply: [['MVP', 'The studio is not for sale. Not the building, not the masters, not your tax.'], ['Dutch', 'Wrong answer.']] }] } },
      { t: 'chase', hp: 150, speed: 23, color: '#1d3b2a', spawn: { x: 120, z: -4, from: 'E', to: 'C' }, text: "Run Dutch's truck off the boulevard" }],
    reward: { cash: 1200, rep: 8, street: 12 }, outro: [['Dutch', 'Okay! Okay. MVP Studios is off the list.'], ['MVP', 'Tell Silas he is next.']] },
  { id: 'finale', title: 'Beyond the Frame', giver: 'ruby2', who: 'Ruby Monroe',
    intro: [['Ruby Monroe', 'Premiere is at the Crown tonight. Red carpet, press, the whole town. Your film, our names on the poster.'], ['Jade Rivers', 'And Silas Crane bought a ticket. He wants the master drive. Watch him.']],
    steps: [{ t: 'goto', to: 'carpet', time: 90, text: 'Get to the premiere at Crown Casino' }, { t: 'shoot', scene: 'world', subjects: ['ruby', 'nova', 'jade'], shots: 6, text: 'Shoot the red carpet (6 photos)' },
      { t: 'chase', hp: 180, speed: 24, color: '#d8d8e0', spawn: { x: -3.2, z: -70, from: 'N', to: 'C' }, text: 'Silas grabbed the master drive. Stop his car!' }],
    reward: { cash: 5000, rep: 20, street: 8 },
    outro: [['Silas Crane', 'Fine. Keep your drive. This town is yours, Phillips.'], ['Ruby Monroe', 'From room 12 at the Desert Rose to owning the whole damn frame.'], ['MVP', 'Own the frame. Then own the film. We are just getting started.']],
    choice: { id: 'finale', title: 'Silas Crane', text: 'The valet has Silas cuffed to his own steering wheel. Every camera on the carpet is pointed at you. What happens to him?', options: [
      { id: 'police', label: 'Call the police and give a statement', fx: { rep: 10 }, reply: [['Ruby Monroe', 'Handled like a grown-up. On camera. Beautiful.']] },
      { id: 'network', label: 'Make him sign over his distribution network', small: '+$2,000', fx: { cash: 2000, street: 10, rep: -3 }, reply: [['Silas Crane', 'You want my trucks? Take them. You will see what this town really costs.']] },
      { id: 'walk', label: 'Let him walk, in front of the whole Strip', fx: { street: 6, rep: 2 }, reply: [['MVP', 'Walk, Silas. Everybody is watching you do it.']] }] } },
];
// The climb: career rung by story progress (index = missions completed)
export const RUNGS = [
  ['Hired Lens', 'A borrowed lens and a phone that won\'t stop ringing.'], ['Vendor', 'You\'re someone else\'s camera, and you get paid.'], ['Vendor', 'You\'re someone else\'s camera, and you get paid.'],
  ['Runner', 'Proofs delivered, cards recovered. People call you now.'], ['Byline', 'Your name is on a cover.'], ['Landlord', 'A room is where films get made.'],
  ['Producer', 'You cast it, you light it, you call it, you wrap it.'], ['Distributor', 'You defend your own IP.'], ['Talent Magnet', 'The best in town want your name on their contract.'],
  ['Untouchable', 'The Neon Kings know your car on sight.'], ['Mogul', 'You own the frame, the film and the future.'],
];
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
// Each set is a look, and the look is the product.
export const SETS = {
  stage: { name: 'Stage A', cost: 0, q: 6, look: 'Cyclorama and softboxes. Your bread and butter.' },
  pool: { name: 'Desert Rose pool at night', cost: 200, q: 9, look: 'Glossy, wet, warm. Nova\'s dream.' },
  club: { name: 'Velvet Room after hours', cost: 400, q: 12, look: 'Red velvet and neon, all drama and shadow.' },
  pent: { name: 'Crown penthouse', cost: 600, q: 15, look: 'Money, glass, skyline.' },
};
export const BUDGET = [{ name: 'Lean', cost: 0, m: 0.9 }, { name: 'Standard', cost: 800, m: 1.1 }, { name: 'Premium', cost: 2000, m: 1.35 }];
export const CALLS = [['light', 'Lighting', ['warm', 'cool', 'neon']], ['mood', 'Mood', ['playful', 'romantic', 'dramatic']], ['cam', 'Camera', ['handheld', 'dolly', 'locked-off']]];
export const FILM_TITLES = ['Neon Confessions', 'After Hours', 'Red Room', 'Desert Heat', 'Velvet Rope', 'High Roller', 'Last Call', 'Room 12', 'Midnight on Fremont', 'Double Down'];
// What the talent is like on set (shown as director hints)
export const ATTITUDE = {
  ruby: 'Ruby knows exactly what she is worth and makes you earn the shot.',
  nova: 'Nova knows the camera loves her and plays every angle.',
  jade: 'Jade runs a set like a general. Do not waste her takes.',
  coco: 'Coco brings the burlesque tease to everything.',
  lex: 'Lex runs her own company and has no patience for amateurs.',
};
// Ruby at MVP Studios (once you own it): what she says while she keeps the place running
export const RUBY_STUDIO = {
  chat: [
    'Floors are swept, lenses are wiped, coffee is hot. Your studio does not run itself, boss.',
    'Somebody left gaffer tape on the cyc again. I am not naming names. It was you.',
    'I reorganized the wardrobe by color. Do not touch it.',
    'Jade says the key light was two stops hot yesterday. I fixed it.',
    'The edit bay smells like energy drinks. That is how I know you were working late.',
    'Every film that goes up on that wall, I want my name somewhere in the credits.',
    'You bought a room. I am making it a studio.',
  ],
  prep: 'Give me twenty minutes. Lights set, wardrobe pressed. The set will be ready to shoot.',
  prepped: 'The set is already prepped for your next shoot. Go make something.',
  brk: 'Five minutes. Then back to work. This place does not clean itself.',
};

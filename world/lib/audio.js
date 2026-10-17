// Soundtrack + spoken dialogue for the world.
// Music is generated live with Web Audio (original, nothing licensed, safe to stream): one track per mood,
// switching on the bar: 'street' synthwave, 'club' house, 'studio' lo-fi, 'chase' high-energy.
// Dialogue is read aloud with the browser's speech synthesis, a distinct voice per character; the music
// ducks under it.

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note -> Hz
// A minor family: Am F C G (street/chase), Am7 Dm7 Em7 Am7 (club), Fmaj7 Em7 Dm7 Cmaj7 (studio)
const CHORDS = {
  street: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
  chase: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
  club: [[57, 60, 64, 67], [50, 53, 57, 60], [52, 55, 59, 62], [57, 60, 64, 67]],
  studio: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
};
const BPM = { street: 96, club: 124, studio: 82, chase: 148 };

export class Music {
  constructor(ac, out) {
    this.ac = ac; this.mood = 'street'; this.next = 'street'; this.on = true;
    this.bus = ac.createGain(); this.bus.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.tone = ac.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 18000; // muffled indoors-through-walls effect hook
    this.bus.connect(this.tone); this.tone.connect(comp); comp.connect(out);
    // shared FX: a dotted-eighth delay for arps and stabs
    this.delay = ac.createDelay(1); this.fb = ac.createGain(); this.fb.gain.value = 0.32; this.wet = ac.createGain(); this.wet.gain.value = 0.25;
    this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.wet); this.wet.connect(this.bus);
    const len = ac.sampleRate; this.noise = ac.createBuffer(1, len, ac.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.step = 0; this.t = ac.currentTime + 0.1; this.level = 0.34; this.duck = 1;
    this.timer = setInterval(() => this.schedule(), 25);
    this.fade(this.level);
  }
  fade(v, s = 1.2) { const g = this.bus.gain, t = this.ac.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + s); }
  setMood(m) { if (BPM[m]) this.next = m; }
  setOn(on) { this.on = on; this.fade(on ? this.level * this.duck : 0, 0.6); }
  setDuck(d) { this.duck = d; if (this.on) this.fade(this.level * d, 0.35); }
  schedule() {
    const ac = this.ac;
    while (this.t < ac.currentTime + 0.12) {
      if (this.step % 16 === 0 && this.next !== this.mood) { this.mood = this.next; this.delay.delayTime.value = 60 / BPM[this.mood] * 0.75; }
      if (this.on) this.play(this.mood, this.step, this.t);
      this.t += 60 / BPM[this.mood] / 4; this.step = (this.step + 1) % 64;
    }
  }
  // ---- instruments
  osc(type, freq, t, dur, vol, dest = this.bus, attack = 0.005, cutoff = 0) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = freq;
    let node = o; if (cutoff) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 2; o.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  kick(t, v = 0.9) { const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.4); }
  hit(t, dur, vol, type, freq) { const ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = this.noise; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); }
  hat(t, open) { this.hit(t, open ? 0.18 : 0.04, open ? 0.12 : 0.08, 'highpass', 8000); }
  snare(t, v = 0.32) { this.hit(t, 0.16, v, 'bandpass', 1800); this.osc('triangle', 190, t, 0.08, v * 0.5); }
  pad(chord, t, dur, vol, cutoff) { for (const n of chord) { this.osc('sawtooth', NOTE(n), t, dur, vol, this.bus, 0.4, cutoff); this.osc('sawtooth', NOTE(n) * 1.004, t, dur, vol * 0.7, this.bus, 0.4, cutoff); } }
  play(mood, step, t) {
    const bar = Math.floor(step / 16), s = step % 16, chord = CHORDS[mood][bar], root = chord[0] - 12, beat = 60 / BPM[mood];
    if (mood === 'street') { // laid-back synthwave
      if (s === 0) this.pad(chord, t, beat * 4, 0.035, 1400);
      if (s % 8 === 0) this.kick(t, 0.75); if (s === 4 || s === 12) this.snare(t, 0.22); if (s % 2 === 0) this.hat(t, false);
      if (s % 2 === 0) this.osc('sawtooth', NOTE(root - 12 + (s % 4 === 2 ? 12 : 0)), t, beat * 0.45, 0.12, this.bus, 0.005, 500);
      if (s % 2 === 1) this.osc('triangle', NOTE(chord[(s >> 1) % chord.length] + 12), t, beat * 0.3, 0.05, this.delay);
    } else if (mood === 'club') { // four-on-the-floor house
      if (s % 4 === 0) this.kick(t, 1); if (s % 4 === 2) this.hat(t, true); if (s === 4 || s === 12) this.hit(t, 0.12, 0.2, 'bandpass', 1500);
      if (s % 4 === 2) this.osc('square', NOTE(root - 12), t, beat * 0.22, 0.1, this.bus, 0.005, 420);
      if (s === 3 || s === 10) for (const n of chord) this.osc('sawtooth', NOTE(n + 12), t, beat * 0.35, 0.03, this.delay, 0.005, 2400);
    } else if (mood === 'studio') { // lo-fi keys
      if (s === 0) for (const n of chord) this.osc('triangle', NOTE(n), t + Math.random() * 0.02, beat * 3.6, 0.05, this.bus, 0.02);
      if (s === 0 || s === 10) this.kick(t, 0.5); if (s === 4 || s === 12) this.hit(t, 0.12, 0.12, 'bandpass', 1200);
      if (s % 2 === 0) this.hat(t + (s % 4 === 2 ? beat * 0.08 : 0), false);
      if (s === 0 || s === 6 || s === 8) this.osc('sine', NOTE(root - 12), t, beat * 1.2, 0.16);
    } else if (mood === 'chase') { // driving 16th bass
      if (s % 4 === 0) this.kick(t, 1); if (s === 4 || s === 12) this.snare(t, 0.35); this.hat(t, s % 4 === 2);
      this.osc('sawtooth', NOTE(root - 12 + (s % 8 === 7 ? 12 : 0)), t, beat * 0.22, 0.13, this.bus, 0.003, 700);
      if (s % 2 === 0) this.osc('square', NOTE(chord[(s >> 1) % chord.length] + 12), t, beat * 0.2, 0.035, this.delay, 0.003, 3000);
      if (s === 0) this.pad(chord, t, beat * 4, 0.03, 2200);
    }
  }
}

// ---------- voices
const CAST = { // pitch, rate, voice gender
  'MVP': [0.9, 1.0, 'm'], 'Ruby Monroe': [1.05, 1.0, 'f'], 'Tony Velvet': [0.85, 1.12, 'm'], 'Editor': [1.0, 1.08, 'f'], 'Dee': [1.15, 1.05, 'f'],
  'Nova Starr': [1.25, 0.98, 'f'], 'Jade Rivers': [0.9, 0.95, 'f'], 'Coco Bellamy': [1.3, 1.05, 'f'], 'Landlord': [0.75, 0.9, 'm'], 'Bouncer': [0.55, 0.9, 'm'],
  'Silas Crane': [0.65, 0.88, 'm'], 'Doorman': [0.8, 1.0, 'm'],
};
const FEMALE = /female|woman|samantha|victoria|karen|moira|tessa|fiona|zira|susan|serena|allison|ava|kate|libby|sonia|aria|jenny|michelle|google uk english female|google us english/i;
const MALE = /\bmale\b|daniel|alex|fred|david|mark|guy|ryan|thomas|oliver|george|arthur|tom|aaron|google uk english male/i;

export class Voices {
  constructor() {
    this.ok = typeof speechSynthesis !== 'undefined'; this.on = true; this.list = [];
    if (this.ok) { const load = () => { this.list = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); }; load(); speechSynthesis.addEventListener?.('voiceschanged', load); }
  }
  pick(gender, who) {
    const pool = this.list.filter(v => gender === 'f' ? FEMALE.test(v.name) && !MALE.test(v.name.replace(/female/i, '')) : MALE.test(v.name.replace(/female/i, 'x')));
    const list = pool.length ? pool : this.list; if (!list.length) return null;
    let h = 0; for (const c of who) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return list[h % list.length];
  }
  // speak a dialogue line; onStart/onEnd let the game duck the music
  say(who, text, onStart, onEnd) {
    if (!this.ok || !this.on || !text || who === 'Sign') { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const [pitch, rate, g] = CAST[who] || [1.1, 1.0, /^(Tasha|Monique|Valentina|Brielle|Kenya|Dani|Mariah|Simone)$/.test(who) ? 'f' : 'm'];
    const u = new SpeechSynthesisUtterance(text.replace(/MVP/g, 'M V P')); u.pitch = pitch; u.rate = rate; u.volume = 1;
    const v = this.pick(g, who); if (v) u.voice = v;
    u.onstart = () => onStart && onStart(); u.onend = u.onerror = () => onEnd && onEnd();
    speechSynthesis.speak(u);
  }
  stop() { if (this.ok) speechSynthesis.cancel(); }
}

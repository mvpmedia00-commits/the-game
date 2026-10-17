// Idle body language for MVP: a relaxed stance with breathing and weight shifts, broken up every few seconds
// by a random mannerism. Poses use the game's joint keys (see setPose in hd-demo/lib/characters.js):
// arms hang at rotation 0; shoulder x < 0 swings the arm forward, z swings it out (L: +, R: -); elbow x < 0 bends.
const S = Math.sin;
const base = t => ({
  sp: [0.03 + S(t * 1.6) * 0.012, 0, 0],                         // breathing
  hips: [0, S(t * 0.35) * 0.05, S(t * 0.5) * 0.03],               // slow weight shift
  hpL: [0, 0, 0.03], hpR: [-0.06 * (0.5 + 0.5 * S(t * 0.5)), 0, -0.03], knR: [0.14 * (0.5 + 0.5 * S(t * 0.5)), 0, 0],
  shL: [0.03, 0, 0.1], elL: [-0.18, 0, 0], shR: [0.03, 0, -0.1], elR: [-0.18, 0, 0],
  hd: [0.02, S(t * 0.27) * 0.12, 0],
});
const MOVES = {
  look: (t, k) => ({ hd: [0.0, S(k * Math.PI * 2) * 0.75, 0], sp: [0.03, S(k * Math.PI * 2) * 0.18, 0] }),
  watch: (t, k) => ({ shL: [-0.75, 0, -0.25], elL: [-1.75, 0.5, 0], hd: [0.38, 0.32, 0.05], sp: [0.06, 0.1, 0] }),
  beret: (t, k) => ({ shR: [-2.3, 0, -0.55], elR: [-1.65, 0, 0], hd: [0.1, -0.15, 0.12 * S(t * 3)] }),
  cross: (t, k) => ({ shL: [-0.55, 0, -0.38], elL: [-2.0, 0.4, 0], shR: [-0.6, 0, 0.42], elR: [-2.0, -0.4, 0], hd: [-0.05, 0, 0], sp: [-0.02, 0, 0] }),
  hips: (t, k) => ({ shL: [0.15, 0, 0.75], elL: [-0.4, 0, -1.75], shR: [0.15, 0, -0.75], elR: [-0.4, 0, 1.75], hd: [0.06, S(t * 0.6) * 0.2, 0] }),
  rub: (t, k) => ({ shL: [-0.5, 0, -0.18], elL: [-1.35 + S(t * 9) * 0.08, 0, 0], shR: [-0.5, 0, 0.18], elR: [-1.35 - S(t * 9) * 0.08, 0, 0], hd: [0.18, 0, 0] }),
  neck: (t, k) => ({ hd: [0.1, 0, S(k * Math.PI * 4) * 0.35] }),
  nod: (t, k) => ({ hd: [0.15 + S(t * 6) * 0.08, 0.2, 0], hips: [0, 0, S(t * 3) * 0.05] }),
};
const NAMES = Object.keys(MOVES);
const DUR = { look: 3.2, watch: 2.6, beret: 1.8, cross: 4.5, hips: 4, rub: 2.2, neck: 2.4, nod: 3 };

export class Mannerisms {
  constructor() { this.reset(); }
  reset() { this.move = null; this.k = 0; this.wait = 2 + Math.random() * 3; }
  // returns this frame's target pose (blend toward it with setPose)
  pose(dt, t) {
    const p = base(t);
    if (!this.move) { this.wait -= dt; if (this.wait <= 0) { let m; do m = NAMES[Math.floor(Math.random() * NAMES.length)]; while (m === this.last && NAMES.length > 1); this.move = this.last = m; this.k = 0; } return p; }
    this.k += dt / DUR[this.move];
    if (this.k >= 1) { this.move = null; this.wait = 3 + Math.random() * 4; return p; }
    return Object.assign(p, MOVES[this.move](t, this.k));
  }
}

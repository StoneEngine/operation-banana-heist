// ตัวจับเวลารอบเกม + สถิติสูงสุด
const rand = (a, b) => a + Math.random() * (b - a);
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

class Round {
  constructor() { this.reset(); }

  reset() {
    this.time = CFG.ROUND_TIME;
    this.bananas = 0;
    this.caughtCount = 0;
    this.over = false;
  }

  update(dt) {
    this.time -= dt;
    if (this.time <= 0) { this.time = 0; this.over = true; }
  }

  /** เวลาที่เล่นไปแล้ว — ใช้เร่งความยากตามเวลา */
  get elapsed() { return CFG.ROUND_TIME - this.time; }
}

const bestScore = {
  get() { return Number(localStorage.getItem('bananaHeistBest') || 0); },
  set(v) {
    if (v > this.get()) { localStorage.setItem('bananaHeistBest', String(v)); return true; }
    return false;
  },
};

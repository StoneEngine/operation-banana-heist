// ตัวจับเวลารอบเกม + สถิติสูงสุด
const rand = (a, b) => a + Math.random() * (b - a);
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

class Round {
  constructor() { this.reset(); }

  reset() {
    this.elapsed = 0;          // เดินขึ้นเรื่อยๆ ไม่มีจับเวลาถอยหลังแล้ว
    this.bananas = 0;
    this.caughtCount = 0;
  }

  update(dt) {
    this.elapsed += dt;
  }
}

const bestScore = {
  get() { return Number(localStorage.getItem('bananaHeistBest') || 0); },
  set(v) {
    if (v > this.get()) { localStorage.setItem('bananaHeistBest', String(v)); return true; }
    return false;
  },
};

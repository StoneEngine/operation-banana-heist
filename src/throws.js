// เปลือกกล้วยที่บอสคองปาใส่ผู้เล่น — ตัวเดียวที่ทำร้ายผู้เล่นได้ในเกม
// ปาเฉพาะตอนลิงตื่น ยิ่งโกรธยิ่งปาทีละหลายลูก
class Throws {
  constructor() { this.reset(); }

  reset() {
    this.items = [];
    this.timer = 0.3;
  }

  update(dt, monkey, hero) {
    for (const p of this.items) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.t += dt;
    }
    this.items = this.items.filter((p) => p.x > -90 && p.x < CFG.W + 90 && p.y > -90 && p.y < CFG.H + 90);

    if (monkey.state !== STATE.AWAKE) {
      this.timer = 0.18;               // ตื่นรอบหน้าปาเร็วเลย ไม่ต้องรอนาน
      return;
    }
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = rand(...CFG.THROW_INTERVAL);
      this.fire(monkey, hero);
    }
  }

  fire(monkey, hero) {
    const n = 1 + Math.round(monkey.anger * CFG.THROW_PER_ANGER);
    const ox = CX;
    const oy = MONKEY.y + MONKEY.size * 0.42;
    const base = Math.atan2(hero.hitY - oy, hero.x - ox);
    for (let i = 0; i < n; i++) {
      const spread = n === 1 ? (Math.random() - 0.5) * CFG.THROW_SPREAD
        : (i - (n - 1) / 2) * CFG.THROW_SPREAD * 1.4;
      const a = base + spread;
      this.items.push({
        x: ox, y: oy,
        vx: Math.cos(a) * CFG.THROW_SPEED,
        vy: Math.sin(a) * CFG.THROW_SPEED,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 14,
        t: 0,
      });
    }
    sfx.throwPeel();
  }

  /** เช็กชนผู้เล่น ลูกที่โดนหายไป — คืนจำนวนลูกที่โดน */
  hitTest(hero) {
    let hits = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      if (hero.hitBy(p.x, p.y, CFG.THROW_R)) {
        this.items.splice(i, 1);
        hits += 1;
      }
    }
    return hits;
  }
}

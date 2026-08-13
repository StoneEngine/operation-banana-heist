// กล้วยทอง + วิทยุกล่อมลิง — โผล่เฉพาะตอนลิงหลับ กดโดนถึงได้ผล
class Powerups {
  constructor() { this.items = []; }
  reset() { this.items = []; }

  // เรียกทุกครั้งที่ลิงเพิ่งเข้า SLEEPING
  onSleepStart() {
    if (Math.random() < CFG.GOLD_CHANCE) this.spawn('gold', CFG.GOLD_LIFETIME);
    if (Math.random() < CFG.RADIO_CHANCE) this.spawn('radio', CFG.RADIO_LIFETIME);
  }

  spawn(kind, life) {
    this.items.push({
      kind,
      // ต้องอยู่ในสนามที่เดินถึง ไม่งั้นเก็บไม่ได้
      x: CFG.FIELD.left + 40 + Math.random() * (CFG.FIELD.right - CFG.FIELD.left - 80),
      y: CFG.FIELD.top + 20 + Math.random() * (CFG.FIELD.bottom - CFG.FIELD.top - 40),
      life,
      maxLife: life,
      t: Math.random() * 6,
      r: kind === 'gold' ? 34 : 30,
    });
  }

  update(dt, monkeyState) {
    if (monkeyState !== STATE.SLEEPING) { this.items.length = 0; return; }
    for (const it of this.items) { it.life -= dt; it.t += dt; }
    this.items = this.items.filter((it) => it.life > 0);
  }

  // เดินทับ = เก็บ (ไม่มีการคลิกแล้ว) คืน kind ของไอเทมที่เก็บได้ หรือ null
  pickup(hero) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.hypot(hero.x - it.x, hero.hitY - it.y) <= it.r + CFG.HERO_R) {
        this.items.splice(i, 1);
        return it.kind;
      }
    }
    return null;
  }
}

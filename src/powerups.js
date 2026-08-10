// กล้วยทอง + วิทยุกล่อมลิง — โผล่เฉพาะตอนลิงหลับ กดโดนถึงได้ผล
import { CFG, STATE } from './config.js';

export class Powerups {
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
      x: 120 + Math.random() * (CFG.W - 260),
      y: 150 + Math.random() * 200,
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

  // คืน kind ของไอเทมที่โดนคลิก (หรือ null) แล้วเอาออกจากจอ
  hit(x, y) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.hypot(x - it.x, y - it.y) <= it.r) {
        this.items.splice(i, 1);
        return it.kind;
      }
    }
    return null;
  }
}

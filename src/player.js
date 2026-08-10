// ผู้เล่น = มือหัวขโมย: ตำแหน่ง, อนิเมชันยื่นมือ, คูลดาวน์, ผลของการกด
import { CFG, STATE } from './config.js';

export class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = CFG.W / 2;
    this.baseY = CFG.H + 34;   // ตอนไม่กด มือโผล่แค่ปลายนิ้วจากขอบล่าง
    this.reach = 0;        // 0 = มืออยู่ล่าง, 1 = ยื่นสุด
    this.reachV = 0;
    this.cool = 0;
    this.combo = 0;
    this.lockedUntil = 0;
  }

  aimAt(x) { this.x = Math.max(70, Math.min(CFG.W - 70, x)); }

  update(dt) {
    this.cool = Math.max(0, this.cool - dt);
    this.lockedUntil = Math.max(0, this.lockedUntil - dt);
    // สปริงดึงมือกลับที่เดิม
    const target = 0;
    this.reachV += (target - this.reach) * 34 * dt;
    this.reachV *= 0.82;
    this.reach = Math.max(0, this.reach + this.reachV * dt * 8);
  }

  get handY() { return this.baseY - this.reach * 250; }

  /** กดขโมย 1 ครั้ง -> 'steal' | 'caught' | null (กดไม่ติด) */
  tryGrab(monkey) {
    if (this.cool > 0 || this.lockedUntil > 0 || monkey.locked) return null;
    this.cool = CFG.GRAB_COOLDOWN;
    this.reach = 1;
    this.reachV = 0;
    if (monkey.state === STATE.AWAKE) {
      this.combo = 0;
      this.lockedUntil = CFG.CAUGHT_LOCK;
      return 'caught';
    }
    if (monkey.canSteal) { this.combo++; return 'steal'; }
    return null;
  }
}

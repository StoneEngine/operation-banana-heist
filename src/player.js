// ตัวเอก "จ๋อจิ๋ว" — เดินทั่วสนาม top-down, หันตามทิศที่เดินจริง, hitbox วงกลมเล็ก
class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = CFG.W / 2;
    this.y = CFG.H / 2;
    this.tx = this.x;              // เป้าหมายจากเมาส์/นิ้ว
    this.ty = this.y;
    this.useMouse = false;         // เมาส์จะคุมก็ต่อเมื่อขยับเมาส์ล่าสุด
    this.mvx = 0;                  // ทิศจากปุ่ม WASD/ลูกศร
    this.mvy = 0;
    this.kx = 0;                   // แรงกระแทกตอนโดน
    this.ky = 0;
    this.dir = 'down';             // down | side | up
    this.face = 1;                 // 1 = หันขวา, -1 = หันซ้าย
    this.anim = 0;
    this.moving = false;
    this.iframe = 0;
    this.parryT = 0;               // ช่วงที่ท่าสะท้อนกำลังทำงาน
    this.parryCool = 0;
    this.hp = CFG.HERO_HP;
    this.maxHp = CFG.HERO_HP;
    this.speed = CFG.HERO_SPEED;   // อัปเกรด "เท้าไว" เพิ่มค่านี้
    this.magnet = CFG.MAGNET_R;    // อัปเกรด "แม่เหล็กกล้วย" เพิ่มค่านี้
  }

  setMove(x, y) {
    this.mvx = x;
    this.mvy = y;
    if (x || y) this.useMouse = false;
  }

  /** x,y เป็นพิกัดในโลก (แปลงจากจอด้วยกล้องแล้ว) */
  aimAt(x, y) {
    this.tx = x;
    this.ty = y;
    this.useMouse = true;
  }

  /** จุดกึ่งกลาง hitbox = กลางลำตัว (เท้าอยู่ที่ y) */
  get hitY() { return this.y - 16; }

  /** คลิกขวา = ตั้งท่าสะท้อน คืน true ถ้าใช้ได้ (ไม่ติดคูลดาวน์) */
  parry() {
    if (this.parryCool > 0) return false;
    this.parryT = CFG.PARRY.window;
    this.parryCool = CFG.PARRY.cool;
    return true;
  }

  get parrying() { return this.parryT > 0; }

  update(dt) {
    this.iframe = Math.max(0, this.iframe - dt);
    this.parryT = Math.max(0, this.parryT - dt);
    this.parryCool = Math.max(0, this.parryCool - dt);

    this.x += this.kx * dt;
    this.y += this.ky * dt;
    this.kx *= 0.85;
    this.ky *= 0.85;

    let dx = 0, dy = 0;
    if (this.mvx || this.mvy) {
      dx = this.mvx;
      dy = this.mvy;
    } else if (this.useMouse) {
      const ax = this.tx - this.x;
      const ay = this.ty - this.y;
      if (Math.hypot(ax, ay) > 6) { dx = ax; dy = ay; }
    }

    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    if (this.moving) {
      const step = this.speed * dt;
      this.x += (dx / len) * step;
      this.y += (dy / len) * step;
      this.anim += dt * CFG.WALK_FPS;
      // ซ้าย/ขวาชนะบน/ล่าง เพราะท่าด้านข้างอ่านง่ายกว่า
      if (Math.abs(dx) > Math.abs(dy) * 0.8) {
        this.dir = 'side';
        this.face = dx > 0 ? 1 : -1;
      } else {
        this.dir = dy > 0 ? 'down' : 'up';
      }
    }

    this.x = clampNum(this.x, 30, CFG.WORLD.w - 30);
    this.y = clampNum(this.y, 40, CFG.WORLD.h - 20);
  }

  hitBy(x, y, r) {
    if (this.iframe > 0) return false;
    return Math.hypot(x - this.x, y - this.hitY) <= r + CFG.HERO_R;
  }

  /** โดนโจมตี 1 ครั้ง — คืน true ถ้าเลือดหมด */
  damage() {
    this.hp = Math.max(0, this.hp - 1);
    return this.hp <= 0;
  }

  knockFrom(x, y) {
    const dx = this.x - x;
    const dy = this.hitY - y;
    const d = Math.hypot(dx, dy) || 1;
    this.kx = (dx / d) * CFG.HERO_KNOCK;
    this.ky = (dy / d) * CFG.HERO_KNOCK;
    this.iframe = CFG.HERO_IFRAME;
  }
}

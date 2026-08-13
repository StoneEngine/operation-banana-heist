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
  }

  setMove(x, y) {
    this.mvx = x;
    this.mvy = y;
    if (x || y) this.useMouse = false;
  }

  aimAt(x, y) {
    this.tx = clampNum(x, CFG.ARENA.left, CFG.ARENA.right);
    this.ty = clampNum(y, CFG.ARENA.top, CFG.ARENA.bottom);
    this.useMouse = true;
  }

  /** จุดกึ่งกลาง hitbox = กลางลำตัว (เท้าอยู่ที่ y) */
  get hitY() { return this.y - 16; }

  update(dt) {
    this.iframe = Math.max(0, this.iframe - dt);

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
      const step = CFG.HERO_SPEED * dt;
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

    this.x = clampNum(this.x, CFG.ARENA.left, CFG.ARENA.right);
    this.y = clampNum(this.y, CFG.ARENA.top, CFG.ARENA.bottom);
  }

  hitBy(x, y, r) {
    if (this.iframe > 0) return false;
    return Math.hypot(x - this.x, y - this.hitY) <= r + CFG.HERO_R;
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

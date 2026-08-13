// ตัวเอก "จ๋อจิ๋ว" — เดินในสนามตามเมาส์ (ไม่มีปุ่มกด) + hitbox วงกลมเล็กแบบเกมหลบกระสุน
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

class Player {
  constructor() { this.reset(); }

  reset() {
    this.x = CFG.W / 2;
    this.y = CFG.FIELD.bottom - 30;
    this.tx = this.x;
    this.ty = this.y;
    this.kx = 0;              // ความเร็วจากแรงกระแทกตอนโดนปา
    this.ky = 0;
    this.face = 1;
    this.walk = 0;            // ระยะทางสะสม ใช้ทำจังหวะเด้งตอนเดิน
    this.iframe = 0;
    this.moving = false;
    this.mvx = 0;             // ทิศจากปุ่ม WASD (-1..1)
    this.mvy = 0;
  }

  /** ปุ่ม WASD/ลูกศร — ถ้ากดอยู่ ปุ่มชนะเมาส์ */
  setMove(x, y) {
    this.mvx = x;
    this.mvy = y;
  }

  /** ตำแหน่งเมาส์/นิ้ว = จุดที่อยากไป */
  aimAt(x, y) {
    this.tx = clampNum(x, CFG.FIELD.left, CFG.FIELD.right);
    this.ty = clampNum(y, CFG.FIELD.top, CFG.FIELD.bottom);
  }

  /** จุดกึ่งกลาง hitbox — อยู่กลางลำตัว ไม่ใช่ที่เท้า */
  get hitY() { return this.y - CFG.HERO_SIZE * 0.32; }

  update(dt) {
    this.iframe = Math.max(0, this.iframe - dt);

    this.x += this.kx * dt;
    this.y += this.ky * dt;
    this.kx *= 0.86;
    this.ky *= 0.86;

    if (this.mvx || this.mvy) {
      const len = Math.hypot(this.mvx, this.mvy);
      const step = CFG.HERO_SPEED * dt;
      this.x += (this.mvx / len) * step;
      this.y += (this.mvy / len) * step;
      this.walk += step;
      this.moving = true;
      if (this.mvx) this.face = this.mvx > 0 ? 1 : -1;
      this.tx = this.x;                 // กันเมาส์ดึงกลับตอนปล่อยปุ่ม
      this.ty = this.y;
    } else {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      this.moving = d > 3;
      if (this.moving) {
        const step = Math.min(d, CFG.HERO_SPEED * dt);
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
        this.walk += step;
        if (Math.abs(dx) > 3) this.face = dx > 0 ? 1 : -1;
      }
    }

    this.x = clampNum(this.x, CFG.FIELD.left, CFG.FIELD.right);
    this.y = clampNum(this.y, CFG.FIELD.top, CFG.FIELD.bottom);
  }

  /** วงกลมชนวงกลม — คืน true เมื่อโดนจริงและยังไม่อยู่ในช่วงอมตะ */
  hitBy(x, y, r) {
    if (this.iframe > 0) return false;
    return Math.hypot(x - this.x, y - this.hitY) <= r + CFG.HERO_R;
  }

  knockFrom(x, y) {
    const dx = this.x - x;
    const dy = this.hitY - y;
    const d = Math.hypot(dx, dy) || 1;
    this.kx = (dx / d) * CFG.HERO_KNOCKBACK;
    this.ky = (dy / d) * CFG.HERO_KNOCKBACK;
    this.iframe = CFG.HERO_IFRAME;
  }
}

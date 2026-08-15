// สกิลเดียวของจ๋อจิ๋ว — ดาวกระจายรอบทิศ (กด R) มีคูลดาวน์ อัปเกรดได้จากการ์ด
// (เดิมมี 3 สกิล Q/E/R ตัด "ระเบิดกล้วย" กับ "พุ่งตัว" ออกตามฟีดแบ็กเด็กๆ ที่เทส
//  พุ่งตัวย้ายไปเป็นความสามารถหลักติดตัว กด Space แทน ดู player.js dash())
const SKILL_DEFS = {
  storm: {
    key: 'R', name: 'ดาวกระจาย', icon: 'star',
    desc: 'ยิงดาวกระจายรอบตัวทุกทิศ',
    cool: (lv) => Math.max(5.0, 13 - lv * 1.1),
    count: (lv) => 10 + lv * 3,
  },
};

class Skills {
  constructor() { this.reset(); }

  reset() {
    this.lv = { storm: 1 };
    this.cd = { storm: 0 };
  }

  update(dt) {
    for (const id of Object.keys(this.cd)) this.cd[id] = Math.max(0, this.cd[id] - dt);
  }

  levelUp(id) {
    this.lv[id] += 1;
    this.cd[id] = 0;                       // อัปเกรดแล้วพร้อมใช้ทันที
  }

  /** กดสกิล — คืน false ถ้าติดคูลดาวน์ */
  cast(id, hero, arena) {
    if (this.cd[id] > 0) return false;
    const def = SKILL_DEFS[id];
    const lv = this.lv[id];
    this.cd[id] = def.cool(lv);

    // storm — ดาวกระจายรอบทิศ 360 องศาในทีเดียว พร้อมเอฟเฟกต์ฉูดฉาดให้รู้สึกโดนใจ
    const n = def.count(lv);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      arena.stars.push({
        x: hero.x, y: hero.hitY,
        vx: Math.cos(a) * CFG.STAR_SPEED,
        vy: Math.sin(a) * CFG.STAR_SPEED,
        rot: 0, life: CFG.STAR_LIFE * 1.3, pierce: 2, hits: new Set(),
      });
    }
    fx.blast(hero.x, hero.hitY, 90);
    fx.shake = 8;
    sfx.storm();
    return true;
  }
}

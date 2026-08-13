// ดาวกระจาย — ยิงเองอัตโนมัติใส่ศัตรูที่ใกล้ที่สุด (ผู้เล่นแค่เดิน)
// อัปเกรดได้ทุกๆ CFG.UPGRADE_EVERY กล้วย โดยผู้เล่นเลือกเองจาก 3 ใบ

const UPGRADES = [
  { id: 'count', title: 'ดาวเพิ่ม 1 ดอก', desc: 'ยิงทีละหลายดอก กระจายเป็นพัด', icon: 'star' },
  { id: 'rate', title: 'ยิงถี่ขึ้น', desc: 'ลดเวลาระหว่างชุด', icon: 'star' },
  { id: 'pierce', title: 'ดาวทะลุ +1', desc: 'ดาว 1 ดอกฆ่าได้หลายตัว', icon: 'star' },
  { id: 'magnet', title: 'แม่เหล็กกล้วย', desc: 'ดูดกล้วยจากไกลขึ้น 40%', icon: 'banana_gold' },
  { id: 'speed', title: 'เท้าไว', desc: 'เดินเร็วขึ้น 12%', icon: 'hero' },
];

class Weapon {
  constructor() { this.reset(); }

  reset() {
    this.level = 1;
    this.count = CFG.WEAPON.baseCount;
    this.pierce = CFG.WEAPON.basePierce;
    this.gap = CFG.WEAPON.baseGap;
    this.cool = 0.35;
  }

  /** สุ่ม 3 ใบให้เลือก */
  roll() {
    const pool = [...UPGRADES];
    const out = [];
    while (out.length < 3 && pool.length) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }

  apply(id, hero) {
    this.level += 1;
    if (id === 'count') this.count += 1;
    else if (id === 'rate') this.gap = Math.max(CFG.WEAPON.gapMin, this.gap - CFG.WEAPON.gapPerLevel);
    else if (id === 'pierce') this.pierce += 1;
    else if (id === 'magnet') hero.magnet = Math.round(hero.magnet * 1.4);
    else if (id === 'speed') hero.speed = Math.round(hero.speed * 1.12);
  }

  /** ยิงเมื่อกดคลิกซ้ายค้างไว้ เล็งไปทางเคอร์เซอร์ (aim = พิกัดในโลก) */
  update(dt, hero, arena, firing, aim) {
    this.cool -= dt;
    if (!firing || this.cool > 0) return;
    this.cool = this.gap;
    const base = Math.atan2(aim.y - hero.hitY, aim.x - hero.x);
    for (let i = 0; i < this.count; i++) {
      const a = base + (i - (this.count - 1) / 2) * CFG.WEAPON.spread;
      arena.stars.push({
        x: hero.x, y: hero.hitY,
        vx: Math.cos(a) * CFG.STAR_SPEED,
        vy: Math.sin(a) * CFG.STAR_SPEED,
        rot: 0,
        life: CFG.STAR_LIFE,
        pierce: this.pierce,
        hits: new Set(),
      });
    }
    sfx.star();
  }
}

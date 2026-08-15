// ดาวกระจาย — ยิงเองอัตโนมัติใส่ศัตรูที่ใกล้ที่สุด (ผู้เล่นแค่เดิน)
// อัปเกรดได้ทุกๆ CFG.UPGRADE_EVERY กล้วย โดยผู้เล่นเลือกเองจาก 3 ใบ

const UPGRADES = [
  { id: 'count', title: 'ดาวเพิ่ม 1 ดอก', desc: 'ยิงทีละหลายดอก กระจายเป็นพัด', icon: 'star' },
  { id: 'rate', title: 'ยิงถี่ขึ้น', desc: 'ลดเวลาระหว่างชุด', icon: 'star' },
  { id: 'pierce', title: 'ดาวทะลุ +1', desc: 'ดาว 1 ดอกฆ่าได้หลายตัว', icon: 'star' },
  { id: 'magnet', title: 'แม่เหล็กกล้วย', desc: 'ดูดกล้วยจากไกลขึ้น 40%', icon: 'banana_gold' },
  { id: 'speed', title: 'เท้าไว', desc: 'เดินเร็วขึ้น 12%', icon: 'hero' },
  { id: 'sk_storm', title: 'อัปสกิล R ดาวกระจาย', desc: 'ดาวเยอะขึ้น คูลดาวน์สั้นลง', icon: 'star' },
  { id: 'boomerang', title: 'ดาวบูมเมอแรง', desc: 'ดาวเหวี่ยงวกกลับมาหาตัว โดนศัตรูซ้ำได้', icon: 'star' },
  { id: 'orbit', title: 'วงแหวนป้องกัน', desc: 'มีดาวลอยรอบตัวคอยฟันศัตรูที่เข้าใกล้', icon: 'star' },
  { id: 'melee_dmg', title: 'ดาบคมขึ้น', desc: 'ฟันประชิดแรงขึ้น +1 ดาเมจ', icon: 'rock' },
  { id: 'melee_range', title: 'ดาบยาวขึ้น', desc: 'ฟันประชิดระยะไกลขึ้น', icon: 'rock' },
  { id: 'melee_rate', title: 'ฟันถี่ขึ้น', desc: 'คูลดาวน์ฟันประชิดสั้นลง', icon: 'rock' },
  { id: 'melee_arc', title: 'ฟันกว้างขึ้น', desc: 'มุมสวิงดาบกว้างขึ้น โดนหลายตัวพร้อมกัน', icon: 'rock' },
];

class Weapon {
  constructor() { this.reset(); }

  reset() {
    this.level = 1;
    this.count = CFG.WEAPON.baseCount;
    this.pierce = CFG.WEAPON.basePierce;
    this.gap = CFG.WEAPON.baseGap;
    this.cool = 0.35;
    this.boomerang = false;    // อัปเกรด "ดาวบูมเมอแรง" — ดาววกกลับมาหาตัวหลังบินสุดระยะ
    this.orbitCount = 0;       // อัปเกรด "วงแหวนป้องกัน" — จำนวนดาวที่ลอยประกบตัวตลอดเวลา
  }

  /** เรียกทุกเฟรม ให้ดาววงแหวนหมุนรอบตัวและฟันศัตรูที่เข้าใกล้ */
  updateOrbit(dt, hero, arena, now) {
    if (this.orbitCount <= 0) return;
    this.orbitT = (this.orbitT || 0) + dt * 2.4;
    for (let i = 0; i < this.orbitCount; i++) {
      const a = this.orbitT + (i / this.orbitCount) * Math.PI * 2;
      const x = hero.x + Math.cos(a) * 70;
      const y = hero.hitY + Math.sin(a) * 70;
      for (const e of arena.enemies) {
        const er = e.boss ? CFG.BOSS.r : (CFG.ENEMY_TYPES[e.kind].r || CFG.ENEMY_R);
        if (Math.hypot(e.x - x, e.y - y) > CFG.STAR_R + er) continue;
        e.orbitHitAt = e.orbitHitAt || 0;
        if (now - e.orbitHitAt < 0.4) continue;   // กันฟันรัวเกิน
        e.orbitHitAt = now;
        e.hp -= 1;
        e.hurtT = 0.12;
        if (e.hp <= 0) arena.killEnemy(e);
      }
    }
    arena.enemies = arena.enemies.filter((e) => e.hp > 0);
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

  apply(id, hero, skills) {
    if (id.startsWith('sk_')) { skills.levelUp(id.slice(3)); return; }
    this.level += 1;
    if (id === 'count') this.count += 1;
    else if (id === 'rate') this.gap = Math.max(CFG.WEAPON.gapMin, this.gap - CFG.WEAPON.gapPerLevel);
    else if (id === 'pierce') this.pierce += 1;
    else if (id === 'magnet') hero.magnet = Math.round(hero.magnet * 1.4);
    else if (id === 'speed') hero.speed = Math.round(hero.speed * 1.12);
    else if (id === 'boomerang') this.boomerang = true;
    else if (id === 'orbit') this.orbitCount += 1;
    else if (id === 'melee_dmg') hero.meleeDmg += 1;
    else if (id === 'melee_range') hero.meleeRange = Math.round(hero.meleeRange * 1.12);
    else if (id === 'melee_rate') hero.meleeCoolBase = Math.max(0.26, hero.meleeCoolBase - 0.05);
    else if (id === 'melee_arc') hero.meleeArc = Math.min(Math.PI * 1.3, hero.meleeArc + 0.16);
  }

  /** ยิงเมื่อกดคลิกซ้ายค้างไว้ เล็งไปทางเคอร์เซอร์ (aim = พิกัดในโลก) */
  update(dt, hero, arena, firing, aim, now) {
    this.updateOrbit(dt, hero, arena, now);
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
        life: this.boomerang ? CFG.STAR_LIFE * 2 : CFG.STAR_LIFE,
        pierce: this.pierce,
        hits: new Set(),
        boomerang: this.boomerang,
        returning: false,
        owner: hero,
      });
    }
    sfx.star();
  }
}

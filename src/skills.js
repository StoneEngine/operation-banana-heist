// สกิล 3 อย่างของจ๋อจิ๋ว — กดปุ่ม มีคูลดาวน์ อัปเกรดได้จากการ์ด
const SKILL_DEFS = {
  bomb: {
    key: 'Q', name: 'ระเบิดกล้วย', icon: 'banana_gold',
    desc: 'ระเบิดรอบตัว ฟันทุกอย่างในวง',
    cool: (lv) => Math.max(3.0, 7.5 - lv * 0.7),
    radius: (lv) => 140 + lv * 26,
    dmg: (lv) => 1 + Math.floor(lv / 2),
  },
  dash: {
    key: 'E', name: 'พุ่งตัว', icon: 'hero',
    desc: 'พุ่งไปข้างหน้า อมตะระหว่างพุ่ง',
    cool: (lv) => Math.max(1.4, 4.0 - lv * 0.35),
    power: (lv) => 900 + lv * 90,
    iframe: (lv) => 0.45 + lv * 0.06,
  },
  storm: {
    key: 'R', name: 'พายุดาว', icon: 'star',
    desc: 'ยิงดาวกระจายรอบตัวทุกทิศ',
    cool: (lv) => Math.max(5.0, 13 - lv * 1.1),
    count: (lv) => 10 + lv * 3,
  },
};

class Skills {
  constructor() { this.reset(); }

  reset() {
    this.lv = { bomb: 1, dash: 1, storm: 1 };
    this.cd = { bomb: 0, dash: 0, storm: 0 };
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

    if (id === 'bomb') {
      const r = def.radius(lv);
      const dmg = def.dmg(lv);
      for (const e of arena.enemies) {
        if (Math.hypot(e.x - hero.x, e.y - hero.hitY) > r) continue;
        e.hp -= dmg;
        e.hurtT = 0.16;
        if (e.hp <= 0) {
          arena.kills += 1;
          arena.dropBananas(e.x, e.y, e.boss ? CFG.BOSS.drop : CFG.ENEMY_TYPES[e.kind].drop);
          fx.puff(e.x, e.y, e.kind === 'ghost');
          if (e.boss) { arena.bossDead = true; fx.text(e.x, e.y - 80, 'ล้มบอสคองได้!', '#ffd94a', 48); }
        }
      }
      arena.enemies = arena.enemies.filter((e) => e.hp > 0);
      // ระเบิดล้างหินที่บินอยู่ในวงด้วย (ของบอสก็ล้างได้ ต่างจากการสะท้อน)
      arena.rocks = arena.rocks.filter((k) => Math.hypot(k.x - hero.x, k.y - hero.hitY) > r);
      fx.blast(hero.x, hero.hitY, r);
      fx.shake = 10;
      sfx.bomb();
      return true;
    }

    if (id === 'dash') {
      const dx = hero.mvx || (hero.dir === 'side' ? hero.face : 0);
      const dy = hero.mvy || (hero.dir === 'down' ? 1 : (hero.dir === 'up' ? -1 : 0));
      const d = Math.hypot(dx, dy) || 1;
      hero.kx = (dx / d) * def.power(lv);
      hero.ky = (dy / d) * def.power(lv);
      hero.iframe = Math.max(hero.iframe, def.iframe(lv));
      fx.dashTrail(hero.x, hero.y);
      sfx.dash();
      return true;
    }

    // storm
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
    sfx.storm();
    return true;
  }
}

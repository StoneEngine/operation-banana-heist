// ทุกอย่างที่วิ่งอยู่ในสนาม: ลิงลูกน้องที่ไล่เรา, ก้อนหินที่มันปา, กล้วยที่ตกตามพื้น
class Arena {
  constructor() { this.reset(); }

  reset() {
    this.enemies = [];
    this.rocks = [];
    this.bananas = [];
    this.spawnT = CFG.SPAWN_FIRST;
    this.bananaT = 0.2;
  }

  // ---------- เกิดของ ----------
  spawnEnemy() {
    // โผล่จากนอกจอสุ่มด้าน แล้ววิ่งเข้ามา
    const side = Math.floor(Math.random() * 4);
    const m = 40;
    let x, y;
    if (side === 0) { x = rand(0, CFG.W); y = -m; }
    else if (side === 1) { x = rand(0, CFG.W); y = CFG.H + m; }
    else if (side === 2) { x = -m; y = rand(0, CFG.H); }
    else { x = CFG.W + m; y = rand(0, CFG.H); }
    this.enemies.push({
      x, y,
      speed: rand(...CFG.ENEMY_SPEED),
      rockT: rand(...CFG.ROCK_GAP),
      dir: 'down', face: 1, anim: Math.random() * 4,
    });
  }

  spawnBanana() {
    const a = CFG.ARENA;
    this.bananas.push({
      x: rand(a.left + 20, a.right - 20),
      y: rand(a.top + 20, a.bottom - 20),
      gold: Math.random() < CFG.GOLD_CHANCE,
      life: CFG.BANANA_LIFE,
      t: Math.random() * 6,
    });
  }

  // ---------- ลูป ----------
  update(dt, hero, round) {
    this.tickSpawns(dt, round);
    this.moveEnemies(dt, hero);
    this.moveRocks(dt);
    this.moveBananas(dt, hero);
  }

  tickSpawns(dt, round) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length < CFG.ENEMY_MAX) {
      const gap = Math.max(CFG.SPAWN_GAP_MIN,
        rand(...CFG.SPAWN_GAP) - round.elapsed * CFG.SPAWN_SPEEDUP);
      this.spawnT = gap;
      this.spawnEnemy();
    }
    this.bananaT -= dt;
    if (this.bananaT <= 0) {
      this.bananaT = rand(...CFG.BANANA_GAP);
      if (this.bananas.length < CFG.BANANA_MAX) this.spawnBanana();
    }
  }

  moveEnemies(dt, hero) {
    for (const e of this.enemies) {
      const dx = hero.x - e.x;
      const dy = hero.hitY - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
      e.anim += dt * 6;
      if (Math.abs(dx) > Math.abs(dy) * 0.8) {
        e.dir = 'side';
        e.face = dx > 0 ? 1 : -1;
      } else {
        e.dir = dy > 0 ? 'down' : 'up';
      }

      e.rockT -= dt;
      if (e.rockT <= 0 && d < CFG.ROCK_RANGE) {
        e.rockT = rand(...CFG.ROCK_GAP);
        this.rocks.push({
          x: e.x, y: e.y,
          vx: (dx / d) * CFG.ROCK_SPEED,
          vy: (dy / d) * CFG.ROCK_SPEED,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 12,
        });
        sfx.throwRock();
      }
    }
    // ลิงเบียดกันเอง ไม่ให้ซ้อนเป็นก้อนเดียว
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i], b = this.enemies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = CFG.ENEMY_R * 2;
        if (d > 0 && d < min) {
          const push = (min - d) / 2;
          a.x -= (dx / d) * push; a.y -= (dy / d) * push;
          b.x += (dx / d) * push; b.y += (dy / d) * push;
        }
      }
    }
  }

  moveRocks(dt) {
    for (const r of this.rocks) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.rot += r.vr * dt;
    }
    this.rocks = this.rocks.filter((r) => r.x > -60 && r.x < CFG.W + 60 && r.y > -60 && r.y < CFG.H + 60);
  }

  moveBananas(dt, hero) {
    for (const b of this.bananas) {
      b.life -= dt;
      b.t += dt;
      // เข้าใกล้แล้วดูดเข้าหาตัว (แบบ orb)
      const dx = hero.x - b.x;
      const dy = hero.hitY - b.y;
      const d = Math.hypot(dx, dy);
      if (d < CFG.MAGNET_R) {
        const pull = (1 - d / CFG.MAGNET_R) * 620;
        b.x += (dx / (d || 1)) * pull * dt;
        b.y += (dy / (d || 1)) * pull * dt;
      }
    }
    this.bananas = this.bananas.filter((b) => b.life > 0);
  }

  // ---------- ชน ----------
  /** เก็บกล้วยที่ทับ — คืนแต้มรวมที่ได้ */
  collect(hero) {
    let gain = 0;
    for (let i = this.bananas.length - 1; i >= 0; i--) {
      const b = this.bananas[i];
      if (Math.hypot(hero.x - b.x, hero.hitY - b.y) <= CFG.BANANA_R + CFG.HERO_R) {
        gain += b.gold ? CFG.GOLD_VALUE : 1;
        fx.pop(b.x, b.y, b.gold);
        if (b.gold) sfx.gold(); else sfx.pick();
        this.bananas.splice(i, 1);
      }
    }
    return gain;
  }

  /** โดนหินหรือโดนลิงชน — คืนจุดที่ชน (สำหรับเด้งถอย) หรือ null */
  hitTest(hero) {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      if (hero.hitBy(r.x, r.y, CFG.ROCK_R)) {
        this.rocks.splice(i, 1);
        return { x: r.x, y: r.y, kind: 'หินโดน!' };
      }
    }
    for (const e of this.enemies) {
      if (hero.hitBy(e.x, e.y, CFG.ENEMY_R)) return { x: e.x, y: e.y, kind: 'โดนจับ!' };
    }
    return null;
  }
}

// ทุกอย่างที่วิ่งอยู่ในโลก: ศัตรู 3 แบบ, ก้อนหินที่มันปา, ดาวกระจายของเรา, กล้วยที่ตกตามพื้น
class Arena {
  constructor() { this.reset(); }

  reset() {
    this.enemies = [];
    this.rocks = [];
    this.stars = [];
    this.bananas = [];
    this.traps = [];
    this.spawnT = CFG.SPAWN_FIRST;
    this.trapT = CFG.TRAP_AFTER;
    this.bananaT = 0.2;
    this.kills = 0;
    this.bossOut = false;
    this.bossDead = false;
  }

  /** บอสคองโผล่ครั้งเดียว ตอนเก็บกล้วยครบ CFG.BOSS_AT */
  spawnBoss(hero, cam) {
    this.bossOut = true;
    const B = CFG.BOSS;
    this.enemies.push({
      kind: 'boss', boss: true,
      x: clampNum(hero.x + rand(-1, 1) * 420, 60, CFG.WORLD.w - 60),
      y: clampNum(hero.y - 420, 60, CFG.WORLD.h - 60),
      hp: B.hp, maxHp: B.hp,
      speed: B.speed,
      rockT: rand(...B.gap),
      hurtT: 0, dir: 'down', face: 1, anim: 0,
    });
    fx.text(hero.x, hero.hitY - 120, 'บอสคองมาแล้ว!', '#ff4b3e', 54);
    sfx.bossReveal();
  }

  // ---------- เกิดของ ----------
  /** สุ่มชนิดศัตรูตามน้ำหนัก เฉพาะชนิดที่ถึงเวลาโผล่แล้ว */
  pickType(elapsed) {
    const pool = Object.entries(CFG.ENEMY_TYPES).filter(([, t]) => elapsed >= t.after);
    const total = pool.reduce((s, [, t]) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const [kind, t] of pool) {
      r -= t.weight;
      if (r <= 0) return kind;
    }
    return 'grunt';
  }

  /** เกิดนอกขอบจอที่กล้องเห็น จะได้ไม่โผล่ต่อหน้าผู้เล่น */
  spawnEnemy(hero, cam, elapsed) {
    const kind = this.pickType(elapsed);
    const t = CFG.ENEMY_TYPES[kind];
    const m = 70;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = cam.x + rand(0, CFG.W); y = cam.y - m; }
    else if (side === 1) { x = cam.x + rand(0, CFG.W); y = cam.y + CFG.H + m; }
    else if (side === 2) { x = cam.x - m; y = cam.y + rand(0, CFG.H); }
    else { x = cam.x + CFG.W + m; y = cam.y + rand(0, CFG.H); }
    this.enemies.push({
      kind, x, y,
      hp: t.hp,
      speed: rand(...t.speed),
      rockT: t.rock ? rand(...t.rock) : 0,
      hurtT: 0,
      dir: 'down', face: 1, anim: Math.random() * 4,
    });
  }

  spawnBanana(hero) {
    const a = rand(0, Math.PI * 2);
    const d = rand(120, CFG.BANANA_SPAWN_R);
    this.bananas.push({
      x: clampNum(hero.x + Math.cos(a) * d, 30, CFG.WORLD.w - 30),
      y: clampNum(hero.y + Math.sin(a) * d, 30, CFG.WORLD.h - 30),
      gold: Math.random() < CFG.GOLD_CHANCE,
      life: CFG.BANANA_LIFE,
      t: Math.random() * 6,
    });
  }

  /** กล้วยที่ศัตรูทิ้งไว้ตอนตาย — ตกตรงจุดที่ตาย */
  dropBananas(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.bananas.push({
        x: x + rand(-26, 26), y: y + rand(-20, 20),
        gold: Math.random() < CFG.GOLD_CHANCE,
        life: CFG.BANANA_LIFE, t: Math.random() * 6,
      });
    }
  }

  // ---------- ลูป ----------
  update(dt, hero, round, cam, weapon, firing, aim) {
    this.tickSpawns(dt, hero, round, cam);
    this.moveEnemies(dt, hero);
    this.moveRocks(dt);
    this.tickParry(hero);
    this.moveStars(dt);
    this.moveBananas(dt, hero);
    weapon.update(dt, hero, this, firing, aim);
  }

  tickSpawns(dt, hero, round, cam) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length < CFG.ENEMY_MAX) {
      this.spawnT = Math.max(CFG.SPAWN_GAP_MIN,
        rand(...CFG.SPAWN_GAP) - round.elapsed * CFG.SPAWN_SPEEDUP);
      const n = round.elapsed >= CFG.SPAWN_BATCH_AT ? 2 : 1;
      for (let i = 0; i < n; i++) this.spawnEnemy(hero, cam, round.elapsed);
    }
    this.bananaT -= dt;
    if (this.bananaT <= 0) {
      this.bananaT = rand(...CFG.BANANA_GAP);
      if (this.bananas.length < CFG.BANANA_MAX) this.spawnBanana(hero);
    }
    // กับดักวางนิ่ง ไม่วางทับตัวผู้เล่น
    this.trapT -= dt;
    if (this.trapT <= 0) {
      this.trapT = rand(...CFG.TRAP_GAP);
      if (this.traps.length < CFG.TRAP_MAX) {
        const a = rand(0, Math.PI * 2);
        const d = rand(...CFG.TRAP_SPAWN_R);
        this.traps.push({
          x: clampNum(hero.x + Math.cos(a) * d, 40, CFG.WORLD.w - 40),
          y: clampNum(hero.y + Math.sin(a) * d, 40, CFG.WORLD.h - 40),
          hp: 1,
        });
      }
    }
  }

  /** ท่าบอส: สลับ "ปาหินกระจายรอบตัว" กับ "ก้อนใหญ่ลูกเดียว" */
  bossAttack(e, hero) {
    const B = CFG.BOSS;
    e.useBig = !e.useBig;
    if (e.useBig) {
      const dx = hero.x - e.x, dy = hero.hitY - e.y;
      const d = Math.hypot(dx, dy) || 1;
      this.rocks.push({
        x: e.x, y: e.y, big: true, boss: true, r: B.bigR,
        vx: (dx / d) * B.bigSpeed, vy: (dy / d) * B.bigSpeed,
        rot: 0, vr: 5, t: 0,
      });
      sfx.bossBig();
    } else {
      for (let i = 0; i < B.fanCount; i++) {
        const a = (i / B.fanCount) * Math.PI * 2 + Math.random() * 0.2;
        this.rocks.push({
          x: e.x, y: e.y, r: CFG.ROCK_R, boss: true,
          vx: Math.cos(a) * B.fanSpeed, vy: Math.sin(a) * B.fanSpeed,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, t: 0,
        });
      }
      sfx.throwRock();
    }
  }

  moveEnemies(dt, hero) {
    for (const e of this.enemies) {
      if (e.boss) {
        const B = CFG.BOSS;
        e.hurtT = Math.max(0, e.hurtT - dt);
        const dx = hero.x - e.x, dy = hero.hitY - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * B.speed * dt;
        e.y += (dy / d) * B.speed * dt;
        e.face = dx > 0 ? 1 : -1;
        e.rockT -= dt;
        if (e.rockT <= 0) {
          e.rockT = rand(...B.gap);
          this.bossAttack(e, hero);
        }
        continue;
      }
      const t = CFG.ENEMY_TYPES[e.kind];
      e.hurtT = Math.max(0, e.hurtT - dt);
      const dx = hero.x - e.x;
      const dy = hero.hitY - e.y;
      const d = Math.hypot(dx, dy) || 1;

      // ตัวปาหินจะถอยรักษาระยะ ไม่เข้าประชิด
      let move = 1;
      if (t.keep) move = d > t.keep ? 1 : (d < t.keep * 0.7 ? -1 : 0);
      e.x += (dx / d) * e.speed * dt * move;
      e.y += (dy / d) * e.speed * dt * move;
      if (t.wiggle) {                       // แมงสาบวิ่งส่ายไปมา ไม่พุ่งตรง
        e.wob = (e.wob || Math.random() * 6) + dt * 9;
        e.x += (-dy / d) * Math.sin(e.wob) * e.speed * dt * t.wiggle * 0.4;
        e.y += (dx / d) * Math.sin(e.wob) * e.speed * dt * t.wiggle * 0.4;
      }

      e.anim += dt * (e.kind === 'ghost' ? 3 : (e.kind === 'roach' ? 12 : 6));
      if (Math.abs(dx) > Math.abs(dy) * 0.8) {
        e.dir = 'side';
        e.face = dx > 0 ? 1 : -1;
      } else {
        e.dir = dy > 0 ? 'down' : 'up';
      }

      if (t.rock) {
        e.rockT -= dt;
        if (e.rockT <= 0 && d < CFG.ROCK_RANGE) {
          e.rockT = rand(...t.rock);
          this.rocks.push({
            x: e.x, y: e.y, r: CFG.ROCK_R, t: 0,
            vx: (dx / d) * CFG.ROCK_SPEED,
            vy: (dy / d) * CFG.ROCK_SPEED,
            rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
          });
          sfx.throwRock();
        }
      }
    }
    // เบียดกันเอง ไม่ให้ซ้อนเป็นก้อนเดียว (ผีทะลุกันได้)
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i], b = this.enemies[j];
        if (a.kind === 'ghost' || b.kind === 'ghost' || a.boss || b.boss) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dd = Math.hypot(dx, dy);
        const min = CFG.ENEMY_R * 2;
        if (dd > 0 && dd < min) {
          const push = (min - dd) / 2;
          a.x -= (dx / dd) * push; a.y -= (dy / dd) * push;
          b.x += (dx / dd) * push; b.y += (dy / dd) * push;
        }
      }
    }
  }

  moveRocks(dt) {
    for (const r of this.rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; r.t = (r.t || 0) + dt; }
    this.rocks = this.rocks.filter((r) => r.t < 3.2);
  }

  moveStars(dt) {
    for (const s of this.stars) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += dt * 22;
      s.life -= dt;
      // ชนศัตรู
      // ดาวทำลายกับดักได้ด้วย
      for (let i = this.traps.length - 1; i >= 0; i--) {
        const tr = this.traps[i];
        if (Math.hypot(tr.x - s.x, tr.y - s.y) <= CFG.STAR_R + CFG.TRAP_R) {
          this.traps.splice(i, 1);
          fx.puff(tr.x, tr.y, false);
          sfx.kill();
          s.pierce -= 1;
          if (s.pierce <= 0) s.life = 0;
        }
      }
      for (const e of this.enemies) {
        const er = e.boss ? CFG.BOSS.r : (CFG.ENEMY_TYPES[e.kind].r || CFG.ENEMY_R);
        if (e.hp <= 0 || s.hits.has(e)) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) <= CFG.STAR_R + er) {
          s.hits.add(e);
          e.hp -= 1;
          e.hurtT = 0.16;
          if (e.hp <= 0) {
            this.kills += 1;
            this.dropBananas(e.x, e.y, e.boss ? CFG.BOSS.drop : CFG.ENEMY_TYPES[e.kind].drop);
            fx.puff(e.x, e.y, e.kind === 'ghost');
            if (e.boss) {
              this.bossDead = true;
              fx.text(e.x, e.y - 80, 'ล้มบอสคองได้!', '#ffd94a', 48);
            }
            sfx.kill();
          } else {
            sfx.ping();
          }
          s.pierce -= 1;
          if (s.pierce <= 0) s.life = 0;
        }
      }
    }
    this.stars = this.stars.filter((s) => s.life > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  moveBananas(dt, hero) {
    for (const b of this.bananas) {
      b.life -= dt;
      b.t += dt;
      const dx = hero.x - b.x;
      const dy = hero.hitY - b.y;
      const d = Math.hypot(dx, dy);
      if (d < hero.magnet) {                         // เข้าใกล้แล้ววิ่งเข้าหาเราเอง (แบบ orb)
        const pull = (1 - d / hero.magnet) * 620;
        b.x += (dx / (d || 1)) * pull * dt;
        b.y += (dy / (d || 1)) * pull * dt;
      }
    }
    this.bananas = this.bananas.filter((b) => b.life > 0);
  }

  /** กำลังตั้งท่าสะท้อน: หินธรรมดารอบตัวกลายเป็นดาวพุ่งกลับ · ก้อนของบอสสะท้อนไม่ได้ */
  tickParry(hero) {
    if (!hero.parrying) return;
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      if (Math.hypot(r.x - hero.x, r.y - hero.hitY) > CFG.PARRY.radius) continue;
      if (r.boss) {
        if (!r.warned) {
          r.warned = true;
          fx.text(r.x, r.y - 30, 'สะท้อนไม่ได้!', '#ff8b7a', 26);
        }
        continue;
      }
      const d = Math.hypot(r.vx, r.vy) || 1;
      this.stars.push({
        x: r.x, y: r.y,
        vx: (-r.vx / d) * CFG.STAR_SPEED,
        vy: (-r.vy / d) * CFG.STAR_SPEED,
        rot: 0, life: CFG.STAR_LIFE, pierce: 2, hits: new Set(),
      });
      this.rocks.splice(i, 1);
      fx.sparkle(r.x, r.y);
      sfx.parry();
    }
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

  /** โดนหินหรือโดนศัตรูชน — คืนจุดที่ชน หรือ null */
  hitTest(hero) {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      if (hero.hitBy(r.x, r.y, r.r || CFG.ROCK_R)) {
        this.rocks.splice(i, 1);
        return { x: r.x, y: r.y, kind: r.big ? 'ก้อนใหญ่!' : 'หินโดน!' };
      }
    }
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const tr = this.traps[i];
      if (hero.hitBy(tr.x, tr.y, CFG.TRAP_R)) {
        this.traps.splice(i, 1);            // เหยียบแล้วกับดักหนีบจนพัง
        return { x: tr.x, y: tr.y, kind: 'ติดกับดัก!' };
      }
    }
    const NAME = { ghost: 'ผีแตะ!', spider: 'แมงมุมกัด!', roach: 'แมงสาบชน!' };
    for (const e of this.enemies) {
      if (hero.hitBy(e.x, e.y, e.boss ? CFG.BOSS.r : (CFG.ENEMY_TYPES[e.kind].r || CFG.ENEMY_R))) {
        if (e.boss) return { x: e.x, y: e.y, kind: 'บอสชน!' };
        return { x: e.x, y: e.y, kind: NAME[e.kind] || 'โดนจับ!' };
      }
    }
    return null;
  }
}

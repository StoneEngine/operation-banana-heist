// วาดโลก top-down พร้อมกล้องตามตัว: พื้นแบ่งโซน, ของตกแต่ง, กล้วย, ศัตรู, บอส, ดาว, HUD
const SPRITES = {
  ground_tile: 'ground_tile.png',
  ground_dirt: 'ground_dirt.png',
  ground_sand: 'ground_sand.png',
  ground_dark: 'ground_dark.png',
  bush: 'bush.png',
  stone: 'stone.png',
  rock: 'rock.png',
  star: 'star.png',
  sword: 'sword.png',
  banana: 'banana.png',
  banana_gold: 'banana_gold.png',
  banana_peel: 'banana_peel.png',
  hero: 'hero.png',
  hero_walk: 'hero_walk.png',
  enemy_walk: 'enemy_walk.png',
  ghost_walk: 'ghost_walk.png',
  spider_walk: 'spider_walk.png',
  roach_walk: 'roach_walk.png',
  trap: 'trap.png',
  monkey_sleep: 'monkey_sleep.png',
  monkey_awake: 'monkey_awake.png',
  monkey_caught: 'monkey_caught.png',
  basket: 'basket.png',
};

const img = {};

// sprite sheet: เรียง down0 down1 side0 side1 up0 up1 (ดู assets/src/build_top.py)
const FRAMES = {
  hero_walk: { w: 32, h: 32, cols: 6 },
  enemy_walk: { w: 24, h: 24, cols: 6 },
  ghost_walk: { w: 24, h: 24, cols: 6 },
  spider_walk: { w: 24, h: 24, cols: 6 },
  roach_walk: { w: 20, h: 20, cols: 6 },
};
const DIR_ROW = { down: 0, side: 2, up: 4 };

// ?hitbox=1 ท้าย URL = โชว์วง hitbox ทั้งหมด (ไว้จูน/ดีบั๊ก)
const SHOW_HITBOX = typeof location !== 'undefined' && /[?&]hitbox=1/.test(location.search);

function loadSprites() {
  const jobs = Object.entries(SPRITES).map(([key, file]) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { img[key] = im; res(); };
    im.onerror = () => rej(new Error('โหลดไม่ได้: ' + file));
    im.src = './assets/sprites/' + file;
  }));
  return Promise.all(jobs);
}

// ---------- โซนพื้น: แบ่งโลกเป็นตาราง แต่ละช่องพื้นคนละแบบ ----------
const ZONE_TILES = ['ground_tile', 'ground_dirt', 'ground_dark', 'ground_sand'];
const ZONES = [];
const DECOR = [];
(function seedWorld() {
  let s = 20260813;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let r = 0; r < CFG.ZONE_ROWS; r++) {
    ZONES[r] = [];
    for (let c = 0; c < CFG.ZONE_COLS; c++) {
      // ช่องกลางเป็นหญ้าเสมอ (จุดเริ่มเกม) ที่เหลือสุ่มโซน
      const mid = r === (CFG.ZONE_ROWS >> 1) && c === (CFG.ZONE_COLS >> 1);
      ZONES[r][c] = mid ? 'ground_tile' : ZONE_TILES[Math.floor(rnd() * ZONE_TILES.length)];
    }
  }
  for (let i = 0; i < 90; i++) {
    DECOR.push({
      kind: rnd() < 0.55 ? 'bush' : 'stone',
      x: 40 + rnd() * (CFG.WORLD.w - 80),
      y: 40 + rnd() * (CFG.WORLD.h - 80),
    });
  }
}());

const ZONE_W = () => CFG.WORLD.w / CFG.ZONE_COLS;
const ZONE_H = () => CFG.WORLD.h / CFG.ZONE_ROWS;

// ---------- เอฟเฟกต์ ----------
const fx = {
  texts: [], pops: [], sparks: [], puffs: [], blasts: [], trails: [], swings: [], shake: 0, flash: 0,

  reset() {
    this.texts = []; this.pops = []; this.sparks = []; this.puffs = [];
    this.blasts = []; this.trails = []; this.swings = []; this.shake = 0; this.flash = 0;
  },

  text(x, y, msg, color = '#fff1e0', size = 30) {
    this.texts.push({ x, y, msg, color, size, life: 0.9, max: 0.9 });
  },
  pop(x, y, gold) { this.pops.push({ x, y, gold, life: 0.32, max: 0.32 }); },
  puff(x, y, ghost) { this.puffs.push({ x, y, ghost, life: 0.4, max: 0.4 }); },
  blast(x, y, r) { this.blasts.push({ x, y, r, life: 0.35, max: 0.35 }); },
  dashTrail(x, y) { this.trails.push({ x, y, life: 0.3, max: 0.3 }); },
  /** ฟันดาบประชิด (คลิกขวา) — เสี้ยววงพระจันทร์สีทองพาดตามทิศ */
  meleeSwing(x, y, angle, range, arc) { this.swings.push({ x, y, angle, range, arc, life: 0.22, max: 0.22 }); },
  sparkle(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this.sparks.push({ x, y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 0.45 });
    }
  },
  /** ล้มบอสคองได้ — ฉลองใหญ่: วงแหวนทองซ้อน 3 ชั้น + สะเก็ดทองกระจายรอบทิศ + กล้วยปลิวว่อน */
  celebrate(x, y) {
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      this.sparks.push({ x, y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, life: 0.9 });
    }
    for (let i = 0; i < 3; i++) {
      const life = 0.7 + i * 0.15;
      this.blasts.push({ x, y, r: 160 + i * 40, life, max: life });
    }
    for (let i = 0; i < 10; i++) {
      this.pops.push({ x: x + rand(-60, 60), y: y + rand(-50, 10), gold: Math.random() < 0.5, life: 1.0, max: 1.0 });
    }
  },

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 3);
    for (const t of this.texts) { t.life -= dt; t.y -= dt * 70; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const p of this.pops) p.life -= dt;
    this.pops = this.pops.filter((p) => p.life > 0);
    for (const p of this.puffs) p.life -= dt;
    this.puffs = this.puffs.filter((p) => p.life > 0);
    for (const b of this.blasts) b.life -= dt;
    this.blasts = this.blasts.filter((b) => b.life > 0);
    for (const t of this.trails) t.life -= dt;
    this.trails = this.trails.filter((t) => t.life > 0);
    for (const w of this.swings) w.life -= dt;
    this.swings = this.swings.filter((w) => w.life > 0);
    for (const s of this.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  },
};

// ---------- ตัวช่วยวาด ----------
function pxFrame(ctx, key, index, cx, cy, scale, flip = false) {
  const f = FRAMES[key];
  const col = index % f.cols;
  const w = f.w * scale;
  const h = f.h * scale;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img[key], col * f.w, 0, f.w, f.h, Math.round(-w / 2), Math.round(-h), w, h);
  ctx.restore();
}

function label(ctx, text, x, y, { size = 26, color = '#fff1e0', align = 'left', weight = 700 } = {}) {
  ctx.font = `${weight} ${size}px "Segoe UI", Tahoma, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = '#2b1b13';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function panel(ctx, x, y, w, h, fill = 'rgba(28,20,14,0.72)') {
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#2b1b13';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

function ring(ctx, x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** หลอดเลือดเล็กๆ ลอยเหนือหัว */
function hpBar(ctx, x, y, w, ratio, color = '#4dff9f') {
  const h = 6;
  ctx.fillStyle = 'rgba(20,14,10,0.8)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), h);
}

function shadow(ctx, x, y, rx) {
  ctx.fillStyle = 'rgba(18,26,14,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- ฉากหลัก ----------
function draw(ctx, game) {
  const { player, arena, cam, time } = game;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (fx.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  }
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  drawGround(ctx, cam);

  // เรียงตาม y ให้ของที่อยู่ล่างทับของที่อยู่บน = ได้ความลึกแบบ top-down
  const actors = [];
  for (const d of DECOR) {
    if (offCam(d.x, d.y, cam, 60)) continue;
    actors.push({ y: d.y, draw: () => ctx.drawImage(img[d.kind], Math.round(d.x - 24), Math.round(d.y - 24), 48, 48) });
  }
  for (const tr of arena.traps) {
    if (offCam(tr.x, tr.y, cam, 60)) continue;
    actors.push({ y: tr.y - 1, draw: () => drawTrap(ctx, tr) });
  }
  for (const b of arena.bananas) actors.push({ y: b.y, draw: () => drawBanana(ctx, b) });
  for (const e of arena.enemies) actors.push({ y: e.y, draw: () => drawEnemy(ctx, e) });
  actors.push({ y: player.y, draw: () => drawHero(ctx, player, time) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  for (const r of arena.rocks) drawRock(ctx, r);
  for (const s of arena.stars) drawStar(ctx, s);
  drawOrbit(ctx, player, game.weapon);

  drawFx(ctx);
  ctx.restore();

  if (game.running) drawHud(ctx, game);

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(214,60,50,${Math.min(0.55, fx.flash * 0.5)})`;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
  }
}

function offCam(x, y, cam, m = 40) {
  return x < cam.x - m || x > cam.x + CFG.W + m || y < cam.y - m || y > cam.y + CFG.H + m;
}

function drawGround(ctx, cam) {
  const t = 64;                                  // กระเบื้อง 32px วาดที่ 64px
  const zw = ZONE_W(), zh = ZONE_H();
  const x0 = Math.floor(cam.x / t) * t;
  const y0 = Math.floor(cam.y / t) * t;
  for (let y = y0; y < cam.y + CFG.H + t; y += t) {
    for (let x = x0; x < cam.x + CFG.W + t; x += t) {
      const c = clampNum(Math.floor(x / zw), 0, CFG.ZONE_COLS - 1);
      const r = clampNum(Math.floor(y / zh), 0, CFG.ZONE_ROWS - 1);
      ctx.drawImage(img[ZONES[r][c]], x, y, t, t);
    }
  }
  // ขอบโลก = แถบมืด บอกว่าเดินต่อไม่ได้
  ctx.fillStyle = 'rgba(12,18,10,0.55)';
  if (cam.x < 30) ctx.fillRect(0, cam.y, 30 - cam.x, CFG.H);
  if (cam.y < 40) ctx.fillRect(cam.x, 0, CFG.W, 40 - cam.y);
  const rEdge = CFG.WORLD.w - 30;
  const bEdge = CFG.WORLD.h - 20;
  if (cam.x + CFG.W > rEdge) ctx.fillRect(rEdge, cam.y, cam.x + CFG.W - rEdge, CFG.H);
  if (cam.y + CFG.H > bEdge) ctx.fillRect(cam.x, bEdge, CFG.W, cam.y + CFG.H - bEdge);
}

function drawHero(ctx, hero, time) {
  shadow(ctx, hero.x, hero.y, 18);
  const step = hero.moving ? Math.floor(hero.anim) % 2 : 0;
  ctx.save();
  if (hero.iframe > 0) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(time * 26));
  pxFrame(ctx, 'hero_walk', DIR_ROW[hero.dir] + step, hero.x, hero.y + 6, CFG.HERO_SCALE,
    hero.dir === 'side' && hero.face < 0);
  ctx.restore();

  if (SHOW_HITBOX) ring(ctx, hero.x, hero.hitY, CFG.HERO_R, '#4dff9f');
}

function drawEnemy(ctx, e) {
  if (e.boss) {
    const B = CFG.BOSS;
    shadow(ctx, e.x, e.y + 12, 46);
    ctx.save();
    ctx.translate(Math.round(e.x), Math.round(e.y));
    if (e.face < 0) ctx.scale(-1, 1);
    if (e.hurtT > 0) ctx.globalAlpha = 0.6;
    ctx.drawImage(img.monkey_awake, -B.size / 2, -B.size + 30, B.size, B.size);
    ctx.restore();
    hpBar(ctx, e.x, e.y - B.size + 20, 120, e.hp / e.maxHp, '#ff6b5a');
    if (SHOW_HITBOX) ring(ctx, e.x, e.y, B.r, '#ff4b3e');
    return;
  }

  const t = CFG.ENEMY_TYPES[e.kind];
  shadow(ctx, e.x, e.y + 14, 14);
  ctx.save();
  if (e.kind === 'ghost') ctx.globalAlpha = 0.78;
  if (e.hurtT > 0) ctx.globalAlpha = 0.45;
  pxFrame(ctx, t.sheet, DIR_ROW[e.dir] + (Math.floor(e.anim) % 2), e.x, e.y + 20, t.scale || CFG.ENEMY_SCALE,
    e.dir === 'side' && e.face < 0);
  ctx.restore();
  if (e.hp < t.hp) hpBar(ctx, e.x, e.y - 30, 30, e.hp / t.hp, '#ff6b5a');
  if (SHOW_HITBOX) ring(ctx, e.x, e.y, t.r || CFG.ENEMY_R, '#ff4b3e');
}

function drawTrap(ctx, tr) {
  ctx.drawImage(img.trap, Math.round(tr.x - 24), Math.round(tr.y - 22), 48, 48);
  if (SHOW_HITBOX) ring(ctx, tr.x, tr.y, CFG.TRAP_R, '#ffa23e');
}

function drawBanana(ctx, b) {
  const bob = Math.sin(b.t * 4) * 4;
  const fade = b.life < 2.5 ? 0.35 + 0.65 * Math.abs(Math.sin(b.life * 12)) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  shadow(ctx, b.x, b.y + 12, 12);
  if (b.gold) { ctx.shadowColor = '#ffe680'; ctx.shadowBlur = 18; }
  ctx.drawImage(b.gold ? img.banana_gold : img.banana, Math.round(b.x - 20), Math.round(b.y - 20 + bob), 40, 40);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, b.x, b.y, CFG.BANANA_R, '#ffd94a');
}

function drawRock(ctx, r) {
  const sz = r.big ? 68 : 28;
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.rot);
  ctx.drawImage(img.rock, -sz / 2, -sz / 2, sz, sz);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, r.x, r.y, r.r || CFG.ROCK_R, '#ff4b3e');
}

function drawOrbit(ctx, hero, weapon) {
  if (!weapon || weapon.orbitCount <= 0) return;
  const t = weapon.orbitT || 0;
  for (let i = 0; i < weapon.orbitCount; i++) {
    const a = t + (i / weapon.orbitCount) * Math.PI * 2;
    const x = hero.x + Math.cos(a) * 70;
    const y = hero.hitY + Math.sin(a) * 70;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 3);
    ctx.drawImage(img.star, -14, -14, 28, 28);
    ctx.restore();
  }
}

function drawStar(ctx, s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.drawImage(img.star, -16, -16, 32, 32);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, s.x, s.y, CFG.STAR_R, '#9fd8ff');
}

function drawFx(ctx) {
  for (const b of fx.blasts) {
    const t = 1 - b.life / b.max;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.6;
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * t, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const t of fx.trails) {
    ctx.save();
    ctx.globalAlpha = t.life / t.max * 0.5;
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const w of fx.swings) {
    const t = 1 - w.life / w.max;                    // 0 -> 1 ตลอดช่วงฟัน
    const half = w.arc / 2;
    const r = w.range * (0.75 + t * 0.25);
    const sweepT = Math.min(1, t / 0.6);              // สวิงจริงจบใน 60% แรก ที่เหลือคือจางหาย
    const sweepEnd = -half + w.arc * sweepT;          // ป้ายจากขอบล่างไล่ขึ้นไปขอบบน (ตามมุม -half -> +half)
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.angle);
    // เสี้ยววงกลมสีทอง ค่อยๆ กวาดจากขอบหนึ่งไปอีกขอบ ไม่ใช่โผล่มาเต็มพร้อมกัน
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -half, sweepEnd);
    ctx.closePath();
    ctx.fill();
    // ปลายดาบสว่างวาบ ไล่ตามจังหวะกวาด
    ctx.globalAlpha = (1 - t) * 0.95;
    ctx.strokeStyle = '#fff1e0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepEnd) * r, Math.sin(sweepEnd) * r);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of fx.puffs) {
    const t = 1 - p.life / p.max;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = p.ghost ? '#a9c6e8' : '#d9b38a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12 + t * 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const p of fx.pops) {
    const t = 1 - p.life / p.max;
    const sz = 40 + t * 34;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.drawImage(p.gold ? img.banana_gold : img.banana, p.x - sz / 2, p.y - sz / 2 - t * 26, sz, sz);
    ctx.restore();
  }
  for (const s of fx.sparks) {
    ctx.fillStyle = '#ffe680';
    ctx.globalAlpha = Math.max(0, s.life * 2);
    ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
    ctx.globalAlpha = 1;
  }
  for (const t of fx.texts) {
    ctx.globalAlpha = Math.min(1, t.life / (t.max * 0.5));
    label(ctx, t.msg, t.x, t.y, { size: t.size, color: t.color, align: 'center' });
    ctx.globalAlpha = 1;
  }
}

/** ช่องความสามารถ 1 อัน — ใช้ร่วมกันทั้งต่อย(Q)/พุ่ง(Space)/สกิลดาวกระจาย(R)
 * lv เป็น optional (มีแค่สกิลที่อัปเกรดได้ถึงจะโชว์ Lv) */
function abilitySlot(ctx, x, y, { key, icon, cool, cd, lv }) {
  const ready = cd <= 0;
  panel(ctx, x, y, 74, 74, ready ? 'rgba(58,44,20,0.85)' : 'rgba(20,14,10,0.85)');
  ctx.save();
  if (!ready) ctx.globalAlpha = 0.4;
  ctx.drawImage(img[icon], x + 15, y + 8, 44, 44);
  ctx.restore();
  label(ctx, key, x + 10, y + 12, { size: 15, color: '#ffd94a' });
  if (lv) label(ctx, `Lv${lv}`, x + 64, y + 12, { size: 13, align: 'right' });
  if (!ready) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, 74, 74 * (cd / cool));
    label(ctx, cd.toFixed(1), x + 37, y + 60, { size: 16, align: 'center', color: '#ff8b7a' });
  }
}

/** แถบความสามารถล่างกลางจอ: Space พุ่ง · R ดาวกระจาย (สกิลเดียว อัปเกรดได้) — ต่อยประชิดย้ายไปคลิกขวา ไม่มีคูลดาวน์โชว์แยก */
function drawAbilityBar(ctx, player, skills) {
  const slots = [
    { key: 'SPACE', icon: 'hero', cool: CFG.DASH.cool, cd: player.dashCool },
    { key: 'R', icon: 'star', cool: SKILL_DEFS.storm.cool(skills.lv.storm), cd: skills.cd.storm, lv: skills.lv.storm },
  ];
  const w = 74, gap = 8;
  const total = slots.length * w + (slots.length - 1) * gap;
  let x = CFG.W / 2 - total / 2;
  const y = CFG.H - 90;
  for (const s of slots) { abilitySlot(ctx, x, y, s); x += w + gap; }
}

// แถบควบคุมเกม — ตัวหนังสือชัดๆ ให้เด็กที่บูธเห็นแล้วเข้าใจทันทีว่าปุ่มไหนทำอะไร
const CONTROLS_LEGEND = 'WASD/ลูกศร เดิน   ·   คลิกซ้ายค้าง ยิงไกล   ·   คลิกขวา ต่อยประชิด   ·   SPACE พุ่งหนี   ·   R ดาวกระจาย(สกิล)';

function drawHud(ctx, { round, arena, player, weapon, skills }) {
  panel(ctx, 16, 14, 236, 58);
  ctx.drawImage(img.banana, 26, 22, 42, 42);
  label(ctx, `${round.bananas}`, 78, 44, { size: 34, color: '#ffd94a' });

  // นาฬิกาเดินขึ้น (ไม่มีจับเวลาแล้ว) + เป้าหมายถัดไป
  const s = Math.floor(round.elapsed);
  panel(ctx, CFG.W / 2 - 110, 14, 220, 58);
  const goal = arena.bossOut ? 'ล้มบอสคอง!' : `บอสที่ ${CFG.BOSS_AT} กล้วย`;
  label(ctx, `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, CFG.W / 2, 34,
    { size: 26, align: 'center' });
  label(ctx, goal, CFG.W / 2, 58, { size: 16, align: 'center', color: arena.bossOut ? '#ff8b7a' : '#ffd94a' });

  panel(ctx, CFG.W - 268, 14, 252, 58);
  label(ctx, `ดาว Lv${weapon.level} · ลิง ${arena.enemies.length}`, CFG.W - 252, 44, { size: 22 });

  // ป้ายควบคุมบางๆ ใต้ HUD บน — โชว์ตลอดเกม อ่านง่ายสำหรับเด็กเล่นที่บูธ
  panel(ctx, 16, 80, CFG.W - 32, 28, 'rgba(28,20,14,0.6)');
  label(ctx, CONTROLS_LEGEND, CFG.W / 2, 94, { size: 14, align: 'center', color: '#fff1e0', weight: 600 });

  // เลือด มุมซ้ายล่าง
  panel(ctx, 16, CFG.H - 78, 268, 62);
  label(ctx, 'เลือด', 30, CFG.H - 52, { size: 19 });
  hpBar(ctx, 180, CFG.H - 58, 170, player.hp / player.maxHp);

  drawAbilityBar(ctx, player, skills);
}

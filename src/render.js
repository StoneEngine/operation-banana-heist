// วาดสนาม top-down: พื้นหญ้าปูกระเบื้อง, ของตกแต่ง, กล้วย, ลิง, ก้อนหิน, ตัวเอก, เอฟเฟกต์, HUD
const SPRITES = {
  ground_tile: 'ground_tile.png',
  bush: 'bush.png',
  stone: 'stone.png',
  rock: 'rock.png',
  banana: 'banana.png',
  banana_gold: 'banana_gold.png',
  banana_peel: 'banana_peel.png',
  hero: 'hero.png',
  hero_walk: 'hero_walk.png',
  enemy_walk: 'enemy_walk.png',
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

// ---------- ของตกแต่งพื้น (ตำแหน่งคงที่ สุ่มครั้งเดียวตอนโหลด) ----------
const DECOR = [];
(function seedDecor() {
  let s = 1337;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 16; i++) {
    DECOR.push({
      kind: rnd() < 0.55 ? 'bush' : 'stone',
      x: 40 + rnd() * (CFG.W - 80),
      y: 40 + rnd() * (CFG.H - 80),
    });
  }
}());

// ---------- เอฟเฟกต์ ----------
const fx = {
  texts: [], pops: [], sparks: [], shake: 0, flash: 0,

  reset() { this.texts = []; this.pops = []; this.sparks = []; this.shake = 0; this.flash = 0; },

  text(x, y, msg, color = '#fff1e0', size = 30) {
    this.texts.push({ x, y, msg, color, size, life: 0.9, max: 0.9 });
  },
  pop(x, y, gold) {
    this.pops.push({ x, y, gold, life: 0.32, max: 0.32 });
  },
  sparkle(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this.sparks.push({ x, y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 0.45 });
    }
  },

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 3);
    for (const t of this.texts) { t.life -= dt; t.y -= dt * 70; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const p of this.pops) p.life -= dt;
    this.pops = this.pops.filter((p) => p.life > 0);
    for (const s of this.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  },
};

// ---------- ตัวช่วยวาด ----------
function px(ctx, key, x, y, size) {
  const im = img[key];
  ctx.drawImage(im, Math.round(x), Math.round(y), size, size * (im.height / im.width));
}

/** วาด 1 เฟรมจาก sheet · flip = พลิกซ้ายขวา (ใช้กับท่าเดินด้านข้าง) */
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

// ---------- ฉากหลัก ----------
function draw(ctx, game) {
  const { player, round, arena, time } = game;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (fx.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  }

  drawGround(ctx);

  // เรียงตาม y ให้ของที่อยู่ล่างทับของที่อยู่บน = ได้ความลึกแบบ top-down
  const actors = [];
  for (const d of DECOR) actors.push({ y: d.y, draw: () => px(ctx, d.kind, d.x - 24, d.y - 24, 48) });
  for (const b of arena.bananas) actors.push({ y: b.y, draw: () => drawBanana(ctx, b, time) });
  for (const e of arena.enemies) actors.push({ y: e.y, draw: () => drawEnemy(ctx, e) });
  actors.push({ y: player.y, draw: () => drawHero(ctx, player, time) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  for (const r of arena.rocks) drawRock(ctx, r);

  drawFx(ctx);
  if (game.running) drawHud(ctx, game);

  ctx.restore();

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(214,60,50,${Math.min(0.55, fx.flash * 0.5)})`;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
  }
}

function drawGround(ctx) {
  const t = 32 * 2;                       // กระเบื้อง 32px วาดที่ 64px
  for (let y = 0; y < CFG.H; y += t) {
    for (let x = 0; x < CFG.W; x += t) ctx.drawImage(img.ground_tile, x, y, t, t);
  }
  // ขอบสนาม = แถบมืดรอบจอ บอกว่าเดินออกไม่ได้
  const a = CFG.ARENA;
  ctx.fillStyle = 'rgba(18,26,14,0.5)';
  ctx.fillRect(0, 0, CFG.W, a.top - 14);
  ctx.fillRect(0, a.bottom + 14, CFG.W, CFG.H - a.bottom);
  ctx.fillRect(0, 0, a.left - 14, CFG.H);
  ctx.fillRect(a.right + 14, 0, CFG.W - a.right, CFG.H);
}

function shadow(ctx, x, y, rx) {
  ctx.fillStyle = 'rgba(18,26,14,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHero(ctx, hero, time) {
  shadow(ctx, hero.x, hero.y, 18);
  const step = hero.moving ? Math.floor(hero.anim) % 2 : 0;
  const index = DIR_ROW[hero.dir] + step;
  ctx.save();
  if (hero.iframe > 0) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(time * 26));
  pxFrame(ctx, 'hero_walk', index, hero.x, hero.y + 6, CFG.HERO_SCALE, hero.dir === 'side' && hero.face < 0);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, hero.x, hero.hitY, CFG.HERO_R, '#4dff9f');
}

function drawEnemy(ctx, e) {
  shadow(ctx, e.x, e.y + 14, 14);
  const index = DIR_ROW[e.dir] + (Math.floor(e.anim) % 2);
  pxFrame(ctx, 'enemy_walk', index, e.x, e.y + 20, CFG.ENEMY_SCALE, e.dir === 'side' && e.face < 0);
  if (SHOW_HITBOX) ring(ctx, e.x, e.y, CFG.ENEMY_R, '#ff4b3e');
}

function drawBanana(ctx, b, time) {
  const bob = Math.sin(b.t * 4) * 4;
  const fade = b.life < 2.5 ? 0.35 + 0.65 * Math.abs(Math.sin(b.life * 12)) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  shadow(ctx, b.x, b.y + 12, 12);
  if (b.gold) {
    ctx.shadowColor = '#ffe680';
    ctx.shadowBlur = 18;
  }
  const im = b.gold ? img.banana_gold : img.banana;
  ctx.drawImage(im, Math.round(b.x - 20), Math.round(b.y - 20 + bob), 40, 40);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, b.x, b.y, CFG.BANANA_R, '#ffd94a');
}

function drawRock(ctx, r) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.rot);
  ctx.drawImage(img.rock, -14, -14, 28, 28);
  ctx.restore();
  if (SHOW_HITBOX) ring(ctx, r.x, r.y, CFG.ROCK_R, '#ff4b3e');
}

function drawFx(ctx) {
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
    const a = Math.min(1, t.life / (t.max * 0.5));
    ctx.globalAlpha = a;
    label(ctx, t.msg, t.x, t.y, { size: t.size, color: t.color, align: 'center' });
    ctx.globalAlpha = 1;
  }
}

function drawHud(ctx, { round, arena }) {
  panel(ctx, 16, 14, 236, 58);
  ctx.drawImage(img.banana, 26, 22, 42, 42);
  label(ctx, `${round.bananas}`, 78, 44, { size: 34, color: '#ffd94a' });

  const left = Math.ceil(round.time);
  panel(ctx, CFG.W / 2 - 78, 14, 156, 58);
  label(ctx, left <= 5 ? `${left}` : `0:${String(left).padStart(2, '0')}`, CFG.W / 2, 44,
    { size: 36, color: left <= 5 ? '#ff8b7a' : '#fff1e0', align: 'center' });

  panel(ctx, CFG.W - 236, 14, 220, 58);
  label(ctx, `ลิงไล่ ${arena.enemies.length}`, CFG.W - 216, 44, { size: 24 });
}

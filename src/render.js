// วาดทุกอย่างลง canvas: ฉาก, ลิง, มือ, ไอเทม, เอฟเฟกต์, HUD
const SPRITES = {
  bg: 'bg.png',
  monkey_sleep: 'monkey_sleep.png',
  monkey_warn: 'monkey_warn.png',
  monkey_awake: 'monkey_awake.png',
  monkey_caught: 'monkey_caught.png',
  banana: 'banana.png',
  banana_gold: 'banana_gold.png',
  basket: 'basket.png',
  hand: 'hand.png',
  radio: 'radio.png',
};

const img = {};

function loadSprites() {
  const jobs = Object.entries(SPRITES).map(([key, file]) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { img[key] = im; res(); };
    im.onerror = () => rej(new Error('โหลดไม่ได้: ' + file));
    im.src = './assets/sprites/' + file;
  }));
  return Promise.all(jobs);
}

// ---------- ตำแหน่งของฉาก ----------
const GROUND_Y = 416;
const MONKEY = { x: 320, y: 106, size: 320 };
const BASKET = { x: 792, y: 300, size: 128 };
const PILE_Y = GROUND_Y - 8;
const CX = MONKEY.x + MONKEY.size / 2;   // จุดกึ่งกลางลิง

// ---------- เอฟเฟกต์ ----------
const fx = {
  texts: [], flies: [], peels: [], shake: 0, flash: 0, sparks: [],

  reset() { this.texts = []; this.flies = []; this.peels = []; this.sparks = []; this.shake = 0; this.flash = 0; },

  text(x, y, msg, color = '#fff1e0', size = 30) {
    this.texts.push({ x, y, msg, color, size, life: 0.9, max: 0.9 });
  },
  fly(x, y, gold = false) {
    this.flies.push({ x, y, x0: x, y0: y, t: 0, dur: 0.45, gold, spin: Math.random() * 6 });
  },
  peelBurst() {
    for (let i = 0; i < 14; i++) {
      this.peels.push({
        x: CX, y: MONKEY.y + 120,
        vx: (Math.random() - 0.5) * 700, vy: -Math.random() * 500 - 80,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, life: 1.4,
      });
    }
  },
  sparkle(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this.sparks.push({ x, y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 0.5 });
    }
  },

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 3);
    for (const t of this.texts) { t.life -= dt; t.y -= dt * 70; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const f of this.flies) { f.t += dt; f.spin += dt * 12; }
    this.flies = this.flies.filter((f) => f.t < f.dur);
    for (const p of this.peels) {
      p.life -= dt; p.vy += 1500 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    this.peels = this.peels.filter((p) => p.life > 0);
    for (const s of this.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 700 * dt; }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  },
};

// ---------- ตัวช่วยวาด ----------
function px(ctx, key, x, y, size) {
  const im = img[key];
  ctx.drawImage(im, Math.round(x), Math.round(y), size, size * (im.height / im.width));
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

// ---------- ฉากหลัก ----------
function draw(ctx, game) {
  const { monkey, player, round, powerups, time } = game;
  ctx.imageSmoothingEnabled = false;
  ctx.save();

  if (fx.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  }

  ctx.drawImage(img.bg, 0, 0, CFG.W, CFG.H);

  // เงาใต้ลิง
  ctx.fillStyle = 'rgba(20,14,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(CX, GROUND_Y + 8, 145, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // ลิง (หายใจขึ้นลงตอนหลับ)
  const breathe = monkey.state === STATE.SLEEPING ? Math.sin(time * 2.2) * 5 : 0;
  const jolt = monkey.state === STATE.AWAKE ? -8 : 0;
  const key = 'monkey_' + monkey.state.toLowerCase().replace('sleeping', 'sleep')
    .replace('warning', 'warn').replace('awake', 'awake').replace('caught', 'caught');
  px(ctx, key, MONKEY.x, MONKEY.y + breathe + jolt, MONKEY.size);

  drawPile(ctx, round, time);
  drawMood(ctx, monkey, time);

  // power-ups
  for (const it of powerups.items) {
    const bob = Math.sin(it.t * 6) * 8;
    const fade = it.life < 0.5 ? 0.35 + 0.65 * Math.abs(Math.sin(it.t * 20)) : 1;
    ctx.globalAlpha = fade;
    if (it.kind === 'gold') {
      ctx.save();
      ctx.translate(it.x, it.y + bob);
      ctx.rotate(Math.sin(it.t * 4) * 0.25);
      ctx.shadowColor = '#ffe680';
      ctx.shadowBlur = 24;
      ctx.drawImage(img.banana_gold, -32, -32, 64, 64);
      ctx.restore();
    } else {
      px(ctx, 'radio', it.x - 30, it.y - 30 + bob, 60);
    }
    ctx.globalAlpha = 1;
  }

  // ตะกร้า + มือ
  px(ctx, 'basket', BASKET.x, BASKET.y, BASKET.size);
  const hy = player.handY - 128;
  px(ctx, 'hand', player.x - 64, hy, 128);

  drawFx(ctx);
  drawHud(ctx, game);

  ctx.restore();

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(214,60,50,${Math.min(0.55, fx.flash * 0.5)})`;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
  }
}

function drawPile(ctx, round, time) {
  // กองกล้วยหน้าลิง — ยิ่งขโมยไปเยอะ กองยิ่งบาง
  const left = Math.max(5, 14 - Math.floor(round.stolenTotal / 6));
  for (let i = 0; i < left; i++) {
    const t = left === 1 ? 0.5 : i / (left - 1);
    const x = CX + (t - 0.5) * 340;                       // เรียงหน้าลิงเป็นแถวโค้ง
    const y = PILE_Y - Math.sin(t * Math.PI) * 18 + (i % 3) * 9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i % 2 ? 1 : -1) * (0.5 + t) + Math.sin(time + i) * 0.05);
    ctx.drawImage(img.banana, -24, -24, 48, 48);
    ctx.restore();
  }
}

function drawMood(ctx, monkey, time) {
  const cx = CX;
  if (monkey.state === STATE.SLEEPING) {
    for (let i = 0; i < 3; i++) {
      const t = (time * 0.6 + i * 0.33) % 1;
      ctx.globalAlpha = 1 - t;
      label(ctx, 'z', cx + 96 + t * 46, MONKEY.y + 40 - t * 70,
        { size: 24 + i * 12 + t * 16, color: '#eaf4ff', align: 'center' });
      ctx.globalAlpha = 1;
    }
  } else if (monkey.state === STATE.WARNING) {
    const pulse = 1 + Math.sin(time * 30) * 0.12;
    ctx.save();
    ctx.translate(cx, MONKEY.y + 52);
    ctx.scale(pulse, pulse);
    label(ctx, '!', 0, 0, { size: 92, color: '#ff4b3e', align: 'center' });
    ctx.restore();
  } else if (monkey.state === STATE.AWAKE) {
    label(ctx, 'ตื่นแล้ว!', cx, MONKEY.y + 44, { size: 44, color: '#ffd94a', align: 'center' });
  } else if (monkey.state === STATE.CAUGHT) {
    label(ctx, 'โดนจับ!', cx, MONKEY.y + 44, { size: 52, color: '#ff4b3e', align: 'center' });
  }
}

function drawFx(ctx) {
  for (const f of fx.flies) {
    const t = f.t / f.dur;
    const tx = BASKET.x + 64, ty = BASKET.y + 40;
    const x = f.x0 + (tx - f.x0) * t;
    const y = f.y0 + (ty - f.y0) * t - Math.sin(t * Math.PI) * 160;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f.spin);
    const im = f.gold ? img.banana_gold : img.banana;
    ctx.drawImage(im, -22, -22, 44, 44);
    ctx.restore();
  }
  for (const p of fx.peels) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.min(1, p.life);
    ctx.drawImage(img.banana, -20, -20, 40, 40);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  for (const s of fx.sparks) {
    ctx.fillStyle = '#fff3a0';
    ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
  }
  for (const t of fx.texts) {
    ctx.globalAlpha = Math.min(1, t.life / t.max * 1.6);
    label(ctx, t.msg, t.x, t.y, { size: t.size, color: t.color, align: 'center' });
    ctx.globalAlpha = 1;
  }
}

function drawHud(ctx, { round, monkey }) {
  // คะแนน
  panel(ctx, 16, 14, 250, 58);
  ctx.drawImage(img.banana, 26, 22, 42, 42);
  label(ctx, `${round.bananas}`, 78, 44, { size: 34, color: '#ffd94a' });
  if (round.mult > 1) {
    label(ctx, `x${round.mult}`, 196, 44, { size: 30, color: '#fff3a0' });
  }

  // เวลา
  const t = Math.ceil(round.time);
  panel(ctx, CFG.W / 2 - 92, 14, 184, 58, t <= 10 ? 'rgba(120,26,20,0.8)' : 'rgba(28,20,14,0.72)');
  label(ctx, `${t}`, CFG.W / 2, 44,
    { size: t <= 10 ? 40 : 34, color: t <= 10 ? '#ff8b7a' : '#fff1e0', align: 'center' });

  // Monkey Meter
  panel(ctx, CFG.W - 266, 14, 250, 58);
  label(ctx, 'ความโกรธ', CFG.W - 250, 44, { size: 20 });
  for (let i = 0; i < 5; i++) {
    const on = i < monkey.anger;
    ctx.fillStyle = on ? ['#f2c14e', '#f09b3c', '#e2702f', '#d64a32', '#b32222'][i] : 'rgba(255,241,224,0.18)';
    ctx.strokeStyle = '#2b1b13';
    ctx.lineWidth = 3;
    const x = CFG.W - 138 + i * 24;
    ctx.beginPath();
    ctx.roundRect(x, 30, 18, 28, 4);
    ctx.fill();
    ctx.stroke();
  }
}

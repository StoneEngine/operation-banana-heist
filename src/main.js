// bootstrap + game loop
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  menu: document.getElementById('menu'),
  over: document.getElementById('gameover'),
  play: document.getElementById('btn-play'),
  again: document.getElementById('btn-again'),
  mute: document.getElementById('btn-mute'),
  score: document.getElementById('final-score'),
  best: document.getElementById('best-score'),
  newBest: document.getElementById('new-best'),
  caught: document.getElementById('final-caught'),
  loading: document.getElementById('loading'),
  endTitle: document.getElementById('ending-title'),
  endMonkey: document.getElementById('ending-monkey'),
  endProp: document.getElementById('ending-prop'),
  upgrade: document.getElementById('upgrade'),
  cards: document.getElementById('upgrade-cards'),
};

const game = {
  player: new Player(),
  round: new Round(),
  arena: new Arena(),
  weapon: new Weapon(),
  skills: new Skills(),
  cam: { x: 0, y: 0 },
  nextUpgradeAt: CFG.UPGRADE_EVERY,
  healAcc: 0,             // กล้วยสะสมสำหรับฟื้นเลือด
  paused: false,          // true ตอนเลือกอัปเกรด
  time: 0,
  running: false,
  bossCelebrating: false, // true ระหว่างหยุดโลกโชว์เอฟเฟกต์ฉลองหลังล้มบอส
  bossCelebrateT: 0,
};

// ---------- กล้องตามตัว: ตัวละครอยู่กลางจอ จนกว่าจะชนขอบโลก ----------
function updateCam(dt) {
  const p = game.player;
  const tx = clampNum(p.x - CFG.W / 2, 0, CFG.WORLD.w - CFG.W);
  const ty = clampNum(p.y - CFG.H / 2, 0, CFG.WORLD.h - CFG.H);
  const k = Math.min(1, dt * CFG.CAM_LERP);
  game.cam.x += (tx - game.cam.x) * k;
  game.cam.y += (ty - game.cam.y) * k;
}

// ---------- เมาส์: เล็ง/ยิงเท่านั้น ไม่ใช้เดิน ----------
const aim = { x: CFG.W / 2, y: CFG.H / 2 };   // พิกัดในโลก
let firing = false;

function toWorld(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (CFG.W / r.width) + game.cam.x,
    y: (e.clientY - r.top) * (CFG.H / r.height) + game.cam.y,
  };
}

canvas.addEventListener('pointermove', (e) => {
  const p = toWorld(e);
  aim.x = p.x;
  aim.y = p.y;
});
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sfx.unlock();
  const p = toWorld(e);
  aim.x = p.x;
  aim.y = p.y;
  if (e.button === 2) {                       // คลิกขวา = สะท้อนอาวุธ (คูลดาวน์ 2 วิ)
    if (game.running && !game.paused && game.player.parry()) sfx.parryReady();
    return;
  }
  if (e.button === 0) firing = true;          // คลิกซ้ายค้าง = ยิงรัวตามคูลดาวน์อาวุธ
});
window.addEventListener('pointerup', (e) => { if (e.button === 0) firing = false; });

// ---------- คีย์บอร์ด: เดินอย่างเดียว ----------
const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};
const held = new Set();

function pushMove() {
  let x = 0, y = 0;
  for (const code of held) { x += MOVE_KEYS[code][0]; y += MOVE_KEYS[code][1]; }
  game.player.setMove(x, y);
}

window.addEventListener('keydown', (e) => {
  if (MOVE_KEYS[e.code]) {
    e.preventDefault();
    sfx.unlock();
    held.add(e.code);
    pushMove();
    return;
  }
  // ต่อยประชิด (Q)
  if (e.code === 'KeyQ') {
    e.preventDefault();
    sfx.unlock();
    if (game.running && !game.paused) {
      if (game.player.meleeCool > 0) {
        fx.text(game.player.x, game.player.hitY - 60, 'ยังไม่พร้อม', '#ff8b7a', 24);
      } else {
        game.player.meleeCool = CFG.MELEE.cool;
        game.arena.meleeAttack(game.player, aim);
      }
    }
    return;
  }
  // สกิลเดียว: R = ดาวกระจายรอบทิศ
  if (e.code === 'KeyR') {
    e.preventDefault();
    sfx.unlock();
    if (game.running && !game.paused) {
      if (!game.skills.cast('storm', game.player, game.arena)) {
        fx.text(game.player.x, game.player.hitY - 60, 'ยังไม่พร้อม', '#ff8b7a', 24);
      }
    }
    return;
  }
  // เลือกอัปเกรดด้วยเลข 1-3 ก็ได้
  if (game.paused && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const i = Number(e.code.slice(-1)) - 1;
    const btn = ui.cards.children[i];
    if (btn) btn.click();
    return;
  }
  if (e.code === 'Enter') {
    e.preventDefault();
    sfx.unlock();
    if (!story.el.hidden) { story.advance(); return; }
    if (!game.running) start();
    return;
  }
  // Space: เมนู/เนื้อเรื่อง = ไปต่อ/เริ่มเกม, ระหว่างเล่น = พุ่งตัวหนี
  if (e.code === 'Space') {
    e.preventDefault();
    sfx.unlock();
    if (!story.el.hidden) { story.advance(); return; }
    if (!game.running) { start(); return; }
    if (game.paused) return;
    if (!game.player.dash()) {
      fx.text(game.player.x, game.player.hitY - 60, 'ยังไม่พร้อม', '#ff8b7a', 24);
    } else {
      fx.dashTrail(game.player.x, game.player.y);
      sfx.dash();
    }
  }
});
window.addEventListener('keyup', (e) => {
  if (!MOVE_KEYS[e.code]) return;
  held.delete(e.code);
  pushMove();
});
window.addEventListener('blur', () => { held.clear(); pushMove(); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

ui.play.addEventListener('click', () => {
  sfx.unlock();
  ui.menu.hidden = true;
  story.play(start);                  // เล่นครั้งแรกจากเมนู = ดูเนื้อเรื่องก่อน (ข้ามได้)
});
ui.again.addEventListener('click', () => { sfx.unlock(); start(); });
ui.mute.addEventListener('click', () => {
  const m = sfx.toggleMute();
  ui.mute.textContent = m ? '🔇 เสียงปิด' : '🔊 เสียงเปิด';
  if (!m && (game.running || !story.el.hidden)) sfx.music.start();
});

// ---------- อัปเกรด ----------
function openUpgrade() {
  game.paused = true;
  held.clear();
  pushMove();
  ui.cards.innerHTML = '';
  game.weapon.roll().forEach((up, i) => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.innerHTML = `<img src="./assets/sprites/${up.icon}.png" alt="">`
      + `<b>${i + 1}. ${up.title}</b><span>${up.desc}</span>`;
    btn.addEventListener('click', () => {
      game.weapon.apply(up.id, game.player, game.skills);
      ui.upgrade.hidden = true;
      game.paused = false;
      sfx.gold();
    });
    ui.cards.appendChild(btn);
  });
  ui.upgrade.hidden = false;
}

// ---------- วงจรเกม ----------
function hurt(from) {
  const hero = game.player;
  const lost = Math.floor(game.round.bananas * CFG.CAUGHT_PENALTY);
  game.round.bananas -= lost;
  game.round.caughtCount += 1;
  const dead = hero.damage();
  hero.knockFrom(from.x, from.y);
  fx.shake = CFG.SHAKE_HIT;
  fx.flash = 1;
  fx.text(hero.x, hero.hitY - 60, lost > 0 ? `${from.kind} -${lost}` : from.kind, '#ff8b7a', 40);
  sfx.caught();
  if (dead) finish(true);
}

function start() {
  game.round.reset();
  game.player.reset();
  game.arena.reset();
  game.weapon.reset();
  game.skills.reset();
  game.player.x = CFG.WORLD.w / 2;
  game.player.y = CFG.WORLD.h / 2;
  game.cam.x = clampNum(game.player.x - CFG.W / 2, 0, CFG.WORLD.w - CFG.W);
  game.cam.y = clampNum(game.player.y - CFG.H / 2, 0, CFG.WORLD.h - CFG.H);
  game.nextUpgradeAt = CFG.UPGRADE_EVERY;
  game.healAcc = 0;
  game.paused = false;
  game.bossCelebrating = false;
  game.bossCelebrateT = 0;
  fx.reset();
  game.running = true;
  sfx.music.start();
  ui.menu.hidden = true;
  ui.over.hidden = true;
  ui.upgrade.hidden = true;
}

function finish(dead = false, won = false) {
  if (!game.running) return;
  game.running = false;
  game.paused = false;
  ui.upgrade.hidden = true;
  sfx.music.stop();
  const isBest = bestScore.set(game.round.bananas);
  ui.score.textContent = game.round.bananas;
  ui.best.textContent = bestScore.get();
  ui.caught.textContent = game.round.caughtCount;
  ui.newBest.hidden = !isBest;
  // เลือดหมด = แพ้เสมอ · ล้มบอสได้ = ฉากจบดีที่สุดเสมอ
  const end = dead ? ENDINGS.bronze : (won ? ENDINGS.gold : endingFor(game.round.bananas));
  ui.endTitle.textContent = dead ? '💀 โดนจับคาป่า' : end.title;
  ui.endMonkey.src = `./assets/sprites/${end.monkey}.png`;
  ui.endProp.src = `./assets/sprites/${end.prop}.png`;
  ui.endMonkey.className = end.cls;
  sfx.ending(end.sound);
  story.playEnding(end, () => { ui.over.hidden = false; });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (game.running && !game.paused) {
    game.player.update(dt);
    game.skills.update(dt);
    updateCam(dt);
    game.arena.update(dt, game.player, game.round, game.cam, game.weapon, firing, aim);

    const gain = game.arena.collect(game.player);
    if (gain > 0) {
      game.round.bananas += gain;
      // นับสะสมแยกต่างหาก ไม่ลดตอนโดนจับ ใช้ปลดล็อกอัปเกรดสกิลทุก CFG.UPGRADE_EVERY ลูก
      game.round.totalCollected += gain;
      // กินกล้วยครบทุกๆ HEAL_EVERY = ฟื้นเลือด 1 หน่วย
      game.healAcc += gain;
      while (game.healAcc >= CFG.HEAL_EVERY) {
        game.healAcc -= CFG.HEAL_EVERY;
        if (game.player.hp < game.player.maxHp) {
          game.player.hp += 1;
          fx.text(game.player.x, game.player.hitY - 70, '+1 เลือด', '#4dff9f', 32);
          sfx.heal();
        }
      }
      if (!game.arena.bossOut && game.round.bananas >= CFG.BOSS_AT) {
        game.arena.spawnBoss(game.player, game.cam);
      }
      if (game.round.totalCollected >= game.nextUpgradeAt) {
        game.nextUpgradeAt += CFG.UPGRADE_EVERY;
        openUpgrade();
      }
    }

    const hit = game.arena.hitTest(game.player);
    if (hit) hurt(hit);

    game.round.update(dt);
    if (game.arena.bossDead && !game.bossCelebrating) {
      game.bossCelebrating = true;   // หยุดโลกไว้ ให้เห็นเอฟเฟกต์ฉลองเด่นๆ ก่อนตัดฉากจบ
      game.paused = true;
    }
  }
  if (game.running && game.bossCelebrating) {
    game.bossCelebrateT += dt;
    if (game.bossCelebrateT >= CFG.BOSS_CELEBRATE_TIME) finish(false, true);   // ล้มบอสได้ = ชนะ จบเกม
  }
  fx.update(dt);
  draw(ctx, game);
  requestAnimationFrame(frame);
}

loadSprites().then(() => {
  ui.loading.hidden = true;
  ui.menu.hidden = false;
  document.getElementById('menu-best').textContent = bestScore.get();
  document.getElementById('menu-hint').textContent =
    `เดินด้วยคีย์บอร์ด · เมาส์เล็งยิง · กินกล้วยฟื้นเลือด · เก็บครบ ${CFG.BOSS_AT} บอสโผล่ ล้มบอส = ชนะ`;
  requestAnimationFrame(frame);
}).catch((err) => {
  ui.loading.textContent = 'โหลดรูปไม่สำเร็จ: ' + err.message;
});

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
};

const game = {
  monkey: null,
  player: new Player(),
  round: new Round(),
  powerups: new Powerups(),
  throws: new Throws(),
  stealAcc: 0,          // เศษกล้วยที่ยังไม่ครบ 1 ลูก
  time: 0,
  running: false,
};

game.monkey = new Monkey((state) => {
  if (state === STATE.SLEEPING) game.powerups.onSleepStart();
  if (state === STATE.WARNING) { sfx.warn(); fx.shake = CFG.SHAKE_WARN; }
  if (state === STATE.AWAKE) sfx.wake();
});

// ---------- อินพุต ----------
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (CFG.W / r.width),
    y: (e.clientY - r.top) * (CFG.H / r.height),
  };
}

/** ยืนในเขตกองกล้วยตอนลิงหลับ = กล้วยไหลเข้าเรื่อยๆ */
function stealTick(dt) {
  const hero = game.player;
  const inZone = Math.hypot(hero.x - STEAL.x, (hero.hitY - STEAL.y) / 0.42) <= CFG.STEAL_R;
  if (!inZone) { game.stealAcc = 0; return; }

  if (game.monkey.canSteal) {
    game.stealAcc += CFG.STEAL_RATE * game.round.mult * dt;
    while (game.stealAcc >= 1) {
      game.stealAcc -= 1;
      game.round.bananas += 1;
      game.round.stolenTotal += 1;
      game.monkey.setAngerFromScore(game.round.stolenTotal);
      sfx.music.setAnger(game.monkey.anger);      // ยิ่งโกรธ เพลงยิ่งเร่ง
      fx.fly(hero.x, hero.hitY, game.round.mult > 1);
      sfx.grab(Math.min(5, Math.floor(game.round.stolenTotal / 8)));
    }
  } else if (game.monkey.state === STATE.AWAKE && hero.iframe <= 0) {
    hurt(STEAL.x, STEAL.y, 'โดนจับ!');           // ยืนแช่ตอนลิงตื่น = โดนจับคาที่
  }
}

/** เสียกล้วย + เด้งถอย — ใช้ทั้งตอนโดนปาและตอนโดนจับคาเขต */
function hurt(fromX, fromY, msg) {
  const hero = game.player;
  const lost = Math.floor(game.round.bananas * CFG.CAUGHT_PENALTY);
  game.round.bananas -= lost;
  game.round.caughtCount += 1;
  game.stealAcc = 0;
  game.monkey.catchPlayer();          // ลิงยืนหัวเราะ 1.2 วิ = ผู้เล่นได้ตั้งหลัก
  hero.knockFrom(fromX, fromY);
  fx.shake = CFG.SHAKE_CAUGHT;
  fx.flash = 1;
  fx.text(hero.x, hero.hitY - 70, lost > 0 ? `${msg} -${lost}` : msg, '#ff8b7a', 42);
  sfx.caught();
}

canvas.addEventListener('pointermove', (e) => {
  if (!game.running) return;
  const p = toCanvas(e);
  game.player.aimAt(p.x, p.y);
});
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sfx.unlock();
  const p = toCanvas(e);
  game.player.aimAt(p.x, p.y);      // แตะบนมือถือ = สั่งให้เดินไปจุดนั้น
});
// ---------- WASD / ลูกศร ----------
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
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  e.preventDefault();
  sfx.unlock();
  if (!story.el.hidden) { story.advance(); return; }
  if (!game.running) start();
});

window.addEventListener('keyup', (e) => {
  if (!MOVE_KEYS[e.code]) return;
  held.delete(e.code);
  pushMove();
});
window.addEventListener('blur', () => { held.clear(); pushMove(); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// เล่นครั้งแรกจากเมนู = ดูเนื้อเรื่องก่อน (ข้ามได้) · เล่นซ้ำจากหน้าจบ = เข้าเกมเลย
ui.play.addEventListener('click', () => {
  sfx.unlock();
  ui.menu.hidden = true;
  story.play(start);
});
ui.again.addEventListener('click', () => { sfx.unlock(); start(); });
ui.mute.addEventListener('click', () => {
  const m = sfx.toggleMute();
  ui.mute.textContent = m ? '🔇 เสียงปิด' : '🔊 เสียงเปิด';
  if (!m && (game.running || !story.el.hidden)) sfx.music.start();   // เปิดเสียงกลางเกม/กลาง intro = ดนตรีกลับมา
});

// ---------- วงจรเกม ----------
function start() {
  game.round.reset();
  game.player.reset();
  game.powerups.reset();
  game.throws.reset();
  game.monkey.reset();
  game.stealAcc = 0;
  fx.reset();
  game.running = true;
  sfx.music.setAnger(0);
  sfx.music.start();
  ui.menu.hidden = true;
  ui.over.hidden = true;
}

function finish() {
  game.running = false;
  sfx.music.stop();
  const isBest = bestScore.set(game.round.bananas);
  ui.score.textContent = game.round.bananas;
  ui.best.textContent = bestScore.get();
  ui.caught.textContent = game.round.caughtCount;
  ui.newBest.hidden = !isBest;
  const end = endingFor(game.round.bananas);
  ui.endTitle.textContent = end.title;
  ui.endMonkey.src = `./assets/sprites/${end.monkey}.png`;
  ui.endProp.src = `./assets/sprites/${end.prop}.png`;
  ui.endMonkey.className = end.cls;
  sfx.ending(end.sound);
  // เล่าฉากจบแบบ typewriter ก่อน (ข้ามได้) แล้วค่อยโชว์การ์ดคะแนน
  story.playEnding(end, () => { ui.over.hidden = false; });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (game.running) {
    game.monkey.update(dt);
    game.player.update(dt);
    game.powerups.update(dt, game.monkey.state);
    game.throws.update(dt, game.monkey, game.player);
    if (game.throws.hitTest(game.player)) hurt(CX, MONKEY.y + 160, 'โดนปา!');
    stealTick(dt);

    const got = game.powerups.pickup(game.player);
    if (got === 'gold') {
      game.round.addMult(CFG.GOLD_MULT, CFG.GOLD_MULT_TIME);
      fx.text(game.player.x, game.player.hitY - 60, `กล้วยทอง x${CFG.GOLD_MULT}!`, '#ffd94a', 36);
      fx.sparkle(game.player.x, game.player.hitY);
      sfx.gold();
    } else if (got === 'radio') {
      game.monkey.extendSleep(CFG.RADIO_SLEEP_BONUS);
      fx.text(game.player.x, game.player.hitY - 60, `หลับต่ออีก ${CFG.RADIO_SLEEP_BONUS} วิ`, '#9fd8ff', 32);
      sfx.radio();
    }

    const before = Math.ceil(game.round.time);
    game.round.update(dt);
    const now2 = Math.ceil(game.round.time);
    if (now2 !== before && now2 <= 5 && now2 >= 0) sfx.tick(now2 === 0);   // นับถอยหลัง 5 วิสุดท้าย
    sfx.snoreTick(dt, game.monkey.state === STATE.SLEEPING);
    if (game.round.over) finish();
  }
  fx.update(dt);
  draw(ctx, game);
  requestAnimationFrame(frame);
}

loadSprites().then(() => {
  ui.loading.hidden = true;
  ui.menu.hidden = false;
  document.getElementById('menu-best').textContent = bestScore.get();
  requestAnimationFrame(frame);
}).catch((err) => {
  ui.loading.textContent = 'โหลดรูปไม่สำเร็จ: ' + err.message;
});

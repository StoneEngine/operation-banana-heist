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
};

const game = {
  monkey: null,
  player: new Player(),
  round: new Round(),
  powerups: new Powerups(),
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

function grabAt(x, y) {
  if (!game.running) return;
  const hit = game.powerups.hit(x, y);
  if (hit === 'gold') {
    game.round.addMult(CFG.GOLD_MULT, CFG.GOLD_MULT_TIME);
    fx.text(x, y - 30, `กล้วยทอง x${CFG.GOLD_MULT}!`, '#ffd94a', 36);
    fx.sparkle(x, y);
    sfx.gold();
    return;
  }
  if (hit === 'radio') {
    game.monkey.extendSleep(CFG.RADIO_SLEEP_BONUS);
    fx.text(x, y - 30, `หลับต่ออีก ${CFG.RADIO_SLEEP_BONUS} วิ`, '#9fd8ff', 32);
    sfx.radio();
    return;
  }

  game.player.aimAt(x);
  const res = game.player.tryGrab(game.monkey);
  if (res === 'steal') {
    const gain = CFG.BANANA_PER_GRAB * game.round.mult;
    game.round.bananas += gain;
    game.round.stolenTotal += 1;
    game.monkey.setAngerFromScore(game.round.stolenTotal);
    sfx.music.setAnger(game.monkey.anger);        // ยิ่งโกรธ เพลงยิ่งเร่ง
    fx.fly(game.player.x, game.player.handY - 90, game.round.mult > 1);
    fx.text(game.player.x, game.player.handY - 130, `+${gain}`,
      game.round.mult > 1 ? '#ffd94a' : '#fff1e0', 30 + Math.min(game.player.combo, 10));
    sfx.grab(game.player.combo);
  } else if (res === 'caught') {
    const lost = Math.floor(game.round.bananas * CFG.CAUGHT_PENALTY);
    game.round.bananas -= lost;
    game.round.caughtCount += 1;
    game.monkey.catchPlayer();
    fx.peelBurst();
    fx.shake = CFG.SHAKE_CAUGHT;
    fx.flash = 1;
    if (lost > 0) fx.text(CFG.W / 2, 300, `-${lost} กล้วย`, '#ff8b7a', 46);
    sfx.caught();
  }
}

canvas.addEventListener('pointermove', (e) => {
  if (game.running) game.player.aimAt(toCanvas(e).x);
});
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sfx.unlock();
  const p = toCanvas(e);
  grabAt(p.x, p.y);
});
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
  e.preventDefault();
  sfx.unlock();
  if (!game.running) { start(); return; }
  grabAt(game.player.x, game.player.handY - 120);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

ui.play.addEventListener('click', () => { sfx.unlock(); start(); });
ui.again.addEventListener('click', () => { sfx.unlock(); start(); });
ui.mute.addEventListener('click', () => {
  const m = sfx.toggleMute();
  ui.mute.textContent = m ? '🔇 เสียงปิด' : '🔊 เสียงเปิด';
  if (!m && game.running) sfx.music.start();     // เปิดเสียงกลางเกม = ดนตรีกลับมา
});

// ---------- วงจรเกม ----------
function start() {
  game.round.reset();
  game.player.reset();
  game.powerups.reset();
  game.monkey.reset();
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
  ui.over.hidden = false;
  sfx.end();
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
    game.round.update(dt);
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

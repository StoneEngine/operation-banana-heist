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
  player: new Player(),
  round: new Round(),
  arena: new Arena(),
  time: 0,
  running: false,
};

// ---------- อินพุต ----------
function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (CFG.W / r.width),
    y: (e.clientY - r.top) * (CFG.H / r.height),
  };
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
  game.player.aimAt(p.x, p.y);        // แตะบนมือถือ = เดินไปจุดนั้น
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

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

// ---------- วงจรเกม ----------
function hurt(from) {
  const hero = game.player;
  const lost = Math.floor(game.round.bananas * CFG.CAUGHT_PENALTY);
  game.round.bananas -= lost;
  game.round.caughtCount += 1;
  hero.knockFrom(from.x, from.y);
  fx.shake = CFG.SHAKE_HIT;
  fx.flash = 1;
  fx.text(hero.x, hero.hitY - 60, lost > 0 ? `${from.kind} -${lost}` : from.kind, '#ff8b7a', 40);
  sfx.caught();
}

function start() {
  game.round.reset();
  game.player.reset();
  game.arena.reset();
  fx.reset();
  game.running = true;
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
  story.playEnding(end, () => { ui.over.hidden = false; });   // เล่าฉากจบก่อน แล้วค่อยโชว์คะแนน
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (game.running) {
    game.player.update(dt);
    game.arena.update(dt, game.player, game.round);

    const gain = game.arena.collect(game.player);
    if (gain > 0) game.round.bananas += gain;

    const hit = game.arena.hitTest(game.player);
    if (hit) hurt(hit);

    const before = Math.ceil(game.round.time);
    game.round.update(dt);
    const nowLeft = Math.ceil(game.round.time);
    if (nowLeft !== before && nowLeft <= 5 && nowLeft >= 0) sfx.tick(nowLeft === 0);
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

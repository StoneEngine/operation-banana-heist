// state machine ของเจ้าจ๋อ + ตัวจับเวลารอบเกม
const rand = (a, b) => a + Math.random() * (b - a);

class Monkey {
  constructor(onEnter) {
    this.onEnter = onEnter || (() => {});
    this.reset();
  }

  reset() {
    this.anger = 0;
    this.fakeWakeQueued = false;
    this.enter(STATE.SLEEPING);
  }

  // ระยะเวลาของแต่ละ state หดตาม anger
  duration(state) {
    const a = this.anger;
    if (state === STATE.SLEEPING) {
      return rand(...CFG.SLEEP) * Math.max(0.35, 1 - a * CFG.SLEEP_SHRINK);
    }
    if (state === STATE.WARNING) {
      return rand(...CFG.WARN) * Math.max(0.4, 1 - a * CFG.WARN_SHRINK);
    }
    if (state === STATE.AWAKE) return rand(...CFG.AWAKE);
    return CFG.CAUGHT_LOCK;
  }

  enter(state) {
    this.state = state;
    this.timer = this.duration(state);
    this.totalTime = this.timer;   // เก็บไว้คำนวณ elapsed ให้ sprite sheet ปาก (ดู render.js pxFrame)
    if (state === STATE.WARNING) {
      // หลอกตื่น: เข้า WARNING แล้วกลับไปหลับ ไม่ตื่นจริง
      const p = CFG.FAKE_WAKE_BASE + this.anger * CFG.FAKE_WAKE_PER_ANGER;
      this.fakeWakeQueued = Math.random() < p;
    }
    this.onEnter(state, this);
  }

  setAngerFromScore(bananas) {
    this.anger = Math.min(CFG.ANGER_MAX,
      Math.floor(bananas / CFG.ANGER_PER_BANANA));
  }

  extendSleep(sec) {
    if (this.state === STATE.SLEEPING) this.timer += sec;
  }

  catchPlayer() {
    this.enter(STATE.CAUGHT);
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.state === STATE.SLEEPING) this.enter(STATE.WARNING);
    else if (this.state === STATE.WARNING) {
      this.enter(this.fakeWakeQueued ? STATE.SLEEPING : STATE.AWAKE);
    } else this.enter(STATE.SLEEPING);   // AWAKE / CAUGHT -> กลับไปหลับ
  }

  get canSteal() {
    return this.state === STATE.SLEEPING || this.state === STATE.WARNING;
  }

  get locked() {
    return this.state === STATE.CAUGHT;
  }
}

class Round {
  constructor() { this.reset(); }
  reset() {
    this.time = CFG.ROUND_TIME;
    this.bananas = 0;
    this.stolenTotal = 0;
    this.caughtCount = 0;
    this.mult = 1;
    this.multTime = 0;
    this.over = false;
  }
  update(dt) {
    this.time -= dt;
    if (this.multTime > 0) {
      this.multTime -= dt;
      if (this.multTime <= 0) this.mult = 1;
    }
    if (this.time <= 0) { this.time = 0; this.over = true; }
  }
  addMult(mult, sec) { this.mult = mult; this.multTime = sec; }
}

const bestScore = {
  get() { return Number(localStorage.getItem('bananaHeistBest') || 0); },
  set(v) {
    if (v > this.get()) { localStorage.setItem('bananaHeistBest', String(v)); return true; }
    return false;
  },
};

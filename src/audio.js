// เสียงทั้งหมดสังเคราะห์ด้วย WebAudio — ไม่มีไฟล์เสียงให้โหลด เล่นได้แม้เน็ตหลุด
let audioCtx = null;
let muted = false;
let snoreTimer = 0;

function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone({ freq = 440, to = null, dur = 0.12, type = 'square', gain = 0.12, delay = 0 }) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur = 0.25, gain = 0.15) {
  if (muted) return;
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

/** เสียงร้องลิง — ออสซิลเลเตอร์ + วิบราโตเร็วๆ ให้ออกแนวตลก ไม่ใช่สัตว์จริง
 *  kind: 'ook' (อู๊ก อู๊ก) | 'screech' (อี๊ดดด ตอนตื่น) | 'angry' (โวยวายตอนจับได้) */
function monkeyVoice(kind, delay = 0) {
  if (muted) return;
  const a = ac();
  const t0 = a.currentTime + delay;

  const syllables = {
    ook: [[300, 190, 0.14], [340, 210, 0.16]],                       // สองพยางค์ต่ำ
    screech: [[520, 1500, 0.1], [1400, 700, 0.22]],                  // ปรี๊ดขึ้นแล้วลง
    angry: [[420, 260, 0.11], [520, 300, 0.11], [700, 180, 0.26]],   // ด่ารัวสามที
  }[kind];

  let t = t0;
  for (const [from, to, dur] of syllables) {
    const osc = a.createOscillator();
    const g = a.createGain();
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;

    // วิบราโตคือตัวทำให้ฟังดูเป็น "เสียงร้อง" ไม่ใช่เสียงบี๊บ
    const lfo = a.createOscillator();
    const lfoGain = a.createGain();
    lfo.frequency.value = 22;
    lfoGain.gain.value = from * 0.12;
    lfo.connect(lfoGain).connect(osc.frequency);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(lp).connect(g).connect(a.destination);
    osc.start(t); lfo.start(t);
    osc.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    t += dur + 0.05;
  }
}

// ---------- ดนตรีประกอบ: เบสย่องๆ แนวการ์ตูนขโมยของ ----------
// เดินบันไดเสียง A minor ทีละครึ่งเสียง = อารมณ์ "ย่องเข้าไปขโมย" แบบ Pink Panther
const BASS = [110.00, 0, 130.81, 0, 146.83, 0, 155.56, 0,
              164.81, 0, 146.83, 0, 130.81, 0, 123.47, 0];
const BLIP = { 3: 659.25, 7: 783.99, 11: 659.25, 15: 987.77 };  // ตัวเอกแหลมๆ ตามจังหวะ

const music = {
  on: false, step: 0, nextTime: 0, timer: null, anger: 0,

  get stepDur() { return 0.155 * Math.max(0.62, 1 - this.anger * 0.07); },  // โกรธ = เพลงเร่ง

  start() {
    if (this.on) return;
    const a = ac();
    this.on = true;
    this.step = 0;
    this.nextTime = a.currentTime + 0.06;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stop() {
    this.on = false;
    clearInterval(this.timer);
    this.timer = null;
  },
  setAnger(v) { this.anger = v; },

  schedule() {
    if (!this.on) return;
    const a = ac();
    while (this.nextTime < a.currentTime + 0.12) {   // จองโน้ตล่วงหน้ากันกระตุก
      const s = this.step % 16;
      const at = this.nextTime - a.currentTime;
      const f = BASS[s];
      if (f) tone({ freq: f, to: f * 0.98, dur: this.stepDur * 1.1, type: 'triangle', gain: 0.075, delay: at });
      if (BLIP[s]) tone({ freq: BLIP[s], dur: 0.07, type: 'square', gain: 0.045, delay: at });
      if (s % 4 === 2) noise(0.05, 0.035);           // เคาะเบาๆ เป็นจังหวะ
      this.nextTime += this.stepDur;
      this.step++;
    }
  },
};

const sfx = {
  music,
  unlock() { ac(); },
  toggleMute() {
    muted = !muted;
    if (muted) music.stop();
    return muted;
  },
  get muted() { return muted; },

  grab(combo = 0) {
    tone({ freq: 520 + Math.min(combo, 12) * 28, to: 900, dur: 0.09, type: 'square', gain: 0.10 });
  },
  gold() {
    [0, 0.07, 0.14].forEach((d, i) =>
      tone({ freq: 700 + i * 260, dur: 0.12, type: 'triangle', gain: 0.12, delay: d }));
  },
  radio() {
    [0, 0.09, 0.18].forEach((d, i) =>
      tone({ freq: 600 - i * 130, dur: 0.16, type: 'sine', gain: 0.12, delay: d }));
  },
  warn() {
    tone({ freq: 880, to: 640, dur: 0.14, type: 'sawtooth', gain: 0.09 });
    monkeyVoice('ook');                       // "อู๊ก?" แบบละเมอสงสัย
  },
  wake() {
    tone({ freq: 300, to: 120, dur: 0.3, type: 'sawtooth', gain: 0.12 });
    monkeyVoice('screech', 0.05);             // อี๊ดดดด!
  },
  caught() {
    noise(0.35, 0.18);
    tone({ freq: 260, to: 70, dur: 0.45, type: 'square', gain: 0.14 });
    monkeyVoice('angry', 0.08);               // ด่ารัวๆ
  },
  end() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.11, delay: i * 0.11 }));
  },

  // เสียงกรนเป็นจังหวะระหว่างลิงหลับ
  snoreTick(dt, sleeping) {
    if (!sleeping) { snoreTimer = 0; return; }
    snoreTimer -= dt;
    if (snoreTimer <= 0) {
      snoreTimer = 1.4;
      tone({ freq: 110, to: 70, dur: 0.5, type: 'sine', gain: 0.07 });
      tone({ freq: 90, to: 130, dur: 0.3, type: 'sine', gain: 0.05, delay: 0.55 });
    }
  },
};

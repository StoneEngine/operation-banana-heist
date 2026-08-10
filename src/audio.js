// ระบบเสียง — เอฟเฟกต์ทั้งหมดสังเคราะห์ด้วย WebAudio (ไม่มีไฟล์ให้โหลด)
// เพลงประกอบ (bgm) เป็นไฟล์จริง assets/audio/bgm.mp3 เล่นผ่าน <audio> ต่อเข้าบัส music เดียวกัน
//
// กฎการออกแบบเสียงของเกมนี้ (เคยพลาดมาแล้วตอนใช้ oscillator เปล่าเหมือนกันหมด = ฟังแล้วกลืนกัน):
//   1. หนึ่งเหตุการณ์ = หนึ่ง "เครื่องดนตรี" คนละชนิด แยกด้วย 3 อย่างพร้อมกัน
//      timbre (ฮาร์โมนิก) + envelope (เร็ว/ช้า) + ย่านความถี่
//   2. แยกบัส  ดนตรี < เอฟเฟกต์ < เสียงลิง  ดังไม่เท่ากันตามความสำคัญ
//   3. ดนตรีหลบ (duck) ทุกครั้งที่มีเสียงสำคัญ
//   4. จำกัดเสียงซ้อน กดรัวแค่ไหนก็ไม่แตก
//
// ตารางเครื่องดนตรี (เอฟเฟกต์ที่ยังสังเคราะห์อยู่)
//   เก็บกล้วย  marimba (ไม้)   ไซน์ + ฮาร์โมนิก x4 เบาๆ            500-900Hz  แต๊ก สั้นมาก
//   กล้วยทอง   glockenspiel    FM bell อัตราส่วน 3.5 หางยาว         1-2kHz     กังวาน
//   วิทยุ      lo-fi radio     สแควร์ผ่าน bandpass แคบ + ซ่า        600Hz      บิดคลื่น
//   ลิง       เสียงร้อง        ซอว์ + วิบราโต 24Hz ผ่าน lowpass     200-1400Hz สั่นเป็นเสียงร้อง
//   โดนจับ    กลองทิมปานี      ไซน์ดิ่ง 180->45 + ฉาบ (นอยส์ HP)    เบส+ซ่า    ตูม
//   นับถอยหลัง woodblock       นอยส์ผ่าน bandpass 2.6kHz แคบมาก     2.6kHz     ก๊อก
//   กรน       ลมหายใจ          นอยส์ผ่าน lowpass ขยับ               ต่ำ ฟู่ๆ   ช้า
//   จบเกม     แตรวง            ซอว์ผ่าน lowpass ค่อยเปิด            คอร์ด      ยาว

let audioCtx = null;
let muted = false;
let snoreTimer = 0;
let bus = null;
let lastGrabAt = 0;

function ac() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);
    const mk = (v) => { const g = audioCtx.createGain(); g.gain.value = v; g.connect(master); return g; };
    bus = { master, music: mk(0.26), sfx: mk(0.6), voice: mk(0.85) };
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function duck(depth = 0.35, hold = 0.25) {
  if (!bus) return;
  const g = bus.music.gain;
  const t = audioCtx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0.26 * depth, t + 0.03);
  g.linearRampToValueAtTime(0.26, t + 0.03 + hold);
}

// ---------------------------------------------------------------- เครื่องดนตรี

/** มาริมบา — ไซน์ + ฮาร์โมนิกที่ 4 เบาๆ, decay สั้น = เสียงไม้ */
function marimba(freq, delay = 0, gain = 0.5) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  out.connect(bus.sfx);

  [[1, 1.0, 0.22], [4, 0.18, 0.07]].forEach(([mult, amp, d]) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * mult, t);
    o.frequency.exponentialRampToValueAtTime(freq * mult * 0.985, t + d);
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d + 0.02);
  });
}

/** ระฆังกลอ็ก — FM อัตราส่วนไม่ลงตัว (3.5) = โลหะกังวาน */
function bell(freq, delay = 0, dur = 1.1, gain = 0.34) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const car = a.createOscillator();
  const mod = a.createOscillator();
  const modGain = a.createGain();
  const g = a.createGain();
  car.type = 'sine';
  mod.type = 'sine';
  car.frequency.value = freq;
  mod.frequency.value = freq * 3.5;
  modGain.gain.setValueAtTime(freq * 2.2, t);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, t + dur * 0.5);
  mod.connect(modGain).connect(car.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  car.connect(g).connect(bus.sfx);
  car.start(t); mod.start(t);
  car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
}

/** วิทยุเก่า — สแควร์ผ่าน bandpass แคบ + ซ่า = เสียงลำโพงกระป๋อง */
function radioBlip(freq, delay = 0, dur = 0.16) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 7;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.42, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const o = a.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.linearRampToValueAtTime(freq * 1.06, t + dur);
  o.connect(bp).connect(g).connect(bus.sfx);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** นอยส์ทั่วไป — ใช้ทำฉาบ/ซ่า/ลมหายใจ ต่างกันที่ฟิลเตอร์ */
function noiseBurst({ dur = 0.2, gain = 0.2, out = 'sfx', filter = 'highpass',
                      freq = 1200, q = 1, sweepTo = 0, delay = 0 }) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.max(1, Math.ceil(a.sampleRate * dur)), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus[out]);
  src.start(t);
}

/** กลอง — ไซน์ดิ่งลงเร็ว = หนังกลอง */
function drum(from, to, dur, gain = 0.5, delay = 0) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus.sfx);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** แตรวง — ซอว์ผ่าน lowpass ที่ค่อยๆ เปิด = ทองเหลือง */
function brass(freq, delay = 0, dur = 0.5, gain = 0.3) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(3000, t + 0.09);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.05);
  g.gain.setValueAtTime(gain, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (const det of [-7, 7]) {
    const o = a.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = det;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  lp.connect(g).connect(bus.sfx);
}

/** เสียงร้องลิง — ตัวอย่างเสียงจริง (มนุษย์เลียนเสียงลิง, CC-BY 3.0 AntumDeluge)
 * ไม่ใช่ oscillator สังเคราะห์แล้ว เพราะเสียงเดิมฟังดูไม่สมจริง ดูเครดิตที่ assets/audio/CREDITS.txt */
const VOICE_FILES = { ook: 'monkey_ook.mp3', screech: 'monkey_jiak.mp3', jiak: 'monkey_jiak.mp3', angry: 'monkey_angry.mp3' };
const voiceEls = {};

function monkeyVoice(kind, delay = 0) {
  if (muted) return;
  const a = ac();
  if (!voiceEls[kind]) {
    const el = new Audio('./assets/audio/' + VOICE_FILES[kind]);
    a.createMediaElementSource(el).connect(bus.voice);
    voiceEls[kind] = el;
  }
  const play = () => {
    const el = voiceEls[kind];
    el.currentTime = 0;
    el.play().catch(() => {});
  };
  if (delay > 0) setTimeout(play, delay * 1000);
  else play();
}

// ---------------------------------------------------------------- ดนตรี
// เพลงประกอบจริง (ไม่ใช่ WebAudio สังเคราะห์แล้ว) — "Secret Base" โดย PPEAK, CC-BY 4.0
// เครดิตอยู่ใน docs/manual.md / README ดู assets/audio/CREDITS.txt
const music = {
  el: null, src: null, on: false, anger: 0,

  ensureEl() {
    if (this.el) return;
    const a = ac();
    this.el = new Audio('./assets/audio/bgm.mp3');
    this.el.loop = true;
    this.src = a.createMediaElementSource(this.el);   // ต่อเข้าบัส music เพื่อให้ duck()/mute ใช้ได้เหมือนเดิม
    this.src.connect(bus.music);
  },

  start() {
    if (this.on || muted) return;
    this.ensureEl();
    this.on = true;
    this.el.currentTime = 0;
    this.el.playbackRate = 1;
    this.el.play().catch(() => {});                    // เบราว์เซอร์บาง build ต้องรอ user gesture ซ้ำ ไม่ throw
  },
  stop() {
    this.on = false;
    if (this.el) this.el.pause();
  },
  setAnger(v) {                                         // ยิ่งโกรธเพลงยิ่งเร่ง (แทนที่จะเปลี่ยนโน้ต)
    this.anger = v;
    if (this.el) this.el.playbackRate = 1 + v * 0.05;
  },
};

// ---------------------------------------------------------------- API ที่เกมเรียก
const sfx = {
  music,
  unlock() { ac(); },
  toggleMute() {
    muted = !muted;
    if (muted) music.stop();
    return muted;
  },
  get muted() { return muted; },

  grab(combo = 0) {                                   // มาริมบา ไล่สูงขึ้นตามคอมโบ
    const now = performance.now();
    if (now - lastGrabAt < 55) return;
    lastGrabAt = now;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    marimba(scale[Math.min(combo, scale.length - 1)]);
  },
  gold() {                                            // ระฆัง
    duck(0.3, 0.5);
    bell(1318.51, 0, 1.2);
    bell(1975.53, 0.08, 0.9, 0.22);
  },
  radio() {                                           // วิทยุกระป๋อง
    duck(0.3, 0.4);
    radioBlip(700); radioBlip(560, 0.1); radioBlip(840, 0.2);
    noiseBurst({ dur: 0.18, gain: 0.1, filter: 'bandpass', freq: 1800, q: 4, delay: 0.05 });
  },

  warn() {                                            // ลิงละเมอ "อู๊ก?"
    duck(0.25, 0.3);
    monkeyVoice('ook');
  },
  wake() {                                            // เจี๊ยกๆๆๆ + ฉาบเบาๆ
    duck(0.15, 0.5);
    monkeyVoice('jiak');
    noiseBurst({ dur: 0.25, gain: 0.1, filter: 'highpass', freq: 5000 });
  },
  caught() {                                          // กลองตูม + ฉาบ + ลิงด่า
    duck(0.08, 1.0);
    drum(180, 45, 0.45, 0.6);
    noiseBurst({ dur: 0.5, gain: 0.16, filter: 'highpass', freq: 3000, sweepTo: 800 });
    monkeyVoice('angry', 0.12);
  },
  end() {                                             // แตรวงจบเกม
    music.stop();
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => brass(f, i * 0.12, 0.5));
  },

  tick(last = false) {                                // woodblock นับถอยหลัง
    noiseBurst({ dur: last ? 0.12 : 0.045, gain: last ? 0.3 : 0.22,
                 filter: 'bandpass', freq: last ? 1800 : 2600, q: 18 });
  },

  snoreTick(dt, sleeping) {                           // ลมหายใจ ไม่ใช่โน้ต
    if (!sleeping) { snoreTimer = 0; return; }
    snoreTimer -= dt;
    if (snoreTimer <= 0) {
      snoreTimer = 2.1;
      noiseBurst({ dur: 0.5, gain: 0.16, filter: 'lowpass', freq: 380, sweepTo: 150, q: 3 });
      noiseBurst({ dur: 0.3, gain: 0.1, filter: 'lowpass', freq: 200, sweepTo: 420, q: 3, delay: 0.55 });
      drum(70, 52, 0.4, 0.12);                        // ตัวสั่นเบาๆ ให้รู้ว่ามีมวล
    }
  },
};

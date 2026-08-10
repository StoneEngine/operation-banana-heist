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

const sfx = {
  unlock() { ac(); },
  toggleMute() { muted = !muted; return muted; },
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
  warn() { tone({ freq: 880, to: 640, dur: 0.14, type: 'sawtooth', gain: 0.09 }); },
  wake() { tone({ freq: 300, to: 120, dur: 0.3, type: 'sawtooth', gain: 0.12 }); },
  caught() {
    noise(0.35, 0.18);
    tone({ freq: 260, to: 70, dur: 0.45, type: 'square', gain: 0.14 });
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

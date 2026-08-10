// ทุกตัวเลขที่จูน balance ได้อยู่ไฟล์นี้ที่เดียว — แก้แล้วรีเฟรชได้เลย
const CFG = {
  // ----- จอ -----
  W: 960,
  H: 540,

  // ----- รอบเกม -----
  ROUND_TIME: 60,          // วินาที
  GRAB_COOLDOWN: 0.13,     // กันกดรัวเกินจนไม่มีจังหวะ

  // ----- state machine ลิง (หน่วย: วินาที) -----
  SLEEP: [2.0, 5.0],
  WARN: [0.6, 1.2],
  AWAKE: [1.0, 2.0],
  CAUGHT_LOCK: 1.2,

  // ----- Monkey Meter (ความโกรธ) -----
  ANGER_PER_BANANA: 20,    // ทุก 20 ลูก โกรธขึ้น 1 ระดับ
  ANGER_MAX: 5,
  SLEEP_SHRINK: 0.13,      // ต่อระดับ: SLEEPING สั้นลง 13%
  WARN_SHRINK: 0.10,       // ต่อระดับ: WARNING สั้นลง 10%
  FAKE_WAKE_BASE: 0.05,    // โอกาสหลอกตื่นที่ anger 0
  FAKE_WAKE_PER_ANGER: 0.09,

  // ----- คะแนน / บทลงโทษ -----
  BANANA_PER_GRAB: 1,
  CAUGHT_PENALTY: 0.20,    // โดนจับ = เสียกล้วย 20%

  // ----- power-up -----
  GOLD_CHANCE: 0.55,       // โอกาสโผล่ต่อรอบหลับ
  GOLD_LIFETIME: 2.0,      // อยู่บนจอกี่วิ
  GOLD_MULT: 5,
  GOLD_MULT_TIME: 5.0,
  RADIO_CHANCE: 0.35,
  RADIO_LIFETIME: 2.5,
  RADIO_SLEEP_BONUS: 5.0,

  // ----- ความรู้สึก (juice) -----
  SHAKE_WARN: 3,
  SHAKE_CAUGHT: 12,
};

const STATE = {
  SLEEPING: 'SLEEPING',
  WARNING: 'WARNING',
  AWAKE: 'AWAKE',
  CAUGHT: 'CAUGHT',
};

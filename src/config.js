// ทุกตัวเลขที่จูน balance ได้อยู่ไฟล์นี้ที่เดียว — แก้แล้วรีเฟรชได้เลย
const CFG = {
  // ----- จอ -----
  W: 960,
  H: 540,

  // ----- รอบเกม -----
  ROUND_TIME: 45,          // วินาที
  GRAB_COOLDOWN: 0,        // 0 = คลิกรัวได้ไม่จำกัด (เสียงยังมีคูลดาวน์ 55ms ของมันเองใน audio.js)

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

  // ----- ตัวเอกเดินในสนาม (แนว Vampire Survivors: เดินอย่างเดียว เก็บของเอง) -----
  HERO_SPEED: 640,         // px/วินาที ที่วิ่งไล่ตำแหน่งเมาส์
  HERO_SIZE: 104,          // ขนาดที่วาด
  HERO_R: 17,              // รัศมี hitbox จริง — เล็กกว่าตัวมาก แบบเกมหลบกระสุน
  HERO_IFRAME: 0.9,        // โดนแล้วอมตะกี่วินาที (กันโดนรัว)
  HERO_KNOCKBACK: 420,
  FIELD: { left: 46, right: 914, top: 250, bottom: 512 },   // ขอบเขตที่เดินได้

  // ----- เก็บกล้วยแบบยืนใกล้กอง -----
  STEAL_R: 132,            // รัศมีเขตกองกล้วย
  STEAL_RATE: 9,           // กล้วย/วินาที ตอนยืนในเขตแล้วลิงหลับ

  // ----- ลิงปาเปลือกกล้วย -----
  THROW_INTERVAL: [0.5, 0.95],   // ระยะห่างระหว่างการปา ตอนลิงตื่น
  THROW_SPEED: 470,
  THROW_R: 20,             // รัศมี hitbox ของกล้วยที่ปามา
  THROW_SPREAD: 0.30,      // ความคลาดเคลื่อนของการเล็ง (เรเดียน)
  THROW_PER_ANGER: 0.5,    // โกรธ 1 ระดับ = ปาเพิ่มทีละ 0.5 ลูก (โกรธ 4 = 3 ลูกรวด)

  // ----- คะแนน / บทลงโทษ -----
  BANANA_PER_GRAB: 1,
  CAUGHT_PENALTY: 0.20,    // โดนจับ/โดนปา = เสียกล้วย 20%

  // ----- power-up -----
  GOLD_CHANCE: 0.55,       // โอกาสโผล่ต่อรอบหลับ
  GOLD_LIFETIME: 2.0,      // อยู่บนจอกี่วิ
  GOLD_MULT: 5,
  GOLD_MULT_TIME: 5.0,
  RADIO_CHANCE: 0.35,
  RADIO_LIFETIME: 2.5,
  RADIO_SLEEP_BONUS: 5.0,

  // ----- ฉากจบ (เกณฑ์จำนวนกล้วยตอนหมดเวลา) -----
  ENDING_HERO: 60,         // ตั้งแต่เท่านี้ = ฮีโร่แห่งหมู่บ้าน
  ENDING_LEGEND: 150,      // ตั้งแต่เท่านี้ = ตำนานจ้าวป่าคนใหม่ (ลดตาม ROUND_TIME 60->45)

  // ----- typewriter หน้าเล่าเรื่อง -----
  STORY_CPS: 45,           // ตัวอักษรต่อวินาที

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

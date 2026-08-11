// หน้าเล่าเรื่อง (intro 3 แผ่น) + ข้อความฉากจบ 3 แบบ
// ไม่ยุ่งกับ canvas / game loop เลย — เป็น overlay HTML ล้วน

const STORY_SLIDES = [
  'มีเกาะลึกลับแห่งหนึ่งชื่อ "เกาะกล้วยหอมทองคำ" เต็มไปด้วยกล้วยที่อร่อยที่สุดในโลก\nแต่กล้วยทั้งเกาะถูกยึดครองโดย "จ่าฝูงบอสคอง" กอริลลาจอมหวงกล้วย',
  'เหล่าสัตว์ตัวน้อยและเด็กๆ ในหมู่บ้านไม่ได้กินกล้วยมานานแล้ว\nคุณคือความหวังเดียว — ย่องเข้าเขตแดนบอสคองตอนมันหลับกลางวัน แล้วขโมยกล้วยกลับมา',
  'แต่ระวัง! บอสคองหูไวมาก มีเสียงกุกกักนิดเดียวก็ตื่นมาปาเปลือกกล้วยใส่ทันที\nเก็บกล้วยให้ได้มากที่สุดใน 60 วินาที เพื่อจัดปาร์ตี้กล้วยหอมให้ทั้งหมู่บ้าน!',
];

// เกณฑ์อ่านจาก CFG.ENDING_HERO / CFG.ENDING_LEGEND
const ENDINGS = {
  bronze: {
    title: '🥉 วิ่งหนีหางจุกตูด',
    body: 'บอสคองตื่นมาคำรามลั่นป่า ไล่ปาเปลือกกล้วยจนคุณต้องเตลิดออกมา\nกล้วยไม่พอแจก ปาร์ตี้ต้องยกเลิก สัตว์เล็กสัตว์น้อยแอบเศร้านิดๆ — กลับไปฝึกวิชานินจาใหม่!',
    monkey: 'monkey_caught', prop: 'banana_peel', cls: 'shake', sound: 'bronze',
  },
  silver: {
    title: '🥈 ฮีโร่แห่งหมู่บ้าน',
    body: 'บอสคองตื่นมาตบพุงตัวเองงุนงงว่ากล้วยหายไปไหนหมด ได้แต่นั่งเกาหัวแกรกๆ\nกล้วยเยอะพอจัด "มหกรรมปาร์ตี้กล้วยหอมทองคำ" ฉลอง 7 วัน 7 คืน! คุณคือฮีโร่ของหมู่บ้าน',
    monkey: 'monkey_awake', prop: 'basket', cls: 'sway', sound: 'silver',
  },
  gold: {
    title: '🥇 ตำนานจ้าวป่าคนใหม่!',
    body: 'คุณมือไวระดับแสงจนขโมยกล้วยหมดเกาะ บอสคองเห็นคลังกล้วยว่างเปล่าถึงกับเข่าทรุด\nมันยอมก้มหัวคารวะขอเป็นลูกศิษย์ คุณถูกแต่งตั้งเป็นราชาแห่งป่าหรรษา พร้อมบอดี้การ์ดส่วนตัว!',
    monkey: 'monkey_sleep', prop: 'banana_gold', cls: 'glow', sound: 'gold',
  },
};

function endingFor(bananas) {
  if (bananas >= CFG.ENDING_LEGEND) return ENDINGS.gold;
  if (bananas >= CFG.ENDING_HERO) return ENDINGS.silver;
  return ENDINGS.bronze;
}

const story = {
  el: document.getElementById('story'),
  textEl: document.getElementById('story-text'),
  scenes: document.querySelectorAll('#story .scene'),
  i: 0,
  chars: [],
  shown: 0,
  timer: null,
  onDone: null,

  play(onDone) {
    this.onDone = onDone;
    this.i = -1;
    this.el.hidden = false;
    sfx.music.start();                 // เพลงเริ่มตั้งแต่ intro แล้วเล่นต่อเนื่องเข้าเกมเลย
    this.next();
  },

  next() {
    this.i += 1;
    if (this.i >= STORY_SLIDES.length) { this.close(); return; }
    this.scenes.forEach((s, n) => s.classList.toggle('on', n === this.i));
    sfx.page();
    if (this.i === 1) sfx.bossReveal();   // แผ่นที่บอสคองโผล่
    this.chars = Array.from(STORY_SLIDES[this.i]);
    this.shown = 0;
    this.textEl.textContent = '';
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.shown += 1;
      this.textEl.textContent = this.chars.slice(0, this.shown).join('');
      if (this.shown % 3 === 0) sfx.type();          // เสียงพิมพ์ดีด ทุก 3 ตัวพอ ไม่งั้นรก
      if (this.shown >= this.chars.length) clearInterval(this.timer);
    }, 1000 / CFG.STORY_CPS);
  },

  // คลิกครั้งแรกระหว่างพิมพ์ = เผยข้อความทั้งหมด, คลิกอีกที = แผ่นถัดไป
  advance() {
    if (this.el.hidden) return;
    if (this.shown < this.chars.length) {
      clearInterval(this.timer);
      this.shown = this.chars.length;
      this.textEl.textContent = this.chars.join('');
      return;
    }
    this.next();
  },

  close() {
    clearInterval(this.timer);
    this.el.hidden = true;
    if (this.onDone) this.onDone();
  },
};

story.el.addEventListener('pointerdown', (e) => {
  if (e.target.id === 'btn-skip') return;
  story.advance();
});
document.getElementById('btn-skip').addEventListener('click', () => story.close());

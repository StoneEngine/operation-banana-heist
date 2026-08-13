// หน้าเล่าเรื่อง — intro 4 แผ่น + ฉากจบ 3 แบบ (เล่าแบบ typewriter เหมือนกัน)
// ไม่ยุ่งกับ canvas / game loop เลย — เป็น overlay HTML ล้วน

// แต่ละแผ่น: scene = ค่า data-scene ของ .scene ใน index.html
const STORY_SLIDES = [
  { scene: 'hero', text: 'นี่คือ "จ๋อจิ๋ว" ลิงตัวจิ๋วจากหมู่บ้านชายป่า ตัวเล็กที่สุดในรุ่น แต่มือไวที่สุดในเกาะ\nมันฝึกวิชานินจาขโมยกล้วยมาตั้งแต่เด็ก — วันนี้ถึงเวลาใช้ของจริง' },
  { scene: 'island', text: 'มีเกาะลึกลับแห่งหนึ่งชื่อ "เกาะกล้วยหอมทองคำ" เต็มไปด้วยกล้วยที่อร่อยที่สุดในโลก\nแต่กล้วยทั้งเกาะถูกยึดครองโดย "จ่าฝูงบอสคอง" กอริลลาจอมหวงกล้วย' },
  { scene: 'boss', text: 'เหล่าสัตว์ตัวน้อยและเด็กๆ ในหมู่บ้านไม่ได้กินกล้วยมานานแล้ว\nจ๋อจิ๋วคือความหวังเดียว — ย่องเข้าเขตแดนบอสคองตอนมันหลับกลางวัน แล้วขโมยกล้วยกลับมา' },
  { scene: 'sneak', text: 'บอสคองสั่งลูกน้องลิงทั้งฝูงออกลาดตระเวนทั่วเกาะ เจอใครเป็นไล่ปาก้อนหินใส่ทันที\nวิ่งเก็บกล้วยที่ร่วงตามพื้นให้ได้มากที่สุดใน 45 วินาที แล้วอย่าให้มันจับได้!' },
];

// เกณฑ์อ่านจาก CFG.ENDING_HERO / CFG.ENDING_LEGEND
const ENDINGS = {
  bronze: {
    title: '🥉 วิ่งหนีหางจุกตูด',
    pages: [
      { scene: 'end-bronze', text: 'เสียงกุกกักดังขึ้นตอนที่ไม่ควรดัง บอสคองลืมตาโพลง คำรามลั่นจนนกทั้งป่าบินหนี\nจ๋อจิ๋วได้แต่กอดกล้วยไม่กี่หวีแล้ววิ่งเตลิด เปลือกกล้วยปลิวใส่หัวไม่หยุดตลอดทาง' },
      { scene: 'end-bronze', text: 'กลับถึงหมู่บ้าน กล้วยมีไม่พอแจกสักคน ปาร์ตี้ถูกเลื่อนออกไปอีกครั้ง\nสัตว์เล็กสัตว์น้อยแอบเศร้านิดๆ แต่ก็ตบไหล่จ๋อจิ๋วแล้วบอกว่า "พรุ่งนี้ยังมี" — ไปฝึกวิชามาใหม่!' },
    ],
    monkey: 'monkey_caught', prop: 'banana_peel', cls: 'shake', sound: 'bronze',
  },
  silver: {
    title: '🥈 ฮีโร่แห่งหมู่บ้าน',
    pages: [
      { scene: 'end-silver', text: 'บอสคองตื่นขึ้นมาตบพุงตัวเองงุนงง กวาดตาหาคลังกล้วยที่หายไปเป็นกอง\nได้แต่นั่งเกาหัวแกรกๆ อยู่กลางเกาะ ไม่รู้เลยว่าเงาเล็กๆ เพิ่งวิ่งลอดพงหญ้าออกไป' },
      { scene: 'end-silver', text: 'คืนนั้นทั้งหมู่บ้านจุดไฟกองใหญ่ จัด "มหกรรมปาร์ตี้กล้วยหอมทองคำ" ฉลองกัน 7 วัน 7 คืน\nทุกคนกินกล้วยจนพุงกาง แล้วยกให้จ๋อจิ๋วเป็นฮีโร่ของหมู่บ้าน' },
    ],
    monkey: 'monkey_awake', prop: 'basket', cls: 'sway', sound: 'silver',
  },
  gold: {
    title: '🥇 ตำนานจ้าวป่าคนใหม่!',
    pages: [
      { scene: 'end-gold', text: 'มือของจ๋อจิ๋วไวจนตาตามแทบไม่ทัน กล้วยทั้งเกาะหายเกลี้ยงไม่เหลือแม้แต่ใบ\nบอสคองตื่นมาเห็นคลังสมบัติว่างเปล่า ถึงกับเข่าทรุดร้องไห้โฮออกมากลางป่า' },
      { scene: 'end-gold', text: 'แต่พอรู้ว่าใครทำ มันกลับก้มหัวคารวะ ขอฝากตัวเป็นลูกศิษย์วิชานินจา\nจ๋อจิ๋วถูกแต่งตั้งเป็น "ราชาแห่งป่าหรรษา" มีบอสคองเป็นบอดี้การ์ด — แถมปลูกกล้วยส่งให้ทั้งหมู่บ้านทุกเดือน' },
    ],
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
  slides: [],
  i: 0,
  chars: [],
  shown: 0,
  timer: null,
  onDone: null,
  isIntro: false,

  play(onDone) {                       // intro ก่อนเริ่มเกม
    this.isIntro = true;
    this.run(STORY_SLIDES, onDone);
    sfx.music.start();                 // เพลงเริ่มตั้งแต่ intro แล้วเล่นต่อเนื่องเข้าเกมเลย
  },

  playEnding(end, onDone) {            // เล่าฉากจบก่อนโชว์การ์ดคะแนน
    this.isIntro = false;
    this.run(end.pages, onDone);
  },

  run(slides, onDone) {
    this.slides = slides;
    this.onDone = onDone;
    this.i = -1;
    this.el.hidden = false;
    this.next();
  },

  next() {
    this.i += 1;
    if (this.i >= this.slides.length) { this.close(); return; }
    const slide = this.slides[this.i];
    this.scenes.forEach((s) => s.classList.toggle('on', s.dataset.scene === slide.scene));
    sfx.page();
    if (this.isIntro && slide.scene === 'boss') sfx.bossReveal();
    this.chars = Array.from(slide.text);
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

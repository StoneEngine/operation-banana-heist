# 🍌 ปฏิบัติการปล้นกล้วย (Operation Banana Heist)

เกม 2D บนเว็บ (HTML + CSS + JavaScript + Canvas) ส่งงานวิชา **273389 Game Design and Development**
กิจกรรม **Game2D for Sci Week** · มหาวิทยาลัยนเรศวร

- ชื่อกลุ่ม: _(ใส่ชื่อกลุ่ม)_
- สมาชิก: _(ใส่ชื่อ-รหัสนิสิตทุกคน)_
- **เล่นเกมเลย: https://stoneengine.github.io/operation-banana-heist/**
- คู่มือ/รายงาน: [docs/manual.md](docs/manual.md)

## วิธีเล่น

| อินพุต | ผล |
|---|---|
| คลิก / แตะ / เว้นวรรค | ยื่นมือหยิบกล้วย 1 ลูก |
| เลื่อนเมาส์ | ย้ายตำแหน่งมือ |

- ลิง **หลับ** (มี Zzz) = ขโมยได้
- ขึ้น **!** สีแดง = ใกล้ตื่น เสี่ยงแล้ว
- ลิง **ตื่น** แล้วยังกด = โดนจับ เสียกล้วย 20%
- **กล้วยทอง** = คะแนน x5 ห้าวินาที · **วิทยุ** = ลิงหลับต่ออีก 5 วินาที
- รอบละ 60 วินาที เก็บกล้วยให้ได้มากที่สุด (สถิติเก็บใน localStorage)

## รันในเครื่อง

**ดับเบิลคลิก `index.html` เปิดในเบราว์เซอร์ได้เลย** — เกมเป็น HTML/CSS/JS ล้วน
ไม่มี build step ไม่มีไลบรารีภายนอก ไม่ต้องติดตั้งอะไร

## สร้าง sprite ใหม่

sprite ทุกตัววาดด้วยโค้ด Python (Pillow) ไม่ได้ใช้ AI สร้างภาพ

```bash
pip install Pillow
python assets/src/build_monkey.py    # เจ้าจ๋อ 4 อารมณ์
python assets/src/build_props.py     # กล้วย/ตะกร้า/มือ/วิทยุ/ฉากหลัง
```

## โครงไฟล์

```
index.html          หน้าเกม + overlay เมนู/จบเกม
style.css           layout + สเกลจอให้พอดี (image-rendering: pixelated)
src/config.js       ตัวเลข balance ทั้งหมดอยู่ที่นี่ที่เดียว
src/state.js        state machine ลิง (SLEEPING/WARNING/AWAKE/CAUGHT) + รอบเกม
src/player.js       มือผู้เล่น อินพุต คูลดาวน์
src/powerups.js     กล้วยทอง + วิทยุ
src/render.js       วาดฉาก/ลิง/เอฟเฟกต์/HUD
src/audio.js        เอฟเฟกต์สังเคราะห์ WebAudio + เพลงประกอบไฟล์จริง (assets/audio/bgm.mp3)
src/main.js         game loop + ผูกทุกอย่างเข้าด้วยกัน
assets/src/*.py     สคริปต์วาด sprite
assets/sprites/     PNG ที่เกมโหลดจริง
assets/audio/       เพลงประกอบ (ดูเครดิต assets/audio/CREDITS.txt)
docs/               รายงาน manual + ผลประเมิน + วิดีโอ demo
```

## เครดิต

เพลงประกอบ "Secret Base" โดย PPEAK (Preston Peak) — [FREE Action Chiptune Music Pack](https://opengameart.org/content/free-action-chiptune-music-pack) · CC-BY 4.0
เสียงลิง โดย AntumDeluge — [Monkey Sounds](https://opengameart.org/content/monkey-sounds) · CC-BY 3.0

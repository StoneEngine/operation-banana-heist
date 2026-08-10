# 🍌 Banana Heist — แข่งขโมยกล้วยจากลิง

เกม 2D บนเว็บ (HTML + CSS + JavaScript + Canvas) ส่งงานวิชา **273389 Game Design and Development**
กิจกรรม **Game2D for Sci Week** · มหาวิทยาลัยนเรศวร

- ชื่อกลุ่ม: _(ใส่ชื่อกลุ่ม)_
- สมาชิก: _(ใส่ชื่อ-รหัสนิสิตทุกคน)_
- เล่นเกม (deploy): _(ใส่ลิงก์ GitHub Pages)_
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

ต้องเสิร์ฟผ่าน http (ใช้ ES modules) — เปิดไฟล์ตรงๆ ด้วย `file://` จะไม่ทำงาน

```bash
python -m http.server 8000
# เปิด http://localhost:8000
```

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
src/audio.js        เสียงสังเคราะห์ WebAudio (ไม่มีไฟล์เสียงให้โหลด)
src/main.js         game loop + ผูกทุกอย่างเข้าด้วยกัน
assets/src/*.py     สคริปต์วาด sprite
assets/sprites/     PNG ที่เกมโหลดจริง
docs/               รายงาน manual + ผลประเมิน + วิดีโอ demo
```

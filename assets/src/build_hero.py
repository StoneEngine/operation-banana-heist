"""จ๋อจิ๋ว (Jo Jiw) — ตัวเอกลิงจิ๋วนินจา 64x64 ท่านิ่งท่าเดียว ไม่มี animation.

Run:  python assets/src/build_hero.py
Out:  assets/sprites/hero.png  +  assets/preview/hero.png (scale 6)
"""
import sys, os
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, ramp, save

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SPR = os.path.join(ROOT, "sprites")
PRE = os.path.join(ROOT, "preview")

FUR = ramp("#8a5a32", steps=5)         # ขนสีเดียวกับบอสคอง จะได้ดูเป็นลิงเผ่าเดียวกัน
SKIN = ramp("#d9a066", steps=5)
NAVY = ramp("#3c4a7a", steps=5)        # ชุดนินจา
INK = "#2b1b13"
WHITE = "#fff1e0"
YEL = "#f7d94c"
YEL_HI = "#fff3a0"
YEL_LO = "#d09a1e"


def hero():
    c = Canvas(64, 64)

    # หาง (อยู่หลังตัว วาดก่อน) — วาดหลายเส้นซ้อนให้หนา ไม่งั้นดูเหมือนกิ่งไม้
    for dy in (0, 1, 2):
        c.line(40, 44 + dy, 49, 42 + dy, FUR[1])
        c.line(49, 42 + dy, 53, 36 + dy, FUR[1])
        c.line(53, 36 + dy, 50, 31 + dy, FUR[1])

    # ขา + เท้า
    c.ellipse(23, 46, 8, 13, NAVY[2])
    c.ellipse(33, 46, 8, 13, NAVY[2])
    c.ellipse(21, 56, 11, 6, SKIN[2])
    c.ellipse(32, 56, 11, 6, SKIN[2])

    # ลำตัวในชุดนินจา
    c.ellipse(22, 28, 20, 22, NAVY[3])
    c.ellipse(26, 32, 12, 12, NAVY[2])     # เงาอกด้านใน
    c.rect(22, 40, 20, 4, YEL)             # ผ้าคาดเอว
    c.rect(22, 40, 20, 1, YEL_HI)

    # แขนซ้าย (ปล่อยข้างตัว) — มือกำ
    c.ellipse(15, 30, 9, 14, NAVY[3])
    c.ellipse(14, 42, 9, 8, SKIN[2])

    # หัว + หู
    c.circle(19, 16, 5, FUR[2])
    c.circle(44, 16, 5, FUR[2])
    c.circle(19, 16, 2, SKIN[2])
    c.circle(44, 16, 2, SKIN[2])
    c.ellipse(20, 4, 24, 24, FUR[3])

    # หน้ากากนินจาปิดครึ่งล่าง เห็นแค่ตา
    c.ellipse(21, 20, 22, 10, NAVY[3])
    c.ellipse(23, 24, 18, 5, NAVY[2])

    # ผ้าคาดหัว + ชายผ้าปลิวไปทางขวา
    c.rect(20, 9, 24, 5, NAVY[4])
    c.rect(20, 9, 24, 1, "#5c6ea8")
    for dy in (0, 1):
        c.line(43, 11 + dy, 55, 8 + dy, NAVY[4])
        c.line(43, 15 + dy, 54, 17 + dy, NAVY[4])
    c.line(55, 8, 61, 12, NAVY[3])
    c.line(54, 17, 60, 22, NAVY[3])

    # แขนขวาปล่อยข้างตัว (เคยลองชูกล้วยเหนือหัวแล้วมันจมรวมเป็นก้อนน้ำเงินกับหัว เลยเอาลง)
    c.ellipse(40, 30, 9, 14, NAVY[3])
    c.ellipse(41, 42, 9, 8, SKIN[2])

    c.shade(NAVY, light=(-1, -1), depth=2, only=NAVY[3])
    c.outline(INK, diagonal=False)

    # ตา (วาดหลัง outline จะได้คม) — ตาโตมุ่งมั่น ไม่ดุ
    c.ellipse(23, 15, 8, 7, WHITE)
    c.ellipse(33, 15, 8, 7, WHITE)
    c.ellipse(25, 17, 4, 4, INK)
    c.ellipse(35, 17, 4, 4, INK)
    c.set(26, 18, WHITE)
    c.set(36, 18, WHITE)
    # คิ้วเอียงเข้าหากันนิดเดียว = ตั้งใจ
    c.line(22, 13, 29, 14, INK)
    c.line(34, 14, 41, 13, INK)

    # กล้วยที่ถือในมือซ้าย
    c.circle(11, 45, 5, YEL)
    c.circle(11, 45, 5, YEL_LO, filled=False)
    c.circle(14, 42, 5, None)
    for x, y in ((7, 44), (7, 45), (8, 43), (8, 48), (9, 49)):
        c.set(x, y, YEL_LO)
    for x, y in ((8, 41), (9, 40), (10, 40)):
        if c.get(x, y)[3]:
            c.set(x, y, YEL_HI)
    return c


c = hero()
save(c, os.path.join(SPR, "hero.png"))
save(c, os.path.join(PRE, "hero.png"), scale=6)
print(f"  hero: {c.count_colors()} colors")

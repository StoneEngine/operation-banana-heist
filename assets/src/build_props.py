"""Props + jungle backdrop for Banana Heist.

Run:  python assets/src/build_props.py
Out:  assets/sprites/{banana,banana_gold,basket,hand,radio,bg}.png
"""
import sys, os
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, ramp, save, save_sheet, save_gif

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SPR = os.path.join(ROOT, "sprites")
PRE = os.path.join(ROOT, "preview")

INK = "#2b1b13"
YEL = ramp("#f2c14e", steps=5)
GOLD = ramp("#ffd94a", steps=5)
WOOD = ramp("#a9703f", steps=5)
SKIN = ramp("#d9a066", steps=5)
GREEN = ramp("#3f8f4a", steps=5)


def banana(body, hi, lo, sparkle=False):
    """Crescent = one filled disc with a second disc erased out of it."""
    c = Canvas(16, 16)
    c.circle(9, 7, 6, body)                    # outer
    c.circle(9, 7, 6, lo, filled=False)        # rim shadow
    c.circle(13, 3, 6, None)                   # bite out the inside curve
    # relight the outer-left rim
    for x, y in ((3, 6), (3, 7), (4, 5), (4, 9), (5, 10), (6, 11), (8, 12)):
        c.set(x, y, lo)
    for x, y in ((4, 4), (5, 3), (6, 3), (7, 4), (5, 4), (4, 6), (4, 7)):
        if c.get(x, y)[3]:
            c.set(x, y, hi)
    # ขั้วกล้วย ต้องต่อกับปลายผลจริงๆ (เดิมวางไว้ (10,3)/(11,2)/(11,1) ซึ่งอยู่ในส่วนที่ถูกเจาะออก
    # เลยกลายเป็นจุดน้ำตาลลอยข้างกล้วยทุกลูก)
    c.set(5, 1, "#6b4a2a"); c.set(6, 1, "#6b4a2a"); c.set(6, 0, "#6b4a2a")
    c.set(11, 13, "#6b4a2a")            # ปลายดอกอีกด้าน
    c.outline(INK)
    if sparkle:
        for x, y in ((2, 2), (14, 8), (5, 14)):
            c.set(x, y, "#fffbe0")
    return c


def peel():
    """เปลือกกล้วยเปิด 3 แฉก — ใช้ตอนลิงปาใส่หน้าผู้เล่น"""
    c = Canvas(16, 16)
    body = "#f0c73f"; dark = "#c99a1c"; inner = "#fff3c4"
    # แฉกสามอันกางออกจากจุดร่วมด้านล่าง
    for x1, y1 in ((1, 2), (8, 0), (14, 3)):
        c.line(8, 13, x1, y1, body)
        c.line(7, 13, x1 - 1, y1 + 1, body)
        c.set(x1, y1, dark)
    c.polygon([(8, 13), (3, 5), (5, 4), (9, 11)], body)
    c.polygon([(8, 13), (8, 2), (10, 3), (10, 12)], inner)
    c.polygon([(8, 13), (13, 5), (14, 7), (10, 12)], body)
    c.ellipse(5, 10, 7, 5, dark)          # ก้นเปลือกที่คว่ำอยู่
    c.ellipse(6, 11, 5, 3, body)
    c.outline(INK)
    return c


def basket():
    c = Canvas(32, 32)
    c.ellipse(2, 6, 28, 10, WOOD[3])          # rim
    c.polygon([(4, 10), (28, 10), (24, 28), (8, 28)], WOOD[2])
    for y in range(12, 28, 3):                 # weave
        c.line(5 + (y - 12) // 4, y, 27 - (y - 12) // 4, y, WOOD[1])
    for x in range(7, 26, 4):
        c.line(x, 11, x + (16 - x) // 6, 27, WOOD[1])
    c.ellipse(5, 8, 22, 7, WOOD[0])           # inner dark
    c.outline(INK)
    return c


def hand_frame(i):
    """เฟรมมือ 0-3: แบเปิด -> นิ้วเริ่มงอ -> งอมากขึ้น -> กำรอบกล้วยแน่น (sync กับ player.reach)"""
    c = Canvas(32, 32)
    c.ellipse(8, 12, 17, 15, SKIN[3])         # palm
    if i == 3:
        c.ellipse(12, 9, 8, 7, YEL[3])        # กล้วยในกำมือ
        c.ellipse(13, 8, 4, 3, YEL[4])
    curl = (0, 3, 6, 9)[i]
    for x, top in ((9, 5), (13, 3), (17, 3), (21, 5)):
        ftop = top + curl
        fh = max(4, 12 - curl)
        c.rect(x, ftop, 3, fh, SKIN[3])
        c.set(x + 1, ftop, "#e8bd8e")
    tdx = i                                    # หัวแม่มือขยับเข้าปิดล้อมตอนกำ
    c.rect(5 + tdx, 15, 5, 4, SKIN[2])        # thumb
    c.rect(4 + tdx, 16, 3, 5, SKIN[2])
    c.rect(10, 25, 13, 7, "#5a3a6b")          # sleeve
    c.rect(10, 25, 13, 2, "#7a5290")
    c.rect(9, 14, 2, 9, "#e8bd8e")            # single soft highlight, light top-left
    c.outline(INK)
    return c


def sword():
    """ดาบสั้นแบบนินจา ใบมีดเฉียง 45 องศา ใช้เป็นไอคอนการ์ดอัปเกรดฟันประชิด"""
    c = Canvas(16, 16)
    STEEL = ramp("#c9d3dc", steps=5)
    HILT = ramp("#6b4a2a", steps=5)
    # ใบมีด — เส้นหนาเฉียงจากล่างซ้ายขึ้นบนขวา
    for i in range(9):
        x, y = 3 + i, 11 - i
        c.set(x, y, STEEL[3])
        c.set(x + 1, y, STEEL[2])
        c.set(x, y - 1, STEEL[4])          # สันมีดสว่างวาบ
    c.set(11, 1, STEEL[4]); c.set(12, 1, STEEL[4])  # ปลายแหลม
    # ด้ามจับ + การ์ด
    c.set(2, 12, HILT[3]); c.set(1, 13, HILT[2])
    c.line(1, 13, 4, 10, "#2b1b13")          # เส้นกากบาทการ์ดสั้นๆ
    c.rect(0, 13, 3, 3, HILT[2])
    c.set(0, 14, HILT[1])
    c.outline(INK)
    return c


def heart():
    """หัวใจแดงเล็ก ใช้แทนคำว่า 'เลือด' บน HUD"""
    c = Canvas(16, 16)
    RED = ramp("#e5484d", steps=5)
    c.circle(5, 5, 4, RED[3])
    c.circle(10, 5, 4, RED[3])
    c.polygon([(1, 6), (14, 6), (8, 15)], RED[3])
    for x, y in ((3, 3), (4, 2), (8, 2), (9, 3)):
        c.set(x, y, RED[4])                # ไฮไลต์บนสองก้อนกลม
    c.outline(INK)
    return c


def radio():
    c = Canvas(16, 16)
    c.rect(2, 6, 12, 8, "#8a8f98")
    c.rect(3, 7, 6, 5, "#4a4f58")
    c.set(4, 8, "#cfd6e0"); c.set(6, 10, "#cfd6e0")
    c.circle(11, 9, 1, "#f2c14e")
    c.rect(10, 11, 3, 1, "#3a3f48")
    c.line(12, 5, 14, 1, "#b9c0cb")           # antenna
    c.set(14, 1, "#f2c14e")
    c.outline(INK)
    # music notes
    c.set(1, 3, "#fff1e0"); c.set(1, 2, "#fff1e0"); c.set(0, 4, "#fff1e0")
    return c


items = {
    "banana": banana("#f7d94c", "#fff3a0", "#d09a1e"),
    "banana_gold": banana("#ffd21f", "#fff8c2", "#c8860a", sparkle=True),
    "banana_peel": peel(),
    "basket": basket(),
    "radio": radio(),
    "sword": sword(),
    "heart": heart(),
}
for name, c in items.items():
    save(c, os.path.join(SPR, f"{name}.png"))
    save(c, os.path.join(PRE, f"{name}.png"), scale=8)

# มือ: 4-เฟรม sheet (แบ -> กำ) แทน PNG นิ่งอันเดียว
hand_frames = [hand_frame(i) for i in range(4)]
save_sheet(hand_frames, os.path.join(SPR, "hand.png"), cols=4, scale=1,
           manifest=os.path.join(SPR, "hand.json"), fps=10, name="grab")
save_gif(hand_frames, os.path.join(PRE, "hand.gif"), scale=8, fps=10)
print(f"  hand: {hand_frames[0].count_colors()} colors, 4 frames")

# หมายเหตุ: ฉากหลัง (bg.png) ย้ายไปอยู่ assets/src/build_bg.py แล้ว อย่าวาดซ้ำที่นี่

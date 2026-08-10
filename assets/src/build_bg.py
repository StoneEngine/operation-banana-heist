"""ฉากหลังป่า 240x135 (canvas ขยาย x4) — วาดเป็นชั้นๆ ให้มีระยะลึก

ชั้นจากหลังไปหน้า: ท้องฟ้า -> ภูเขาไกล -> แนวป่าไกล -> แนวป่ากลาง
-> เรือนยอด+เถาวัลย์ด้านบน -> ต้นไม้ใหญ่ซ้ายขวา -> พื้นดิน+หญ้า -> ใบไม้เบลอหน้าสุด

Run:  python assets/src/build_bg.py
"""
import sys, os, random
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, save

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W, H = 240, 135
GROUND = 104                      # เส้นพื้นต้องตรงกับ GROUND_Y/4 ใน render.js

# palette เดียวทั้งฉาก ไล่จากไกล(จาง/ฟ้า) ไปใกล้(เข้ม/อิ่ม)
SKY = ["#2c6e58", "#3f8d6d", "#5cae85", "#83cda3", "#a8e0bd"]  # ล่างสว่าง = แสงลอดเรือนยอด
FAR = ["#5fae8a", "#4f9c7b"]
MID = ["#3d8365", "#347356"]
NEAR = ["#27604a", "#1e5340"]
CANOPY = ["#164536", "#10382b"]
FRONT = "#0c2a21"
DIRT = ["#7a5330", "#66432476", "#5a3c1f", "#49301a"]
GRASS = ["#3f8f4a", "#57a86a", "#2c6f3c"]


def leaf(c, cx, cy, w, h, col, vein=None, tilt=0):
    """ใบไม้ทรงรีปลายแหลม + ก้านกลาง (ทรงรีเฉยๆ ดูเป็นก้อนกลมไม่เหมือนใบ)"""
    for i in range(w):
        t = i / max(w - 1, 1)
        half = int(h / 2 * (1 - (2 * t - 1) ** 2) ** 0.62)
        x = cx + i
        y = cy + int(tilt * (t - 0.5) * h)
        if half <= 0:
            c.set(x, y, col)
            continue
        c.line(x, y - half, x, y + half, col)
    if vein:
        c.line(cx, cy, cx + w - 1, cy + int(tilt * 0.5 * h), vein)


def blob_row(c, y, r_min, r_max, step, col, rnd, jitter=4):
    """แนวพุ่มไม้ = วงกลมซ้อนกันเป็นแถว ให้ขอบบนหยักเป็นธรรมชาติ"""
    x = -8
    while x < W + 8:
        r = rnd.randrange(r_min, r_max)
        c.circle(x, y + rnd.randrange(-jitter, jitter + 1), r, col)
        c.rect(x - r, y, r * 2 + 1, H - y, col)
        x += step


def build():
    rnd = random.Random(11)
    c = Canvas(W, H, fill=SKY[0])

    # 1) ท้องฟ้า/อากาศในป่า ไล่สว่างลงล่าง
    c.gradient_dither(SKY, axis="y", box=(0, 0, W, GROUND))

    # 2) ภูเขาไกลจางๆ
    for base, col in ((72, "#7cc79f"), (79, "#63b189")):
        x = -10
        while x < W + 10:
            wdt = rnd.randrange(40, 80)
            hgt = rnd.randrange(10, 20)
            c.polygon([(x, base), (x + wdt // 2, base - hgt), (x + wdt, base)], col)
            x += wdt // 2

    # แสงลอดเรือนยอด — เชคเกอร์ดิเธอร์ทำให้เป็นลำแสงฟุ้ง ไม่ใช่เส้นแข็ง
    for sx, wid in ((40, 10), (104, 14), (176, 11)):
        for y in range(4, 100):
            x0 = sx + int(y * 0.34)
            for x in range(x0, x0 + wid + y // 14):
                if (x + y) % 2 or not c.inside(x, y):
                    continue
                r, g, b, a = c.get(x, y)
                c.set(x, y, (min(255, int(r * 1.18 + 12)), min(255, int(g * 1.13 + 14)),
                             min(255, int(b * 1.10 + 10)), a))

    # 3) แนวป่าไกล + 4) แนวป่ากลาง (ยิ่งใกล้ยิ่งเข้มและเม็ดใหญ่)
    blob_row(c, 74, 5, 10, 7, FAR[1], rnd)
    blob_row(c, 84, 7, 13, 9, MID[0], rnd)
    blob_row(c, 93, 9, 16, 12, NEAR[0], rnd)

    # ลำต้นบางๆ โผล่ในแนวป่ากลาง ให้รู้ว่าเป็นป่าไม่ใช่พุ่ม
    for x in (26, 58, 96, 142, 186, 214):
        top = rnd.randrange(60, 72)
        c.line(x, top, x, 96, "#2a5c46")
        c.line(x + 1, top, x + 1, 96, "#22513d")

    # 5) เรือนยอดด้านบน — ใบไม้ทับกันหนา + ห้อยลงมาเป็นซุ้ม
    c.rect(0, 0, W, 12, CANOPY[1])
    for i in range(46):
        x = rnd.randrange(-10, W)
        y = rnd.randrange(-2, 22)
        col = CANOPY[i % 2]
        leaf(c, x, y, rnd.randrange(14, 26), rnd.randrange(7, 12), col,
             vein=CANOPY[1] if col == CANOPY[0] else None,
             tilt=rnd.choice((-0.4, -0.2, 0.2, 0.4)))

    # เถาวัลย์ห้อยจากเรือนยอด
    for x in (16, 52, 108, 158, 202, 228):
        L = rnd.randrange(24, 62)
        for y in range(L):
            c.set(x + (y // 8) % 2, y, "#1c5140")
            if y and y % 11 == 0:
                leaf(c, x - 5, y, 8, 5, "#1e5f45", tilt=0.3)

    # 6) ต้นไม้ใหญ่ซ้าย-ขวา เป็นกรอบฉาก
    for tx, wdt in ((2, 13), (W - 17, 15)):
        c.rect(tx, 0, wdt, GROUND + 4, "#4a3423")
        c.rect(tx, 0, 3, GROUND + 4, "#5c422c")            # ด้านรับแสง
        c.rect(tx + wdt - 3, 0, 3, GROUND + 4, "#38271a")  # ด้านเงา
        for y in range(4, GROUND, 6):                      # ลายเปลือกไม้
            c.line(tx + 4, y, tx + wdt - 5, y + 2, "#3d2b1c")
        c.polygon([(tx - 4, GROUND + 3), (tx + 2, GROUND - 12),
                   (tx + 2, GROUND + 3)], "#4a3423")       # พูพอน
        c.polygon([(tx + wdt + 3, GROUND + 3), (tx + wdt - 2, GROUND - 12),
                   (tx + wdt - 2, GROUND + 3)], "#4a3423")

    # 7) พื้นดิน
    c.rect(0, GROUND, W, H - GROUND, DIRT[2])
    c.gradient_dither([DIRT[0], DIRT[2], DIRT[3]], axis="y", box=(0, GROUND, W, H - GROUND))
    for _ in range(90):                                    # กรวด/จุดดิน
        x, y = rnd.randrange(W), rnd.randrange(GROUND + 3, H)
        c.set(x, y, DIRT[3] if rnd.random() < .6 else DIRT[0])
    for _ in range(9):                                     # ก้อนหิน
        x, y = rnd.randrange(6, W - 12), rnd.randrange(GROUND + 6, H - 6)
        c.ellipse(x, y, rnd.randrange(5, 9), rnd.randrange(3, 5), "#8a8172")
        c.ellipse(x + 1, y, 3, 2, "#a49b8b")

    # ขอบหญ้าเป็นเส้นๆ ไม่เท่ากัน
    for x in range(0, W, 2):
        h = rnd.randrange(2, 6)
        c.line(x, GROUND + 1, x, GROUND + 1 - h, GRASS[1] if x % 4 else GRASS[0])
        c.line(x + 1, GROUND + 1, x + 1, GROUND + 2 - h, GRASS[2])
    for _ in range(26):                                    # กอหญ้าสูงกระจาย
        x = rnd.randrange(W)
        for d in (-1, 0, 1):
            c.line(x + d, GROUND + 1, x + d * 2, GROUND - rnd.randrange(4, 9), GRASS[0])

    # ขอนไม้ล้ม
    lx = 150
    c.rect(lx, GROUND - 5, 40, 8, "#5c422c")
    c.rect(lx, GROUND - 5, 40, 2, "#6d4f34")
    c.ellipse(lx + 36, GROUND - 6, 8, 10, "#7a5b3c")
    c.ellipse(lx + 38, GROUND - 4, 4, 6, "#4a3423")
    for i in range(4):                                     # เห็ด/ตะไคร่บนขอน
        c.set(lx + 6 + i * 7, GROUND - 6, GRASS[0])

    # ดอกไม้เล็กๆ ให้ฉากมีสีตัด
    for _ in range(14):
        x, y = rnd.randrange(4, W - 4), rnd.randrange(GROUND - 3, GROUND + 2)
        col = rnd.choice(("#ffd94a", "#ff8ba0", "#fff1e0"))
        c.set(x, y, col); c.set(x + 1, y, col); c.set(x, y - 1, col)

    # ฝุ่นละอองลอยรับแสง
    for _ in range(14):
        x, y = rnd.randrange(20, W - 20), rnd.randrange(16, 76)
        c.set(x, y, "#d8f3e4")

    # ขอบจอมืดลงเล็กน้อย (vignette) ให้สายตาโฟกัสกลางจอที่ลิงนั่ง
    for x in range(W):
        for y in range(H):
            d = max(abs(x - W / 2) / (W / 2), abs(y - H / 2) / (H / 2))
            if d > 0.72 and (x * 3 + y * 5) % 7 < int((d - 0.72) * 16):
                r, g, b, a = c.get(x, y)
                c.set(x, y, (int(r * 0.72), int(g * 0.74), int(b * 0.76), a))

    # 8) ใบไม้หน้าสุด (เงาเข้ม ไม่มีรายละเอียด = ให้รู้สึกว่าอยู่นอกโฟกัส)
    for cx, cy, wdt, hgt, tilt in ((-6, 126, 52, 20, -0.3), (16, 132, 44, 16, 0.25),
                                   (198, 122, 54, 22, 0.3), (168, 133, 40, 14, -0.2)):
        leaf(c, cx, cy, wdt, hgt, FRONT, tilt=tilt)

    return c


bg = build()
save(bg, os.path.join(ROOT, "sprites", "bg.png"))
save(bg, os.path.join(ROOT, "preview", "bg.png"), scale=2)

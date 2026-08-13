"""ชุด sprite สำหรับสนาม top-down (มุมมองจากบน) — พื้นหญ้า, ของตกแต่ง, ตัวเอก 4 ทิศ, ลิงศัตรู, ก้อนหิน

Run:  python assets/src/build_top.py
Out:  assets/sprites/{ground_tile,bush,stone,hero_walk,enemy_walk,rock}.png
      + assets/preview/*.png|gif
"""
import sys, os, random
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, ramp, save, save_sheet, save_gif

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SPR = os.path.join(ROOT, "sprites")
PRE = os.path.join(ROOT, "preview")

INK = "#2b1b13"
GRASS = ramp("#4e8f3f", steps=5)
DIRT = ramp("#8a6136", steps=5)
FUR = ramp("#8a5a32", steps=5)
SKIN = ramp("#d9a066", steps=5)
NAVY = ramp("#3c4a7a", steps=5)
STONE = ramp("#8d8f96", steps=5)
YEL = "#f7d94c"
WHITE = "#fff1e0"

random.seed(7)          # ให้ผลเหมือนเดิมทุกครั้งที่รัน


# ---------- พื้น ----------
def ground_tile(pal=None, blades=9):
    """พื้น 32x32 ต่อกันได้ทุกด้าน (ไม่มีขอบ ไม่มี outline) — เปลี่ยน ramp = เปลี่ยนโซน"""
    pal = pal or GRASS
    c = Canvas(32, 32, fill=pal[2])
    for _ in range(46):                       # จุดเข้ม/อ่อนกระจาย
        x, y = random.randrange(32), random.randrange(32)
        c.set(x, y, pal[1] if random.random() < 0.6 else pal[3])
    for _ in range(blades):                   # ใบหญ้า/เศษหิน 2 พิกเซล
        x, y = random.randrange(32), random.randrange(30)
        c.set(x, y, pal[4])
        c.set(x, y + 1, pal[3])
    return c


def bush():
    c = Canvas(24, 24)
    c.ellipse(1, 8, 22, 14, GRASS[1])
    c.ellipse(3, 4, 11, 11, GRASS[2])
    c.ellipse(11, 5, 11, 10, GRASS[2])
    c.ellipse(5, 6, 6, 5, GRASS[3])
    c.ellipse(14, 7, 5, 4, GRASS[3])
    c.outline(INK)
    return c


def stone():
    c = Canvas(16, 16)
    c.ellipse(1, 5, 14, 10, STONE[2])
    c.ellipse(3, 6, 8, 5, STONE[3])
    c.ellipse(4, 7, 4, 3, STONE[4])
    c.ellipse(2, 12, 12, 3, STONE[1])
    c.outline(INK)
    return c


def star():
    """ดาวกระจาย 4 แฉก 12x12 — อาวุธหลักของจ๋อจิ๋ว"""
    c = Canvas(12, 12)
    STEEL = ramp("#b9c6d6", steps=5)
    # 4 แฉก: สลับปลายแฉกกับร่องเว้า
    c.polygon([(5, 0), (7, 4), (11, 5), (7, 7), (6, 11), (4, 7), (0, 5), (4, 4)], STEEL[3])
    c.polygon([(5, 0), (6, 4), (4, 4)], STEEL[4])            # แฉกบนรับแสง
    c.polygon([(0, 5), (4, 4), (4, 6)], STEEL[4])
    c.set(5, 5, "#3d4756")                                    # รูตรงกลาง
    c.outline(INK)
    return c


def rock():
    c = Canvas(12, 12)
    c.ellipse(1, 2, 10, 9, STONE[2])
    c.ellipse(3, 3, 5, 4, STONE[4])
    c.ellipse(2, 8, 8, 3, STONE[1])
    c.outline(INK)
    return c


# ---------- ตัวเอก 32x32 มองจากบน 3/4 ----------
def hero_frame(dir_, step):
    """dir_: 'down' | 'side' | 'up'  ·  step 0/1 = สลับขา"""
    c = Canvas(32, 32)
    sw = 1 if step else -1                    # ขาสลับซ้าย/ขวา

    # เงาใต้ตัว
    c.ellipse(8, 27, 16, 5, "#2f4a28")

    # ขา
    c.rect(11, 22 + (0 if sw > 0 else 1), 4, 5, NAVY[2])
    c.rect(17, 22 + (1 if sw > 0 else 0), 4, 5, NAVY[2])
    c.rect(11, 26 + (0 if sw > 0 else 1), 4, 2, SKIN[2])
    c.rect(17, 26 + (1 if sw > 0 else 0), 4, 2, SKIN[2])

    # ลำตัวชุดนินจา + ผ้าคาดเอว
    c.ellipse(9, 14, 14, 11, NAVY[3])
    c.rect(9, 21, 14, 2, YEL)

    # แขน (ข้างเดียวเวลาเดินด้านข้าง)
    if dir_ == "side":
        c.ellipse(15, 15, 6, 6, NAVY[3])
        c.ellipse(16, 19, 5, 4, SKIN[2])
    else:
        c.ellipse(6, 15, 6, 7, NAVY[3])
        c.ellipse(20, 15, 6, 7, NAVY[3])
        c.ellipse(6, 20, 5, 4, SKIN[2])
        c.ellipse(21, 20, 5, 4, SKIN[2])

    # หัว — ท่าด้านข้างเลื่อนหัวไปข้างหน้าและเหลือหูข้างเดียว ไม่งั้นดูเหมือนหันหน้าตรง
    if dir_ == "side":
        c.line(6, 16, 2, 12, FUR[1])          # หางโผล่ข้างหลัง
        c.line(5, 16, 1, 13, FUR[1])
        c.circle(9, 8, 3, FUR[2])
        c.ellipse(12, 2, 16, 13, FUR[3])
    else:
        c.circle(7, 8, 3, FUR[2])             # หูซ้าย
        c.circle(24, 8, 3, FUR[2])            # หูขวา
        c.ellipse(8, 2, 16, 13, FUR[3])

    if dir_ == "up":
        # เห็นท้ายทอย: ผ้าคาดหัว + ปมผ้าห้อย
        c.rect(8, 5, 16, 4, NAVY[4])
        c.rect(14, 8, 4, 6, NAVY[4])
        c.set(15, 14, NAVY[3]); c.set(16, 14, NAVY[3])
    elif dir_ == "side":
        c.ellipse(15, 9, 13, 6, NAVY[3])      # หน้ากากปิดปาก (เลื่อนตามหัว)
        c.rect(12, 4, 16, 4, NAVY[4])         # ผ้าคาดหัว
        c.line(12, 6, 4, 3, NAVY[4])          # ชายผ้าปลิวไปข้างหลัง
        c.line(12, 7, 4, 4, NAVY[4])
    else:
        c.ellipse(9, 9, 14, 6, NAVY[3])       # หน้ากากปิดปาก
        c.rect(8, 4, 16, 4, NAVY[4])          # ผ้าคาดหัว
        c.line(23, 6, 30, 9, NAVY[4])
        c.line(23, 7, 30, 10, NAVY[4])

    c.outline(INK, diagonal=False)

    # ตา (หลัง outline จะได้คม)
    if dir_ == "down":
        c.ellipse(12, 7, 3, 3, WHITE); c.set(13, 8, INK)
        c.ellipse(18, 7, 3, 3, WHITE); c.set(19, 8, INK)
    elif dir_ == "side":
        c.ellipse(21, 7, 4, 3, WHITE); c.set(23, 8, INK)
    return c


# ---------- ลิงศัตรู 24x24 ----------
def enemy_frame(dir_, step):
    c = Canvas(24, 24)
    sw = 1 if step else -1
    c.ellipse(5, 20, 14, 4, "#2f4a28")        # เงา
    c.rect(8, 16 + (0 if sw > 0 else 1), 3, 5, FUR[1])
    c.rect(13, 16 + (1 if sw > 0 else 0), 3, 5, FUR[1])
    c.ellipse(6, 10, 12, 9, FUR[2])           # ตัว
    c.ellipse(9, 12, 6, 6, SKIN[1])           # พุง
    if dir_ == "side":
        c.ellipse(12, 10, 5, 5, FUR[2])
        c.ellipse(13, 13, 4, 4, SKIN[2])
    else:
        c.ellipse(3, 10, 5, 6, FUR[2])
        c.ellipse(16, 10, 5, 6, FUR[2])
        c.ellipse(3, 14, 4, 4, SKIN[2])
        c.ellipse(17, 14, 4, 4, SKIN[2])
    c.circle(5, 5, 2, FUR[1])                 # หู
    c.circle(18, 5, 2, FUR[1])
    c.ellipse(6, 1, 12, 10, FUR[3])           # หัว
    if dir_ != "up":
        c.ellipse(8, 5, 8, 5, SKIN[3])        # ปาก
    c.outline(INK, diagonal=False)
    if dir_ == "down":
        c.ellipse(7, 3, 4, 3, WHITE); c.set(8, 4, INK)      # ตาโกรธ
        c.ellipse(13, 3, 4, 3, WHITE); c.set(15, 4, INK)
        c.line(7, 1, 10, 2, INK); c.line(14, 2, 17, 1, INK)  # คิ้วชนกลาง
    elif dir_ == "side":
        c.ellipse(13, 3, 4, 3, WHITE); c.set(15, 4, INK)
        c.line(12, 1, 16, 2, INK)
    return c


GHOST = ramp("#a9c6e8", steps=5)      # ลิงผี: ขาวอมฟ้า ไม่มีขา ล่างจางหายไป


def ghost_frame(dir_, step):
    """ลิงวิปริตร่างผี 24x24 — ลอย ไม่มีขา ตาโบ๋ ปากอ้า"""
    c = Canvas(24, 24)
    float_y = 0 if step else 1

    # ชายผีเป็นริ้วแทนขา
    for i, x in enumerate((7, 11, 15)):
        c.rect(x, 17 + float_y, 3, 4 - (i % 2), GHOST[1])
    c.ellipse(5, 9 + float_y, 14, 10, GHOST[2])          # ตัว
    if dir_ == "side":
        c.ellipse(12, 9 + float_y, 6, 6, GHOST[2])       # แขนยื่นไปข้างหน้า
    else:
        c.ellipse(2, 9 + float_y, 5, 7, GHOST[2])
        c.ellipse(17, 9 + float_y, 5, 7, GHOST[2])
    c.circle(5, 4 + float_y, 2, GHOST[1])                # หู
    c.circle(18, 4 + float_y, 2, GHOST[1])
    c.ellipse(6, 1 + float_y, 12, 11, GHOST[3])          # หัว
    c.outline("#2a3550", diagonal=False)                 # ขอบน้ำเงินเข้ม ไม่ใช่สีเดียวกับตัวอื่น

    # ตาโบ๋ + ปากอ้า (วาดหลัง outline)
    if dir_ != "up":
        eyes = ((8, 4), (14, 4)) if dir_ == "down" else ((13, 4),)
        for ex, ey in eyes:
            c.ellipse(ex, ey + float_y, 4, 4, "#101828")
            c.set(ex + 1, ey + 1 + float_y, "#7fe3ff")   # แสงในตา
        c.ellipse(10, 9 + float_y, 5, 4, "#101828")      # ปากอ้ากรีดร้อง
    return c


SAND = ramp("#c9a86a", steps=5)
DARK = ramp("#2f5d3a", steps=5)

SPIDER = ramp("#4a3a63", steps=5)
ROACH = ramp("#7a4a22", steps=5)


def spider_frame(dir_, step):
    """แมงมุม 24x24 — ขา 8 ขาขยับสลับ ตาแดง"""
    c = Canvas(24, 24)
    leg = 1 if step else -1
    c.ellipse(4, 18, 16, 4, "#2f4a28")                    # เงา
    for i, dy in enumerate((6, 10, 14)):                  # ขาซ้าย-ขวา
        off = leg if i % 2 else -leg
        c.line(8, dy + 2, 1, dy + off, SPIDER[1])
        c.line(15, dy + 2, 22, dy + off, SPIDER[1])
    c.ellipse(5, 6, 14, 12, SPIDER[3])                    # ท้อง
    c.ellipse(8, 4, 8, 7, SPIDER[4])                      # หัว
    c.ellipse(7, 9, 10, 6, SPIDER[2])                     # ลายหลัง
    c.outline("#1b1526", diagonal=False)
    if dir_ != "up":                                      # ตาแดง 4 ดวง
        for ex in (9, 13):
            c.set(ex, 6, "#ff3b3b")
            c.set(ex, 8, "#ff7b7b")
    return c


def roach_frame(dir_, step):
    """แมงสาบ 20x20 — ตัวแบน หนวดยาว วิ่งเร็ว"""
    c = Canvas(20, 20)
    wig = 1 if step else 0
    c.ellipse(3, 15, 14, 4, "#2f4a28")
    for x in (5, 9, 13):                                  # ขา
        c.line(x, 12, x - 2, 15 + wig, ROACH[1])
        c.line(x, 12, x + 3, 15 - wig, ROACH[1])
    c.ellipse(3, 4, 14, 11, ROACH[2])                     # ปีกแข็ง
    c.ellipse(5, 6, 10, 7, ROACH[3])
    c.line(9, 4, 9, 12, ROACH[1])                         # รอยกลางปีก
    c.ellipse(6, 1, 8, 5, ROACH[4])                       # หัว
    c.line(7, 1, 3 - wig, -2, ROACH[1])                   # หนวด
    c.line(12, 1, 16 + wig, -2, ROACH[1])
    c.outline("#241608", diagonal=False)
    c.set(7, 2, "#ffd94a"); c.set(11, 2, "#ffd94a")       # ตาเหลือง
    return c


def trap():
    """กับดักหนีบ 24x24 — วางนิ่งบนพื้น เหยียบโดนเสียเลือด"""
    c = Canvas(24, 24)
    STEEL = ramp("#8d8f96", steps=5)
    c.ellipse(3, 8, 18, 11, STEEL[1])                     # ฐาน
    c.ellipse(6, 10, 12, 7, "#3a2a1c")                    # ปากกับดัก
    for x in range(5, 20, 3):                             # ฟันบน-ล่าง
        c.line(x, 8, x + 1, 4, STEEL[4])
        c.line(x, 15, x + 1, 19, STEEL[4])
    c.ellipse(9, 11, 6, 4, "#1c130c")
    c.outline(INK)
    return c


items = {
    "ground_tile": ground_tile(),                      # โซนหญ้า (โซนเริ่มต้น)
    "ground_dirt": ground_tile(DIRT, blades=4),        # โซนดินแห้ง
    "ground_sand": ground_tile(SAND, blades=3),        # โซนชายหาด
    "ground_dark": ground_tile(DARK, blades=12),       # โซนป่าลึก (ที่ลิงผีชอบโผล่)
    "bush": bush(), "stone": stone(), "rock": rock(), "star": star(), "trap": trap(),
}
for name, c in items.items():
    save(c, os.path.join(SPR, f"{name}.png"))
    save(c, os.path.join(PRE, f"{name}.png"), scale=8)
    print(f"  {name}: {c.count_colors()} colors")

# ลำดับเฟรมต้องตรงกับ FRAMES ใน render.js: down0 down1 side0 side1 up0 up1
hero_frames = [hero_frame(d, s) for d in ("down", "side", "up") for s in (0, 1)]
save_sheet(hero_frames, os.path.join(SPR, "hero_walk.png"), cols=6, scale=1,
           manifest=os.path.join(SPR, "hero_walk.json"), fps=8, name="walk")
save_gif(hero_frames[:2] + hero_frames[2:4], os.path.join(PRE, "hero_walk.gif"), scale=8, fps=6)
save(hero_frames[0], os.path.join(PRE, "hero_down.png"), scale=8)
save(hero_frames[2], os.path.join(PRE, "hero_side.png"), scale=8)
save(hero_frames[4], os.path.join(PRE, "hero_up.png"), scale=8)
print(f"  hero_walk: {hero_frames[0].count_colors()} colors, 6 frames")

enemy_frames = [enemy_frame(d, s) for d in ("down", "side", "up") for s in (0, 1)]
save_sheet(enemy_frames, os.path.join(SPR, "enemy_walk.png"), cols=6, scale=1,
           manifest=os.path.join(SPR, "enemy_walk.json"), fps=8, name="walk")
save(enemy_frames[0], os.path.join(SPR, "enemy_icon.png"))     # ไอคอนเฟรมเดียว ใช้ในเมนู
save(enemy_frames[0], os.path.join(PRE, "enemy_down.png"), scale=8)
save(enemy_frames[2], os.path.join(PRE, "enemy_side.png"), scale=8)
print(f"  enemy_walk: {enemy_frames[0].count_colors()} colors, 6 frames")

spider_frames = [spider_frame(d, s) for d in ("down", "side", "up") for s in (0, 1)]
save_sheet(spider_frames, os.path.join(SPR, "spider_walk.png"), cols=6, scale=1,
           manifest=os.path.join(SPR, "spider_walk.json"), fps=10, name="walk")
save(spider_frames[0], os.path.join(SPR, "spider_icon.png"))
save(spider_frames[0], os.path.join(PRE, "spider_down.png"), scale=8)

roach_frames = [roach_frame(d, s) for d in ("down", "side", "up") for s in (0, 1)]
save_sheet(roach_frames, os.path.join(SPR, "roach_walk.png"), cols=6, scale=1,
           manifest=os.path.join(SPR, "roach_walk.json"), fps=12, name="walk")
save(roach_frames[0], os.path.join(PRE, "roach_down.png"), scale=8)

ghost_frames = [ghost_frame(d, s) for d in ("down", "side", "up") for s in (0, 1)]
save_sheet(ghost_frames, os.path.join(SPR, "ghost_walk.png"), cols=6, scale=1,
           manifest=os.path.join(SPR, "ghost_walk.json"), fps=6, name="float")
save(ghost_frames[0], os.path.join(SPR, "ghost_icon.png"))
save(ghost_frames[0], os.path.join(PRE, "ghost_down.png"), scale=8)
print(f"  ghost_walk: {ghost_frames[0].count_colors()} colors, 6 frames")

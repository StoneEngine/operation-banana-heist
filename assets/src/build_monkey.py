"""King Kluay (เจ้าจ๋อ) - 64x64, three moods: sleep / warn / awake (+caught).

Run:  python assets/src/build_monkey.py
Out:  assets/sprites/monkey_*.png  +  assets/preview/monkey_*.png (scale 8)
"""
import sys, os
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, ramp, save, save_sheet, save_gif

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SPR = os.path.join(ROOT, "sprites")
PRE = os.path.join(ROOT, "preview")

FUR = ramp("#8a5a32", steps=5)        # 0 dark .. 4 light
SKIN = ramp("#d9a066", steps=5)       # muzzle / ears inner / hands
INK = "#2b1b13"
WHITE = "#fff1e0"
PINK = "#d47b7b"
YEL_PEEL = "#f2c14e"


def base_body():
    """Shared silhouette: sitting monkey, arms hugging a belly."""
    c = Canvas(64, 64)
    # tail (behind body)
    c.line(46, 46, 55, 44, FUR[1])
    c.line(55, 44, 58, 37, FUR[1])
    c.line(57, 37, 54, 32, FUR[1])
    c.line(47, 47, 56, 45, FUR[1])
    # body
    c.ellipse(16, 32, 32, 28, FUR[2])
    # legs
    c.ellipse(14, 50, 16, 12, FUR[2])
    c.ellipse(34, 50, 16, 12, FUR[2])
    c.ellipse(17, 54, 10, 7, SKIN[2])
    c.ellipse(37, 54, 10, 7, SKIN[2])
    # belly
    c.ellipse(22, 38, 20, 18, SKIN[1])
    # ears
    c.circle(15, 22, 6, FUR[2])
    c.circle(48, 22, 6, FUR[2])
    c.circle(15, 22, 3, SKIN[2])
    c.circle(48, 22, 3, SKIN[2])
    # head
    c.ellipse(14, 6, 36, 32, FUR[3])
    # face plate
    c.ellipse(20, 13, 24, 22, SKIN[3])
    # brow fur ridge
    c.ellipse(18, 6, 28, 12, FUR[4])
    return c


def arms(c, lift=0):
    """Arms hugging the banana pile; lift raises the hands (awake pose)."""
    c.ellipse(10, 36 - lift, 14, 12, FUR[2])
    c.ellipse(40, 36 - lift, 14, 12, FUR[2])
    c.ellipse(13, 42 - lift, 9, 8, SKIN[2])
    c.ellipse(42, 42 - lift, 9, 8, SKIN[2])
    return c


def finish(c):
    c.shade(FUR, light=(-1, -1), depth=2, only=FUR[2])
    c.outline(INK, diagonal=False)
    return c


def face_sleep(c):
    # closed happy eyes
    for x0 in (24, 36):
        c.line(x0, 22, x0 + 2, 24, INK)
        c.line(x0 + 2, 24, x0 + 4, 22, INK)
    # relaxed brows
    c.line(23, 18, 28, 17, FUR[0])
    c.line(36, 17, 41, 18, FUR[0])
    # muzzle + open snoring mouth
    c.ellipse(25, 25, 14, 11, SKIN[4])
    c.ellipse(29, 22, 6, 5, PINK)          # nose
    c.set(30, 23, INK); c.set(33, 23, INK)
    c.ellipse(29, 29, 7, 6, INK)
    c.ellipse(30, 32, 5, 3, PINK)          # tongue
    # blush
    c.dither(21, 25, 4, 3, PINK, None, "checker")
    c.dither(40, 25, 4, 3, PINK, None, "checker")
    return c


def face_warn(c):
    # one eye cracked open, one squinting
    c.ellipse(23, 20, 7, 6, WHITE)
    c.ellipse(35, 20, 7, 6, WHITE)
    c.ellipse(25, 21, 4, 4, INK)
    c.ellipse(37, 21, 4, 4, INK)
    c.set(26, 22, WHITE); c.set(38, 22, WHITE)
    # raised suspicious brows
    c.line(22, 16, 29, 15, INK)
    c.line(23, 17, 29, 16, INK)
    c.line(35, 15, 42, 17, INK)
    c.line(35, 16, 42, 18, INK)
    # muzzle, small "o" mouth
    c.ellipse(25, 25, 14, 11, SKIN[4])
    c.ellipse(29, 23, 6, 5, PINK)
    c.set(30, 24, INK); c.set(33, 24, INK)
    c.ellipse(30, 30, 4, 4, INK)
    return c


def eyes_awake(c):
    # wide angry eyes + hard angled brows (shared across snarl frames)
    c.ellipse(21, 18, 9, 9, WHITE)
    c.ellipse(34, 18, 9, 9, WHITE)
    c.ellipse(24, 21, 5, 5, INK)
    c.ellipse(36, 21, 5, 5, INK)
    c.set(25, 22, WHITE); c.set(37, 22, WHITE)
    for d in range(3):
        c.line(20, 14 + d, 30, 18 + d, INK)
        c.line(34, 18 + d, 44, 14 + d, INK)


def face_awake_mid(c):
    eyes_awake(c)
    c.ellipse(24, 27, 16, 12, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(26, 30, 12, 8, INK)
    c.rect(28, 31, 2, 3, WHITE)            # fangs
    c.rect(34, 31, 2, 3, WHITE)
    c.ellipse(29, 35, 6, 3, PINK)
    return c


def face_awake_open(c):
    """ขากรรไกรอ้าเต็มที่"""
    eyes_awake(c)
    c.ellipse(24, 27, 16, 13, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(25, 29, 14, 11, INK)
    c.rect(27, 33, 2, 4, WHITE)             # fangs (ยาวขึ้นตอนอ้า)
    c.rect(35, 33, 2, 4, WHITE)
    c.ellipse(28, 37, 8, 4, PINK)
    return c


def face_awake_clench(c):
    """ขากรรไกรหุบ ขบเขี้ยว"""
    eyes_awake(c)
    c.ellipse(24, 27, 16, 11, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(27, 29, 10, 5, INK)
    c.rect(28, 29, 2, 3, WHITE)
    c.rect(34, 29, 2, 3, WHITE)
    c.rect(30, 30, 4, 2, WHITE)             # ฟันหน้าขบแน่น
    return c


def brow_eyes_caught(c):
    # ตาเบิ่งโพลง ม่านตาเล็ก = โมโหสุดขีด + คิ้วชนกันกลางหน้าผาก (shared across caught frames)
    c.ellipse(21, 17, 10, 10, WHITE)
    c.ellipse(34, 17, 10, 10, WHITE)
    c.ellipse(24, 20, 4, 4, INK)
    c.ellipse(37, 20, 4, 4, INK)
    c.set(25, 21, WHITE); c.set(38, 21, WHITE)
    for d in range(3):
        c.line(19, 13 + d, 31, 18 + d, INK)
        c.line(33, 18 + d, 45, 13 + d, INK)


def arm_peel(c, dx=0, dy=0):
    """แขนขวาเงื้อขึ้นเหนือหัว ถือเปลือกกล้วยเตรียมปา (ห้ามทำตากากบาท เดี๋ยวดูเหมือนตาย)"""
    c.ellipse(44 + dx, 12 + dy, 12, 11, FUR[2])          # ต้นแขน
    c.ellipse(48 + dx, 4 + dy, 11, 10, FUR[3])           # ปลายแขน
    c.ellipse(50 + dx, 1 + dy, 9, 8, SKIN[2])            # มือ
    c.outline(INK)
    for x, y in ((52, 0), (55, 1), (53, 3), (56, 4)):    # เปลือกกล้วยในมือ
        c.set(x + dx, y + dy, YEL_PEEL)
        c.set(x + 1 + dx, y + 1 + dy, YEL_PEEL)


def face_caught_shout(c):
    brow_eyes_caught(c)
    c.ellipse(24, 27, 16, 12, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(25, 29, 14, 10, INK)
    c.rect(28, 30, 2, 3, WHITE)
    c.rect(35, 30, 2, 3, WHITE)
    c.ellipse(28, 34, 8, 4, PINK)
    arm_peel(c)
    return c


def face_caught_grind(c):
    """ขบฟันแค้นๆ + แขนสั่นนิดหน่อย"""
    brow_eyes_caught(c)
    c.ellipse(24, 27, 16, 12, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(26, 29, 12, 6, INK)
    c.rect(27, 29, 2, 3, WHITE)
    c.rect(29, 29, 2, 3, WHITE)
    c.rect(33, 29, 2, 3, WHITE)
    c.rect(35, 29, 2, 3, WHITE)
    arm_peel(c, dx=1, dy=-1)
    return c


MOODS = {
    "sleep": (face_sleep, 0),
    "warn": (face_warn, 0),
}

for name, (face, lift) in MOODS.items():
    c = base_body()
    arms(c, lift)
    finish(c)
    face(c)
    save(c, os.path.join(SPR, f"monkey_{name}.png"))
    save(c, os.path.join(PRE, f"monkey_{name}.png"), scale=6)
    print(f"  {name}: {c.count_colors()} colors")

# awake: 3-เฟรม snarl loop (ขากรรไกรอ้า-หุบ)
base_awake = base_body()
arms(base_awake, 3)
finish(base_awake)
awake_frames = [
    face_awake_mid(base_awake.copy()),
    face_awake_open(base_awake.copy()),
    face_awake_clench(base_awake.copy()),
]
save_sheet(awake_frames, os.path.join(SPR, "monkey_awake.png"), cols=3, scale=1,
           manifest=os.path.join(SPR, "monkey_awake.json"), fps=6, name="snarl")
save_gif(awake_frames, os.path.join(PRE, "monkey_awake.gif"), scale=6, fps=6)
print(f"  awake: {awake_frames[0].count_colors()} colors, 3 frames")

# caught: 2-เฟรม ตะโกน + ขบฟันแค้น
base_caught = base_body()
arms(base_caught, 5)
finish(base_caught)
caught_frames = [
    face_caught_shout(base_caught.copy()),
    face_caught_grind(base_caught.copy()),
]
save_sheet(caught_frames, os.path.join(SPR, "monkey_caught.png"), cols=2, scale=1,
           manifest=os.path.join(SPR, "monkey_caught.json"), fps=8, name="grind")
save_gif(caught_frames, os.path.join(PRE, "monkey_caught.gif"), scale=6, fps=8)
print(f"  caught: {caught_frames[0].count_colors()} colors, 2 frames")

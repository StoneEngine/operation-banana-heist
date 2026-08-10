"""King Kluay (เจ้าจ๋อ) - 64x64, three moods: sleep / warn / awake (+caught).

Run:  python assets/src/build_monkey.py
Out:  assets/sprites/monkey_*.png  +  assets/preview/monkey_*.png (scale 8)
"""
import sys, os
sys.path.append(r"C:\Users\MSI KATANA\.claude\skills\pixel-art-studio\scripts")
from pxlib import Canvas, ramp, save

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


def face_awake(c):
    # wide angry eyes
    c.ellipse(21, 18, 9, 9, WHITE)
    c.ellipse(34, 18, 9, 9, WHITE)
    c.ellipse(24, 21, 5, 5, INK)
    c.ellipse(36, 21, 5, 5, INK)
    c.set(25, 22, WHITE); c.set(37, 22, WHITE)
    # hard angled brows
    for d in range(3):
        c.line(20, 14 + d, 30, 18 + d, INK)
        c.line(34, 18 + d, 44, 14 + d, INK)
    # snarl
    c.ellipse(24, 27, 16, 12, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(26, 30, 12, 8, INK)
    c.rect(28, 31, 2, 3, WHITE)            # fangs
    c.rect(34, 31, 2, 3, WHITE)
    c.ellipse(29, 35, 6, 3, PINK)
    return c


def face_caught(c):
    """โกรธจัด ตะโกน + เงื้อแขนปาเปลือกกล้วย (ห้ามทำตากากบาท เดี๋ยวดูเหมือนตาย)"""
    # ตาเบิ่งโพลง ม่านตาเล็ก = โมโหสุดขีด
    c.ellipse(21, 17, 10, 10, WHITE)
    c.ellipse(34, 17, 10, 10, WHITE)
    c.ellipse(24, 20, 4, 4, INK)
    c.ellipse(37, 20, 4, 4, INK)
    c.set(25, 21, WHITE); c.set(38, 21, WHITE)
    # คิ้วชนกันกลางหน้าผาก
    for d in range(3):
        c.line(19, 13 + d, 31, 18 + d, INK)
        c.line(33, 18 + d, 45, 13 + d, INK)
    # ปากอ้าตะโกน
    c.ellipse(24, 27, 16, 12, SKIN[4])
    c.ellipse(29, 25, 6, 4, PINK)
    c.ellipse(25, 29, 14, 10, INK)
    c.rect(28, 30, 2, 3, WHITE)
    c.rect(35, 30, 2, 3, WHITE)
    c.ellipse(28, 34, 8, 4, PINK)

    # แขนขวาเงื้อขึ้นเหนือหัว ถือเปลือกกล้วยเตรียมปา
    c.ellipse(44, 12, 12, 11, FUR[2])          # ต้นแขน
    c.ellipse(48, 4, 11, 10, FUR[3])           # ปลายแขน
    c.ellipse(50, 1, 9, 8, SKIN[2])            # มือ
    c.outline(INK)
    for x, y in ((52, 0), (55, 1), (53, 3), (56, 4)):   # เปลือกกล้วยในมือ
        c.set(x, y, YEL_PEEL)
        c.set(x + 1, y + 1, YEL_PEEL)
    return c


MOODS = {
    "sleep": (face_sleep, 0),
    "warn": (face_warn, 0),
    "awake": (face_awake, 3),
    "caught": (face_caught, 5),
}

for name, (face, lift) in MOODS.items():
    c = base_body()
    arms(c, lift)
    finish(c)
    face(c)
    save(c, os.path.join(SPR, f"monkey_{name}.png"))
    save(c, os.path.join(PRE, f"monkey_{name}.png"), scale=6)
    print(f"  {name}: {c.count_colors()} colors")

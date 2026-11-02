"""Fondos ilustrados originales para los videos de Nexo Fit (sin fotos de terceros).
Uso: python3 fondos.py  -> genera fondos/<tema>-<n>.jpg (1188x2112, 10 % más grande para el zoom lento).
Temas: gimnasio, box, polideportivo, cancha, estudio. Cada tema tiene variantes (cámara y luces distintas)."""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

BW, BH = 1188, 2112
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "fondos")


class Cam:
    def __init__(self, x=0.0, y=1.5, f=980, hy=None, yaw=0.0):
        self.x, self.y, self.f = x, y, f * BW / 1080
        self.hy = hy if hy is not None else BH * 0.47
        self.yaw = yaw

    def _rot(self, x, z):
        c, s = math.cos(self.yaw), math.sin(self.yaw)
        dx = x - self.x
        return dx * c - z * s, dx * s + z * c

    def proj(self, x, y, z):
        rx, rz = self._rot(x, z)
        return (BW / 2 + self.f * rx / rz, self.hy - self.f * (y - self.y) / rz)

    def depth(self, x, z):
        return self._rot(x, z)[1]


NEAR = 0.35


def clip_near(cam, pts):
    """Sutherland–Hodgman contra el plano z' >= NEAR (en coords de cámara)."""
    out = []
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        za, zb = cam.depth(a[0], a[2]), cam.depth(b[0], b[2])
        ina, inb = za >= NEAR, zb >= NEAR
        if ina: out.append(a)
        if ina != inb:
            t = (NEAR - za) / (zb - za)
            out.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)))
    return out


def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


def fog(c, z, fc, fd):
    t = 1 - math.exp(-max(0, z) / fd) if fd else 0
    return tuple(int(a + (b - a) * t) for a, b in zip(c, fc))


class Scene:
    def __init__(self, cam, sky=(12, 12, 14), fogc=(14, 14, 16), fogd=40.0):
        self.cam = cam
        self.img = Image.new("RGB", (BW, BH), sky)
        self.glow = Image.new("RGB", (BW, BH), (0, 0, 0))
        self.fogc, self.fogd = fogc, fogd
        self.polys = []  # (depth, pts3d, color, emissive)

    def quad(self, pts, color, emissive=False, glow=None, order=None):
        cz = sum(self.cam.depth(p[0], p[2]) for p in pts) / len(pts)
        self.polys.append((order if order is not None else cz, pts, color, emissive, glow, cz))

    def box(self, x0, x1, y0, y1, z0, z1, color, emissive=False, glow=None):
        c = self.cam
        cz = c.depth((x0 + x1) / 2, (z0 + z1) / 2)
        faces = []
        faces.append(([(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)], 1.0))  # frente
        if y1 < c.y: faces.append(([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], 1.18))
        if y0 > c.y: faces.append(([(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], 0.55))
        if x0 > c.x: faces.append(([(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)], 0.72))
        if x1 < c.x: faces.append(([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], 0.72))
        for i, (f, k) in enumerate(faces):
            col = color if emissive else shade(color, k)
            self.polys.append((cz - i * 1e-4, f, col, emissive, glow, cz))

    def line3(self, a, b, color, width=2, glow=None):
        self.polys.append((self.cam.depth((a[0] + b[0]) / 2, (a[2] + b[2]) / 2) - 0.01, ("line", a, b, width), color, False, glow, None))

    def disc(self, cx, cy, cz, r, color, glow=None):
        self.polys.append((self.cam.depth(cx, cz) - 0.005, ("disc", (cx, cy, cz), r), color, False, glow, None))

    def draw(self):
        d = ImageDraw.Draw(self.img); g = ImageDraw.Draw(self.glow); c = self.cam
        for z, pts, color, em, gl, fz in sorted(self.polys, key=lambda p: -p[0]):
            col = color if em else fog(color, z if fz is None else fz, self.fogc, self.fogd)
            if isinstance(pts, tuple) and pts[0] == "line":
                _, a, b, w = pts
                cl = clip_near(c, [a, b]) if True else [a, b]
                if len(cl) < 2: continue
                pa, pb = c.proj(*cl[0]), c.proj(*cl[1])
                d.line([pa, pb], fill=col, width=w)
                if gl: g.line([pa, pb], fill=gl, width=w * 3)
                continue
            if isinstance(pts, tuple) and pts[0] == "disc":
                _, (x, y, zz), r = pts
                if c.depth(x, zz) < NEAR: continue
                px, py = c.proj(x, y, zz); pr = c.f * r / c.depth(x, zz)
                d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=col)
                if gl: g.ellipse([px - pr * 2.5, py - pr * 2.5, px + pr * 2.5, py + pr * 2.5], fill=gl)
                continue
            cl = clip_near(c, pts)
            if len(cl) < 3: continue
            pp = [c.proj(*p) for p in cl]
            d.polygon(pp, fill=col)
            if gl: g.polygon(pp, fill=gl)
        return self

    def finish(self, rng, blur=3.2, glow_r=60, grade=(1.0, 1.0, 1.0), dark=0.72, grain=7):
        im = self.img.filter(ImageFilter.GaussianBlur(blur))
        gl = self.glow.filter(ImageFilter.GaussianBlur(glow_r))
        gl2 = self.glow.filter(ImageFilter.GaussianBlur(glow_r / 4))
        im = ImageChops.screen(im, gl); im = ImageChops.screen(im, gl2)
        a = np.asarray(im).astype(np.float32)
        a *= np.array(grade, dtype=np.float32)
        yy, xx = np.mgrid[0:BH, 0:BW].astype(np.float32)
        nx, ny = (xx / BW - 0.5) * 2, (yy / BH - 0.5) * 2
        vig = 1 - 0.55 * np.clip((nx ** 2 * 0.9 + ny ** 2 * 0.6), 0, 1.4)
        # oscurecido para que el texto se lea: más oscuro arriba (titulares) y abajo (CTA)
        band = dark * (0.82 + 0.18 * np.cos(np.pi * (yy / BH - 0.5) * 1.6))
        a *= (vig * band)[..., None]
        a += np.random.default_rng(rng.randint(0, 10**6)).normal(0, grain, a.shape[:2])[..., None]
        return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


# ------------------------------------------------------------------ temas

def gimnasio(v):
    rng = random.Random(100 + v)
    cam = Cam(x=[-0.4, 0.5, 0.0][v % 3], y=1.45, f=760, hy=BH * 0.42, yaw=[0.12, -0.12, 0.04][v % 3])
    s = Scene(cam, fogc=(16, 18, 22), fogd=34)
    Wd, Hc, D = 4.2, 3.6, 30
    for z in range(0, D, 1):  # piso de goma en baldosas
        for xi in range(-6, 6):
            k = 0.92 + 0.12 * ((xi + z) % 2)
            s.quad([(xi, 0, z), (xi + 1, 0, z), (xi + 1, 0, z + 1), (xi, 0, z + 1)], shade((70, 70, 74), k), order=999 + 200 - z)
    s.quad([(-Wd, 0, 0.4), (-Wd, Hc, 0.4), (-Wd, Hc, D), (-Wd, 0, D)], (62, 64, 70), order=1200)
    s.quad([(Wd, 0, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (Wd, 0, D)], (56, 58, 64), order=1200)
    s.quad([(-Wd, Hc, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (-Wd, Hc, D)], (20, 21, 24), order=1201)
    s.quad([(-Wd, 0, D), (Wd, 0, D), (Wd, Hc, D), (-Wd, Hc, D)], (50, 52, 58), order=1199)
    for z in range(2, D - 1, 4):  # espejos en la pared derecha
        s.quad([(Wd - 0.01, 0.35, z), (Wd - 0.01, 2.5, z), (Wd - 0.01, 2.5, z + 3.6), (Wd - 0.01, 0.35, z + 3.6)], (96, 104, 116), order=1100)
    for lx in (-2.2, 2.2):  # tiras LED
        for z in range(1, D - 1, 3):
            s.box(lx - 0.12, lx + 0.12, Hc - 0.06, Hc - 0.01, z, z + 2.4, (255, 248, 232), emissive=True, glow=(120, 115, 100))
    acc = [(34, 197, 94), (230, 230, 230), (200, 60, 50)][v % 3]
    for z in (2.2, 5.6, 9.0, 12.4, 15.8, 19.2):  # racks a la izquierda
        x0 = -Wd + 0.5
        for (xa, za) in ((x0, z), (x0 + 1.3, z), (x0, z + 1.3), (x0 + 1.3, z + 1.3)):
            s.box(xa, xa + 0.09, 0, 2.35, za, za + 0.09, (36, 36, 40))
        s.box(x0, x0 + 1.38, 2.27, 2.35, z, z + 0.08, (28, 28, 30))
        s.box(x0, x0 + 1.38, 2.27, 2.35, z + 1.3, z + 1.38, (28, 28, 30))
        s.box(x0 - 0.3, x0 + 1.7, 1.38, 1.42, z + 0.6, z + 0.64, (170, 170, 175))
        for px in (x0 - 0.25, x0 + 1.45):
            s.box(px, px + 0.06, 1.2, 1.6, z + 0.45, z + 0.8, acc)
        s.box(x0 + 2.1, x0 + 2.5, 0, 0.45, z + 0.2, z + 1.4, (24, 24, 26))  # banco
    for z in range(2, 24, 2):  # mancuerneros a la derecha
        s.box(Wd - 1.0, Wd - 0.3, 0, 0.75, z, z + 1.9, (46, 46, 52))
        for k in range(5):
            s.box(Wd - 0.95, Wd - 0.35, 0.75, 0.9, z + 0.1 + k * 0.36, z + 0.3 + k * 0.36, (150, 152, 158))
    for x in (-1.6, -0.2, 1.2):  # cintas al fondo
        s.box(x, x + 0.8, 0, 0.35, D - 5, D - 3, (30, 30, 34))
        s.box(x + 0.05, x + 0.75, 1.0, 1.35, D - 5.1, D - 4.9, (40, 42, 46))
    s.draw()
    return s.finish(rng, grade=(0.95, 1.0, 1.08))


def box_crossfit(v):
    rng = random.Random(200 + v)
    cam = Cam(x=[0.4, -0.8, 1.0][v % 3], y=1.45, yaw=[-0.15, 0.12, -0.05][v % 3])
    s = Scene(cam, fogc=(22, 18, 16), fogd=30)
    Wd, Hc, D = 7, 6, 32
    s.quad([(-Wd, 0, 0.4), (Wd, 0, 0.4), (Wd, 0, D), (-Wd, 0, D)], (78, 76, 74), order=2000)
    for i in range(140):  # manchas del cemento
        x, z = rng.uniform(-Wd, Wd), rng.uniform(1, D); r = rng.uniform(0.3, 1.4)
        s.quad([(x, 0.001, z), (x + r, 0.001, z), (x + r, 0.001, z + r), (x, 0.001, z + r)], shade((78, 76, 74), rng.uniform(0.82, 0.95)), order=1990)
    for z in range(1, D, 2):
        for x in range(-6, 6, 2):  # pisos de goma en la zona del rig
            if -4 <= x <= 2 and 5 <= z <= 22:
                s.quad([(x, 0.002, z), (x + 1.95, 0.002, z), (x + 1.95, 0.002, z + 1.95), (x, 0.002, z + 1.95)], (32, 32, 34), order=1980)
    s.quad([(-Wd, 0, 0.4), (-Wd, Hc, 0.4), (-Wd, Hc, D), (-Wd, 0, D)], (86, 52, 42), order=2100)
    for y in np.arange(0.3, Hc, 0.3):
        s.line3((-Wd + 0.01, y, 0.5), (-Wd + 0.01, y, D), (66, 40, 32), 2)
    s.quad([(Wd, 0, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (Wd, 0, D)], (60, 58, 60), order=2100)
    s.quad([(-Wd, Hc, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (-Wd, Hc, D)], (14, 14, 16), order=2101)
    s.quad([(-Wd, 0, D), (Wd, 0, D), (Wd, Hc, D), (-Wd, Hc, D)], (70, 72, 78), order=2099)
    for y in np.arange(0.25, 4.5, 0.35):  # portón
        s.line3((-3, y, D - 0.01), (3, y, D - 0.01), (52, 54, 60), 3)
    for x in (-4, -2, 0, 2):  # rig
        for z in (6, 10, 14, 18, 22):
            s.box(x, x + 0.09, 0, 2.9, z, z + 0.09, (24, 24, 26))
        s.box(x, x + 0.09, 2.82, 2.9, 6, 22.09, (24, 24, 26))
    for z in (6, 10, 14, 18, 22):
        s.box(-4, 2.09, 2.82, 2.9, z, z + 0.09, (24, 24, 26))
    cols = [(34, 197, 94), (40, 90, 200), (220, 190, 40), (200, 50, 50), (30, 30, 30)]
    for z in (7, 11, 15):  # discos apilados
        for k in range(6):
            c = cols[(k + v) % len(cols)]
            s.box(4.2, 4.65, k * 0.08, k * 0.08 + 0.075, z, z + 0.45, c)
        s.disc(3.6, 0.18, z + 1.5, 0.18, (30, 30, 34))
        s.disc(3.6, 0.18, z + 2.2, 0.18, (30, 30, 34))
    for z in (4, 9, 14, 19, 24):  # lámparas colgantes
        for x in (-3, 1.5):
            s.line3((x, Hc, z), (x, 4.6, z), (20, 20, 20), 2)
            s.box(x - 0.25, x + 0.25, 4.4, 4.6, z - 0.25, z + 0.25, (255, 200, 140), emissive=True, glow=(150, 100, 50))
    s.draw()
    return s.finish(rng, grade=(1.08, 0.98, 0.9))


def polideportivo(v):
    rng = random.Random(300 + v)
    cam = Cam(x=[0, -2, 2.5][v % 3], y=[1.6, 2.6, 1.8][v % 3], yaw=[0.0, 0.14, -0.16][v % 3])
    s = Scene(cam, fogc=(30, 26, 24), fogd=50)
    Wd, Hc, D = 12, 9, 40
    wood = (158, 98, 52)
    for i, x in enumerate(np.arange(-Wd, Wd, 0.5)):
        s.quad([(x, 0, 0.4), (x + 0.5, 0, 0.4), (x + 0.5, 0, D), (x, 0, D)], shade(wood, 0.9 + 0.12 * ((i * 7) % 3) / 2), order=3000)
    line = (235, 235, 235)
    cx, cz = 0, 20
    s.line3((-8, 0.003, 4), (-8, 0.003, 36), line, 4); s.line3((8, 0.003, 4), (8, 0.003, 36), line, 4)
    s.line3((-8, 0.003, 36), (8, 0.003, 36), line, 4); s.line3((-8, 0.003, cz), (8, 0.003, cz), line, 4)
    for k in range(48):
        a, b = 2 * math.pi * k / 48, 2 * math.pi * (k + 1) / 48
        s.line3((cx + 2 * math.cos(a), 0.003, cz + 2 * math.sin(a)), (cx + 2 * math.cos(b), 0.003, cz + 2 * math.sin(b)), line, 4)
        a2, b2 = math.pi * k / 48, math.pi * (k + 1) / 48
        s.line3((6 * math.cos(a2), 0.003, 36 - 6 * math.sin(a2)), (6 * math.cos(b2), 0.003, 36 - 6 * math.sin(b2)), (230, 200, 60), 4)
    s.quad([(-Wd, 0, 0.4), (-Wd, Hc, 0.4), (-Wd, Hc, D), (-Wd, 0, D)], (70, 72, 80), order=3100)
    s.quad([(Wd, 0, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (Wd, 0, D)], (66, 68, 76), order=3100)
    s.quad([(-Wd, Hc, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (-Wd, Hc, D)], (24, 24, 28), order=3101)
    s.quad([(-Wd, 0, D), (Wd, 0, D), (Wd, Hc, D), (-Wd, Hc, D)], (60, 64, 72), order=3099)
    for z in range(3, D - 2, 5):  # ventanales altos a la derecha
        s.quad([(Wd - 0.02, 5.5, z), (Wd - 0.02, 8.2, z), (Wd - 0.02, 8.2, z + 3.6), (Wd - 0.02, 5.5, z + 3.6)], (215, 228, 245), emissive=True, glow=(70, 80, 95))
    for k in range(5):  # gradas a la izquierda
        y = k * 0.45; x0 = -Wd + k * 0.8
        s.box(-Wd, x0 + 0.8, y, y + 0.45, 3, 33, shade((90, 92, 100), 0.8 + 0.05 * k))
    s.box(-0.9, 0.9, 2.9, 3.95, D - 1.2, D - 1.15, (240, 240, 240))  # tablero
    s.box(-0.3, 0.3, 3.05, 3.5, D - 1.21, D - 1.19, (200, 70, 40))
    s.box(-0.05, 0.05, 0, 2.9, D - 0.6, D - 0.5, (40, 40, 44))
    for x in (-6, 0, 6):
        for z in (8, 20, 32):
            s.box(x - 0.5, x + 0.5, Hc - 0.12, Hc - 0.02, z - 0.5, z + 0.5, (255, 246, 225), emissive=True, glow=(110, 100, 80))
    s.draw()
    return s.finish(rng, grade=(1.05, 0.98, 0.92))


def cancha(v):
    rng = random.Random(400 + v)
    cam = Cam(x=[0, -5, 4][v % 3], y=[1.6, 2.6, 2.0][v % 3], f=820, yaw=[0.0, 0.12, -0.1][v % 3], hy=BH * 0.42)
    s = Scene(cam, sky=(8, 12, 26), fogc=(22, 28, 46), fogd=90)
    sky = ImageDraw.Draw(s.img)
    for y in range(int(cam.hy) + 4):
        t = y / cam.hy
        sky.line([(0, y), (BW, y)], fill=(int(6 + 26 * t), int(9 + 30 * t), int(22 + 52 * t)))
    turf = (40, 92, 172)  # sintético azul de hockey
    G = 32  # línea de fondo / arco
    for i in range(0, 60, 4):
        s.quad([(-60, 0, i + 0.4), (60, 0, i + 0.4), (60, 0, i + 4.4), (-60, 0, i + 4.4)], shade(turf, 1.0 if (i // 4) % 2 else 0.86), order=5000 - i)
    L = (235, 240, 245)
    s.line3((-27, 0.01, 1), (-27, 0.01, G), L, 5); s.line3((27, 0.01, 1), (27, 0.01, G), L, 5)
    s.line3((-27, 0.01, G), (27, 0.01, G), L, 5); s.line3((-27, 0.01, G - 22.9), (27, 0.01, G - 22.9), L, 5)
    for k in range(48):
        a, b = math.pi * k / 48, math.pi * (k + 1) / 48
        s.line3((14.6 * math.cos(a), 0.01, G - 14.6 * math.sin(a)), (14.6 * math.cos(b), 0.01, G - 14.6 * math.sin(b)), L, 5)
    s.disc(0, 0.02, G - 6.4, 0.12, L)
    for x in (-1.85, 1.85):  # arco
        s.box(x - 0.06, x + 0.06, 0, 2.14, G, G + 0.1, (248, 248, 248))
    s.box(-1.91, 1.91, 2.1, 2.16, G, G + 0.1, (248, 248, 248))
    s.box(-1.85, 1.85, 0, 2.1, G + 1.2, G + 1.25, (60, 64, 80))
    for y in np.arange(0.2, 2.1, 0.22):
        s.line3((-1.85, y, G + 1.15), (1.85, y, G + 1.15), (170, 170, 180), 1)
    for x in (-36, 36):  # torres de luz
        for z in (8, 40):
            s.box(x - 0.35, x + 0.35, 0, 20, z, z + 0.7, (34, 36, 46))
            s.box(x - 3, x + 3, 19, 22.5, z, z + 0.5, (255, 252, 240), emissive=True, glow=(170, 170, 160))
    s.box(-80, 80, 0, 7, 55, 56, (18, 20, 32))  # tribuna lejana
    s.draw()
    return s.finish(rng, glow_r=90, grade=(0.95, 1.0, 1.1), dark=0.85)


def estudio(v):
    rng = random.Random(500 + v)
    cam = Cam(x=[0.3, -0.7, 0.8][v % 3], y=1.3, yaw=[0.08, -0.1, 0.18][v % 3])
    s = Scene(cam, fogc=(40, 34, 30), fogd=40)
    Wd, Hc, D = 5, 3.4, 18
    wood = (176, 132, 90)
    for i, x in enumerate(np.arange(-Wd, Wd, 0.25)):
        s.quad([(x, 0, 0.4), (x + 0.25, 0, 0.4), (x + 0.25, 0, D), (x, 0, D)], shade(wood, 0.88 + 0.1 * ((i * 5) % 4) / 3), order=6000)
    s.quad([(-Wd, 0, 0.4), (-Wd, Hc, 0.4), (-Wd, Hc, D), (-Wd, 0, D)], (190, 182, 170), order=6100)
    s.quad([(Wd, 0, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (Wd, 0, D)], (180, 172, 160), order=6100)
    s.quad([(-Wd, Hc, 0.4), (Wd, Hc, 0.4), (Wd, Hc, D), (-Wd, Hc, D)], (150, 146, 140), order=6101)
    s.quad([(-Wd, 0, D), (Wd, 0, D), (Wd, Hc, D), (-Wd, Hc, D)], (170, 164, 154), order=6099)
    for z in range(2, D - 2, 4):  # ventanas con luz de día
        s.quad([(Wd - 0.02, 0.6, z), (Wd - 0.02, 3.0, z), (Wd - 0.02, 3.0, z + 3.0), (Wd - 0.02, 0.6, z + 3.0)], (255, 250, 236), emissive=True, glow=(120, 110, 90))
    mats = [(40, 120, 110), (60, 60, 66), (120, 70, 90)]
    for r in range(4):
        for c in range(3):
            x = -2.4 + c * 1.6; z = 4 + r * 3
            s.box(x, x + 0.62, 0, 0.01, z, z + 1.8, mats[(r + c + v) % 3])
    for z in (4, 8, 12):  # reformers
        s.box(-Wd + 0.4, -Wd + 1.1, 0, 0.35, z, z + 2.4, (230, 226, 220))
        s.box(-Wd + 0.45, -Wd + 1.05, 0.35, 0.42, z + 0.3, z + 1.8, (50, 50, 56))
    s.draw()
    return s.finish(rng, grade=(1.05, 1.0, 0.95), dark=0.6)


TEMAS = dict(gimnasio=gimnasio, box=box_crossfit, polideportivo=polideportivo, cancha=cancha, estudio=estudio)


def generar(variantes=3):
    os.makedirs(OUT, exist_ok=True)
    for nombre, fn in TEMAS.items():
        for v in range(variantes):
            p = os.path.join(OUT, f"{nombre}-{v + 1}.jpg")
            fn(v).save(p, quality=90); print(p)


if __name__ == "__main__":
    generar()

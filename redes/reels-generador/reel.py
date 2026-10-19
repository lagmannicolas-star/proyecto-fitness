import subprocess, math, sys
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
OUT = sys.argv[1]
PREVIEW = len(sys.argv) > 2  # write stills instead

BLACK = (10, 13, 11)
DARK = (18, 24, 20)
CARD = (28, 36, 31)
GREEN = (34, 197, 94)
LIME = (163, 230, 53)
WHITE = (245, 247, 245)
GREY = (150, 160, 154)
RED = (239, 68, 68)

FB = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FX = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FR = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
_fc = {}
def F(path, size):
    k = (path, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

def clamp(x, a=0, b=1): return max(a, min(b, x))
def ease(x): x = clamp(x); return 1 - (1 - x) ** 3
def back(x):
    x = clamp(x); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def mix(c1, c2, t): return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def text_c(d, y, s, font, fill, alpha=1.0, bg=BLACK):
    w = d.textlength(s, font=font)
    d.text(((W - w) / 2, y), s, font=font, fill=mix(bg, fill, alpha))

def wrap(d, s, font, maxw):
    words, lines, cur = s.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = wd
    lines.append(cur); return lines

def headline(d, t, s, y, size=92, color=WHITE, bg=BLACK, delay=0.0, hl=None):
    """kinetic headline: lines slide up one by one"""
    font = F(FB, size)
    lines = wrap(d, s, font, W - 140)
    lh = int(size * 1.18)
    for i, ln in enumerate(lines):
        p = ease((t - delay - i * 0.12) / 0.35)
        if p <= 0: continue
        yy = y + i * lh + (1 - p) * 60
        c = LIME if (hl and hl in ln) else color
        text_c(d, yy, ln, font, c, p, bg)
    return y + len(lines) * lh

def pill(d, x, y, w, h, fill, r=None):
    d.rounded_rectangle([x, y, x + w, y + h], radius=r or h // 2, fill=fill)

def bg_frame(color=BLACK):
    im = Image.new("RGB", (W, H), color)
    d = ImageDraw.Draw(im)
    return im, d

def brand_bar(d, bg=BLACK):
    f = F(FX, 34)
    d.text((70, 90), "NEXO", font=f, fill=WHITE)
    d.text((70 + d.textlength("NEXO ", font=f), 90), "FIT", font=f, fill=GREEN if bg != GREEN else BLACK)

def progress(d, g):
    d.rectangle([0, H - 10, int(W * g / TOTAL), H], fill=GREEN)

def notif(d, x, y, title, sub, a=1.0, bg=BLACK):
    pill(d, x, y, W - 2 * x, 150, mix(bg, CARD, a), r=36)
    d.ellipse([x + 30, y + 35, x + 110, y + 115], fill=mix(bg, GREEN, a))
    d.text((x + 52, y + 46), "N", font=F(FX, 48), fill=mix(bg, BLACK, a))
    d.text((x + 140, y + 30), title, font=F(FB, 40), fill=mix(bg, WHITE, a))
    d.text((x + 140, y + 85), sub, font=F(FR, 34), fill=mix(bg, GREY, a))

def step_badge(d, t, n, label, y=330):
    p = back(t / 0.4)
    if p <= 0: return
    r = int(70 * p)
    cx = W // 2
    d.ellipse([cx - r, y - r, cx + r, y + r], fill=GREEN)
    if p > 0.6:
        f = F(FX, 80); s = str(n)
        d.text((cx - d.textlength(s, font=f) / 2, y - 52), s, font=f, fill=BLACK)

# ---------------- scenes ----------------
def s_hook(t):
    im, d = bg_frame()
    headline(d, t, "Publiqué lo que necesitaba para mi gimnasio...", 230, 84)
    names = [("Nueva oferta", "Proveedor A · Máquinas"), ("Nueva oferta", "Proveedor B · Pisos"),
             ("Nueva oferta", "Proveedor C · Discos"), ("Nueva oferta", "Proveedor D · Bancos")]
    for i, (a, b) in enumerate(names):
        p = back((t - 0.5 - i * 0.35) / 0.35)
        if p <= 0: continue
        notif(d, 70, 760 + i * 185 + (1 - p) * 120, a, b, clamp(p))
    p = ease((t - 2.1) / 0.4)
    if p > 0: headline(d, t, "y me llovieron ofertas", 1560, 92, LIME, delay=2.1)
    return im

def s_who(t):
    im, d = bg_frame()
    headline(d, t, "Equipar tu espacio es un dolor de cabeza", 300, 86)
    for i, w in enumerate(["GIMNASIOS", "CLUBES", "COLEGIOS", "PROFES"]):
        p = back((t - 0.8 - i * 0.45) / 0.35)
        if p <= 0: continue
        f = F(FX, 110)
        tw = d.textlength(w, font=f)
        x = (W - tw) / 2; y = 820 + i * 200
        pill(d, x - 40, y - 10 + (1 - p) * 40, tw + 80, 160, GREEN if i % 2 == 0 else CARD, r=30)
        d.text((x, y + 8 + (1 - p) * 40), w, font=f, fill=BLACK if i % 2 == 0 else WHITE)
    return im

def s_pain(t):
    im, d = bg_frame()
    headline(d, t, "Llamás a uno. Esperás. Llamás a otro...", 250, 84)
    msgs = ["Hola, ¿me pasás precio?", "¿Tenés stock de discos?", "Necesito presupuesto", "Hola?? 😅"]
    for i, m in enumerate(msgs):
        p = ease((t - 0.4 - i * 0.5) / 0.3)
        if p <= 0: continue
        y = 640 + i * 190
        f = F(FR, 42)
        m2 = m.replace(" 😅", "")
        tw = d.textlength(m2, font=f)
        x = W - 90 - tw - 80
        pill(d, x, y, tw + 80, 120, mix(BLACK, (40, 80, 55), p), r=40)
        d.text((x + 40, y + 34), m2, font=f, fill=mix(BLACK, WHITE, p))
        d.text((W - 90 - 110, y + 130), "Visto ✓✓".replace("✓✓", ""), font=F(FR, 30), fill=mix(BLACK, GREY, p))
    p = back((t - 2.6) / 0.4)
    if p > 0:
        f = F(FX, 100)
        s = "¿PRECIO JUSTO?"
        d.text(((W - d.textlength(s, font=f)) / 2, 1500 + (1 - p) * 60), s, font=f, fill=RED)
        s2 = "Ni idea."
        text_c(d, 1630 + (1 - p) * 60, s2, F(FB, 80), WHITE, clamp(p))
    return im

def s_logo(t):
    p = ease(t / 0.25)
    im, d = bg_frame(mix(BLACK, GREEN, p))
    bgc = mix(BLACK, GREEN, p)
    text_c(d, 640, "Por eso creamos", F(FB, 70), BLACK, ease((t - 0.3) / 0.3), bgc)
    s = back((t - 0.6) / 0.5)
    if s > 0:
        size = max(10, int(220 * s))
        f = F(FX, size)
        a, b = "NEXO", "FIT"
        tw = d.textlength(a + " " + b, font=f)
        x = (W - tw) / 2; y = 860 - size * 0.1
        d.text((x, y), a, font=f, fill=BLACK)
        d.text((x + d.textlength(a + " ", font=f), y), b, font=f, fill=WHITE)
    text_c(d, 1180, "Equipamiento fitness, sin vueltas", F(FR, 52), BLACK, ease((t - 1.6) / 0.4), bgc)
    return im

def s_step1(t):
    im, d = bg_frame(); brand_bar(d)
    step_badge(d, t, 1, "")
    headline(d, t, "Publicás lo que necesitás", 450, 90, delay=0.2)
    # form mockup
    x, y, w = 110, 820, W - 220
    pill(d, x, y, w, 820, CARD, r=40)
    d.text((x + 50, y + 45), "Pedir ofertas", font=F(FB, 54), fill=WHITE)
    fields = [("¿Qué necesitás?", "Cinta, bicis, discos, piso de goma"),
              ("Cantidad", "10 equipos"), ("Zona de entrega", "Buenos Aires")]
    for i, (lab, val) in enumerate(fields):
        fy = y + 150 + i * 190
        d.text((x + 50, fy), lab, font=F(FR, 34), fill=GREY)
        pill(d, x + 50, fy + 50, w - 100, 100, DARK, r=20)
        n = int(len(val) * clamp((t - 0.8 - i * 0.9) / 0.8))
        d.text((x + 80, fy + 78), val[:n], font=F(FR, 40), fill=WHITE)
    p = back((t - 3.8) / 0.3)
    if p > 0:
        pill(d, x + 50, y + 690, w - 100, 100, GREEN, r=50)
        text_c(d, y + 713, "Enviar pedido", F(FB, 46), BLACK, clamp(p), GREEN)
    return im

def s_step2(t):
    im, d = bg_frame(); brand_bar(d)
    step_badge(d, t, 2, "")
    headline(d, t, "Los proveedores compiten por vos", 450, 90, delay=0.2, hl="compiten")
    items = [("Oferta recibida · Email", "Proveedor A: $4.850.000"), ("Oferta recibida · WhatsApp", "Proveedor B: $4.390.000"),
             ("Oferta recibida · Email", "Proveedor C: $5.100.000"), ("Oferta recibida · WhatsApp", "Proveedor D: $4.620.000")]
    for i, (a, b) in enumerate(items):
        p = back((t - 0.9 - i * 0.7) / 0.35)
        if p <= 0: continue
        notif(d, 70, 870 + i * 185 + (1 - p) * 120, a, b, clamp(p))
    return im

def s_step3(t):
    im, d = bg_frame(); brand_bar(d)
    step_badge(d, t, 3, "")
    headline(d, t, "Comparás y elegís", 450, 96, delay=0.2)
    offers = [("Proveedor A", "$4.850.000", "Entrega 15 días"), ("Proveedor B", "$4.390.000", "Entrega 7 días"),
              ("Proveedor D", "$4.620.000", "Entrega 10 días")]
    sel = ease((t - 2.8) / 0.4)
    for i, (n, pr, e) in enumerate(offers):
        p = ease((t - 0.7 - i * 0.3) / 0.35)
        if p <= 0: continue
        y = 720 + i * 300 + (1 - p) * 80
        best = i == 1
        col = mix(CARD, (20, 70, 40), sel) if best else CARD
        pill(d, 90, y, W - 180, 260, mix(BLACK, col, p), r=36)
        if best and sel > 0:
            d.rounded_rectangle([90, y, W - 90, y + 260], radius=36, outline=GREEN, width=int(8 * sel))
        d.text((140, y + 40), n, font=F(FB, 50), fill=mix(BLACK, WHITE, p))
        d.text((140, y + 115), pr, font=F(FX, 72), fill=mix(BLACK, LIME if best else WHITE, p))
        d.text((140, y + 200), e, font=F(FR, 32), fill=mix(BLACK, GREY, p))
        if best and sel > 0.5:
            pill(d, W - 420, y + 40, 280, 80, GREEN)
            d.text((W - 395, y + 55), "ELEGIDA", font=F(FX, 44), fill=BLACK)
    return im

def s_space(t):
    im, d = bg_frame(); brand_bar(d)
    headline(d, t, "¿No sabés por dónde empezar?", 300, 84)
    p = ease((t - 0.8) / 0.4)
    if p > 0:
        pill(d, 160, 560, W - 320, 130, mix(BLACK, GREEN, p))
        text_c(d, 588, "Armá tu espacio", F(FX, 66), BLACK, p, GREEN)
    # room grid filling
    gx, gy, cell = 140, 820, 200
    labels = ["Cinta", "Bici", "Rack", "Discos", "Banco", "Remo", "Piso", "Polea", "Kettle", "Box", "Soga", "Colch."]
    for i in range(12):
        r, c = divmod(i, 4)
        x = gx + c * cell; y = gy + r * cell
        d.rounded_rectangle([x, y, x + cell - 20, y + cell - 20], radius=24, outline=(50, 60, 54), width=4)
        q = back((t - 1.4 - i * 0.18) / 0.3)
        if q > 0:
            m = (1 - clamp(q)) * 60
            pill(d, x + m / 2, y + m / 2, cell - 20 - m, cell - 20 - m, GREEN if i % 3 else LIME, r=24)
            if q > 0.7:
                f = F(FB, 34); tw = d.textlength(labels[i], font=f)
                d.text((x + (cell - 20 - tw) / 2, y + 62), labels[i], font=f, fill=BLACK)
    text_c(d, 1480, "Te ayuda a equipar tu sala desde cero", F(FR, 48), WHITE, ease((t - 3.5) / 0.4))
    return im

def s_total(t):
    im, d = bg_frame(); brand_bar(d)
    headline(d, t, "Y ves el precio final", 400, 96)
    p = ease((t - 0.6) / 2.6)
    val = int(4390000 * p)
    s = "$" + f"{val:,}".replace(",", ".")
    f = F(FX, 150)
    d.text(((W - d.textlength(s, font=f)) / 2, 820), s, font=f, fill=LIME)
    text_c(d, 1030, "TOTAL", F(FB, 54), GREY, ease((t - 0.6) / 0.3))
    q = back((t - 3.4) / 0.4)
    if q > 0:
        pill(d, 180, 1300 + (1 - q) * 40, W - 360, 140, GREEN)
        text_c(d, 1335 + (1 - q) * 40, "Sin sorpresas", F(FX, 70), BLACK, clamp(q), GREEN)
    return im

def s_one(t):
    im, d = bg_frame()
    cats = ["Máquinas", "Pisos", "Pesas", "Indumentaria", "Accesorios", "Suplementos"]
    cx, cy = W / 2, 960
    for i, c in enumerate(cats):
        p = ease((t - 0.2 - i * 0.15) / 0.5)
        ang = i / len(cats) * 2 * math.pi - math.pi / 2
        conv = ease((t - 2.2) / 0.8)
        rad = 520 * (1 - conv * 0.75)
        x = cx + math.cos(ang) * rad; y = cy + math.sin(ang) * rad
        if p <= 0: continue
        f = F(FB, 44); tw = d.textlength(c, font=f)
        a = p * (1 - conv)
        if a > 0.02:
            pill(d, x - tw / 2 - 30, y - 45, tw + 60, 90, mix(BLACK, CARD, a))
            d.text((x - tw / 2, y - 30), c, font=f, fill=mix(BLACK, WHITE, a))
    q = back((t - 2.8) / 0.5)
    if q > 0:
        r = int(230 * q)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN)
        if q > 0.7:
            f = F(FX, 90)
            for j, s in enumerate(["NEXO", "FIT"]):
                d.text((cx - d.textlength(s, font=f) / 2, cy - 105 + j * 100), s, font=f, fill=BLACK)
    headline(d, t, "Distintas empresas.", 230, 90)
    headline(d, t, "Un solo lugar.", 1520, 100, LIME, delay=3.2)
    return im

def s_climax(t):
    p = ease((t - 2.5) / 0.3)
    bgc = mix(BLACK, GREEN, p)
    im, d = bg_frame(bgc)
    if p < 0.5:
        headline(d, t, "Dejá de perseguir proveedores.", 700, 104)
    else:
        f = F(FX, 140)
        for j, s in enumerate(["QUE TE", "BUSQUEN", "A VOS"]):
            q = back((t - 2.6 - j * 0.15) / 0.35)
            if q > 0:
                d.text(((W - d.textlength(s, font=f)) / 2, 600 + j * 190 + (1 - q) * 60), s, font=f, fill=BLACK)
    return im

def s_cta(t):
    im, d = bg_frame()
    text_c(d, 380, "Comentá", F(FB, 100), WHITE, ease(t / 0.3))
    q = back((t - 0.4) / 0.5)
    if q > 0:
        pulse = 1 + 0.04 * math.sin(t * 6)
        size = int(190 * q * pulse)
        f = F(FX, max(10, size)); s = "EQUIPAR"
        tw = d.textlength(s, font=f)
        pill(d, (W - tw) / 2 - 60, 600, tw + 120, size + 90, GREEN, r=40)
        d.text(((W - tw) / 2, 620), s, font=f, fill=BLACK)
    headline(d, t, "y te mandamos el link por privado", 1000, 72, delay=1.2)
    # comment bubble mock
    p = ease((t - 2.2) / 0.4)
    if p > 0:
        pill(d, 110, 1400 + (1 - p) * 60, W - 220, 150, mix(BLACK, CARD, p), r=40)
        d.ellipse([150, 1430 + (1 - p) * 60, 240, 1520 + (1 - p) * 60], fill=mix(BLACK, GREEN, p))
        d.text((275, 1440 + (1 - p) * 60), "gimnasio_power", font=F(FB, 34), fill=mix(BLACK, GREY, p))
        d.text((275, 1485 + (1 - p) * 60), "EQUIPAR", font=F(FB, 42), fill=mix(BLACK, WHITE, p))
    return im

def s_save(t):
    im, d = bg_frame()
    # bookmark icon
    p = back(t / 0.5)
    if p > 0:
        cx, top = W / 2, 380; w = 200 * p; h = 260 * p
        d.polygon([(cx - w / 2, top), (cx + w / 2, top), (cx + w / 2, top + h), (cx, top + h * 0.72), (cx - w / 2, top + h)], fill=LIME)
    headline(d, t, "Guardalo para tu próxima compra", 760, 92, delay=0.4)
    q = ease((t - 1.4) / 0.5)
    if q > 0:
        f = F(FX, 120); a, b = "NEXO", "FIT"
        tw = d.textlength(a + " " + b, font=f); x = (W - tw) / 2
        d.text((x, 1300), a, font=f, fill=mix(BLACK, WHITE, q))
        d.text((x + d.textlength(a + " ", font=f), 1300), b, font=f, fill=mix(BLACK, GREEN, q))
        text_c(d, 1460, "nexofitt.com.ar", F(FR, 52), GREY, q)
    return im

SCENES = [(s_hook, 3.2), (s_who, 3.8), (s_pain, 4.2), (s_logo, 3.2), (s_step1, 5), (s_step2, 4.5),
          (s_step3, 5), (s_space, 5), (s_total, 4.5), (s_one, 5), (s_climax, 5), (s_cta, 5), (s_save, 4)]
TOTAL = sum(s for _, s in SCENES)

if PREVIEW:
    g = 0
    for i, (fn, dur) in enumerate(SCENES):
        im = fn(dur - 0.3); d = ImageDraw.Draw(im); progress(d, g + dur)
        im.resize((540, 960)).save(f"{OUT}/p{i:02d}.png"); g += dur
    sys.exit()

proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                         "-r", str(FPS), "-i", "-", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                         "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                         "-c:a", "aac", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
g = 0.0
for fn, dur in SCENES:
    n = int(dur * FPS)
    for k in range(n):
        t = k / FPS
        im = fn(t)
        # quick fade between scenes
        if k < 4:
            im = Image.blend(Image.new("RGB", (W, H), BLACK), im, (k + 1) / 5)
        d = ImageDraw.Draw(im); progress(d, g + t)
        proc.stdin.write(im.tobytes())
    g += dur
proc.stdin.close(); proc.wait()
print("TOTAL", TOTAL)

"""Nexo Fit reel engine: render a list of scene dicts into a 1080x1920 MP4 with brand style."""
import subprocess, math
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
BLACK = (10, 13, 11); DARK = (18, 24, 20); CARD = (28, 36, 31)
GREEN = (34, 197, 94); LIME = (163, 230, 53); WHITE = (245, 247, 245)
GREY = (150, 160, 154); RED = (239, 68, 68); CHAT = (40, 80, 55)
FB = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
FX = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FR = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
_fc = {}
def F(p, s):
    s = max(8, int(s))
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def clamp(x, a=0, b=1): return max(a, min(b, x))
def ease(x): x = clamp(x); return 1 - (1 - x) ** 3
def back(x):
    x = clamp(x); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def mix(a, b, t): t = clamp(t); return tuple(int(x + (y - x) * t) for x, y in zip(a, b))

def wrap(d, s, font, maxw):
    lines = []
    for para in s.split("\n"):
        cur = ""
        for wd in para.split():
            t = (cur + " " + wd).strip()
            if d.textlength(t, font=font) <= maxw: cur = t
            else: lines.append(cur); cur = wd
        lines.append(cur)
    return lines

def text_c(d, y, s, font, fill, a=1.0, bg=BLACK):
    d.text(((W - d.textlength(s, font=font)) / 2, y), s, font=font, fill=mix(bg, fill, a))

def headline(d, t, s, y, size=88, color=WHITE, bg=BLACK, delay=0.0, hl=None, font=FB, maxw=W - 140):
    f = F(font, size); lines = wrap(d, s, f, maxw); lh = int(size * 1.18)
    for i, ln in enumerate(lines):
        p = ease((t - delay - i * 0.12) / 0.35)
        if p <= 0: continue
        c = LIME if (hl and any(h in ln for h in hl)) else color
        text_c(d, y + i * lh + (1 - p) * 60, ln, f, c, p, bg)
    return y + len(lines) * lh

def pill(d, x, y, w, h, fill, r=None):
    d.rounded_rectangle([x, y, x + w, y + h], radius=r if r is not None else h // 2, fill=fill)

def brand_bar(d, bg=BLACK):
    f = F(FX, 34)
    d.text((70, 90), "NEXO", font=f, fill=WHITE if bg != GREEN else BLACK)
    d.text((70 + d.textlength("NEXO ", font=f), 90), "FIT", font=f, fill=GREEN if bg != GREEN else WHITE)

def logo(d, y, size, a=1.0, bg=BLACK, fit=GREEN, nexo=WHITE):
    f = F(FX, size); tw = d.textlength("NEXO FIT", font=f); x = (W - tw) / 2
    d.text((x, y), "NEXO", font=f, fill=mix(bg, nexo, a))
    d.text((x + d.textlength("NEXO ", font=f), y), "FIT", font=f, fill=mix(bg, fit, a))

# ---------------- scene renderers: fn(d, t, sc, bg) ----------------
def sc_title(d, t, sc, bg):
    y = sc.get("y", 700)
    if sc.get("kicker"):
        p = ease(t / 0.3)
        f = F(FB, 46); tw = d.textlength(sc["kicker"], font=f)
        pill(d, (W - tw) / 2 - 36, y - 150, tw + 72, 90, mix(bg, sc.get("kcolor", GREEN if bg != GREEN else BLACK), p))
        d.text(((W - tw) / 2, y - 133), sc["kicker"], font=f, fill=mix(bg, BLACK if bg != GREEN else GREEN, p))
    col = BLACK if bg == GREEN else WHITE
    y2 = headline(d, t, sc["text"], y, sc.get("size", 100), col, bg, 0.15, sc.get("hl"), FX if sc.get("heavy") else FB)
    if sc.get("sub"):
        headline(d, t, sc["sub"], y2 + 50, sc.get("subsize", 56), GREY if bg != GREEN else BLACK, bg, sc.get("subdelay", 0.9), font=FR)

def sc_number(d, t, sc, bg):
    p = back(t / 0.45)
    f = F(FX, 380 * p if p > 0 else 8)
    s = sc["n"]
    if p > 0: d.text(((W - d.textlength(s, font=f)) / 2, 260), s, font=f, fill=sc.get("ncolor", RED))
    y = headline(d, t, sc["text"], 760, sc.get("size", 92), WHITE, bg, 0.35, sc.get("hl"))
    if sc.get("sub"):
        headline(d, t, sc["sub"], y + 50, 54, GREY, bg, 1.3, font=FR)
    if sc.get("fix"):
        q = back((t - sc.get("fixt", 2.6)) / 0.4)
        if q > 0:
            f2 = F(FB, 50); lines = wrap(d, sc["fix"], f2, W - 260)
            hh = 70 + 66 * len(lines)
            yy = 1480 + (1 - q) * 60
            pill(d, 90, yy, W - 180, hh, mix(bg, GREEN, clamp(q)), r=40)
            for i, ln in enumerate(lines): text_c(d, yy + 35 + i * 66, ln, f2, BLACK, clamp(q), GREEN)

def sc_chat(d, t, sc, bg):
    if sc.get("text"): headline(d, t, sc["text"], 230, sc.get("size", 80), WHITE, bg, 0, sc.get("hl"))
    y = sc.get("y", 620)
    for i, m in enumerate(sc["msgs"]):
        side, txt, at = m[0], m[1], m[2]
        p = ease((t - at) / 0.25)
        if p <= 0: continue
        f = F(FR, 42); lines = wrap(d, txt, f, 640)
        tw = max(d.textlength(l, font=f) for l in lines); hh = 50 + 54 * len(lines)
        x = W - 90 - tw - 80 if side == "me" else 90
        col = CHAT if side == "me" else CARD
        pill(d, x, y + (1 - p) * 30, tw + 80, hh, mix(bg, col, p), r=40)
        for j, ln in enumerate(lines): d.text((x + 40, y + 25 + j * 54 + (1 - p) * 30), ln, font=f, fill=mix(bg, WHITE, p))
        if len(m) > 3:
            d.text((x + tw + 80 - d.textlength(m[3], font=F(FR, 30)) if side == "me" else x, y + hh + 10), m[3], font=F(FR, 30), fill=mix(bg, GREY, p))
            y += 50
        y += hh + 40
    if sc.get("punch"):
        q = back((t - sc["pt"]) / 0.4)
        if q > 0:
            f = F(FX, sc.get("psize", 92)); lines = wrap(d, sc["punch"], f, W - 140)
            for i, ln in enumerate(lines):
                d.text(((W - d.textlength(ln, font=f)) / 2, 1520 + i * 110 + (1 - q) * 60), ln, font=f, fill=sc.get("pcolor", RED))

def notif(d, x, y, a, b, al, bg):
    pill(d, x, y, W - 2 * x, 150, mix(bg, CARD, al), r=36)
    d.ellipse([x + 30, y + 35, x + 110, y + 115], fill=mix(bg, GREEN, al))
    d.text((x + 52, y + 46), "N", font=F(FX, 48), fill=mix(bg, BLACK, al))
    d.text((x + 140, y + 30), a, font=F(FB, 40), fill=mix(bg, WHITE, al))
    d.text((x + 140, y + 85), b, font=F(FR, 34), fill=mix(bg, GREY, al))

def sc_notifs(d, t, sc, bg):
    headline(d, t, sc["text"], 250, sc.get("size", 86), WHITE, bg, 0, sc.get("hl"))
    for i, (a, b) in enumerate(sc["items"]):
        p = back((t - sc.get("start", 0.6) - i * sc.get("gap", 0.4)) / 0.35)
        if p > 0: notif(d, 70, 760 + i * 185 + (1 - p) * 120, a, b, clamp(p), bg)
    if sc.get("bottom"):
        headline(d, t, sc["bottom"], 1560, 88, LIME, bg, sc.get("bt", 2.2))

def sc_chips(d, t, sc, bg):
    headline(d, t, sc["text"], 280, sc.get("size", 86), WHITE, bg, 0, sc.get("hl"))
    n = len(sc["items"]); y0 = sc.get("y", 760); step = sc.get("step", 170)
    for i, w in enumerate(sc["items"]):
        p = back((t - sc.get("start", 0.7) - i * sc.get("gap", 0.35)) / 0.35)
        if p <= 0: continue
        f = F(FX if sc.get("big") else FB, sc.get("isize", 64)); tw = d.textlength(w, font=f)
        y = y0 + i * step + (1 - p) * 40
        on = i % 2 == 0 if sc.get("alt", True) else True
        pill(d, (W - tw) / 2 - 45, y, tw + 90, sc.get("isize", 64) + 66, GREEN if on else CARD, r=30)
        d.text(((W - tw) / 2, y + 26), w, font=f, fill=BLACK if on else WHITE)

def sc_checklist(d, t, sc, bg):
    headline(d, t, sc["text"], 230, sc.get("size", 84), WHITE, bg, 0, sc.get("hl"))
    for i, it in enumerate(sc["items"]):
        p = ease((t - sc.get("start", 0.8) - i * sc.get("gap", 0.6)) / 0.3)
        if p <= 0: continue
        y = 700 + i * 190
        pill(d, 90, y, W - 180, 150, mix(bg, CARD, p), r=36)
        q = back((t - sc.get("start", 0.8) - i * sc.get("gap", 0.6) - 0.2) / 0.3)
        r = int(42 * q)
        cx, cy = 175, y + 75
        if r > 0:
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN)
            if q > 0.7: d.line([(cx - 18, cy), (cx - 5, cy + 14), (cx + 20, cy - 14)], fill=BLACK, width=9)
        fs = 50
        while d.textlength(it, font=F(FB, fs)) > W - 90 - 250 - 40: fs -= 2
        d.text((250, y + 75 - fs * 0.62), it, font=F(FB, fs), fill=mix(bg, WHITE, p))

def sc_split(d, t, sc, bg):
    headline(d, t, sc["text"], 200, sc.get("size", 84), WHITE, bg, 0, sc.get("hl"))
    cols = [(sc["left_title"], sc["left"], RED, 80), (sc["right_title"], sc["right"], GREEN, W // 2 + 15)]
    for c, (tt, items, col, x) in enumerate(cols):
        base = 0.6 + c * (0.4 + 0.45 * len(items))
        p = ease((t - base) / 0.3)
        if p <= 0: continue
        w = W // 2 - 95
        pill(d, x, 560, w, 1100, mix(bg, CARD, p), r=40)
        pill(d, x, 560, w, 120, mix(bg, col, p), r=40)
        f = F(FX, 54); d.text((x + (w - d.textlength(tt, font=f)) / 2, 588), tt, font=f, fill=mix(bg, BLACK, p))
        yy = 730
        for i, it in enumerate(items):
            q = ease((t - base - 0.3 - i * 0.45) / 0.3)
            if q <= 0: continue
            f2 = F(FB, 42); ls = wrap(d, it, f2, w - 70)
            mark = "✕" if c == 0 else "✓"
            d.text((x + 30, yy), "-" if c == 0 else "+", font=F(FX, 46), fill=mix(bg, col, q))
            for j, ln in enumerate(ls): d.text((x + 75, yy + j * 52), ln, font=f2, fill=mix(bg, WHITE, q))
            yy += 52 * len(ls) + 60

def sc_cards(d, t, sc, bg):
    headline(d, t, sc["text"], 250, sc.get("size", 90), WHITE, bg, 0, sc.get("hl"))
    sel = ease((t - sc.get("selt", 2.6)) / 0.4)
    for i, (n, pr, e) in enumerate(sc["items"]):
        p = ease((t - 0.6 - i * 0.3) / 0.35)
        if p <= 0: continue
        y = 640 + i * 300 + (1 - p) * 80
        best = i == sc.get("best", 1)
        col = mix(CARD, (20, 70, 40), sel) if best else CARD
        pill(d, 90, y, W - 180, 260, mix(bg, col, p), r=36)
        if best and sel > 0: d.rounded_rectangle([90, y, W - 90, y + 260], radius=36, outline=GREEN, width=max(1, int(8 * sel)))
        d.text((140, y + 40), n, font=F(FB, 50), fill=mix(bg, WHITE, p))
        d.text((140, y + 115), pr, font=F(FX, 72), fill=mix(bg, LIME if best else WHITE, p))
        d.text((140, y + 200), e, font=F(FR, 32), fill=mix(bg, GREY, p))
        if best and sel > 0.5:
            pill(d, W - 420, y + 40, 280, 80, GREEN); d.text((W - 395, y + 55), "ELEGIDA", font=F(FX, 44), fill=BLACK)
    if sc.get("note"): text_c(d, 1600, sc["note"], F(FR, 34), GREY, ease((t - 1) / 0.4), bg)

def sc_grid(d, t, sc, bg):
    headline(d, t, sc["text"], 260, sc.get("size", 84), WHITE, bg, 0, sc.get("hl"))
    p = ease((t - 0.7) / 0.4)
    if p > 0 and sc.get("badge"):
        f = F(FX, 66); tw = d.textlength(sc["badge"], font=f)
        pill(d, (W - tw) / 2 - 50, 560, tw + 100, 130, mix(bg, GREEN, p)); text_c(d, 588, sc["badge"], f, BLACK, p, GREEN)
    labels = sc["items"]; cols = 4; cell = 200; gx = (W - cols * cell + 20) / 2; gy = 800
    for i, lab in enumerate(labels):
        r, c = divmod(i, cols); x = gx + c * cell; y = gy + r * cell
        d.rounded_rectangle([x, y, x + cell - 20, y + cell - 20], radius=24, outline=(50, 60, 54), width=4)
        q = back((t - 1.2 - i * 0.16) / 0.3)
        if q > 0:
            m = (1 - clamp(q)) * 60
            pill(d, x + m / 2, y + m / 2, cell - 20 - m, cell - 20 - m, GREEN if i % 3 else LIME, r=24)
            if q > 0.7:
                f = F(FB, 32); tw = d.textlength(lab, font=f); d.text((x + (cell - 20 - tw) / 2, y + 64), lab, font=f, fill=BLACK)
    if sc.get("bottom"): headline(d, t, sc["bottom"], 1500, 50, WHITE, bg, sc.get("bt", 3.2), font=FR)

def sc_logo(d, t, sc, bg):
    text_c(d, 660, sc.get("pre", "Por eso existe"), F(FB, 70), BLACK, ease((t - 0.2) / 0.3), bg)
    s = back((t - 0.5) / 0.5)
    if s > 0: logo(d, 860, 220 * s, 1, bg, WHITE, BLACK)
    if sc.get("sub"): headline(d, t, sc["sub"], 1180, 52, BLACK, bg, 1.4, font=FR)

def sc_steps(d, t, sc, bg):
    headline(d, t, sc["text"], 230, sc.get("size", 84), WHITE, bg, 0, sc.get("hl"))
    for i, s in enumerate(sc["items"]):
        p = back((t - 0.7 - i * sc.get("gap", 0.8)) / 0.4)
        if p <= 0: continue
        y = 640 + i * 300
        r = int(70 * clamp(p)); cx = 190; cy = y + 90
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN)
        if p > 0.6:
            f = F(FX, 80); n = str(i + 1); d.text((cx - d.textlength(n, font=f) / 2, cy - 52), n, font=f, fill=BLACK)
        f2 = F(FB, 54); ls = wrap(d, s, f2, W - 400)
        for j, ln in enumerate(ls): d.text((300, y + 40 + j * 66 + (1 - clamp(p)) * 30), ln, font=f2, fill=mix(bg, WHITE, clamp(p)))

def sc_cta(d, t, sc, bg):
    text_c(d, 360, sc.get("pre", "Comentá"), F(FB, 100), WHITE, ease(t / 0.3), bg)
    q = back((t - 0.4) / 0.5)
    if q > 0:
        pulse = 1 + 0.04 * math.sin(t * 6)
        s = sc["word"]; base = sc.get("ksize", 190)
        while d.textlength(s, font=F(FX, base)) > W - 260: base -= 4
        size = base * q * pulse
        f = F(FX, size); tw = d.textlength(s, font=f)
        pill(d, (W - tw) / 2 - 60, 580, tw + 120, size + 90, GREEN, r=40)
        d.text(((W - tw) / 2, 600), s, font=f, fill=BLACK)
    headline(d, t, sc["sub"], 1000, 70, WHITE, bg, 1.1)
    if sc.get("comment"):
        p = ease((t - 2.0) / 0.4); o = (1 - p) * 60
        if p > 0:
            pill(d, 110, 1420 + o, W - 220, 150, mix(bg, CARD, p), r=40)
            d.ellipse([150, 1450 + o, 240, 1540 + o], fill=mix(bg, GREEN, p))
            d.text((275, 1460 + o), sc["comment"][0], font=F(FB, 34), fill=mix(bg, GREY, p))
            d.text((275, 1505 + o), sc["comment"][1], font=F(FB, 42), fill=mix(bg, WHITE, p))

def sc_end(d, t, sc, bg):
    p = back(t / 0.5)
    if p > 0 and sc.get("icon", "save") == "save":
        cx, top = W / 2, 380; w = 200 * p; h = 260 * p
        d.polygon([(cx - w / 2, top), (cx + w / 2, top), (cx + w / 2, top + h), (cx, top + h * 0.72), (cx - w / 2, top + h)], fill=LIME)
    headline(d, t, sc.get("text", "Guardalo para tu próxima compra"), 760, 88, WHITE, bg, 0.4)
    q = ease((t - 1.3) / 0.5)
    if q > 0:
        logo(d, 1300, 120, q, bg); text_c(d, 1460, "nexofitt.com.ar", F(FR, 52), GREY, q, bg)

def sc_plan(d, t, sc, bg):
    """Planta de un espacio: room=(ancho_m, largo_m), items=[(label, x, y, w, h, at)] en metros.
    Opcional: verdict (texto en pastilla abajo), vcolor, vt (tiempo), note (texto chico)."""
    headline(d, t, sc["text"], 210, sc.get("size", 84), WHITE, bg, 0, sc.get("hl"))
    rw, rh = sc["room"]; top = sc.get("top", 640); maxw, maxh = W - 220, sc.get("maxh", 760)
    k = min(maxw / rw, maxh / rh); pw, ph = rw * k, rh * k; x0 = (W - pw) / 2; y0 = top
    p = ease((t - 0.3) / 0.4)
    if p > 0:
        d.rectangle([x0, y0, x0 + pw, y0 + ph], fill=mix(bg, DARK, p))
        for gx in range(1, int(rw)):
            d.line([(x0 + gx * k, y0), (x0 + gx * k, y0 + ph)], fill=mix(bg, (32, 42, 36), p), width=2)
        for gy in range(1, int(rh)):
            d.line([(x0, y0 + gy * k), (x0 + pw, y0 + gy * k)], fill=mix(bg, (32, 42, 36), p), width=2)
        d.rectangle([x0, y0, x0 + pw, y0 + ph], outline=mix(bg, GREEN, p), width=8)
        f = F(FB, 40)
        lab = sc.get("wlabel", f"{rw:g} m".replace(".", ",")); text_c(d, y0 + ph + 18, lab, f, GREEN, p, bg)
        lab2 = sc.get("hlabel", f"{rh:g} m".replace(".", ","))
        tw = d.textlength(lab2, font=f); d.text((x0 - tw - 18, y0 + ph / 2 - 26), lab2, font=f, fill=mix(bg, GREEN, p))
    for i, it in enumerate(sc["items"]):
        lab, ix, iy, iw, ih = it[:5]; at = it[5] if len(it) > 5 else 0.9 + i * 0.35
        q = back((t - at) / 0.3)
        if q <= 0: continue
        cq = clamp(q); m = (1 - cq) * 20
        bx, by, bw, bh = x0 + ix * k + m, y0 + iy * k + m, iw * k - 2 * m, ih * k - 2 * m
        col = it[6] if len(it) > 6 else (GREEN if i % 2 == 0 else LIME)
        if bw > 4 and bh > 4: d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=14, fill=col)
        if cq > 0.7 and lab:
            fs = 34
            while fs > 18 and d.textlength(lab, font=F(FB, fs)) > iw * k - 16: fs -= 2
            ff = F(FB, fs); lw = d.textlength(lab, font=ff)
            d.text((x0 + ix * k + (iw * k - lw) / 2, y0 + iy * k + ih * k / 2 - fs * 0.62), lab, font=ff, fill=BLACK)
    if sc.get("verdict"):
        q = back((t - sc.get("vt", 3.0)) / 0.4)
        if q > 0:
            f = F(FX, sc.get("vsize", 70)); s = sc["verdict"]; tw = d.textlength(s, font=f)
            yy = y0 + ph + 110 + (1 - clamp(q)) * 50
            pill(d, (W - tw) / 2 - 50, yy, tw + 100, sc.get("vsize", 70) + 60, sc.get("vcolor", LIME), r=36)
            d.text(((W - tw) / 2, yy + 22), s, font=f, fill=BLACK)
    if sc.get("note"): text_c(d, H - 120, sc["note"], F(FR, 34), GREY, ease((t - 0.8) / 0.4), bg)

R = dict(plan=sc_plan, title=sc_title, number=sc_number, chat=sc_chat, notifs=sc_notifs, chips=sc_chips, checklist=sc_checklist,
         split=sc_split, cards=sc_cards, grid=sc_grid, logo=sc_logo, steps=sc_steps, cta=sc_cta, end=sc_end)

def frame(sc, t, g, total):
    bg = GREEN if sc.get("bg") == "green" else BLACK
    if sc["type"] == "logo": bg = mix(BLACK, GREEN, ease(t / 0.25))
    im = Image.new("RGB", (W, H), bg); d = ImageDraw.Draw(im)
    if sc.get("brand"): brand_bar(d, bg)
    R[sc["type"]](d, t, sc, bg)
    d.rectangle([0, H - 10, int(W * g / total), H], fill=GREEN if bg != GREEN else BLACK)
    return im

def render(scenes, out, audio=None):
    total = sum(s["dur"] for s in scenes)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    cmd += ["-i", audio] if audio else ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
    cmd += ["-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    g = 0.0
    for sc in scenes:
        n = int(sc["dur"] * FPS)
        for k in range(n):
            t = k / FPS; im = frame(sc, t, g + t, total)
            if k < 4: im = Image.blend(Image.new("RGB", (W, H), BLACK), im, (k + 1) / 5)
            p.stdin.write(im.tobytes())
        g += sc["dur"]
    p.stdin.close(); p.wait()
    return total

def preview(scenes, out):
    total = sum(s["dur"] for s in scenes); g = 0; ims = []
    for sc in scenes:
        ims.append(frame(sc, sc["dur"] - 0.2, g + sc["dur"], total).resize((360, 640))); g += sc["dur"]
    cols = 6; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (360 * cols, 640 * rows), (70, 70, 70))
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 360, (i // cols) * 640))
    sheet.save(out)

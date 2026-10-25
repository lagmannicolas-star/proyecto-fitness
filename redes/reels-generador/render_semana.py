"""Uso: python3 render_semana.py MODULO [preview|render] [slug ...]
Renderiza REELS (redes/<folder>/reel-HHMM-slug.mp4) y T (redes/tiktok/AAAA-MM-DD_HHh_slug.mp4) con música de beat.py."""
import sys, os, importlib, subprocess, tempfile
from engine import render, preview
mod = importlib.import_module(sys.argv[1]); mode = sys.argv[2] if len(sys.argv) > 2 else "preview"; only = set(sys.argv[3:])
HERE = os.path.dirname(os.path.abspath(__file__)); REDES = os.path.dirname(HERE)
def out_path(v, reel):
    d, h = v["date"].split("T"); hh, mm = h.split(":")[:2]
    if reel: return os.path.join(REDES, v["folder"], f"reel-{hh}{mm}-{v['slug']}.mp4")
    return os.path.join(REDES, "tiktok", f"{d}_{hh}h_{v['slug']}.mp4")
items = [(v, True) for v in getattr(mod, "REELS", [])] + [(v, False) for v in getattr(mod, "T", [])]
for v, reel in items:
    if only and v["slug"] not in only: continue
    dur = sum(s["dur"] for s in v["scenes"])
    if mode == "preview":
        os.makedirs("/tmp/prev", exist_ok=True); preview(v["scenes"], f"/tmp/prev/{v['slug']}.png"); print(v["slug"], dur); continue
    out = out_path(v, reel); os.makedirs(os.path.dirname(out), exist_ok=True)
    wav = os.path.join(tempfile.gettempdir(), f"beat-{v['slug']}.wav")
    subprocess.run(["python3", os.path.join(HERE, "beat.py"), wav, str(dur + 0.5), str(v["seed"])], check=True)
    render(v["scenes"], out, wav); os.remove(wav); print("OK", out, dur, flush=True)

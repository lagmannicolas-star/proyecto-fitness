"""Uso: python3 gen_guiones.py MODULO "Encabezado de la semana" "Línea de cambio"  >> GUIONES.md
Genera las tablas de texto en pantalla de REELS y T de un módulo de semana."""
import sys, importlib

def fmt(x): return f"{x:g}"

def row(sc):
    parts = []
    if sc["type"] in ("plan", "iso"):
        rw, rh = sc["room"]; parts.append(f"[{'planta' if sc['type'] == 'plan' else '3D'} {fmt(rw)} × {fmt(rh)} m]".replace(".", ","))
    for k in ("kicker", "pre", "text", "n", "badge", "word", "sub", "fix", "punch", "verdict", "bottom"):
        if sc.get(k) and not (k == "pre" and sc["type"] != "cta"): parts.append(str(sc[k]))
    if sc["type"] == "cards": parts.append(", ".join(f"{a} · {b}" for a, b, _ in sc["items"]))
    elif sc["type"] == "notifs": parts.append(", ".join(f"{a}: {b}" for a, b in sc["items"]))
    elif sc["type"] == "chat": parts.append(", ".join(m[1] for m in sc["msgs"]))
    elif sc["type"] in ("plan", "iso"):
        labs = []
        for it in sc["items"]:
            if it[0] and it[0] not in labs: labs.append(it[0])
        parts.append(", ".join(labs))
    elif sc.get("items"): parts.append(", ".join(sc["items"]))
    if sc["type"] == "end": parts.append("NEXO FIT · nexofitt.com.ar")
    if sc.get("note"): parts.append(f"({sc['note']})")
    return " / ".join(parts).replace(" ", " ").replace("|", "/")

def block(v, kind):
    d, h = v["date"].split("T")
    out = [f"## {d} {h[:5]} · {kind} · {v['title']}", "", "| Seg | Texto en pantalla |", "|---|---|"]
    t = 0.0
    for sc in v["scenes"]:
        out.append(f"| {fmt(round(t, 2))}–{fmt(round(t + sc['dur'], 2))} | {row(sc)} |"); t += sc["dur"]
    out += ["", "**Texto de la publicación:**", "", v["caption"], ""]
    return "\n".join(out)

if __name__ == "__main__":
    m = importlib.import_module(sys.argv[1])
    print(f"\n# {sys.argv[2]} ({sys.argv[1]}.py)\n")
    if len(sys.argv) > 3: print(sys.argv[3] + "\n")
    for v in m.REELS: print(block(v, "Reel IG + TikTok"))
    for v in m.T: print(block(v, "TikTok"))

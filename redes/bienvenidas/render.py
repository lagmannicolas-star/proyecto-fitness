import json, base64, sys, os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = "data:image/png;base64," + base64.b64encode(open(os.path.join(HERE, "logo.png"), "rb").read()).decode()

CSS = """
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;background:#10171f;overflow:hidden}
body{font-family:'Inter',sans-serif;color:#fbf9f4;position:relative}
.cond{font-family:'Inter Display','Inter',sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;transform-origin:left top;transform:scaleX(.84)}
.glow{position:absolute;right:-260px;top:520px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(165,204,33,.20),rgba(165,204,33,0) 65%)}
.stripe{position:absolute;left:0;top:0;width:14px;height:1920px;background:#a5cc21}
.logo{position:absolute;left:80px;top:150px;width:300px}
.kick{position:absolute;left:84px;top:330px;font-weight:800;font-size:30px;letter-spacing:.22em;color:#a5cc21;text-transform:uppercase}
.big{position:absolute;left:80px;top:390px;font-size:150px;line-height:.95;white-space:nowrap}
.name{position:absolute;left:80px;width:1100px;line-height:.92;color:#a5cc21;white-space:normal}
.card{position:absolute;left:80px;right:80px;border:3px solid #a5cc21;border-radius:28px;padding:38px 44px;background:rgba(255,255,255,.03)}
.card .lbl{font-size:24px;font-weight:800;letter-spacing:.2em;color:#a5cc21;text-transform:uppercase;margin-bottom:14px}
.card .rub{font-size:46px;font-weight:700;line-height:1.15}
.card .loc{font-size:34px;font-weight:500;color:#c9cfd6;margin-top:12px}
.handle{position:absolute;left:80px;display:inline-block;background:#fbf9f4;color:#10171f;font-weight:800;font-size:46px;padding:20px 40px;border-radius:999px}
.foot{position:absolute;left:80px;right:80px;bottom:150px}
.foot .q{font-size:40px;font-weight:700;line-height:1.2}
.foot .q b{color:#a5cc21}
.foot .url{margin-top:22px;display:inline-block;background:#a5cc21;color:#10171f;font-weight:800;font-size:38px;padding:16px 34px;border-radius:999px;letter-spacing:.02em}
"""

def page(body):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='stripe'></div><div class='glow'></div><img class='logo' src='{LOGO}'>{body}</body></html>"

def story(p):
    handle = f"<div class='handle' style='top:__HY__px'>{p['handle']}</div>" if p.get("handle") else ""
    body = f"""
<div class='kick'>Nuevo en la red de proveedores</div>
<div class='big cond'>Bienvenidos</div>
<div class='name cond' id='nm'>{p['nombre']}</div>
<div class='card' id='card'><div class='lbl'>Qué hacen</div><div class='rub'>{p['rubro']}</div>{f"<div class='loc'>📍 {p['ciudad']}</div>" if p.get('ciudad') else ''}</div>
{handle}
<div class='foot'><div class='q'>¿Equipás un gimnasio, club o colegio?<br><b>Pedí ofertas a toda la red.</b></div><div class='url'>nexofitt.com.ar</div></div>
"""
    return page(body)

def cover():
    body = """
<div class='kick' style='top:560px'>Red de proveedores Nexo Fit</div>
<div class='big cond' style='top:620px;font-size:165px'>Bienvenidos</div>
<div class='big cond' style='top:780px;font-size:165px;color:#a5cc21'>a la red</div>
<div style='position:absolute;left:84px;right:80px;top:1040px;font-size:44px;font-weight:600;line-height:1.3;color:#c9cfd6'>Fabricantes, importadores y comercios de equipamiento que ya reciben los pedidos de gimnasios, clubes y colegios.</div>
<div style='position:absolute;left:84px;top:1290px;font-size:40px;font-weight:800;color:#fbf9f4'>Conocelos en las próximas historias →</div>
<div class='foot'><div class='q'>¿Vendés equipamiento?<br><b>Sumate sin abono ni costo de alta.</b></div><div class='url'>nexofitt.com.ar/proveedores</div></div>
"""
    return page(body)

FIT_JS = """() => {
  const nm=document.getElementById('nm'); if(!nm) return;
  let fs=200; nm.style.top='545px';
  const maxW=920/0.84;
  nm.style.fontSize=fs+'px'; nm.style.width=maxW+'px';
  // shrink until longest word fits and at most 2 lines
  const fits=()=>{ const words=nm.textContent.split(/\\s+/); const c=document.createElement('canvas').getContext('2d');
     c.font=`900 ${fs}px 'Inter Display'`; const lw=Math.max(...words.map(w=>c.measureText(w.toUpperCase()).width*0.98));
     return lw<=maxW && nm.getBoundingClientRect().height<=fs*0.92*2+4; };
  while(!fits() && fs>70){ fs-=4; nm.style.fontSize=fs+'px'; }
  const r=nm.getBoundingClientRect(); const card=document.getElementById('card');
  card.style.top=(r.bottom+60)+'px';
  const cr=card.getBoundingClientRect(); const h=document.querySelector('.handle');
  if(h) h.style.top=(cr.bottom+50)+'px';
}"""

if __name__ == "__main__":
    data = json.load(open(sys.argv[1]))
    out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.set_content(cover()); pg.screenshot(path=f"{out}/00-portada.jpg", type="jpeg", quality=92)
        for i, p in enumerate(data, 1):
            pg.set_content(story(p).replace("__HY__", "0")); pg.evaluate(FIT_JS)
            pg.screenshot(path=f"{out}/{i:02d}-{p['slug']}.jpg", type="jpeg", quality=92)
        b.close()

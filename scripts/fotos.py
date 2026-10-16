"""Copia las fotos del catálogo público a assets/productos/ y guarda una copia del catálogo.

Lo ejecuta GitHub Actions (.github/workflows/fotos.yml). Usa solo la clave pública de Supabase,
la misma que usa la página, así que no necesita secretos.

- assets/productos/<hash>.webp : foto propia, máximo 1000 px, WebP.
- assets/productos/mapa.json    : {"url original": "assets/productos/<hash>.webp"}
- assets/productos/s/<hash>.webp: versión chica (420 px) para tarjetas y miniaturas.
- assets/productos/textos.json  : {"slug": {"d": "descripción completa", "g": ["assets/productos/…", …]}}
                                  tomado de la página del producto en la tienda del proveedor.
- tests/fixtures/live-*.json    : catálogo público y estado público, para probar la tienda con datos reales.
"""
import html as htmllib
import re
import hashlib
import io
import json
import os
import sys
import time
import urllib.request
import urllib.parse

from PIL import Image

URL = 'https://ecdaxdqvdwplhovcmnxr.supabase.co'
KEY = 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'productos')
FIX = os.path.join(ROOT, 'tests', 'fixtures')
UA = 'Mozilla/5.0 (compatible; NexoFitBot/1.0; +https://nexofitt.com.ar)'


def rpc(name):
    req = urllib.request.Request(
        URL + '/rest/v1/rpc/' + name, data=b'{}', method='POST',
        headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def get(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/*'})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001 - se reintenta y se informa
            last = e
            time.sleep(1 + attempt * 2)
    print('  no se pudo bajar', url, last, file=sys.stderr)
    return None


def save_image(url, mapa):
    """Guarda la foto en grande y en chico; devuelve la ruta propia o None."""
    name = hashlib.sha1(url.encode('utf-8')).hexdigest()[:16] + '.webp'
    dest = os.path.join(OUT, name)
    small = os.path.join(OUT, 's', name)
    if not os.path.exists(dest):
        raw = get(url)
        if not raw:
            return None
        try:
            im = Image.open(io.BytesIO(raw))
            im = im.convert('RGBA') if im.mode in ('P', 'LA') else im
            if im.mode == 'RGBA':
                bg = Image.new('RGB', im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[3])
                im = bg
            im = im.convert('RGB')
            im.thumbnail((1000, 1000), Image.LANCZOS)
            im.save(dest, 'WEBP', quality=82, method=6)
        except Exception as e:  # noqa: BLE001
            print('  foto inválida', url, e, file=sys.stderr)
            return None
    if not os.path.exists(small):
        try:
            im = Image.open(dest).convert('RGB')
            im.thumbnail((420, 420), Image.LANCZOS)
            im.save(small, 'WEBP', quality=78, method=6)
        except Exception as e:  # noqa: BLE001
            print('  miniatura inválida', url, e, file=sys.stderr)
    mapa[url] = 'assets/productos/' + name
    return mapa[url]


def page(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html'})
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.read().decode('utf-8', 'replace')
    except Exception as e:  # noqa: BLE001
        print('  página no disponible', url, e, file=sys.stderr)
        return None


def clean_text(raw):
    t = htmllib.unescape(raw or '')
    t = re.sub(r'(?i)<\s*br\s*/?>', '\n', t)
    t = re.sub(r'(?i)</\s*(p|div|li|h[1-6])\s*>', '\n', t)
    t = re.sub(r'(?i)<\s*li[^>]*>', '\n• ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = htmllib.unescape(t)
    t = t.replace('\r', '')
    t = re.sub(r'[ \t\u00a0]+', ' ', t)
    t = re.sub(r' *\n *', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    # Líneas de relleno típicas de las tiendas.
    t = '\n'.join(l for l in t.split('\n') if not re.match(r'^[-_=*·.\s]{3,}$', l))
    return t.strip()[:4000]


def read_product(html, base):
    desc = ''
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>([\s\S]*?)</script>', html, re.I):
        try:
            data = json.loads(m.group(1))
        except Exception:  # noqa: BLE001
            continue
        for d in data if isinstance(data, list) else [data]:
            if isinstance(d, dict) and d.get('@type') == 'Product' and d.get('description'):
                desc = d['description']
                break
        if desc:
            break
    if not desc:
        m = re.search(r'<div[^>]+(?:product-description|js-product-description|user-content)[^>]*>([\s\S]{20,8000}?)</div>\s*</div>', html, re.I)
        if m:
            desc = m.group(1)
    if not desc:
        m = re.search(r'<meta[^>]+(?:property|name)=["\'](?:og:)?description["\'][^>]*content=["\']([^"\']+)', html, re.I)
        desc = m.group(1) if m else ''
    gallery, seen = [], set()
    # La galería del producto está antes de los productos relacionados.
    cut = re.search(r'(?i)(js-related|related-products|productos-relacionados|productos similares|tambi[eé]n te puede interesar)', html)
    zone = html[:cut.start()] if cut else html
    for m in re.finditer(r'(?:https?:)?//[\w.-]*mitiendanube\.com/stores/[\w/]+/products/[\w.-]+?-(?:\d+)-(?:\d+)\.(?:webp|jpe?g|png)', zone):
        u = m.group(0)
        u = ('https:' + u) if u.startswith('//') else u
        key = re.sub(r'-\d+-\d+\.(webp|jpe?g|png)$', '', u)
        if key in seen:
            continue
        seen.add(key)
        gallery.append(re.sub(r'-\d+-\d+\.(webp|jpe?g|png)$', r'-1024-1024.\1', u))
        if len(gallery) >= 8:
            break
    return clean_text(desc), gallery


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FIX, exist_ok=True)
    catalog = rpc('fitness_public_catalog')
    snapshot = rpc('fitness_snapshot')
    with open(os.path.join(FIX, 'live-catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(FIX, 'live-snapshot.json'), 'w', encoding='utf-8') as f:
        json.dump(snapshot, f, ensure_ascii=False, separators=(',', ':'))

    urls = sorted({p['image'] for p in catalog if p.get('image', '').startswith('https://')})
    map_path = os.path.join(OUT, 'mapa.json')
    os.makedirs(os.path.join(OUT, 's'), exist_ok=True)
    try:
        mapa = json.load(open(map_path, encoding='utf-8'))
    except Exception:  # noqa: BLE001 - primera vez
        mapa = {}
    fallas = 0
    for url in urls:
        if not save_image(url, mapa):
            fallas += 1

    # Descripción completa y galería desde la página del producto en la tienda del proveedor.
    webs = {v.get('id'): v.get('web') for v in snapshot.get('vendors', []) if v.get('web')}
    slugs = {}
    for p in catalog:
        slug = str(p.get('key', '')).split('#')[0]
        if slug and p.get('vendorId') in webs:
            slugs.setdefault(slug, p['vendorId'])
    textos_path = os.path.join(OUT, 'textos.json')
    textos = {}
    for slug, vid in sorted(slugs.items()):
        url = urllib.parse.urljoin(webs[vid].rstrip('/') + '/', 'productos/' + urllib.parse.quote(slug) + '/')
        html = page(url)
        if not html:
            continue
        desc, gallery = read_product(html, url)
        local = [x for x in (save_image(g, mapa) for g in gallery) if x]
        if desc or local:
            textos[slug] = {'d': desc, 'g': local}
        time.sleep(0.25)
    with open(textos_path, 'w', encoding='utf-8') as f:
        json.dump(textos, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    # Solo se publican en el mapa las fotos que existen.
    mapa = {u: p for u, p in mapa.items() if os.path.exists(os.path.join(ROOT, p))}
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(mapa, f, ensure_ascii=False, indent=0, sort_keys=True)
    print(f'{len(catalog)} variantes · {len(urls)} fotos · {fallas} con error · {len(mapa)} en el mapa · {len(textos)} fichas con texto')


if __name__ == '__main__':
    main()

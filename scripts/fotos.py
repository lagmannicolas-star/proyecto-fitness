"""Copia las fotos del catálogo público a assets/productos/ y guarda una copia del catálogo.

Lo ejecuta GitHub Actions (.github/workflows/fotos.yml). Usa solo la clave pública de Supabase,
la misma que usa la página, así que no necesita secretos.

- assets/productos/<hash>.webp : foto propia, máximo 1000 px, WebP.
- assets/productos/mapa.json    : {"url original": "assets/productos/<hash>.webp"}
- tests/fixtures/live-*.json    : catálogo público y estado público, para probar la tienda con datos reales.
"""
import hashlib
import io
import json
import os
import sys
import time
import urllib.request

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
    try:
        mapa = json.load(open(map_path, encoding='utf-8'))
    except Exception:  # noqa: BLE001 - primera vez
        mapa = {}
    nuevas = fallas = 0
    for url in urls:
        name = hashlib.sha1(url.encode('utf-8')).hexdigest()[:16] + '.webp'
        dest = os.path.join(OUT, name)
        if os.path.exists(dest):
            mapa[url] = 'assets/productos/' + name
            continue
        raw = get(url)
        if not raw:
            fallas += 1
            continue
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
            fallas += 1
            continue
        mapa[url] = 'assets/productos/' + name
        nuevas += 1
    # Solo se publican en el mapa las fotos que existen.
    mapa = {u: p for u, p in mapa.items() if os.path.exists(os.path.join(ROOT, p))}
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(mapa, f, ensure_ascii=False, indent=0, sort_keys=True)
    print(f'{len(catalog)} variantes · {len(urls)} fotos · {nuevas} nuevas · {fallas} con error · {len(mapa)} en el mapa')


if __name__ == '__main__':
    main()

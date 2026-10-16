// Genera worker/texto.js con las mismas funciones de texto que usa la tienda (nicolas.html).
// Uso: node scripts/texto-worker.mjs   (tests/worker-seo.test.mjs verifica que el archivo esté al día)
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('nicolas.html', root), 'utf8');
const line = start => { const p = html.indexOf(start); if (p < 0) throw Error('No está: ' + start); return html.slice(p, html.indexOf('\n', p)); };
const a = html.indexOf('var NF_ACR='), b = html.indexOf('\n/* ---------- Fotos propias');
if (a < 0 || b < a) throw Error('No se encontró el bloque de textos');
export function build() {
  return '// Textos para mostrar, compartidos con la tienda (nicolas.html). NO editar a mano:\n'
    + '// se genera con `node scripts/texto-worker.mjs` y tests/worker-seo.test.mjs verifica que esté al día.\n'
    + line('function norm(s){') + '\n' + line('function plain(s){') + '\n' + html.slice(a, b) + '\n' + line('function catSlug(name){') + '\n'
    + 'export { norm, plain, nfText, nfProp, nfDetail, nfCategory, nfSize, catSlug, nfUnits, nfDesc, nfPairUse, NF_FAQ };\n';
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  fs.writeFileSync(new URL('worker/texto.js', root), build());
  console.log('worker/texto.js actualizado');
}

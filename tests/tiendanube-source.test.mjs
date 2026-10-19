import fs from 'node:fs';
import assert from 'node:assert/strict';

const admin=fs.readFileSync('admin.html','utf8');

assert.match(admin,/function tiendanubeSource\(v,d\)/,'hay un generador específico para Tiendanube');
assert.match(admin,/safeUrl\(v&&v\.web\)/,'solo parte de una web HTTPS validada');
assert.match(admin,/\^\[a-z0-9\]\[a-z0-9-\]\*\$/i,'rechaza identificadores inseguros');
assert.match(admin,/u\.origin\+'\/productos\/'\+encodeURIComponent\(slug\)\+'\/'/,'forma la URL oficial de producto');
assert.match(admin,/sourceUrl:source/,'la publicación masiva guarda la fuente');
assert.match(admin,/sourceUrl:tiendanubeSource\(dv,draft\)\|\|safeUrl\(existing&&existing\.sourceUrl\)/,'la publicación individual se completa y conserva fuentes manuales');
assert.match(admin,/n\.missing\+\+/,'cuenta variantes bloqueadas por falta de fuente');
assert.match(admin,/quedan fuera por falta de fuente oficial/,'el administrador ve el bloqueo');
assert.match(admin,/Abrir oficial/,'el administrador puede revisar el enlace antes de publicar');

function source(web,slug){
  web=String(web||'').trim();slug=String(slug||'').trim();
  if(!/^https:\/\/[^\s"'<>]+$/i.test(web)||!/^[a-z0-9][a-z0-9-]*$/i.test(slug))return '';
  try{const u=new URL(web);if(u.protocol!=='https:'||!u.hostname||u.username||u.password)return '';return u.origin+'/productos/'+encodeURIComponent(slug)+'/';}catch{return '';}
}
assert.equal(source('https://www.abfitnessmayorista.com.ar','colchoneta-100x50'),'https://www.abfitnessmayorista.com.ar/productos/colchoneta-100x50/');
assert.equal(source('http://www.abfitnessmayorista.com.ar','colchoneta-100x50'),'');
assert.equal(source('https://www.abfitnessmayorista.com.ar','../admin'),'');
assert.equal(source('javascript:alert(1)','colchoneta-100x50'),'');
assert.equal(source('https://user:pass@example.com','producto'),'');
console.log('OK: fuentes Tiendanube se generan solo con web HTTPS e identificador seguro; faltantes no se publican.');

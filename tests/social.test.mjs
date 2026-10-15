import fs from 'node:fs';import assert from 'node:assert/strict';
// Instagram programado: lo publica la base de datos (pg_cron), no el Worker. Acá se revisa que la semana esté completa,
// que las imágenes sean JPG públicos del sitio y que el Worker no publique por su cuenta (nunca dos publicadores).
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cola=JSON.parse(read('redes/publicar/semana-1/cola.json'));
assert.equal(cola.length,56);assert.equal(cola.filter(x=>x.kind==='historia').length,35);assert.equal(cola.filter(x=>x.kind!=='historia').length,21);
const seen=new Set();
for(const x of cola){assert(['post','carrusel','historia'].includes(x.kind));assert(x.media.length>=1&&x.media.length<=10);
 assert(!seen.has(x.scheduled_at+x.label),'repetida '+x.label);seen.add(x.scheduled_at+x.label);assert.match(x.scheduled_at,/-03:00$/,'hora de Argentina');
 for(const m of x.media){assert.match(m,/^redes\/publicar\/semana-1\/.+\.jpg$/);const b=fs.readFileSync(new URL('../'+m,import.meta.url));assert(b[0]===0xFF&&b[1]===0xD8,'JPG: '+m);assert(b.length<8e6);}
 if(x.kind==='historia')assert.equal(x.caption,'');else assert(x.caption.length>20&&x.caption.length<2200,'descripción de '+x.label);}
assert.match(read('.assetsignore'),/!redes\/publicar\/\*\*/);assert.match(read('robots.txt'),/Disallow: \/redes\//);
const w=read('worker/index.js'),cfg=read('wrangler.jsonc');assert(!/graph\.instagram|scheduled\s*\(/.test(w),'el Worker no publica en Instagram');assert(!/crons/.test(cfg));
const sql=read('supabase/migrations/20261016150000_instagram_desde_la_base.sql');
assert.match(sql,/vault\.create_secret/,'la llave se guarda cifrada');assert.match(sql,/cron\.schedule\('nexofit-instagram','\*\/5 \* \* \* \*'/);
assert.match(sql,/interval '3 hours'/);assert.match(sql,/attempts\+1>=3/);assert.match(sql,/media_type','STORIES'/);assert.match(sql,/is_carousel_item/);
const admin=read('admin.html');assert.match(admin,/fitness_social_set_token/);assert.match(admin,/type="password" aria-label="Llave de Instagram"/);
console.log('OK: Instagram programado: semana 1 completa (21 posts y 35 historias en JPG), publicación desde la base cada 5 minutos con la llave cifrada, y el Worker no publica.');

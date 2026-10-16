import fs from 'node:fs';
import assert from 'node:assert/strict';
// Cloudflare solo publica lo que .assetsignore deja pasar: toda página .html del sitio tiene que estar en la lista.
const allow = fs.readFileSync('.assetsignore', 'utf8').split('\n').filter(l => l.startsWith('!')).map(l => l.slice(1).trim());
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.html'))) assert(allow.includes(f), f + ' no se publica: falta "!' + f + '" en .assetsignore');
console.log('OK: todas las páginas se publican.');

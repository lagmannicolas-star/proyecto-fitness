// Recuperar la clave: el link vuelve a la misma página, se pide email válido y la pantalla de clave nueva
// avisa si el link venció. Los proveedores tienen "Me olvidé la clave" en su ingreso.
import fs from 'node:fs';
import assert from 'node:assert/strict';

for (const f of ['nicolas.html', 'proveedores.html', 'admin.html']) {
  const s = fs.readFileSync(f, 'utf8');
  assert.match(s, /function recover\(email\)\{email=String\(email\|\|''\)\.trim\(\);if\(!\/\^\[\^@\\s\]\+@/, f + ': valida el email');
  assert.match(s, /\/auth\/v1\/recover\?redirect_to='\+encodeURIComponent\(location\.origin\+location\.pathname\)/, f + ': vuelve a la misma página');
  assert.doesNotMatch(s, /recover\?redirect_to='\+encodeURIComponent\(new URL\('nicolas\.html'/, f);
  assert.match(s, /recovery=false,linkError='',storageKey=/, f);
  assert.match(s, /fragment\.get\('error_code'\)\|\|fragment\.get\('error'\)/, f + ': detecta link vencido');
  assert.match(s, /Creá tu clave nueva/, f);
  assert.match(s, /El link ya no sirve/, f);
  assert.match(s, /Mostrar las claves/, f);
  assert.match(s, /FC\.recoveryForm\(\);/, f);
}
const prov = fs.readFileSync('proveedores.html', 'utf8');
assert.match(prov, /data-forgot="1">Me olvidé la clave<\/button>/);
assert.match(prov, /if\(ui\.forgot\) return '[^\n]*Recuperar la clave/);
assert.match(prov, /<form id="f-forgot" class="card" novalidate>/);
assert.match(prov, /f\.id==='f-forgot'\)\{ui\.forgotEmail=val\('fg-email'\)\.trim\(\);await FC\.recover\(ui\.forgotEmail\)/);
const cat = fs.readFileSync('nicolas.html', 'utf8');
assert.match(cat, /data-t="forgot">Me olvidé la clave<\/button>/);
console.log('recuperar-clave ok');

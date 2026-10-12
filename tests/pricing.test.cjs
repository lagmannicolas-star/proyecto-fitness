const fs=require('fs'),vm=require('vm'),a=require('assert/strict');
const h=fs.readFileSync('nicolas.html','utf8');
for(const f of ['nicolas.html','admin.html','proveedores.html','index.html'])for(const m of fs.readFileSync(f,'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:f});
const c={ui:{cp:'1425',paymentMethods:{v:'transfer'}},vendor:()=>c.v};vm.createContext(c);
for(const n of ['amount','volumePct','freeShipping','shippingZoneEligible','cpOk','zone','payBenefits','payPct','validMethod','selectedMethod','quote','paymentQuote','comparisonQuote']){const s=h.indexOf('function '+n+'(');a(s>=0);let e=h.indexOf('\n}',s)+2;const l=h.indexOf('\n',s);if(h.slice(s,l).trim().endsWith('}'))e=l;vm.runInContext(h.slice(s,e),c);}
c.v={id:'v',paymentBenefits:{transfer:5,cash:10,installments:[3],stackVolume:true},freeShipping:{mode:'from',zone:'all',threshold:1700}};
const o={vendorId:'v',price:1000,shipAmba:100,shipInt:200,volumeTiers:[{qty:2,pct:10}]};
a.equal(c.paymentQuote(o,2,'1425','transfer').total,1710);a.equal(c.comparisonQuote(o,2,'1425').total,1710);
c.v.freeShipping.threshold=1750;a.equal(c.paymentQuote(o,2,'1425','transfer').total,1810);
c.v.paymentBenefits.stackVolume=false;a.equal(c.paymentQuote(o,2,'1425','transfer').subtotal,1900);
a.equal(c.paymentQuote(o,2,'1425','installments-24').paymentMethod,'card');
c.v.freeShipping={mode:'always',zone:'amba',postalCodes:['1425']};a.equal(c.paymentQuote(o,1,'1602','card').shipping,100);a.equal(c.paymentQuote(o,1,'5000','card').shipping,200);a.equal(c.paymentQuote(o,1,'1425','card').shipping,0);
const script=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];let dest;vm.runInNewContext(script,{location:{search:'?x=1',hash:'#pagar-a',replace:t=>dest=t},document:{getElementById:()=>({})}});a.equal(dest,'nicolas.html?x=1#pagar-a');
console.log('OK: sintaxis de 4 páginas; descuentos acumulados/exclusivos; comparación y checkout; envío por cobertura y umbral; método inválido; enlace de pago.');

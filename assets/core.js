(function(root){
'use strict';
var blocked={};
function money(n){return Math.round((n+Number.EPSILON)*100)/100;}
function report(message){
 if(typeof document==='undefined')return;
 var el=document.getElementById('cf-error');
 if(!el){el=document.createElement('div');el.id='cf-error';el.setAttribute('role','alert');el.style.cssText='position:fixed;bottom:20px;left:20px;right:20px;z-index:99999;background:#84202a;color:white;padding:18px;border-radius:8px;white-space:pre-wrap';document.body.appendChild(el);}
 el.textContent=message;
}
function fail(message){var e=new Error(message);e.cfHandled=true;report(message);throw e;}
function read(key){
 try{var raw=root.localStorage.getItem(key);if(raw==null)return null;var state=JSON.parse(raw);if(!state||!Array.isArray(state.vendors)||!Array.isArray(state.offers)||!Array.isArray(state.orders))throw Error('Invalid state');return state;}
 catch(e){blocked[key]=true;report('No pudimos leer los datos guardados. Conservamos el original y bloqueamos cambios para no sobrescribirlo. Recuperá una copia antes de reiniciar la demo.');return null;}
}
function write(key,value){
 if(blocked[key])fail('El guardado está bloqueado porque los datos anteriores no se pudieron leer. No se sobrescribió tu información.');
 try{root.localStorage.setItem(key,JSON.stringify(value));return true;}
 catch(e){fail('No se pudo guardar el cambio. El navegador puede estar sin espacio o bloquear el almacenamiento. No cierres esta pantalla hasta recuperar una copia de los datos.');}
}
function calculate(p){
 var o=p.offer,qty=p.qty;
 if(!Number.isInteger(qty)||qty<1)throw Error('La cantidad debe ser un entero mayor a cero.');
 if(!Number.isFinite(o.price)||o.price<=0)throw Error('El producto no tiene un precio válido.');
 var vp=(o.volumeTiers||[]).reduce(function(a,t){return qty>=t.qty?Math.max(a,t.pct):a;},0),pp=p.paymentPct||0;
 if(!Number.isFinite(vp)||vp<0||vp>=100||!Number.isFinite(pp)||pp<0||pp>=100)throw Error('El descuento no es válido.');
 var base=money(o.price*qty),discount=money(base*vp/100);
 if(pp&&p.stackVolume===false){discount=0;vp=0;}
 var paymentBase=money(base-discount),pd=money(paymentBase*pp/100),sub=money(paymentBase-pd);
 var ship=p.shipping;
 if(!Number.isFinite(ship)||ship<0)throw Error('El costo de envío no es válido.');
 return {baseSubtotal:base,discount:discount,discountPct:vp,subtotal:sub,baseShipping:ship,shipping:p.freeShipping(sub)?0:ship,total:money(sub+(p.freeShipping(sub)?0:ship)),paymentBase:paymentBase,paymentDiscount:pd,paymentPct:pp,paymentMethod:p.method||'card',volumeDiscount:discount};
}
function parseNumber(s){
 s=String(s==null?'':s).trim().replace(/[$\s]/g,'');if(!s)return null;
 if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))s=s.replace(/\./g,'').replace(',','.');
 else if(/^\d+(,\d{1,2})$/.test(s))s=s.replace(',','.');
 else if(!/^\d+(\.\d{1,2})?$/.test(s))return NaN;
 var n=Number(s);return Number.isFinite(n)?n:NaN;
}
root.CF={calculate:calculate,read:read,write:write,report:report,parseNumber:parseNumber};
if(root.addEventListener)root.addEventListener('error',function(e){if(e.error&&e.error.cfHandled)e.preventDefault();});
if(typeof module!=='undefined')module.exports=root.CF;
})(typeof window!=='undefined'?window:globalThis);

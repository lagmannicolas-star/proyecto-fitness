/* Recomendación de ofertas de Nexo Fit: ordena las ofertas según las prioridades del comprador y explica por qué gana una.
   Sin dependencias, para usarla en la página y en las pruebas. */
(function (root) {
  'use strict';
  // Peso de cada criterio según lo que el comprador dijo que le importa más.
  var PESOS = {
    // dureza: cuánto castiga cada punto porcentual de sobreprecio (con "menor costo" casi siempre gana la más barata).
    equilibrio: { costo: 0.40, plazo: 0.25, cuotas: 0.15, garantia: 0.20, dureza: 2 },
    precio: { costo: 0.70, plazo: 0.10, cuotas: 0.10, garantia: 0.10, dureza: 8 },
    rapidez: { costo: 0.30, plazo: 0.55, cuotas: 0.05, garantia: 0.10, dureza: 1.5 },
    financiacion: { costo: 0.35, plazo: 0.10, cuotas: 0.45, garantia: 0.10, dureza: 2 },
    calidad: { costo: 0.30, plazo: 0.10, cuotas: 0.10, garantia: 0.50, dureza: 1.5 }
  };
  // Plazo pedido por el comprador, llevado a días hábiles aproximados.
  var LIMITE = { urgente: 3, '7': 5, '15': 10, '30': 20, flexible: Infinity };
  var PRIO = { equilibrio: 'el mejor equilibrio', precio: 'el menor costo total', rapidez: 'la entrega más rápida', financiacion: 'la financiación', calidad: 'la calidad y la garantía' };

  var fmt = function (n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); };
  var plural = function (n, a, b) { return n + ' ' + (n === 1 ? a : b); };

  function recomendar(ofertas, prioridad, plazoPedido) {
    var W = PESOS[prioridad] || PESOS.equilibrio, limite = LIMITE[plazoPedido] == null ? Infinity : LIMITE[plazoPedido];
    var vigentes = (ofertas || []).filter(function (o) { return !o.vencida && Number(o.total) > 0; });
    var marcas = {};
    (ofertas || []).forEach(function (o) { marcas[o.id] = []; });
    if (!vigentes.length) return { mejor: null, motivo: '', marcas: marcas, puntajes: {} };

    var min = function (k) { return Math.min.apply(null, vigentes.map(function (o) { return Number(o[k]); })); };
    var max = function (k) { return Math.max.apply(null, vigentes.map(function (o) { return Number(o[k]); })); };
    var minT = min('total'), minP = min('plazo'), maxC = max('cuotas'), maxG = max('garantia');
    var puntajes = {};
    vigentes.forEach(function (o) {
      var s = W.costo * Math.pow(minT / o.total, W.dureza) + W.plazo * (minP / Math.max(1, o.plazo))
        + W.cuotas * (maxC > 0 ? o.cuotas / maxC : 1) + W.garantia * (maxG > 0 ? o.garantia / maxG : 1);
      if (o.cumple === 'parcial') s *= 0.85;
      if (o.plazo > limite) s *= 0.85;
      puntajes[o.id] = Math.round(s * 1000) / 1000;
      if (Number(o.total) === minT) marcas[o.id].push('Más barata');
      if (Number(o.plazo) === minP && vigentes.length > 1) marcas[o.id].push('Más rápida');
      if (maxC > 0 && Number(o.cuotas) === maxC && vigentes.length > 1) marcas[o.id].push('Más cuotas');
      if (maxG > 0 && Number(o.garantia) === maxG && vigentes.length > 1) marcas[o.id].push('Más garantía');
      if (o.plazo > limite) marcas[o.id].push('Llega después de lo que pediste');
      if (o.cumple === 'parcial') marcas[o.id].push('Cubre una parte');
    });
    (ofertas || []).forEach(function (o) { if (o.vencida) marcas[o.id].push('Vencida'); });

    // Gana el mayor puntaje; si empatan, la más barata.
    var mejor = vigentes.slice().sort(function (a, b) { return (puntajes[b.id] - puntajes[a.id]) || (a.total - b.total); })[0];
    var barata = vigentes.slice().sort(function (a, b) { return (a.total - b.total) || (a.plazo - b.plazo); })[0];
    var motivo;
    if (vigentes.length === 1) {
      motivo = 'Es la única oferta vigente por ahora. Revisá que el precio, el plazo y las condiciones te sirvan antes de elegirla.';
    } else {
      var ventajas = [], frente = mejor.id === barata.id ? null : barata;
      var otras = vigentes.filter(function (o) { return o.id !== mejor.id; });
      var ref = frente || otras.slice().sort(function (a, b) { return puntajes[b.id] - puntajes[a.id]; })[0];
      if (mejor.plazo < ref.plazo) ventajas.push('llega ' + plural(ref.plazo - mejor.plazo, 'día hábil', 'días hábiles') + ' antes');
      if (mejor.cuotas > ref.cuotas) ventajas.push('ofrece ' + mejor.cuotas + ' cuotas sin interés');
      if (mejor.garantia > ref.garantia) ventajas.push('tiene ' + plural(mejor.garantia - ref.garantia, 'mes', 'meses') + ' más de garantía');
      if (Number(mejor.envio) === 0 && Number(ref.envio) > 0) ventajas.push('incluye el envío');
      if (mejor.cumple === 'total' && ref.cumple === 'parcial') ventajas.push('cubre todo el pedido');
      var lista = ventajas.length > 1 ? ventajas.slice(0, -1).join(', ') + ' y ' + ventajas[ventajas.length - 1] : ventajas[0];
      if (frente) {
        var pct = Math.round((mejor.total / frente.total - 1) * 100);
        motivo = 'Cuesta ' + (pct >= 1 ? pct + '% más' : 'casi lo mismo') + ' que la Oferta ' + frente.letra + ' (' + fmt(frente.total) + ', la más barata)'
          + (lista ? ', pero ' + lista : '') + '.';
      } else {
        motivo = 'Es la de menor costo total (' + fmt(mejor.total) + ')' + (lista ? ' y además ' + lista + ' frente a la Oferta ' + ref.letra : '') + '.';
      }
      motivo += ' La elegimos porque priorizaste ' + (PRIO[prioridad] || PRIO.equilibrio) + '.';
    }
    return { mejor: mejor, motivo: motivo, marcas: marcas, puntajes: puntajes };
  }

  root.nfRecomendar = recomendar;
  if (typeof module !== 'undefined') module.exports = recomendar;
})(typeof window !== 'undefined' ? window : globalThis);

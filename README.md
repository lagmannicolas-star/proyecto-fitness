# Nexo Fit

La web reúne categorías y un carrito con productos de distintas empresas. Los pedidos, mínimos, envíos y medios de pago se organizan por proveedor.

## Archivos
- nicolas.html: compradores.
- proveedores.html: proveedores e importación de catálogos.
- admin.html: administración.
- index.html: entrada de compradores.
- assets/: logo original y fotografías reales de referencia para categorías.

Los HTML contienen sus estilos y JavaScript. Mantener los nombres, las rutas y los archivos de assets al publicar.

## Estado verificado - 13 de octubre de 2026
- Publicación del rediseño inicial confirmada en GitHub Pages.
- La API de Supabase responde a fitness_snapshot. Devuelve un proveedor y ninguna oferta publicada en la comprobación realizada.
- Arranque y navegación comprobados con respuestas simuladas: espacios, categorías, variantes, carrito, ingreso y seguimiento.
- Las fotografías originales conservan sus bytes; las miniaturas de categorías usan CSS en tonos neutros. Fuentes en assets/categories/SOURCES.md.
- El carrito reúne empresas; el checkout separa los pedidos y pagos por proveedor. No se anuncia un único pago ni un único envío.

## Pendientes para ventas reales
1. Importar, revisar y publicar productos con precios, unidades, stock, mínimos, cobertura y plazos de envío.
2. Completar una prueba con proveedor, administrador y comprador en cuentas/dispositivos separados, incluyendo reserva, cancelación y recuperación de stock.
3. Conectar y comprobar cobros, confirmación de pagos, comisiones, reembolsos y notificaciones. Mercado Pago permanece pendiente.
4. Acordar condiciones comerciales y operación de envíos, facturación, garantías y cambios con los proveedores.
5. Confirmar el dominio y los enlaces a compartir; revisar diseño móvil y accesibilidad.

## Pruebas
npm install
npm test

La suite utiliza datos de ejemplo y respuestas de API simuladas; no confirma pagos reales ni reemplaza una prueba de producción.

## Catálogo AB Fitness

`catalogo-ab.html` incluye 466 productos visibles y 724 variantes de la exportación recibida. Ofrece búsqueda, filtro por 35 categorías visibles, detalle de variantes y enlace al proveedor. Los 93 productos ocultos no se exponen. Los precios se identifican como referencia del archivo, no como oferta activa. La importación autenticada de los 865 borradores y la activación de ofertas en el carrito permanecen pendientes de acceso y validación comercial.

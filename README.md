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

`catalogo-ab.html` incluye 466 productos visibles y 724 variantes de la exportación recibida. Ofrece búsqueda, filtro por 35 categorías visibles, detalle de variantes, cantidades y botón Agregar al carrito. Los 93 productos ocultos no se exponen. Los precios se identifican como referencia del archivo, no como oferta activa. La selección de AB se guarda en el mismo carrito local, separada de las ofertas activas. Permite cambiar cantidades, quitar variantes y ver un subtotal de referencia. No se envía al pago ni a reservas sin precio/stock/condiciones confirmados. La importación autenticada de los 865 borradores y la activación de ofertas comprables siguen pendientes.

## Pedí ofertas (modelo híbrido)

- `index.html`: portada "¿Qué querés equipar?". Los links de pago, el carrito y las vueltas de Mercado Pago siguen yendo a `nicolas.html`.
- `arma-tu-espacio.html`: arma una lista sugerida y la pasa a `solicitud.html`.
- `solicitud.html`: el comprador pide ofertas y recibe un número SOL-.
- Admin → Solicitudes: red de proveedores (rubros y zonas), invitaciones con link privado y estado de cada oferta.
- Aviso automático: cada proveedor activo de la red recibe un email con su link privado cuando entra un pedido (cola de avisos, cada minuto). Requiere la llave de Resend y el remitente con dominio verificado (no @resend.dev); los pedidos abiertos que todavía no se avisaron salen solos apenas se activa.
- Ciclo de avisos al proveedor (email): pedido nuevo, confirmación al cargar o corregir su oferta, "Eligieron su oferta" al ganador, "El comprador eligió otra oferta" al resto y aviso si el pedido se cierra sin elegir. Las respuestas a los emails de Nexo Fit llegan al email del administrador.
- `oferta.html#t=<token>`: el proveedor ve el pedido sin datos del comprador y carga su oferta (precio, envío, plazo, cuotas, garantía, validez).
- `mi-solicitud.html`: el comprador ve las ofertas comparadas (sin nombres hasta elegir), la recomendación según sus prioridades (`assets/recomendar.js`) y elige una.
- Vencimientos: una solicitud abierta sin movimiento por 30 días queda vencida; una oferta vale hasta la fecha que puso el proveedor (máximo 90 días).

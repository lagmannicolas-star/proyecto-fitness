# Comparador Fitness

Demo para compradores (`nicolas.html`), proveedores (`proveedores.html`) y administración (`admin.html`). `index.html` abre la pantalla de compradores.

## Publicar esta actualización en GitHub Pages

Subir los cuatro HTML y la carpeta `assets` completa, conservando nombres y rutas. Los HTML ahora necesitan los archivos CSS/JS de esa carpeta. No subir únicamente los tres HTML. GitHub Pages debe publicar `main` desde `/ (root)`.

## Cambios del 12/10/2026

- Motor compartido de precios: mismo cálculo de descuentos y envío en comparación y checkout.
- Beneficios configurados en el proveedor compatibles con comprador y administrador.
- Validación del stock y precio actual al confirmar un pedido de prueba.
- Protección contra duplicar un mismo pedido con la misma referencia de pago.
- Grupo de carrito guardado conjuntamente: si falla antes del guardado, se restaura el estado anterior.
- Errores visibles al fallar el almacenamiento y protección de los datos corruptos.
- Importación de precios con decimales y validación de unidades enteras.
- Proveedor suspendido no accede a su panel de prueba.
- Google no simula una verificación de identidad inexistente; recuperación por email informa que no envía mensajes.
- Envío gratis AMBA requiere códigos postales exactos. Completar la cobertura antes de activar promociones.
- CSS común y JavaScript separados de las páginas.

## Verificación

Con Node.js:

```sh
node tests/regression.cjs
```

19 casos pasaron el 12/10/2026. Se ejecuta el código real en un entorno DOM simulado: comprueba cálculo, almacenamiento, generación inicial de vistas, importación, carrito y pedidos. No equivale a QA visual ni a pruebas de integración con una base de datos o Mercado Pago.

## Límites pendientes

- Datos en `localStorage`: no hay sincronización entre dispositivos.
- Credenciales y sesiones son de demostración. No representan autenticación segura del servidor.
- Pagos, conexiones Mercado Pago y devolución son simulaciones. No se mueve dinero.
- Notificaciones por email no están conectadas.
- Envíos son tarifas ingresadas, no cotización de transportistas; la clasificación general de código postal sigue siendo aproximada.
- Antes de un piloto con datos reales: backend, autenticación por roles, base de datos compartida, control transaccional de stock, respaldo y pruebas con usuarios separados.
- No cargar datos sensibles de clientes en esta demo pública.

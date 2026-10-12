# Estado de pruebas - 12 de octubre de 2026

## Resultado

19 pruebas automáticas correctas y sintaxis JavaScript correcta en cuatro scripts.

Se verificaron: generación inicial de las tres pantallas; enlaces internos; descuentos sucesivos y cuotas; consistencia comparación/checkout; cobertura de envío gratis; preservación de beneficios; persistencia al cambiar de rol en el mismo almacenamiento; agrupación del carrito; umbral de envío por proveedor; pedido idempotente; rechazo por stock insuficiente; precio actualizado al confirmar; pedido del carrito; suspensión del proveedor; importación de precios y stock; errores por falta de espacio; conservación de datos corruptos; bloqueo del ingreso Google sin integración.

La última prueba confirma expresamente que dos navegadores aislados NO comparten información. Ese problema necesita un backend: no está resuelto en esta actualización.

## No verificado

- Navegador real, revisión visual móvil y accesibilidad completa: no hay navegador de pruebas disponible en este entorno.
- Versión publicada: cambios preparados localmente; la cuenta GitHub no está conectada para publicar.
- Base de datos compartida, autenticación segura y compras concurrentes entre dispositivos: servicio no configurado.
- Mercado Pago y emails: integraciones no configuradas.

## Mercado Pago

Para el modelo del proyecto (cada proveedor cobra y el sitio recibe comisión), preparar aplicación Marketplace con Checkout Pro, credenciales protegidas en el servidor, autorización OAuth de cada proveedor, cuentas de prueba y webhook HTTPS validado.

Referencias oficiales:
- https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites
- https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/create-configuration
- https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace
- https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/payment-notifications

## Criterio para declarar el piloto listo

Un proveedor desde un dispositivo publica; administrador desde otro aprueba; comprador desde otro compara, compra y consulta pedido; pago rechazado no aprueba venta; notificación repetida no duplica pedido; dos compras concurrentes no exceden stock; roles no pueden acceder a datos de otros; respaldo recuperable; diseño verificado en móvil.

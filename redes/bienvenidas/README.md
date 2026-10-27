# Historias de bienvenida a proveedores

Una historia por cada proveedor que se suma a la red (tabla `fitness_red_proveedores` en Supabase), para la destacada "Red proveedores" de Instagram.

- `data.json`: un proveedor por línea (slug, nombre, rubro, ciudad, handle, estado, fecha).
  - estado: `pendiente_aprobacion` → Nicolás todavía no aprobó, `aprobada`, `publicada`.
  - handle: solo si está enlazado desde el sitio oficial del proveedor. Si no se encontró, va vacío y la historia sale sin @.
- Renderizar: `python3 render.py data.json historias` (genera `00-portada.jpg` y una `NN-slug.jpg` por proveedor; necesita Playwright).
- AB Fitness no lleva historia (es el proveedor de la casa).
- Nunca se publica sin la aprobación de Nicolás.
- La etiqueta que avisa al proveedor es el sticker de mención de Instagram. Se agrega a mano desde la app, en el espacio libre debajo del @. La publicación automática por API no puede poner stickers.

# Conectar Instagram para que todo se publique solo

Se hace **una sola vez** y lleva unos 20 minutos. Después, el sitio publica posts, carruseles e historias a la hora programada, sin que tengas que hacer nada.

> 🔒 Las llaves de este proceso son secretas. Pegalas solo en Cloudflare. No las mandes por chat, mail ni WhatsApp, y no las subas a GitHub.

---

## Paso 1 · Instagram como cuenta profesional
En la app de Instagram: **Perfil → ☰ → Configuración → Tipo de cuenta y herramientas → Cambiar a cuenta profesional → Empresa**.

## Paso 2 · Crear la "app" de Meta (es gratis)
1. Entrá a **developers.facebook.com** con tu cuenta de Facebook y tocá **Mis apps → Crear app**.
2. Ponele de nombre **Nexo Fit Publicador**.
3. Cuando te pregunte para qué es, elegí la opción de **Instagram** (administrar contenido y mensajes de Instagram).
4. Dentro de la app, entrá a **Instagram → Configuración de la API con inicio de sesión de Instagram**.
5. En **Generar tokens de acceso**, tocá **Agregar cuenta**, iniciá sesión con la cuenta de Instagram de Nexo Fit y aceptá los permisos. Tienen que incluir **publicar contenido** (instagram_business_content_publish).
6. Tocá **Generar token** y copiá la llave larga que aparece (empieza con "IG…").

No hace falta enviar la app a revisión: alcanza con que vos seas administrador de la app y de la cuenta.

## Paso 3 · Cargar las llaves en Cloudflare
En **dash.cloudflare.com → Workers y Pages → proyecto-fitness → Configuración → Variables y secretos → Agregar**. Elegí siempre el tipo **Secreto**.

| Nombre | Qué pegar |
|---|---|
| `IG_TOKEN` | La llave de Instagram del paso 2. |
| `SUPABASE_SERVICE_ROLE_KEY` | En **supabase.com → tu proyecto → Project Settings → API Keys**, la clave **secret** (empieza con `sb_secret_`). |
| `TOKEN_KEY` | Una clave al azar. Para crearla, abrí cualquier página en la compu, apretá **F12 → Consola**, pegá esto y apretá Enter: `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))`. Copiá el resultado, sin las comillas. |

`SUPABASE_SERVICE_ROLE_KEY` y `TOKEN_KEY` son las mismas que pide Mercado Pago: se cargan una sola vez y sirven para las dos cosas.

Guardá y esperá un minuto.

## Paso 4 · Probar
Entrá al **panel de administración → Instagram → Probar conexión**. Tiene que decir **"Conexión correcta con @tu_cuenta"**.

Listo. Desde ese momento:
- Cada 5 minutos, el sitio publica lo que ya tocaba.
- En **Panel → Instagram** ves qué salió, qué está programado y si algo falló. Cada publicación tiene el link para verla en Instagram.
- **Pausar todo** frena las publicaciones al instante. **Volver a programar** reintenta una publicación que falló.
- La llave dura 60 días y el sitio la renueva solo.

---

## Bueno saber
- **Historias sin stickers:** la API de Instagram no permite encuestas ni stickers de link. Por eso las historias dicen "Respondé con 1 o 2" y "Link en el perfil". Si algún día querés un sticker en particular, subí esa historia a mano desde la app.
- **Si la conexión tarda:** lo programado que se atrase más de 3 horas no se publica, para no llenar el perfil de golpe. Queda marcado "No salió a tiempo" y lo podés volver a programar desde el panel.
- **Máximo de Instagram:** 50 publicaciones por día por cuenta. Nosotros usamos 8.

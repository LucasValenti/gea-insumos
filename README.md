# Tienda GEA Insumos

Tienda de insumos de manicuría. HTML + CSS + JavaScript, sin build: se abre
y se edita en VS Code.

Publicada en https://gea-insumos.lucas-valenti00.workers.dev

## Cómo levantarlo

No alcanza con hacer doble clic en el HTML: los archivos `.jsx` se cargan por
red y el navegador los bloquea en `file://`. Hace falta un servidor:

```
npm install     # la primera vez
npm run dev     # levanta el sitio igual que en producción
```

Si preferís la extensión *Live Server* de VS Code, andá a `public/index.html`
y abrila con clic derecho → "Open with Live Server".

## Cómo publicar

```
npm run deploy
```

Sube el contenido de `public/` a Cloudflare. La primera vez pide autorizar la
cuenta con `npx wrangler login`.

## Archivos

Todo lo que se publica vive en `public/`. Lo de afuera es configuración.

### HTML
- `public/index.html` — armazón: carga estilos y scripts, monta la app, y
  guarda el estado general (ruta actual, carrito, búsqueda, datos del
  checkout) más las preferencias de visualización (tema, tamaño de texto,
  movimiento), que un script previo a la primera pintura estampa en
  `<html>` para que no haya destello. Acá están el header, la barra de
  tabs móvil y el panel de Tweaks.

### CSS
- `public/tienda/tienda.css` — todos los estilos de la tienda: header, hero,
  tarjetas de producto, carrito, checkout y los breakpoints responsive.
- `public/tokens/colors.css`, `typography.css`, `layout.css`, `effects.css`,
  `theme-dark.css`, `theme-papel.css` — variables del sistema de diseño GEA
  (paleta nude, el acento vino, tipografías, espaciados, sombras, temas
  oscuro y papel).
- `public/base/reset.css`, `public/base/utilities.css` — normalización y utilidades.
- `public/styles.css` — importa lo anterior.

### JavaScript
- `public/tienda/datos.js` — **JS puro**: productos, categorías, familias de
  tonos, precios, zonas y costos de envío, y la función de búsqueda. Es el
  archivo que más vas a tocar.
- `public/tienda/ui.jsx` — componentes reusables: íconos, marca, interruptor
  de tema, botones, fotos, tarjeta de producto, indicador de stock,
  acordeón, pie.
- `public/tienda/pantallas-tienda.jsx` — pantallas de inicio, catálogo,
  búsqueda y ficha de producto.
- `public/tienda/pantallas-pedido.jsx` — carrito, checkout, confirmación,
  ayuda y contacto.
- `public/tweaks-panel.jsx`, `public/ios-frame.jsx` — panel de opciones de
  diseño y marco de celular. Son de prototipado: se sacan en producción.

Los `.jsx` son JavaScript con sintaxis JSX (marcado dentro del JS), traducido
en el navegador por Babel. Podés escribir JS normal adentro: funciones,
`fetch`, `localStorage`, etc.

### Imágenes
- `public/tienda/img/` — fotos de producto y de las secciones.

## Dónde agregar cosas

| Querés… | Archivo |
| --- | --- |
| Sumar o editar un producto | `public/tienda/datos.js` (array `PRODUCTOS`) |
| Cambiar precios o envíos | `public/tienda/datos.js` (`ENVIO`, `costoEnvio`) |
| Nueva sección en el inicio | `public/tienda/pantallas-tienda.jsx` + estilos en `public/tienda/tienda.css` |
| Cambiar el carrito o el checkout | `public/tienda/pantallas-pedido.jsx` |
| Colores o tipografías | `public/tokens/colors.css`, `public/tokens/typography.css` |
| Lógica nueva (cupones, descuentos) | función en `public/tienda/datos.js`, llamada desde la pantalla |

## Estado actual

Prototipo funcional: catálogo, búsqueda, ficha, carrito con tonos y
cantidades, checkout y confirmación. El pedido se cierra por WhatsApp. **No**
hay pagos online, stock real ni backend — el carrito se guarda en
`localStorage` del navegador.

Datos pendientes de confirmar con el cliente, en `public/tienda/datos.js`
(constante `NEGOCIO`): número de WhatsApp, usuario de Instagram, ciudad y
horarios. Hoy tienen valores de relleno.

## Para pasar a producción

Dos caminos: migrar el diseño a una plataforma (Tiendanube, Shopify,
WooCommerce), o pasar estos archivos a un proyecto Vite + React con pasarela
de pago y base de datos. El CSS y los componentes se reutilizan casi tal cual
en el segundo caso.

## Herramientas de auditoría

`herramientas/` no se publica: son scripts para revisar el sitio con un
navegador de verdad (Playwright + axe-core). Necesitan el servidor de pruebas
levantado en otra terminal:

```
node herramientas/servidor.mjs        # sirve public/ en el puerto 8788
node herramientas/auditoria.mjs       # 7 variantes: anchos, temas y direcciones
node herramientas/flujo.mjs           # recorre la compra entera y audita cada pantalla
node herramientas/medidas.mjs         # texto chico y áreas táctiles menores a 44px
```

`auditoria.mjs` reescribe el bloque EDITMODE al vuelo para fijar cada variante,
así que no hace falta tocar `index.html` para probar tema oscuro o vista móvil.
Las capturas quedan en la carpeta temporal que imprime al terminar.

`parche.mjs` aplica reemplazos literales sobre un archivo y aborta si el texto
no aparece exactamente una vez, para no editar a ciegas.

# Tienda GEA Insumos

Tienda de insumos de manicuría. HTML + CSS + JavaScript, sin build: se abre
y se edita en VS Code. El catálogo vive en una base (Cloudflare D1) y lo sirve
un Worker en `/api/catalogo`.

Publicada en https://gea-insumos.lucas-valenti00.workers.dev

## Cómo levantarlo

No alcanza con hacer doble clic en el HTML: los archivos `.jsx` se cargan por
red y el navegador los bloquea en `file://`. Hace falta un servidor:

```
npm install     # la primera vez
npm run dev     # levanta el sitio igual que en producción, en el 8787
```

`npm run dev` es `wrangler dev`: levanta el Worker con su base local. Desde que
el catálogo se sirve por API, abrir el HTML suelto o con *Live Server* ya no
alcanza, porque la tienda se queda esperando datos que nadie le manda.

La primera vez hay que llenar la base local:

```
node herramientas/semilla.mjs                                   # genera db/semilla.sql
npx wrangler d1 execute gea-catalogo --local --file=db/esquema.sql
npx wrangler d1 execute gea-catalogo --local --file=db/semilla.sql
```

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
  checkout) y el tema elegido, que un script previo a la primera pintura
  estampa en `<html>` para que no haya destello. Acá están el header, la
  barra de tabs móvil y el panel de Tweaks.

### CSS
- `public/tienda/tienda.css` — todos los estilos de la tienda: header, hero,
  tarjetas de producto, carrito, checkout y los breakpoints responsive.
- `public/tokens/colors.css`, `typography.css`, `layout.css`, `effects.css`,
  `theme-dark.css` — variables del sistema de diseño GEA (paleta nude, el
  acento vino, tipografías, espaciados, sombras, tema oscuro).
- `public/base/reset.css`, `public/base/utilities.css` — normalización y utilidades.
- `public/styles.css` — importa lo anterior.

## El panel

En `/admin`. Se entra con una contraseña y sirve para cargar stock, precios,
los datos del negocio y las tarifas de envío sin tocar código.

La contraseña y la clave de firma viven como secretos de Cloudflare, nunca en
el repositorio. Para cambiarlas:

```
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESION_SECRETO
```

Para desarrollo local, los mismos nombres van en `.dev.vars`, que está en
`.gitignore`.

Cómo funciona el acceso: al entrar, el servidor devuelve una cookie firmada que
solo guarda hasta cuándo vale, nunca la contraseña. Va `HttpOnly` (ningún
script la puede leer), `Secure` y `SameSite=Strict` (no viaja desde otro
sitio). Los intentos fallidos se cuentan por IP en la base y después de ocho
se frena quince minutos; va en la base y no en memoria porque cada pedido
puede caer en otra instancia del Worker.

`herramientas/panel-seguridad.mjs` comprueba todo eso, incluido que sin sesión
no se pueda escribir nada:

```
node herramientas/panel-seguridad.mjs                          # contra el dev local
node herramientas/panel-seguridad.mjs https://gea-insumos...   # contra producción
```

### La base y la API
- `src/index.js` — el Worker. Atiende `/api/catalogo`, las rutas del panel y le
  pasa todo lo demás al sitio estático.
- `src/auth.js` — sesión firmada, comparaciones de tiempo constante y freno a
  la fuerza bruta.
- `src/admin.js` — rutas de escritura. Los campos que se pueden escribir están
  enumerados uno por uno: sin esa lista, un pedido armado a mano podría tocar
  cualquier columna.
- `public/admin/` — la pantalla del panel.
- `db/esquema.sql` — las tablas: productos, tonos, categorías, familias, zonas
  de envío y datos del negocio.
- `db/semilla.sql` — la carga inicial. **Generado**, no se edita a mano.
- `db/catalogo-inicial.js` — el catálogo tal como estaba escrito a mano antes
  de mudarlo a la base. Queda congelado como origen de la carga inicial.

Dos cosas se calculan al servir y no se guardan, para que no haya dos números
diciendo cosas distintas: el stock de un producto con tonos (es la suma de sus
tonos) y el precio anterior de un kit (sale de sumar sus componentes, y solo si
comprarlo suelto sale más caro).

### JavaScript
- `public/tienda/datos.js` — ya no tiene datos: pide el catálogo a la API y lo
  deja a mano, con las mismas funciones de lectura de siempre (`prod`,
  `buscar`, `stockDe`, `costoEnvio`). Ojo al editarlo: las pantallas capturan
  `window.T` una sola vez, así que los contenedores se llenan, nunca se
  reemplazan.
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
- `public/tienda/img/` — fotos de producto y de las secciones. Se publican en
  `.webp`; los `.jpg` de al lado son los originales y no se suben (los excluye
  `public/.assetsignore`). Para preparar fotos nuevas:

  ```
  node herramientas/imagenes.mjs
  ```

  Convierte a WebP, las achica a 1100 px de ancho como mucho y regenera
  `medidas.js`, que es de donde cada `<img>` saca su `width` y `height` para
  que la página no salte al cargar.

## Dónde agregar cosas

| Querés… | Archivo |
| --- | --- |
| Cambiar stock o precios | el panel, en `/admin` |
| Cargar WhatsApp, ciudad y horarios | el panel, solapa "Datos del negocio" |
| Cambiar tarifas de envío | el panel, solapa "Envíos" |
| Sumar un producto nuevo | por ahora, SQL contra la base |
| Nueva sección en el inicio | `public/tienda/pantallas-tienda.jsx` + estilos en `public/tienda/tienda.css` |
| Cambiar el carrito o el checkout | `public/tienda/pantallas-pedido.jsx` |
| Colores o tipografías | `public/tokens/colors.css`, `public/tokens/typography.css` |
| Lógica nueva (cupones, descuentos) | función en `public/tienda/datos.js`, llamada desde la pantalla |

## Estado actual

Prototipo funcional: catálogo, búsqueda, ficha, carrito con tonos y
cantidades, checkout y confirmación. El pedido se cierra por WhatsApp. **No**
hay pagos online ni stock que se descuente solo. El catálogo ya sale de una
base; el carrito se guarda en `localStorage` del navegador.

Datos pendientes de cargar desde el panel: número de WhatsApp, usuario de
Instagram, ciudad y horarios. Hoy siguen con valores de relleno, y hasta que
se cargue el WhatsApp real los pedidos no le llegan a nadie. El panel lo avisa
en rojo al entrar.

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

`comparar-catalogo.mjs` contrasta lo que devuelve la API contra el catálogo
original, campo por campo. Es la prueba de que mudar los datos a la base no le
cambió nada al que mira la tienda:

```
node herramientas/comparar-catalogo.mjs                          # contra el dev local
node herramientas/comparar-catalogo.mjs https://gea-insumos...   # contra producción
```

Las demás herramientas apuntan al `wrangler dev` del 8787. Para auditar
producción, `GEA_URL=https://gea-insumos.lucas-valenti00.workers.dev/`.

`parche.mjs` aplica reemplazos literales sobre un archivo y aborta si el texto
no aparece exactamente una vez, para no editar a ciegas.

`imagenes.mjs` prepara las fotos (ver arriba). Se corre a mano cuando entran
fotos nuevas, no en cada build.

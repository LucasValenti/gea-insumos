# Tienda GEA Insumos

Tienda de insumos de manicuría. HTML + CSS + JavaScript, sin empaquetador ni
framework de proyecto: React entra por CDN y cada archivo se cuelga de `window`.
Lo único que se compila es el JSX, y de eso se encarga `npm run dev` mientras
trabajás. El catálogo vive en una base (Cloudflare D1) y lo sirve un Worker en
`/api/catalogo`.

Publicada en https://gea-insumos.lucas-valenti00.workers.dev

## Cómo levantarlo

No alcanza con hacer doble clic en el HTML: los archivos `.jsx` se cargan por
red y el navegador los bloquea en `file://`. Hace falta un servidor:

```
npm install     # la primera vez
npm run dev     # levanta el sitio igual que en producción, en el 8787
```

`npm run dev` hace tres cosas en una terminal: compila el JSX, se queda mirando
los archivos para recompilar al guardar, y levanta `wrangler dev` con la base
local. Se edita y se refresca el navegador, igual que siempre. Desde que el
catálogo se sirve por API, abrir el HTML suelto o con *Live Server* ya no
alcanza, porque la tienda se queda esperando datos que nadie le manda.

Si preferís las dos cosas por separado: `npm run mirar` deja el compilador
mirando, y `npx wrangler dev` levanta el sitio. `npm run build` compila una vez
y se va.

La primera vez hay que llenar la base local:

```
npm run semilla                                                 # genera db/semilla.sql
npx wrangler d1 execute gea-catalogo --local --file=db/esquema.sql
npx wrangler d1 execute gea-catalogo --local --file=db/semilla.sql
```

## Cómo publicar

```
npm run deploy
```

Compila el JSX y sube el contenido de `public/` a Cloudflare. La primera vez pide
autorizar la cuenta con `npx wrangler login`. Los `.jsx` no se publican: los
excluye `public/.assetsignore`, porque lo que el navegador lee es el `.js`.

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

En `/admin`. Se entra con una contraseña y sirve para ver los pedidos que
entran, cargar stock y precios, y completar los datos del negocio y las
tarifas de envío sin tocar código.

**Pedidos.** Cada pedido queda registrado antes de que se abra WhatsApp, con
número correlativo de verdad. En el panel se confirma o se cancela:

- **Confirmar** descuenta el stock de cada línea, todo en una sola operación:
  o se descuenta entero y el pedido queda confirmado, o no pasa nada. Un
  descuento a medias dejaría el stock mintiendo.
- **Cancelar** no toca el stock.
- Un pedido solo se puede cerrar una vez. Sin esa condición, tocar dos veces
  "confirmar" descontaría el doble.

Los precios de un pedido los pone el servidor, no el navegador: lo que llega
del cliente son ids, tonos y cantidades. Confiar en el precio que manda el
navegador sería dejar que cualquiera arme un pedido de cien mil pesos por dos
mil cambiando un número en la consola.

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
npm run panel:seguridad                                        # contra el dev local
npm run panel:seguridad -- https://gea-insumos...              # contra producción
```

`herramientas/pedidos-prueba.mjs` recorre un pedido de punta a punta: que quede
registrado, que confirmarlo descuente el stock exacto, que cancelarlo no lo
toque, que no se pueda cerrar dos veces y que los precios los ponga el
servidor. Deja el stock como estaba al terminar.

### La base y la API
- `src/index.js` — el Worker. Atiende `/api/catalogo`, las rutas del panel y le
  pasa todo lo demás al sitio estático.
- `src/auth.js` — sesión firmada, comparaciones de tiempo constante y freno a
  la fuerza bruta.
- `src/admin.js` — rutas de escritura. Los campos que se pueden escribir están
  enumerados uno por uno: sin esa lista, un pedido armado a mano podría tocar
  cualquier columna.
- `src/pedidos.js` — alta de pedidos y cierre con descuento de stock.
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

- `public/app.jsx` — la aplicación: estado general (ruta, carrito, búsqueda,
  datos del checkout, tema) y el armado de cada pantalla. Vivía adentro de
  `index.html`; salió de ahí cuando el JSX pasó a compilarse.

Los `.jsx` son JavaScript con sintaxis JSX (marcado dentro del JS). Podés
escribir JS normal adentro: funciones, `fetch`, `localStorage`, etc.

Cada uno deja su `.js` hermano, que es lo que carga el navegador y **no se
edita**: lo sobrescribe el build. Están en `.gitignore`. Hasta acá el JSX lo
traducía `@babel/standalone` en el teléfono de cada visitante, en cada visita:
3 MB —el 91 % de todo el JavaScript de la página— para traducir 113 KB, y todo
en el hilo principal antes de que se viera un producto. Ahora lo traduce
`herramientas/compilar.mjs` una vez, acá.

### Imágenes
- `public/tienda/img/` — fotos de producto y de las secciones. Se publican en
  `.webp`; los `.jpg` de al lado son los originales y no se suben (los excluye
  `public/.assetsignore`). Para preparar fotos nuevas:

  ```
  npm run imagenes
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
| Ver los pedidos que entran | el panel, solapa "Pedidos" |
| Sumar un producto nuevo | por ahora, SQL contra la base |
| Nueva sección en el inicio | `public/tienda/pantallas-tienda.jsx` + estilos en `public/tienda/tienda.css` |
| Cambiar el carrito o el checkout | `public/tienda/pantallas-pedido.jsx` |
| Colores o tipografías | `public/tokens/colors.css`, `public/tokens/typography.css` |
| Lógica nueva (cupones, descuentos) | función en `public/tienda/datos.js`, llamada desde la pantalla |

## Estado actual

Prototipo funcional: catálogo, búsqueda, ficha, carrito con tonos y
cantidades, checkout y confirmación. El pedido se cierra por WhatsApp. **No**
hay pagos online: el pedido se cierra por WhatsApp. El catálogo sale de una
base, los pedidos quedan registrados y el stock baja al confirmarlos desde el
panel. El carrito y el pedido habitual de cada cliente se guardan en el
`localStorage` de su navegador.

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
navegador de verdad (Playwright + axe-core). Cada uno tiene su `npm run`, así
que `npm run` a secas lista todo lo que hay:

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Compila el JSX una vez |
| `npm run mirar` | Lo mismo, pero se queda mirando los archivos |
| `npm run servidor` | Sirve `public/` en el 8788, para lo que no necesita la API |
| `npm run semilla` | Genera `db/semilla.sql` a partir de `datos.js` |
| `npm run imagenes` | Convierte las fotos a WebP y regenera `medidas.js` |
| `npm run audita` | 7 variantes: anchos, temas y direcciones |
| `npm run audita:medidas` | Texto chico y áreas táctiles menores a 44 px |
| `npm run audita:formas` | Que ningún botón tenga esquinas cuadradas |
| `npm run audita:responsive` | Barrido de anchos y temas, en la tienda y en el panel |
| `npm run audita:rendimiento` | Tiempos de montaje y peso de cada recurso |
| `npm run audita:revelado` | Que nada quede invisible después de pasarle por encima |
| `npm run audita:jsx` | Que el JSX del sitio compile |
| `npm run audita:lighthouse` | LCP, TBT y CLS con freno de CPU y de red, como los mide Google |
| `npm run flujo` | Recorre la compra entera y audita cada pantalla |
| `npm run flujo:movil` | Lo mismo en un viewport de celular con táctil |
| `npm run flujo:recorrido` | Baja por toda la página y deja capturas |
| `npm run panel:ficha` | La ficha de producto del panel, como se usa en un celular |
| `npm run panel:seguridad` | Que el panel no se pueda usar sin entrar |
| `npm run api:catalogo` | Alta, edición y baja de productos y tonos contra la API |
| `npm run api:pedidos` | Un pedido de punta a punta, con el stock como estaba al terminar |
| `npm run api:seguridad` | Repaso de seguridad y robustez de la API |
| `npm run api:comparar` | La API contra el catálogo original, campo por campo |

`api:comparar` es la prueba de que mudar los datos a la base no le cambió nada
al que mira la tienda: contrasta campo por campo lo que devuelve `/api/catalogo`
contra el `datos.js` de antes de la mudanza.

`herramientas/parche.mjs` no está en la tabla porque no es un comando: es una
librería que usan los otros scripts para aplicar reemplazos literales sobre un
archivo, abortando si el texto no aparece exactamente una vez.

### Contra qué corren

Casi todas apuntan al `wrangler dev` del 8787, así que hace falta `npm run dev`
en otra terminal. Las excepciones son `semilla`, `imagenes` y `audita:jsx`, que
no abren el navegador, y `servidor`, que es el servidor de pruebas.

Para auditar producción hay dos formas, según el script:

```
GEA_URL=https://gea-insumos.lucas-valenti00.workers.dev/ npm run audita
npm run api:comparar -- https://gea-insumos.lucas-valenti00.workers.dev/
```

El `--` es de npm: separa los argumentos del script de los suyos propios.

`audita` reescribe el bloque EDITMODE al vuelo para fijar cada variante, así
que no hace falta tocar `index.html` para probar tema oscuro o vista móvil.
Las capturas y el informe van a la carpeta temporal del sistema, que el script
imprime al terminar; se puede fijar otra con `GEA_OUT`.

`imagenes` se corre a mano cuando entran fotos nuevas, no en cada publicación.

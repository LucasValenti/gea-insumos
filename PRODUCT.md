# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Quien compra: la consumidora final.** Compra artículos de belleza para ella
—no para revender ni para abastecer un gabinete profesional—. Entra desde el
celular. Confirmado el 11/09/2026; corrige la lectura anterior del proyecto,
que lo trataba como venta de insumos de manicuría a profesionales.

**Quien administra: la dueña del negocio**, clienta de Lucas y única usuaria
del panel en `/admin`. Carga stock y precios, mira los pedidos que entran,
confirma o cancela, y completa los datos del negocio y las tarifas de envío.
No toca código y no debería necesitar hacerlo nunca.

Resto de la etapa anterior: el formulario de pedido todavía guarda un campo
`gabinete`. Con el público confirmado como consumidora final, ese campo sobra:
hay que sacarlo o volverlo opcional.

## Product Purpose

Vender artículos de belleza al público con el precio y el stock publicados, y
que el pedido entre registrado y numerado sin que nadie tenga que preguntar
nada por mensaje.

Éxito: la compradora arma el pedido sola y lo manda; la dueña lo confirma desde
el panel y el stock se descuenta solo. La conversación por WhatsApp arranca con
el pedido ya hecho, no para averiguar precio o disponibilidad.

## Positioning

**Precio y stock a la vista.** El competidor real no es otra tienda en línea:
es la venta por Instagram y por DM, donde hay que preguntar "¿precio?" y
enterarse tarde de que no había stock.

GEA publica los dos, y son de verdad: el stock se descuenta al confirmar el
pedido, en una sola operación que pasa entera o no pasa; los precios los fija
el servidor y del navegador solo llegan ids, tonos y cantidades.

## Operating Context

- Se compra desde el celular.
- El pedido se registra en la base con número correlativo **antes** de abrir
  WhatsApp. La conversación es el cierre, no el pedido.
- El pago ocurre fuera del sitio: no hay pasarela.
- Envío: la compradora pone un pin en el mapa y ve el costo en el momento.
  Adentro del polígono no paga; afuera paga según el tramo de distancia, medida
  en línea recta. El punto de origen es el domicilio de la dueña y nunca sale
  del servidor.
- La dueña entra al panel con contraseña; la sesión es una cookie firmada y los
  intentos fallidos se frenan por IP.
- Publicado en Cloudflare Workers; el catálogo vive en D1.

## Capabilities and Constraints

**Confirmado y funcionando**

- Catálogo con categorías, subcategorías, productos, tonos, familias de color y
  kits. El stock de un producto con tonos es la suma de sus tonos, calculado al
  servir y no guardado.
- Pedidos: alta, confirmar (descuenta stock, todo o nada) y cancelar. Un pedido
  se cierra una sola vez.
- Datos del negocio editables desde el panel: WhatsApp, Instagram, saludo,
  mínimo de compra, ciudad, horarios, envío gratis desde, zonas y tramos.
- Sin empaquetador ni framework de proyecto: React entra por CDN y el JSX lo
  compila una herramienta propia antes de publicar.

**Decisiones tomadas el 11/09/2026 sobre lo que ya existe**

- **El cierre del pedido se queda como está:** un botón que abre WhatsApp con
  el pedido ya armado, igual que viene funcionando. No se rediseña ese cierre.
  Más adelante puede entrar pago en línea, pero eso se decide cuando pase: el
  checkout no debe darse por cerrado en ninguna de las dos puntas.
- **Las siete categorías cargadas son el punto de partida y se quedan:**
  esmaltes semis, esmaltes tradicionales, construcción de uñas, decoración de
  uñas, herramientas y equipos, preparación y removedores, y kits por servicio,
  con 19 subcategorías. Lo que falta es que la dueña pueda **editarlas desde el
  panel como quiera** —crear, renombrar, reordenar, borrar—, porque el catálogo
  va a crecer hacia belleza en general. El diseño no puede fijar nombres ni
  cantidad: los va a cambiar ella.

**Pendiente de código, decidido como producto**

- El panel todavía **no permite editar categorías**: `src/admin.js` escribe
  productos, tonos, config y zonas, y las categorías solo se leen. Poder
  editarlas es requisito confirmado; falta esa función.
- Ciudad, horarios, WhatsApp real e Instagram real siguen sin cargar; los
  valores en la base son de ejemplo.

## Brand Commitments

- Nombre: **GEA Insumos**. Rubro publicado: "Insumos de belleza".
- Logo tipográfico: "GEA" en Playfair Display e "INSUMOS" en Inter, separados
  por un filete fino. Ambas fuentes son libres, así que el logo se reconstruye
  con texto; no hace falta el vectorial.
- Paleta cerrada con el cliente: negro `#111111`, blanco `#FFFFFF`, nude
  `#E2C2B9`, más el acento vino del sistema de tokens.
- **Regla dura: el nude es fondo, nunca tinta.** Nude sobre blanco da 1,7:1 y
  es ilegible; negro sobre nude da 11,4:1. Para texto rosado se usa el derivado
  `#8A5C4E` (5,6:1). El "INSUMOS" blanco sobre nude vale solo dentro del logo.
- Descartado por engañoso, y no se vuelve atrás: relojes de cuenta regresiva,
  precios tachados inventados y avisos de "quedan 2 unidades" que no son reales.

## Evidence on Hand

- 34 productos de ejemplo en `db/semilla.sql`, marcados como tales. **No son el
  catálogo real.**
- **No hay fotos de producto todavía.** En venta al público la foto es el
  producto, así que sigue siendo el mayor riesgo. **Las sube la dueña desde el
  panel**, de a una (confirmado el 11/09/2026), así que el catálogo va a estar
  **mezclado** durante un buen rato: algunos productos con foto y otros sin. El
  diseño tiene que sostener ese estado intermedio, no solo los dos extremos. No
  inventar fotos, no describir productos que no existen, no dar por hecho un
  catálogo que todavía no está.
- Sin testimonios, sin métricas de venta, sin prensa, sin casos. No fabricar
  ninguno.
- Verificación propia ya escrita: `npm run audita`, `audita:lighthouse`,
  `audita:responsive`, `panel:seguridad`, `api:pedidos`.
- Sitio publicado: https://gea-insumos.kusak.workers.dev

## Product Principles

1. **El precio y el stock que se ven son los de verdad.** Nada en la tienda
   puede obligar a preguntar por mensaje lo que debería estar publicado.
2. **El catálogo es dato, no código.** La dueña define categorías y productos;
   el diseño tiene que aguantar cualquier cantidad y cualquier rubro, incluido
   el catálogo casi vacío de los primeros días.
3. **Se compra del celular.** Lo que no funciona con un pulgar no funciona.
4. **Nada de urgencia fabricada.** La confianza es el activo; una tienda nueva
   sin fotos ni reputación no puede permitirse un truco.
5. **La dueña se maneja sola.** Si un cambio del negocio necesita que Lucas
   toque código, está mal resuelto.

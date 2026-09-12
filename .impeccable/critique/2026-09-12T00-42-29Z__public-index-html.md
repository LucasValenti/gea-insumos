---
target: la tienda
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Lucas\\proyectos\\gea-insumos\\public\\index.html"
target_fingerprint: "sha256:be1b6bdf955df15ed5fd51a89d586da403374c2a9e9c9e9c9694089c66622a27"
target_path: "C:\\Users\\Lucas\\proyectos\\gea-insumos\\public\\index.html"
timestamp: 2026-09-12T00-42-29Z
slug: public-index-html
---
Method: dual-agent (A: design review · B: detector + navegador)

## Design Health Score

| # | Heurística | Antes | Ahora | Hallazgo clave |
|---|---|---|---|---|
| 1 | Visibilidad del estado | 3 | 2 | El veredicto del mapa se dibuja debajo de la barra fija: no se ve el resultado de lo que se acaba de tocar. |
| 2 | Mundo real | 2 | 3 | Se fue el vocabulario de mayorista. Quedan "1 unidades" y "Otros de herramientas y equipos". |
| 3 | Control y libertad | 3 | 3 | Refrescar en el checkout devuelve a la portada: no tiene dirección propia. |
| 4 | Consistencia | 2 | 2 | El mismo círculo de 42px en la misma esquina hace tres cosas: agrega, navega, o abre WhatsApp. |
| 5 | Prevención de errores | 2 | 1 | Marcar el pin borraba el nombre y el WhatsApp ya tipeados. |
| 6 | Reconocer vs recordar | 3 | 3 | El medio de pago queda tapado por la barra fija, y viene preseleccionado. |
| 7 | Flexibilidad | 3 | 3 | No hay forma de agregar un producto con tonos sin entrar a la ficha. |
| 8 | Estética y minimalismo | 2 | 3 | Lo mejor del sitio. El inicio sigue midiendo 6.362px en celular. |
| 9 | Recuperarse de errores | 3 | 1 | Cero mensajes por campo: todo se agrupa en una frase al pie que no lleva a ningún lado. |
| 10 | Ayuda y documentación | 1 | 4 | "Cómo comprar" en 4 pasos + FAQ en acordeón. Excelente de verdad. |
| **Total** | | **24/40** | **25/40** | **Aceptable** |

Subieron cuatro heurísticas por el trabajo del día y bajaron dos por regresiones introducidas en esas mismas pasadas.

## Design Specificity Verdict

Compuesto para este producto en la voz y en las piezas que sostienen la promesa; el esqueleto es de catálogo; y donde el producto es más raro —el catálogo mezclado sin fotos— el diseño no tiene respuesta propia.

Propio: el titular como acusación al DM, el indicador de stock viajando por cinco pantallas, la confirmación que muestra el mensaje literal antes de mandarlo, "No puedo marcar el mapa" como salida con nombre, los tres tildes que discuten contra Instagram.

De catálogo: la secuencia del inicio (hero, destacados, banda, categorías, kits, pie) es el orden de Dawn.

Escaneo determinístico: de 165 hallazgos a 25. La regla de tipografía pasó de 105 a 6, y la mitad de esos 6 son falsos positivos (los clamp() que DESIGN.md documenta). Quedan 10 colores a mano y 3 radios.

El pase en navegador subió: 164 a 188 entre las tres vistas. La escala arregló lo escrito, no lo renderizado. El piso del sistema (.55rem = 8,8px) está por debajo de lo que el detector considera legible, y cada etiqueta nueva cae ahí: los "Quedan N" de los tonos, la ayuda de los campos que salió del label. Son 151 textos chicos medidos sobre render.

Dos hallazgos del navegador que valen: el detector se detecta a sí mismo (dark-glow con #ffba00, el color de su propio banner), y el control de zoom de Leaflet tapa el 83% de la pestaña "Inicio" en el checkout.

## What's Working

1. La pantalla de confirmación con el mensaje literal a la vista y el número de pedido ya asignado. Convierte el salto de fe del cierre por WhatsApp en un trámite.
2. El indicador de stock resuelto una sola vez y usado en tarjeta, ficha, tono, carrito y cross-sell.
3. El revelado progresivo del bloque de entrega: "Retiro en el local" retira mapa, dirección y localidad; "No puedo marcar el mapa" trae las zonas con precio y plazo.

## Priority Issues

### [P1] Marcar el pin borraba el nombre y el WhatsApp — RESUELTO

El handler del clic de Leaflet se registra una sola vez, así que {...datos} escribía una copia del estado capturada al montar el mapa. Pasó a la forma de función. Verificado en navegador: los campos sobreviven y el botón se habilita.

### [P1] El pedido por zona no llegaba al servidor — RESUELTO

La salida por zona se abrió en la tienda sin tocar el servidor, que tenía su propia guarda: con mapa cargado y sin pin, rechazaba. El botón se habilitaba, se llenaba todo, y el servidor contestaba "Marcá en el mapa". Peor que el callejón original, porque fallaba al final. El servidor acepta ahora la misma regla que la tienda: pin o zona, nunca las dos.

### [P1] El envío se cotizaba distinto en cada pantalla — RESUELTO

Resumen "$3.500 / $100.000" contra mensaje de WhatsApp "A COTIZAR / $96.500 + envío a cotizar". Causa: Number(null) da 0 y Number.isFinite(0) da true, así que lat:null llegaba como un pin válido en (0,0). El punto caía fuera de la zona y de todos los tramos. Verificado de punta a punta: los tres lugares dicen $3.500 y $100.000.

### [P2] La pared rosa: el estado intermedio del catálogo no está diseñado

25 de 34 sin foto. La placa escribe el nombre del producto en versales rosas arriba del mismo nombre en negro: repite un dato que ya está. Y el cuadrado de color liso, sin una palabra adentro, se lee como una imagen que no cargó.

Fix: mostrar el dato que la tarjeta esconde (contenido, rinde, cuántos tonos), y ordenar el catálogo poniendo primero lo que tiene foto. Lo segundo cambia la primera impresión sin tocar una línea de diseño.

Comando sugerido: /impeccable distill

### [P2] El checkout en celular: 29% de la pantalla es barra fija

245px de 844 entre barra superior, barra de acción y pestañas. En esa franja quedan el veredicto del mapa y el medio de pago, que además viene con Mercado Pago preseleccionado. Los errores se acumulan en una frase al pie, sin anclas por campo.

Fix: al soltar el pin, scrollear el veredicto y anunciarlo con role="status"; mensaje por campo con aria-invalid; ningún medio de pago preseleccionado hasta que la sección se haya visto.

Comando sugerido: /impeccable harden

### [P2] El pie completo del sitio y las 5 pestañas viven dentro del checkout

El enlace de WhatsApp del pie abre un chat vacío: tocarlo a mitad del pedido lleva exactamente al DM sin precio que la tienda vino a reemplazar, con el pedido sin mandar.

Fix: checkout sin pie y sin pestañas, con barra mínima y una salida explícita.

Comando sugerido: /impeccable distill

## Persona Red Flags

Casey (celular, una mano): "Quitar" mide 46x24px, no está en la lista de agrandado táctil, está a 8px del "+" y no tiene deshacer. En la ficha 198px de 844 son barras fijas; en el checkout 245. El círculo de 42px del pie de la tarjeta hace tres cosas distintas según el producto.

Jordan (primera vez): la primera pantalla del catálogo en escritorio tiene dos cuadrados de color liso seguidos que se leen como imágenes rotas. Llega al checkout y lo primero que lee es una lista de cinco reproches sobre un botón gris. Mercado Pago viene preseleccionado y tapado.

Riley (bordes): con catálogo vacío la portada imprime "VER LOS 0" y el catálogo dice "No hay productos con esos filtros" sin filtros puestos. Refrescar en el checkout devuelve al hero: no tiene dirección propia. Volver de una ficha restaura el scroll cuatro filas más arriba.

Sam (teclado y lector): el recorrido de tabulación entra al mapa y sale del sitio por los enlaces "Leaflet" y "OpenStreetMap". El mapa se anuncia como "Tocá para marcar tu ubicación" a quien no toca, y no hay forma con teclado de poner el pin; la salida existe pero nada la conecta con quien la necesita. Ningún campo tiene mensaje propio ni aria-invalid.

## Minor Observations

- "Pedido 260911-0051 · 1 unidades": plural sin concordancia en el momento más cuidado del sitio.
- Los semipermanentes están cargados en la categoría "Herramientas y equipos"; la categoría "Esmaltes semis" queda oculta por vacía y nada avisa que la categoría insignia se cayó del menú. Es dato del catálogo de ejemplo.
- El vino en una sola pantalla de la ficha: cinta de descuento, precio tachado y seis "Quedan N". La Regla de los Tres Gritos se cumple de nombre, pero en pantalla el acento ya es textura.
- El stepper del carrito mide 40px donde el sistema declara 44.
- Durante la carga la marca aparece dos veces.
- El control de zoom de Leaflet tapa el 83% de la pestaña "Inicio" en el checkout.
- La barra "Envío sin cargo desde $120.000" ocupa el primer renglón de todas las pantallas, incluido el checkout.
- Cambiar de pestaña resetea el scroll al tope.

## Questions to Consider

1. Si la foto es el producto y la dueña las sube de a una, ¿por qué el catálogo ordena por relevancia y no pone adelante lo que tiene foto?
2. La placa escribe el nombre del producto arriba del mismo nombre en negro. ¿Qué dice ese cuadrado que la tarjeta no dijera ya?
3. El sitio promete "sin preguntar cuánto sale", y el camino principal del envío responde "lo cotizamos por WhatsApp" cuando caés afuera, mientras el desvío para quien no puede usar el mapa sí da precio y plazo. ¿Por qué el camino que la interfaz recomienda es el que menos responde?
4. Si el pedido se guarda con número antes de abrir WhatsApp, ¿por qué el checkout no tiene dirección propia?
5. El indicador de stock está resuelto como componente de sistema. ¿Por qué la otra mitad de la promesa —el precio del envío— no tiene un componente equivalente que diga siempre lo mismo en el resumen, en el botón y en el mensaje?

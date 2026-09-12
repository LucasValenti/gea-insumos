---
target: la tienda
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\Lucas\\proyectos\\gea-insumos\\public\\index.html"
target_fingerprint: "sha256:f0e1ee34608b56e658bca67ec40b23e890133dd7c62c9beeb8bfc363353240a0"
target_path: "C:\\Users\\Lucas\\proyectos\\gea-insumos\\public\\index.html"
timestamp: 2026-09-11T18-40-27Z
slug: public-index-html
closed: true
---
Method: dual-agent (A: design review · B: detector + navegador)

## Design Health Score

| # | Heurística | Nota | Hallazgo clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | El indicador `1 · DATOS — 2 · ENVÍO — 3 · PAGO` está escrito a mano en el paso 1 y nunca avanza. |
| 2 | Correspondencia con el mundo real | 2 | "gabinete", "proveedor", "jornada", "bonificación por cantidad", "remito": vocabulario de otro comprador. |
| 3 | Control y libertad | 3 | "Quitar" borra la línea sin confirmar ni deshacer, a 12px del `+` del stepper. |
| 4 | Consistencia y estándares | 2 | "Usar mi ubicación" usa la clase `pa-cancela`, solo definida en el CSS del panel. La tienda no lo carga: botón nativo pelado en el paso crítico. |
| 5 | Prevención de errores | 2 | El aviso de campos faltantes aparece antes de tipear nada, cuatro reproches en una oración, sin marcar los campos. |
| 6 | Reconocer antes que recordar | 3 | El error lista los campos por nombre; hay que mapearlos de memoria hacia arriba. |
| 7 | Flexibilidad y eficiencia | 3 | Repedido de un toque, filtros combinables, `/p/:id` compartible. Afinado para la profesional. |
| 8 | Estética y minimalismo | 2 | Filas de 4 y 5 placas nude idénticas; home móvil de 7.100px (8,4 pantallas). |
| 9 | Errores: recuperarse | 3 | Excelente en el rechazo del servidor. El aviso de campos faltantes no tiene `role="alert"`. |
| 10 | Ayuda y documentación | 1 | La ayuda contradice al producto: manda a preguntar por chat lo que la tienda promete publicar. |
| **Total** | | **24/40** | **Aceptable** |

## Design Specificity Verdict

Compuesto para este producto, pero para el producto equivocado. Decisiones caras y propias (indicador de stock como componente, grilla de 12 tonos con el agotado tachado y fuera del tabulado, mapa de envío con polígono) apuntando a la manicurista con gabinete y no a la consumidora final que PRODUCT.md confirmó el 11/09/2026.

Señales de mayorista: eyebrow "MAYORISTA", titular "El gabinete completo", pie "para profesionales", campo "Nombre del gabinete o marca", "consultá bonificación por cantidad", envío gratis desde $120.000, módulo "Volver a pedir · SUMAR 6 AL PEDIDO · $52.200" en el home de una primera visita, y el meta description.

Escaneo determinístico: 165 hallazgos, 123 en fuentes versionadas (42 son duplicados de .js generados). Regla dominante `design-system-font-size` con 105 hits y 33 tamaños distintos fuera de rampa; DESIGN.md declara "catorce", así que subestima la deuda por más del doble. Además 9 colores a mano, 3 radios, 2 transiciones de layout. El pase de navegador sumó 50-77 textos bajo el piso de tamaño por vista, incluido el "INSUMOS" del logo a 5,44px, que el CLI no ve porque el tamaño pasa por una tabla en vez de estar escrito como fontSize.

Falsos positivos descartados: `cream-palette` (mide el fondo del escenario de preview, no la tienda), `overused-font: inter` (es la Regla de las Dos Familias), `tight-leading 1.15` (es el Display documentado), `gpt-thin-border-wide-shadow` (la sombra única sobre filetes de 1px), `side-tab` del nude (canónico en DESIGN.md), atribución de Leaflet (obligatoria por licencia).

Sin overlay visible: la CSP de public/_headers:18 bloquea todo script externo e inline. El detector corrió con bypassCSP sobre el DOM real, así que la evidencia vale, pero no quedó overlay en el navegador.

## What's Working

1. El indicador de stock es un componente, no un texto suelto: punto de 6px con `currentColor`, presente en tarjeta, ficha, carrito, repedido y cross-sell. La promesa del negocio resuelta como sistema.
2. La grilla de tonos de la ficha: 12 muestras con nombre, la agotada tachada en diagonal, atenuada y excluida del recorrido de teclado.
3. Los estados vacíos y de error: carga con `role="status"`, fallo de red con Reintentar, búsqueda sin resultados que sugiere qué tipear, carrito vacío con salida. Los primeros días del catálogo real van a ser exactamente estos estados.

## Priority Issues

### [P0] El checkout no se puede completar sin tocar el mapa

La validación exige `datos.lat != null` cuando hay mapa cargado. `.mapa-envio` es un `div role="application"` sin tabindex ni controles internos, y el único escape ("Usar mi ubicación") es el botón sin estilo de la clase huérfana. La lista de zonas que resolvería esto solo se renderiza cuando NO hay mapa. Con teclado, con lector de pantalla, o negando el permiso de ubicación, "Enviar el pedido" queda deshabilitado para siempre.

Fix: cambiar `pa-cancela` por `btn btn-ghost`, y renderizar el selector de zona siempre, como camino de primera clase que también satisface la validación. El pin queda como atajo.

Comando sugerido: /impeccable harden

### [P1] La tienda le habla a la profesional, no a la consumidora final

Eyebrow "MAYORISTA", titular del gabinete, pie "para profesionales", "sin faltantes a mitad de la jornada", campo gabinete, "consultá bonificación por cantidad", envío gratis desde $120.000, repedido de $52.200 en el home, y el meta description de public/index.html.

Fix: reescribir eyebrow, titular, subtítulo, sección, pie y meta. Sacar el campo gabinete. Bajar o quitar el umbral de envío hasta tener el número real. Mover el repedido a segunda visita, alimentado por lo que ella compró.

Comando sugerido: /impeccable clarify

### [P1] El botón principal de la ficha corta el precio en todo celular

Medido en el DOM: client 228 / scroll 260 a 390px; 163 / 227 a 320px, con `white-space:nowrap` y `overflow:hidden`. Se lee "GREGAR AL PEDIDO · $ 12.40". Pasa en iPhone SE, 12/13 mini y todo Android de 360.

Fix: `grid-template-columns: auto 1fr` con `min-width: 0` en el botón, y label "Agregar · $ 12.400" por debajo de 420px. Verificar a 320, 360 y 390.

Comando sugerido: /impeccable adapt

### [P2] El catálogo sin fotos colapsa en una sola imagen repetida

25 de 34 productos sin foto y la placa de marca es idéntica para todos: "Cabina LED/UV 48W" y "Removedor 500ml" son el mismo rectángulo rosa. El relleno de color miente cuando el producto no es de ese color (Top Coat Brillo Espejo en terracota sólido). El nombre, único identificador sin foto, se corta a 2 líneas y pierde el gramaje, que es lo que distingue el SKU.

Fix: glifo tipográfico derivado del nombre en la placa en vez de la marca repetida; reservar el relleno de color para esmaltes y geles; subir el nombre a 3 líneas.

Comando sugerido: /impeccable distill

### [P2] El carrito desmiente la promesa del sitio, tres veces en la misma pantalla

"Confirmamos stock por WhatsApp antes de que pagues" + "Stock confirmado por WhatsApp antes de pagar" + "Si falta un tono, te ofrecemos el reemplazo", más el placeholder de la nota. Todo sobre un servidor que descuenta stock de forma atómica. Y el stepper de 3 pasos nunca avanza sobre un checkout que es un scroll único.

Fix: un solo mensaje en positivo ("El stock que ves se reserva al confirmar. Si algo falla, te avisamos antes de cobrarte"). Y decidir sobre el stepper: o son tres pantallas reales, o se saca.

Comando sugerido: /impeccable clarify

## Persona Red Flags

Casey (celular, una mano): precio cortado en el botón de la ficha; el riel de chips entra 2,5 de 7 categorías sin degradado ni flecha que avise que scrollea; el botón de limpiar búsqueda queda en x = -8px, fuera de pantalla; el interruptor de tema (52x28) es el segundo elemento del header, más prominente que el carrito.

Jordan (primera vez): "ENVÍO SIN CARGO DESDE $120.000" / "MAYORISTA" / "El gabinete completo" seguidos, sin contra-señal; el módulo "Lo de siempre, en un toque · 6 de 6" en su primera visita; dos acciones circulares en la tarjeta (un "+" y un glifo de tres círculos) sin ninguna leyenda.

Sam (teclado y lector de pantalla): no hay "saltar al contenido"; en la ficha llega al botón de comprar recién en el stop ~26, después de los 11 tonos y de 4 productos relacionados que no eligió; el checkout es el P0, sin camino de teclado al mapa el pedido no se envía nunca.

## Minor Observations

- DESIGN.md declara 4 columnas en escritorio; el CSS es `auto-fill minmax(13.5rem,1fr)` y a 1440 da 5, a 1920 daría 7.
- `npm run audita` falla en silencio desde el commit a0db093: busca `<script defer src="app.js">` y el HTML dice `src="/app.js"`, con barra. De 7 casos pasan 5, el 6º revienta y el 7º nunca corre.
- El stock por tono no se muestra: la ficha dice "En stock" (57, la suma) mientras "Verde Bosque" tiene 2.
- El tono viene preseleccionado: se puede agregar al pedido un color que nunca se eligió conscientemente.
- La barra de acción de la ficha se estira a los 1440px completos en escritorio; DESIGN.md dice que ahí se disuelve en el flujo.
- Migas con separador colgando: "PINK MASK · HERRAMIENTAS Y EQUIPOS ·".
- La tercera opción de entrega queda tapada por la barra pegajosa en celular.
- Hoja de filtros con dos gramáticas para la misma decisión: "Ordenar por" son filas con radio, "Familia de tono" son chips.

## Questions to Consider

1. Si la foto es el producto y no hay fotos, ¿por qué el diseño le sigue reservando el 55% de cada tarjeta?
2. ¿"Precio y stock a la vista" no debería significar el stock del tono, que es el que decide?
3. ¿El carrito se disculpa por un riesgo real o por un resto de cuando la venta era por DM?
4. Si la dueña va a crear y borrar categorías, ¿el riel de chips aguanta 20?

---
name: GEA Insumos
description: Tienda de belleza donde el precio y el stock son el diseño. Papel nude, tinta negra, una sola sombra.
colors:
  paper: "#FAF8F7"
  surface: "#FFFFFF"
  sunk: "#F3EEEC"
  hairline: "#E4DBD7"
  border: "#D6CBC6"
  ink: "#111111"
  ink-soft: "#6E6663"
  ink-faint: "#766D69"
  nude-50: "#FAF3F1"
  nude-100: "#F4E7E3"
  nude-200: "#E2C2B9"
  nude-300: "#CFA79C"
  nude-400: "#B8887B"
  nude-600: "#8A5C4E"
  vino-50: "#FBF1F2"
  vino-600: "#8A1B2E"
  vino-700: "#6E1524"
  on-vino: "#FFFFFF"
  ok: "#2F6B4F"
  scrim: "rgba(17,17,17,.32)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.4rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "normal"
  headline:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.2
  title:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
  price:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 500
    letterSpacing: "0.18em"
  eyebrow:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6rem"
    fontWeight: 400
    letterSpacing: "0.16em"
rounded:
  radio: "2px"
  boton: "999px"
spacing:
  space-1: "0.25rem"
  space-2: "0.5rem"
  space-3: "0.75rem"
  space-4: "1rem"
  space-5: "1.25rem"
  space-6: "1.5rem"
  space-8: "2rem"
  space-10: "2.5rem"
  space-12: "3rem"
  space-14: "3.5rem"
  space-16: "4rem"
  gap-grid: "1.15rem"
  gap-grid-movil: "0.8rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.boton}"
    padding: "0.8rem 1.5rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.nude-600}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.boton}"
    padding: "0.8rem 1.5rem"
  button-ghost-hover:
    backgroundColor: "{colors.nude-50}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radio}"
    padding: "0.7rem 0.75rem 0.8rem"
  card-accion:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.boton}"
    size: "42px"
  card-accion-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.boton}"
    padding: "0.5rem 0.85rem"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radio}"
    padding: "0.8rem 0.85rem"
    height: "48px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    height: "56px"
  tab-current:
    textColor: "{colors.ink}"
  stepper-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.boton}"
    size: "44px"
---

# Design System: GEA Insumos

## Overview

**Creative North Star: "Papel nude, tinta negra"**

Hay un papel y hay una tinta, y no se intercambian nunca. El nude `#E2C2B9` es
la superficie sobre la que se apoya el producto —una franja, el fondo de una
foto que todavía no existe, el filete que separa dos palabras de la marca—; el
negro `#111111` es lo que se lee. De esa sola frase se deduce el resto del
sistema: por qué el fondo de la página es un blanco con una pizca de nude adentro
(`#FAF8F7`), por qué el único rosa que puede ser texto es un derivado oscuro
(`#8A5C4E`), y por qué el modo oscuro cambia todo menos el nude de marca, que es
la constante.

El carácter es **cálido y cercano** antes que frío y exacto. La calidez no está
en el color saturado sino en la temperatura de los neutros: todos los grises
tienen nude adentro, los hover se resuelven con un lavado de `--nude-50` en vez
de un gris, y Playfair aparece en los nombres de producto y en los precios, donde
otra tienda pondría una sans condensada. La densidad es alta y sin miedo: cuatro
columnas en escritorio, dos en celular, el precio siempre visible en la tarjeta.

Los controles son **táctiles y seguros**. Todo lo que se toca se hunde apenas al
tocarlo (`scale(.92)` o `scale(.96)`, siempre con la misma curva), mide entre 40
y 56 píxeles de lado, y lo que quedó chico tiene la zona táctil agrandada con un
`::after` invisible bajo `@media (pointer:coarse)`, sin mover el layout. Esta
tienda se compra con el pulgar, en la calle, con una mano.

**Key Characteristics:**

- Papel nude y tinta negra, nunca al revés.
- Dos familias tipográficas y ninguna tercera: Playfair para lo que se mira,
  Inter para lo que se lee.
- Una sola sombra en todo el sistema, y casi nunca en reposo.
- Dos radios con trabajos distintos: 2px para lo que se mira, cápsula para lo
  que se toca.
- Un solo acento fuera del nude —el vino— con tres usos contados.
- Densidad alta sin ruido: el aire está entre las secciones, no adentro de las
  tarjetas.
- El modo oscuro no invierte: recalcula todo alrededor de un nude que no se mueve.

## Colors

Neutros cálidos con nude adentro, un nude de marca que solo hace de superficie, y
un único acento que grita tres veces.

### Primary

- **Tinta** (`#111111`): todo el texto de cuerpo y de título, el fondo del botón
  primario, el fondo del chip seleccionado y el borde del control activo. Es el
  color que más superficie ocupa después del papel.
- **Nude de Marca** (`#E2C2B9`): el color de GEA. Fondo de la franja de marca,
  base de la foto ausente, filete de 3px al costado de una fila de categoría,
  parada de un degradado SVG. **Idéntico en claro y en oscuro**: es la constante
  que hace que la marca se reconozca en los dos temas.

### Secondary

- **Nude Legible** (`#8A5C4E` en claro, `#E0B6A8` en oscuro): el único nude que
  puede ser texto. Enlaces en hover, migas, "ver más", el veredicto del mapa de
  envío, el hover del botón primario. Es el rosa cuando el rosa tiene que decir
  algo.
- **Nude Lavado** (`#FAF3F1`) y **Nude Papel** (`#F4E7E3`): los dos fondos de
  reacción. El primero es el hover de casi toda fila y de todo botón fantasma; el
  segundo es el fondo de la foto que todavía no existe y el anillo de foco de los
  campos.
- **Nude Filete** (`#CFA79C`) y **Nude Trazo** (`#B8887B`): líneas, no tintas. El
  borde de la tarjeta en hover, el subrayado de la pestaña activa, la marca de
  2px sobre el tab actual, y el anillo de foco global del sitio.

### Tertiary

- **Vino** (`#8A1B2E` en claro, `#EE9AA6` en oscuro): el único acento fuera del
  nude, con **tres usos y ninguno más**: precio rebajado, cinta de descuento y
  stock al límite. En el panel se suma su tono fuerte (`#6E1524`) para lo
  destructivo y lo cancelado.
- **Verde de Confirmado** (`#2F6B4F` en claro, `#86C4A2` en oscuro): "hay stock"
  en la tienda y "confirmado" en el panel. Nunca decora; solo informa estado.

### Neutral

- **Papel** (`#FAF8F7`): el fondo de la tienda. Blanco con nude adentro, no blanco
  puro.
- **Superficie** (`#FFFFFF`): tarjetas, barras, hojas, campos. Lo que se levanta
  del papel lo hace poniéndose más blanco, no proyectando sombra.
- **Hundido** (`#F3EEEC`): el fondo del panel de administración y de las pistas
  vacías (la barra de meta de envío, el contenedor del mapa).
- **Filete** (`#E4DBD7`) y **Borde** (`#D6CBC6`): dos pesos de línea. El filete
  separa —bordes de tarjeta, divisiones de lista—; el borde delimita un control
  que se puede tocar —campos, chips, steppers—.
- **Tinta Suave** (`#6E6663`) y **Tinta Tenue** (`#766D69`): texto secundario y
  terciario. Los dos están medidos contra el papel: el tenue da 4.77:1, y existe
  porque el `#948B87` anterior daba 3.15 y lo marcaba axe.
- **Velo** (`rgba(17,17,17,.32)`): el scrim detrás de las hojas. En oscuro pasa a
  `rgba(0,0,0,.62)`, porque negro sobre negro no oscurecía nada.

### Named Rules

**La Regla del Papel.** El nude `#E2C2B9` es fondo, nunca tinta. Sobre blanco da
1,7:1 y es ilegible; negro sobre nude da 11,4:1. Cuando algo rosado tiene que
leerse, se usa `#8A5C4E`. La única excepción es el "INSUMOS" blanco sobre nude
adentro del logo.

**La Regla de los Tres Gritos.** El vino aparece en exactamente tres lugares:
precio rebajado, cinta de descuento y stock al límite. Si aparece en un cuarto,
deja de gritar, y hay que sacarlo de alguno de los otros tres.

**La Regla del Contraste Medido.** Ningún color de texto entra al sistema sin su
razón de contraste anotada al lado. Los tres que ya se corrigieron dejaron su
número en el comentario del token; los que entren después hacen lo mismo.

## Typography

**Display Font:** Playfair Display (con Georgia, Times New Roman, serif)
**Body Font:** Inter (con -apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

**Character:** un serif de contraste alto contra una grotesca neutra. Playfair no
hace de decoración: hace de vitrina. Todo lo que el ojo tiene que valuar —el
nombre del producto, el precio, el total del pedido— va en serif; todo lo que se
lee corrido, se navega o se etiqueta va en Inter. El logo es esa misma tensión en
dos palabras: "GEA" en Playfair con `.18em` de tracking, "INSUMOS" en Inter con
`.42em`, separados por un filete.

### La escala

Catorce escalones, de `.55rem` a `2rem`, con razón ~1.09 abajo y ~1.12 arriba:
`--fs-1` a `--fs-14` en `public/tokens/typography.css`. Encima viven los nombres
por rol —`--fs-eyebrow`, `--fs-label`, `--fs-btn`, `--fs-section`…—, que son la
puerta de entrada y apuntan a un escalón, nunca a un número suelto.

La escala se derivó del código, no al revés: había **44 tamaños distintos
escritos a mano en 125 lugares**, y los escalones se pusieron sobre los valores
que más se usaban, así que casi nada se movió más de `.02rem` y nada más de
`.05rem`.

### Hierarchy

- **Display** (Playfair 500, `clamp(1.8rem, 7.4vw, 2.35rem)` en celular y
  `clamp(2.1rem, 4.2vw, 3.4rem)` en escritorio, línea 1.08): el título del hero, y
  nada más. Entra animado palabra por palabra desde abajo.
- **Headline** (Playfair 500, 1.3rem en celular y 1.5rem en escritorio, línea
  1.2): encabezados de sección. `.titulo-seccion` es su forma canónica.
- **Title** (Playfair 500, .9rem en celular y 1rem en escritorio, línea 1.3):
  nombre de producto en la tarjeta, cortado a dos líneas.
- **Price** (Playfair, 1.25rem en tarjeta y 2rem en ficha, tracking `-.01em`): el
  precio se compone como un título, no como un dato. Rebajado toma el vino, y el
  precio anterior va al lado en Inter .72rem tachado.
- **Body** (Inter 400, 1rem, línea 1.6): texto corrido y valores de formulario.
- **Label** (Inter 500, .68rem, tracking `.18em`, versales): etiquetas de campo,
  encabezados del pie, la cuenta de resultados.
- **Eyebrow** (Inter 400, .6rem, tracking `.16em`, versales): la categoría arriba
  del nombre en la tarjeta, "ver más", los avisos de condiciones.

### Named Rules

**La Regla de las Dos Familias.** Playfair en títulos, nombres de producto y
precios. Inter en todo lo demás. No hay una tercera familia y no hay un caso que
la justifique.

**La Regla del Escalón.** Ningún tamaño de tipografía se escribe a mano. Si el
que hace falta no está en la escala, se discute el escalón; no se inventa un
número al lado. Prueba de auditoría: buscar `font-size:` seguido de un número en
`public/tienda/` tiene que dar cero resultados.

**La Regla del Tracking Inverso.** Cuanto más chica la tipografía, más suelta: la
marca respira a `.18em` y `.42em`, las etiquetas gritan bajito a `.18em`, los
botones van a `.13em`. Un texto de .6rem con tracking normal es un error de
sistema.

## Layout

Contenedor de `78rem` máximo (`--maxw`), centrado, con `1.25rem` de padding
lateral. El ritmo vertical sale de una escala de once pasos (`--space-1` a
`--space-16`, de `.25rem` a `4rem`).

La grilla del catálogo (`.gr`) es el esqueleto del sitio: **2 columnas en
celular, 3 por debajo de 1000px y 4 en escritorio**, con `.7rem` de gap que crece
hasta `1.15rem` con el ancho. Dos columnas en el teléfono es una decisión, no una
concesión: la densidad es parte de la promesa. Y cuatro en escritorio es un
número, no un resultado: con `auto-fill` la cantidad de columnas la decidía el
monitor, y salían cinco.

La navegación tiene dos formas completas, no una adaptada. En escritorio, barra
superior con nav centrada y buscador en línea. En celular, barra superior
pegajosa más una **barra de tabs inferior de 5 columnas y 56px de alto**, con
`env(safe-area-inset-bottom)`. La barra de acción del checkout se apoya justo
encima de esa barra (`bottom: var(--h-tabs)`) en celular y se disuelve en el
flujo en escritorio.

Los breakpoints no forman una escala: son 339, 479, 560, 720, 820, 900 y 980/981,
más 640 en el panel. Cada uno responde a un defecto medido y está comentado en el
archivo. No inventar escalones nuevos sin un defecto que los justifique.

El panel de administración es una sola columna de `780px` máximo sobre el fondo
hundido, con un único breakpoint en 640px. No tiene modo escritorio y no lo
necesita.

## Elevation & Depth

El sistema es **plano por convicción**. La profundidad se construye con tono y con
línea: el papel `#FAF8F7` abajo, la superficie blanca arriba, y un filete de 1px
donde dos planos se tocan. Hay exactamente **una sombra de propósito general** en
todo el sistema, y casi nunca aparece en reposo.

### Shadow Vocabulary

- **Sombra** (`box-shadow: 0 1px 2px rgba(17,17,17,.04), 0 10px 30px -18px rgba(17,17,17,.22)`):
  la única. Aparece como respuesta —hover de tarjeta, hover de botón, la tarjeta
  lateral del carrito—, nunca como estado de reposo. En oscuro se profundiza a
  `0 1px 2px rgba(0,0,0,.5), 0 14px 34px -18px rgba(0,0,0,.8)`.
- **Sombra Flotante** (`box-shadow: 0 6px 20px -6px rgba(0,0,0,.45)`): exclusiva
  de la hoja inferior, que sí está despegada de la página por definición.
- **Sombra de Tono** (`box-shadow: inset 0 -8px 18px -8px rgba(0,0,0,.35)`):
  interior, sobre la muestra de color, para que el círculo se lea como esmalte y
  no como un disco plano.
- **Anillo de Campo** (`box-shadow: 0 0 0 3px var(--nude-100)`): el foco de los
  campos de texto. Es un anillo, no una sombra: no simula altura.

Las barras pegajosas suman una capa de vidrio cuando el scroll las despega:
`color-mix(in oklab, var(--surface) 74–90%, transparent)` con
`backdrop-filter: blur(18px) saturate(1.35)`, dentro de un `@supports` que la
apaga entera si el navegador no puede.

### Named Rules

**La Regla de la Sombra Única.** Hay una sombra en el sistema. Si un componente
necesita otra, primero se prueba con tono y con filete; si igual la necesita, se
justifica por escrito al lado del valor. Las dos sombras escritas a mano que hoy
existen (`tienda.css:167` y `tienda.css:625`) son deuda, no precedente.

**La Regla del Plano en Reposo.** Nada está levantado sin que lo hayan tocado. El
reposo es plano; la sombra es una respuesta.

## Shapes

Dos radios, y cada uno tiene su trabajo.

- **Lo que se mira lleva `2px`** (`--radio`): tarjetas, paneles, campos de texto,
  fotos, el contenedor del mapa. Casi recto: suaviza el corte sin redondear.
- **Lo que se toca es cápsula** (`--radio-boton: 999px`): botones, chips, pasos,
  íconos del header, el stepper. Si el control es cuadrado de lado, la cápsula lo
  deja circular, y esa es la misma regla, no otra.

La marca aporta una tercera forma que no es un radio: **el filete**. Una línea de
1px que separa "GEA" de "INSUMOS" en el logo, se repite como borde de sección,
como separador de fila y como subrayado de la pestaña activa, y reaparece animada
(`scaleX(0) → scaleX(1)` desde la izquierda) en la entrada del hero. La separación
en este sistema se dibuja con una línea, no con una caja.

Las fotos son cuadradas (`aspect-ratio: 1`) en tarjeta y en carrito. Las muestras
de color son círculos perfectos. La hoja inferior de celular es lo único con un
radio grande (`12px 12px 0 0`), porque imita una superficie que sube desde el
borde de la pantalla.

### Named Rules

**La Regla del Mirar y el Tocar.** 2px para lo que se mira, cápsula para lo que se
toca. Un botón con esquinas rectas no es una variante: es el síntoma de que
alguien escribió el radio a mano en vez de usar el token.

## Components

### Buttons

- **Forma:** cápsula (`999px`), borde de 1px transparente, `.8rem 1.5rem` de
  padding, versales de .74rem con `.13em` de tracking, ícono opcional de `1.05em`.
- **Primario:** fondo tinta, texto papel. En hover el fondo pasa al nude legible
  (`#8A5C4E`) mediante una cortina `::after` que sube desde abajo
  (`translateY(101%) → 0` en `.32s`), no por un cambio plano de color.
- **Fantasma:** transparente con borde `--border`. En hover el borde se vuelve
  tinta y el fondo se lava con `--nude-50`.
- **Estados:** `:hover` levanta 1px y enciende la sombra única; `:active` baja 1px
  con `scale(.99)` y la apaga; `:disabled` no se mueve en hover.
- **Botón de ícono** (header): 44×44, sin borde ni fondo; el color pasa al nude
  legible en hover y el SVG se hunde a `scale(.9)` al tocarlo.

### Chips

- **Estilo:** cápsula de 36px de alto, fondo superficie, borde `--border`, texto
  `--ink-soft` de .74rem. Viven en un riel horizontal con la barra de scroll
  oculta.
- **Estado:** seleccionado invierte por completo —fondo tinta, texto papel— y el
  contador interno se apaga con
  `color-mix(in oklab, var(--paper) 74%, var(--ink))`, que es lo que lo hace
  seguir al tema solo.
- **Táctil:** `:active` hunde a `scale(.96)`, y un `::after` de `inset: -4px 0`
  agranda la zona de toque sin mover el riel.

### Cards / Containers

- **Esquinas:** 2px. **Fondo:** superficie. **Borde:** filete de 1px.
- **Sombra:** ninguna en reposo; en hover aparece la sombra única, el borde pasa a
  `--nude-300` y la tarjeta sube 3px.
- **Foto:** cuadrada, fondo `--nude-50`, y la imagen hace un zoom lento a
  `scale(1.07)` en `.5s` cuando el mouse entra. Sin foto el hueco no queda vacío:
  si el producto tiene color se pinta con un degradado radial de ese tono y un
  velo interior; si no, con la placa de marca en nude.
- **Padding interno:** `.7rem .75rem .8rem`.
- **Acción:** botón circular de 42px en el pie de la tarjeta, que invierte a tinta
  en hover y se hunde a `scale(.92)` al tocarlo.

### Inputs / Fields

- **Estilo:** 2px de radio, borde `--border`, fondo superficie, `48px` de alto
  mínimo, texto de 1rem. La etiqueta va arriba, en versales de .66rem con `.18em`.
- **Foco:** el borde pasa a tinta y se enciende el anillo
  `0 0 0 3px var(--nude-100)`.
- **Buscador:** misma forma, con lupa a la izquierda y limpiador circular a la
  derecha; en escritorio se convierte en una barra en línea de `34rem` centrada en
  el header.
- **Foco global:** todo lo demás usa el anillo del sitio,
  `outline: 2px solid var(--nude-400)` con `3px` de separación.

### Navigation

- **Escritorio:** pestañas de texto en versales de .76rem, `--ink-soft` en reposo,
  tinta en hover, y la activa marcada con un filete `--nude-300` debajo.
- **Celular:** barra de tabs inferior de 5 columnas y 56px de alto, ícono de 21px
  sobre etiqueta de .58rem. La activa se pinta tinta y le crece una barra de 2px
  en `--nude-300` sobre el borde superior. El color de reposo es `--ink-soft` y no
  `--ink-faint` a propósito: la etiqueta mide 9,3px sobre una barra de vidrio, y
  el tono más claro no llegaba al mínimo de contraste.
- **Vidrio:** las barras se vuelven translúcidas solo cuando el scroll las
  despega, y solo si el navegador soporta `backdrop-filter` y `color-mix`.

### Panel de administración

El panel es el mismo sistema con otra densidad, no otro sistema. Lo que cambia
está justificado por el uso: la dueña carga stock y precios con el teléfono en
una mano, muchas veces seguidas.

- **Superficie:** una sola columna de `780px` máximo sobre el fondo hundido
  (`--sunk`), no sobre el papel. Las barras pegajosas —la de navegación y la de
  guardar— van en `--paper`, que invierte la relación de la tienda, donde las
  barras son `--surface` sobre `--paper`.
- **Blanco táctil:** 44px es el número del panel —stepper, casilla, editar,
  sumar, acciones de foto— contra los 40–42 de la tienda. Objetivo más grande y
  más uniforme, porque acá se toca mucho más seguido.
- **Campos:** `46px` de alto y `.7rem .8rem` de padding, un escalón más bajos
  que los `48px` de la tienda.
- **Sin display serif:** el `h1` del panel mide 1rem. Playfair queda reservado a
  los datos que se valúan —nombre, precio, y el número del stepper a 1.1rem—. En
  el panel el serif informa; no titula.
- **Stepper de stock:** dos botones circulares de 44px con el número entre
  ellos, en cápsula y en Playfair. El número toma la forma de los botones que
  tiene al lado y no la de los campos del formulario: es parte del control, no un
  campo suelto.
- **Destructivo:** `.pa-borrar` es el único control del sistema que se rellena de
  vino (`--vino-700`) en hover. Es deliberado y no se repite en la tienda.
- **Estado:** confirmado en `--ok`; cancelado y agotado en vino. Los mismos dos
  colores de estado que la tienda, con el mismo significado.

**Lo que hoy se desvía y no es doctrina.** El panel no usa ninguno de los tokens
tipográficos (`--fs-label`, `--track-label` y compañía) y escribe cinco trackings
distintos a mano; no usa `--dur`; consume `var(--sal)` sin declararlo, así que
depende de que lo cargue el CSS de la tienda; y sus campos no tienen estado de
foco, mientras la tienda tiene el anillo `--ring-input`. Lo último es lo más
serio: es accesibilidad, no estilo.

### Indicador de stock

Un punto de 6px del color del texto, y el texto al lado en .68rem: verde para
"hay", vino para "al límite", tinta tenue para "sin stock". El punto toma
`currentColor`, así que nunca puede desincronizarse de su etiqueta. Es el
componente más chico del sistema y el que más trabaja: es la mitad de la promesa
de la tienda.

### Hoja inferior

En celular sube desde abajo (`translateY(100%) → 0` en `.24s`) con radio de 12px
arriba, `86%` de alto máximo y la sombra flotante. En escritorio la misma hoja se
convierte en un modal centrado de `min(30rem, 92vw)` con radio de 2px y entrada
por opacidad. Un componente, dos gramáticas completas.

## Do's and Don'ts

### Do:

- **Do** usar `--nude-200` solo como fondo, filete o parada de degradado. Prueba
  de auditoría: buscar `color:` seguido de `--nude-200` tiene que dar cero
  resultados.
- **Do** poner el precio en Playfair. Es el dato que la tienda promete mostrar: se
  compone como título.
- **Do** dar `scale(.92)`–`.96` al tocar cualquier control, con `var(--sal)`
  (`cubic-bezier(.22,.72,.24,1)`). La respuesta táctil es parte de la identidad.
- **Do** agrandar zonas táctiles chicas con un `::after` de inset negativo bajo
  `@media (pointer:coarse)`, nunca cambiando el tamaño visible.
- **Do** anotar la razón de contraste al lado de cualquier color de texto nuevo.
- **Do** apagar todo el movimiento bajo `prefers-reduced-motion: reduce`,
  incluidos los hover con `transform` y los revelados por scroll.
- **Do** usar `--ok` para estado positivo y `--acento` para alarma, en la tienda y
  en el panel por igual.

### Don't:

- **Don't** usar el nude de marca como color de texto, ni `--nude-300` o
  `--nude-400` para tinta. Para rosa legible existe `--nude-600`, y solo ese.
- **Don't** agregar una sombra nueva. Hay una sola, y aparece por reacción.
- **Don't** escribir un `border-radius` a mano. Si no es `--radio` ni
  `--radio-boton`, está mal.
- **Don't** escribir un tamaño de tipografía a mano. Eran 44 valores distintos en
  125 lugares y ahora son catorce escalones con nombre: si el que necesitás no
  está, se agrega al sistema, no al componente.
- **Don't** usar el vino en un cuarto lugar.
- **Don't** mostrar cuentas regresivas, precios tachados que no correspondan a un
  precio anterior real, ni avisos de unidades restantes inventados. La honestidad
  del precio y del stock es el producto.
- **Don't** dejar una foto ausente como un rectángulo gris: el sistema ya tiene
  dos respuestas para eso, el campo de color y la placa de marca.
- **Don't** dar por hecho que hay cuatro columnas. La grilla es 4 / 3 / 2, y el
  catálogo puede estar casi vacío.

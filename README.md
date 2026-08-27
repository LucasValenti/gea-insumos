# GEA Insumos

Catálogo de insumos de manicuría con consulta por WhatsApp. Sitio estático hecho con
[Astro](https://astro.build): se generan archivos HTML sueltos que andan en cualquier
alojamiento.

## Cómo trabajar en el proyecto

```bash
npm install     # una sola vez
npm run dev     # abre http://localhost:4321 y se actualiza solo al guardar
npm run build   # genera el sitio final en dist/
npm run preview # mira dist/ como se va a ver publicado
```

## Los tres archivos que vas a tocar

Todo lo que cambia seguido está separado del código:

| Archivo | Qué tiene |
|---|---|
| `src/data/config.js` | WhatsApp, Instagram, ciudad, formas de pago, envíos, dominio |
| `src/data/productos.js` | Los productos con su precio y descripción |
| `src/data/categorias.js` | Las categorías del catálogo |

### Cambiar un precio

Abrí `src/data/productos.js`, buscá el producto y cambiá el número de `precio`.
Sin puntos ni símbolo: `precio: 12400`.

### Agregar un producto

Copiá un bloque existente y cambiale los datos. El `id` es lo que aparece en la
dirección web, así que va sin acentos, sin eñes y sin espacios:
`torno-portatil-35000`.

### Poner el número de WhatsApp real

En `src/data/config.js`, campo `whatsapp`. Con código de país, sin `+`, sin espacios
ni guiones. Para Argentina: `54` + `9` + característica sin el 0 + número sin el 15.
Ejemplo para un celular de Rosario: `5493411234567`.

Después poné `whatsappPendiente: false`.

### Sacar el aviso naranja de "datos de ejemplo"

En `src/data/productos.js`, cambiá `export const EJEMPLO = true;` por `false`.

### Agregar las fotos

1. Guardá las imágenes en `public/productos/`, en cuadrado y con el mismo fondo.
2. En cada producto agregá el nombre del archivo: `foto: "torno.jpg"`.

Mientras no haya foto, el sitio muestra el color del producto o la marca, y una
etiqueta de "Foto pendiente". No se ve roto.

## Cómo está armado

```
src/
├── data/          los datos que cambian: productos, categorías, contacto
├── styles/        global.css tiene todos los colores y tamaños del sistema visual
├── components/    las piezas que se repiten (tarjeta, encabezado, pie)
├── layouts/       Base.astro: el <head>, el SEO y lo que se ve al compartir
└── pages/         una carpeta = una dirección del sitio
    ├── index.astro              /
    ├── catalogo/index.astro     /catalogo
    ├── catalogo/[categoria]     /catalogo/esmaltes, /catalogo/geles...
    ├── producto/[id]            una página por cada producto
    ├── como-comprar.astro       /como-comprar
    ├── contacto.astro           /contacto
    └── 404.astro                página de error
```

Los archivos entre corchetes generan varias páginas de una: `[id].astro` produce las
30 fichas de producto, una por cada entrada de `productos.js`.

## Reglas del sistema visual

Están todas en `src/styles/global.css`, pero hay una que no se puede romper:

**El rosa nude (`#E2C2B9`) es un fondo, nunca una tinta.** Sobre blanco tiene 1,7 a 1
de contraste y no se lee. Todo lo que se apoye sobre nude va en negro (11,4 a 1). Para
texto rosado legible existe `--nude-600` (`#8A5C4E`, 5,6 a 1).

Playfair Display va solo en títulos, nombres de producto y precios. Inter va en todo
lo demás.

## Publicar

`npm run build` deja el sitio listo en `dist/`. Esa carpeta es el sitio completo.

- **Hostinger u otro hosting común:** subir el contenido de `dist/` por FTP.
- **Cloudflare Pages o Netlify:** conectar el repositorio. Comando de compilación
  `npm run build`, carpeta de salida `dist`.

Antes de publicar, cambiá `sitio` en `src/data/config.js` por el dominio real: de ahí
salen el mapa del sitio y los enlaces que se ven al compartir.

## Pendientes

- [ ] Número de WhatsApp real
- [ ] Usuario de Instagram
- [ ] Ciudad, y dirección si hay local
- [ ] Formas de pago
- [ ] Condiciones de envío
- [ ] Los 30 productos reales
- [ ] Fotos de producto
- [ ] Imagen `public/og.png` (1200×630) para cuando se comparte el enlace

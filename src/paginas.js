/* Las páginas que el servidor arma para que la tienda exista en un buscador.
 *
 * El problema que resuelven: la tienda es una sola pantalla y una sola
 * dirección. Se navega por estado de React, así que por más que Google ejecute
 * el JavaScript, no hay nada que indexar producto por producto — hay una URL
 * sola. Buscando el nombre de un producto la tienda no podía aparecer.
 *
 * Acá cada producto tiene su dirección, /p/<id>, y el servidor le arma el
 * <head>: título, descripción, canónica, vista previa al compartir y el JSON-LD
 * de Product con precio y disponibilidad, que es lo que habilita el resultado
 * enriquecido. El cuerpo lo sigue dibujando React: desde que no está Babel la
 * página monta rápido y el buscador la ejecuta sin problema. Lo que no podía
 * resolverse con JavaScript era la falta de direcciones, no el renderizado.
 *
 * El JSON-LD va sin hash en la CSP a propósito, y está medido: un
 * <script type="application/ld+json"> no lo ejecuta nadie, así que script-src
 * no lo alcanza. Se comprobó en un navegador de verdad, con un script sin hash
 * al lado como control: ese sí se bloqueó, el JSON-LD no.
 */

const ID_VALIDO = /^[A-Za-z0-9._~-]{1,80}$/;

/* Para meter texto adentro de un atributo o de un nodo del html. Sin esto, un
   producto con comillas en el nombre cierra el atributo antes de tiempo y el
   resto del nombre pasa a ser marcado. */
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* Adentro de un <script> no vale escapar con entidades —no las interpreta— así
   que lo único peligroso es que aparezca la secuencia que cierra la etiqueta. */
const escJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

const recorte = (s, max) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s\S*$/, "") + "…";
};

async function traerProducto(db, id) {
  const p = await db.prepare(
    `SELECT p.id, p.nombre, p.marca, p.precio, p.stock, p.descripcion, p.contenido,
            p.img, p.categoria_id, c.nombre AS categoria
     FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE p.id = ?`).bind(id).first();
  if (!p) return null;
  /* Con tonos, el stock es la suma de los tonos y productos.stock queda en 0.
     Es la misma regla que aplica /api/catalogo; si acá se leyera la columna a
     secas, todo producto con tonos se anunciaría agotado en Google. */
  const t = await db.prepare(
    "SELECT COUNT(*) AS n, COALESCE(SUM(stock), 0) AS s FROM tonos WHERE producto_id = ?")
    .bind(id).first();
  p.stock_real = (t && t.n) ? t.s : p.stock;
  return p;
}

function cabezaProducto(p, origen) {
  const url = `${origen}/p/${encodeURIComponent(p.id)}`;
  const titulo = `${p.nombre}${p.marca ? ` · ${p.marca}` : ""} · GEA Insumos`;
  const desc = recorte(p.descripcion || p.contenido || `${p.nombre} para manicuría, por mayor.`, 155);
  const imagen = p.img ? `${origen}/${String(p.img).replace(/^\//, "")}` : `${origen}/assets/og-gea.jpg`;

  const producto = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    sku: p.id,
    description: desc,
    image: imagen,
    ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
    ...(p.categoria ? { category: p.categoria } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      price: String(p.precio),
      availability: p.stock_real > 0
        ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "GEA Insumos" },
    },
  };

  /* La miga le dice al buscador dónde vive el producto, y es lo que hace que en
     el resultado aparezca "gea › categoría › producto" en vez de la URL cruda. */
  const miga = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: origen + "/" },
      ...(p.categoria ? [{ "@type": "ListItem", position: 2, name: p.categoria }] : []),
      { "@type": "ListItem", position: p.categoria ? 3 : 2, name: p.nombre, item: url },
    ],
  };

  return { url, titulo, desc, imagen, jsonld: [producto, miga] };
}

/* Reemplaza el <head> del armazón. Se hace por reemplazo y no armando un html
   nuevo para que la página siga siendo exactamente la misma: los mismos
   estilos, los mismos scripts y el mismo orden. Lo único que cambia es lo que
   lee un buscador. */
function inyectar(html, meta) {
  const reemplazos = [
    [/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.titulo)}</title>`],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(meta.desc)}">`],
    [/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(meta.url)}">`],
    [/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(meta.titulo)}">`],
    [/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(meta.desc)}">`],
    [/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(meta.url)}">`],
    [/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(meta.imagen)}">`],
    [/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="product">`],
  ];
  let salida = html;
  for (const [re, con] of reemplazos) salida = salida.replace(re, con);

  const bloques = meta.jsonld
    .map((o) => `<script type="application/ld+json">${escJson(o)}</script>`).join("\n");
  return salida.replace("</head>", bloques + "\n</head>");
}

export async function paginaProducto(env, url, id) {
  const armazon = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin)));
  const html = await armazon.text();

  /* Un id con forma rara o inexistente devuelve 404 con la misma página. Que
     conteste 200 sería peor que un error: el buscador guardaría una dirección
     que no lleva a ningún lado y la seguiría ofreciendo. */
  const p = ID_VALIDO.test(id) ? await traerProducto(env.DB, id) : null;
  if (!p) {
    return new Response(html.replace(/<title>[\s\S]*?<\/title>/,
      "<title>Ese producto ya no está · GEA Insumos</title>"), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  return new Response(inyectar(html, cabezaProducto(p, url.origin)), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      /* Corto: el precio y el stock salen de la base y se editan desde el panel.
         Una página cacheada mucho tiempo anunciaría en Google un precio viejo. */
      "cache-control": "public, max-age=60, stale-while-revalidate=600",
    },
  });
}

/* El sitemap sale de la base y no de un archivo, porque el catálogo se edita
   desde el panel sin publicar nada: un archivo escrito a mano quedaría viejo el
   día que se agrega un producto, y en un sitemap eso son direcciones que no
   existen o productos que nadie encuentra. */
export async function sitemap(db, origen) {
  const { results } = await db.prepare(
    "SELECT id FROM productos ORDER BY orden").all();
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${esc(origen)}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...results.map((p) =>
      `  <url>\n    <loc>${esc(origen)}/p/${encodeURIComponent(p.id)}</loc>\n`
      + `    <lastmod>${hoy}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

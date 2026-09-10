/* Las fotos que sube la clienta desde el panel.
 *
 * Hasta acá todas las fotos eran archivos de public/tienda/img/, convertidos a
 * WebP por herramientas/imagenes.mjs y publicados con el resto del sitio. Eso
 * sirve para el catálogo que armamos nosotros, pero deja a la clienta afuera:
 * para cambiar una foto hacía falta editar el repositorio y volver a publicar.
 *
 * Las de acá viven en la base y se sirven por /img/<clave>. Las viejas siguen
 * donde estaban: no hay que migrar nada y las dos conviven, porque lo que la
 * tienda guarda de cada producto es la ruta y no el archivo.
 *
 * La conversión a WebP y el achique pasan en el navegador, antes de subir
 * —public/admin/panel.jsx—. No es por comodidad: un Worker no tiene con qué
 * decodificar un JPEG, así que el servidor no puede achicar nada. El navegador
 * ya tiene el decodificador y el canvas, y de paso una foto de 4 MB del celular
 * viaja convertida en unos 80 KB en vez de cruzar la red entera para que el
 * servidor la rechace.
 *
 * Por eso este módulo NO confía en lo que llega: comprueba que sea de verdad un
 * WebP mirando los bytes, no el content-type, que lo escribe quien sube.
 */

const MAX = 600 * 1024;
const CACHE_IMG = "public, max-age=31536000, immutable";

/* El tope real es el de una celda de D1 (2 MB). 600 KB está bien por encima de
   lo que produce el panel —una foto de 1100 px al 80 % de calidad da entre 40 y
   150 KB— y bien por debajo del límite, así que deja lugar para una foto con
   mucho detalle sin acercarse al borde. */

/* Un WebP arranca con "RIFF", cuatro bytes de tamaño, y después "WEBP". Mirar
   el content-type no sirve de nada: lo escribe quien sube, así que un .exe
   renombrado pasaría igual. Esto mira el archivo. */
function esWebp(b) {
  if (b.length < 12) return false;
  const t = (i, s) => String.fromCharCode(...b.slice(i, i + s.length)) === s;
  return t(0, "RIFF") && t(8, "WEBP");
}

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

/* La clave sale del contenido, no del nombre ni del reloj.
 *
 * Dos consecuencias, las dos buenas: subir dos veces la misma foto no ocupa dos
 * filas, y como la dirección cambia cuando cambia la imagen, se puede cachear
 * para siempre sin quedar nunca sirviendo una foto vieja. Con un nombre elegido
 * por la clienta —"tapa.webp" dos veces— pasaría lo contrario. */
async function claveDe(bytes) {
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

export async function guardarImagen(request, db) {
  const bytes = new Uint8Array(await request.arrayBuffer());

  if (!bytes.length) return { error: "No llegó ninguna foto", estado: 400 };
  if (bytes.length > MAX)
    return { error: `La foto pesa ${Math.round(bytes.length / 1024)} KB y el máximo es ${MAX / 1024} KB`, estado: 413 };
  if (!esWebp(bytes)) return { error: "La foto tiene que ser un WebP", estado: 415 };

  const url = new URL(request.url);
  const medida = (n) => {
    const v = Number(url.searchParams.get(n));
    return Number.isInteger(v) && v > 0 && v <= 10000 ? v : null;
  };
  const ancho = medida("ancho"), alto = medida("alto");

  const clave = (await claveDe(bytes)).slice(0, 32);

  /* OR IGNORE y no un INSERT a secas: la misma foto subida dos veces no es un
     error, es la misma fila. Y no se reescribe, porque el contenido ya es el
     mismo por definición: la clave sale de él. */
  await db.prepare(
    "INSERT OR IGNORE INTO imagenes (clave, tipo, ancho, alto, bytes) VALUES (?, 'image/webp', ?, ?, ?)")
    .bind(clave, ancho, alto, bytes).run();

  return { ruta: `img/${clave}.webp`, clave, ancho, alto };
}

/* Sirve /img/<clave>.webp.
 *
 * Se cachea para siempre porque la dirección depende del contenido: una foto
 * distinta es otra clave y otra dirección. El ETag está igual para que un
 * navegador que ya la tiene se ahorre el cuerpo, y para que la caché del borde
 * de Cloudflare se apoye en él: la fila de D1 se lee una vez por punto de
 * presencia, no una vez por visita. */
export async function servirImagen(db, clave, request) {
  if (!/^[a-f0-9]{6,64}$/.test(clave)) return new Response("No existe", { status: 404 });

  const etag = `"${clave}"`;
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers: { etag, "cache-control": CACHE_IMG } });

  const fila = await db.prepare("SELECT tipo, bytes FROM imagenes WHERE clave = ?").bind(clave).first();
  if (!fila) return new Response("No existe", { status: 404 });

  /* D1 devuelve los BLOB como Array de números, que no es un cuerpo válido para
     Response: la foto salía con 200 y content-type de WebP, pero con cero bytes
     —una imagen rota en la tienda, sin ningún error que lo delatara—. Lo
     encontró la prueba que compara los bytes que vuelven contra los que se
     subieron. Se aceptan las tres formas porque la de D1 no está garantizada y
     miniflare y producción no tienen por qué coincidir. */
  const b = fila.bytes;
  const cuerpo = Array.isArray(b) ? new Uint8Array(b) : b;

  return new Response(cuerpo, {
    headers: { "content-type": fila.tipo, "cache-control": CACHE_IMG, etag },
  });
}

/* Las medidas de las fotos subidas, para que el <img> las declare igual que
   hace medidas.js con las estáticas. Van con el catálogo y no en una consulta
   aparte: son dos números por foto y pedirlas después llegaría tarde, cuando el
   navegador ya reservó el lugar equivocado. */
export async function medidasSubidas(db) {
  const { results } = await db.prepare(
    "SELECT clave, ancho, alto FROM imagenes WHERE ancho IS NOT NULL AND alto IS NOT NULL").all();
  const m = {};
  for (const r of results) m[`${r.clave}.webp`] = { w: r.ancho, h: r.alto };
  return m;
}

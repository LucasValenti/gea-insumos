/* Compara lo que devuelve /api/catalogo contra el catálogo original, el que
 * estaba escrito a mano en datos.js antes de mudarlo a la base.
 *
 *   node herramientas/comparar-catalogo.mjs [url]
 *
 * La mudanza solo está bien si las pantallas no pueden notar la diferencia.
 * Esto lo comprueba campo por campo en vez de confiar en que se ve parecido.
 *
 * Sirve para verificar la mudanza, no como control permanente: en cuanto el
 * stock se mueva de verdad —una venta confirmada desde el panel, una
 * corrección a mano— va a diferir del catálogo congelado, y con razón. Si
 * las únicas diferencias son de stock, la mudanza sigue estando bien.
 */
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const BASE = process.argv[2] || "http://127.0.0.1:8787";

const ventana = {};
runInNewContext(await readFile("db/catalogo-inicial.js", "utf8"), { window: ventana });
const T = ventana.T;
/* Solo los datos: las funciones no viajan por la red. */
const original = {
  NEGOCIO: T.NEGOCIO, CATEGORIAS: T.CATEGORIAS, FAMILIAS: T.FAMILIAS,
  PRODUCTOS: T.PRODUCTOS, DESTACADOS: T.DESTACADOS, HABITUALES: T.HABITUALES,
  ENVIO: T.ENVIO,
};

const res = await fetch(BASE + "/api/catalogo");
if (!res.ok) { console.error("La API respondió " + res.status); process.exit(1); }
const api = await res.json();

const dif = [];
const ver = (ruta, a, b) => {
  if (a === b) return;
  const tipo = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
  if (tipo(a) !== tipo(b)) return dif.push(`${ruta}: original ${tipo(a)} ${JSON.stringify(a)} / api ${tipo(b)} ${JSON.stringify(b)}`);
  if (Array.isArray(a)) {
    if (a.length !== b.length) dif.push(`${ruta}: original tiene ${a.length} y la api ${b.length}`);
    for (let i = 0; i < Math.max(a.length, b.length); i++) ver(`${ruta}[${i}]`, a[i], b[i]);
    return;
  }
  if (a && typeof a === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) { dif.push(`${ruta}.${k}: sobra en la api (${JSON.stringify(b[k])})`); continue; }
      if (!(k in b)) { dif.push(`${ruta}.${k}: falta en la api (${JSON.stringify(a[k])})`); continue; }
      ver(`${ruta}.${k}`, a[k], b[k]);
    }
    return;
  }
  dif.push(`${ruta}: original ${JSON.stringify(a)} / api ${JSON.stringify(b)}`);
};

for (const k of Object.keys(original)) ver(k, original[k], api[k]);

if (!dif.length) {
  console.log(`Idénticos. ${api.PRODUCTOS.length} productos, ` +
    `${api.PRODUCTOS.reduce((a, p) => a + (p.tonos ? p.tonos.length : 0), 0)} tonos, ` +
    `${api.CATEGORIAS.length} categorías.`);
} else {
  console.log(`${dif.length} diferencias:`);
  for (const d of dif.slice(0, 40)) console.log("  " + d);
  if (dif.length > 40) console.log(`  ... y ${dif.length - 40} más`);
  process.exit(1);
}

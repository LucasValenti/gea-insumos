/* Genera db/semilla.sql a partir del catálogo que hoy vive en datos.js.
 *
 *   node herramientas/semilla.mjs
 *
 * Nada se transcribe a mano: se ejecuta db/catalogo-inicial.js —que es el
 * datos.js de antes de la mudanza, tal cual estaba publicado— con un window de
 * mentira, y se leen los objetos que arma.
 *
 * Se lee ese archivo y no public/tienda/datos.js porque datos.js ya no tiene
 * datos: ahora los pide a la API. El catálogo original queda congelado acá
 * para que la carga inicial siga siendo reproducible.
 *
 * Ojo con dos campos derivados: el stock de los productos con tonos y el
 * precioAntes de los kits los calcula datos.js al cargar. No se guardan; los
 * vuelve a calcular la API al servir. Por eso acá se escribe el stock por tono
 * y el precio de cada componente, que es de donde salen.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const js = await readFile("db/catalogo-inicial.js", "utf8");
const ventana = {};
runInNewContext(js, { window: ventana });
const T = ventana.T;

const txt = (v) => (v === null || v === undefined ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'");
const num = (v) => (v === null || v === undefined ? "NULL" : String(v));
const filas = [];
const ins = (tabla, cols, vals) =>
  filas.push(`INSERT INTO ${tabla} (${cols.join(", ")}) VALUES (${vals.join(", ")});`);

filas.push("-- Generado por herramientas/semilla.mjs. No editar a mano.");
/* Sin BEGIN/COMMIT: D1 remoto rechaza las transacciones explícitas dentro de un
   archivo importado, porque envuelve el import por su cuenta (y lo revierte
   entero si algo falla). En local las aceptaba, así que esto solo se veía al
   cargar la base de verdad. */
filas.push("PRAGMA foreign_keys = ON;");
filas.push("DELETE FROM kit_incluye; DELETE FROM kit_componentes; DELETE FROM tonos;");
filas.push("DELETE FROM productos; DELETE FROM subcategorias; DELETE FROM categorias;");
filas.push("DELETE FROM familias; DELETE FROM zonas_envio; DELETE FROM config;");

/* --- config: los datos del negocio y el mínimo de envío gratis --- */
const config = { ...T.NEGOCIO, envioGratisDesde: T.ENVIO.gratisDesde, envioProvisorio: T.ENVIO.provisorio ? 1 : 0 };
for (const [k, v] of Object.entries(config)) ins("config", ["clave", "valor"], [txt(k), txt(v)]);

/* --- categorías y sus subcategorías --- */
T.CATEGORIAS.forEach((c, i) => {
  ins("categorias", ["id", "nombre", "descripcion", "img", "orden"],
    [txt(c.id), txt(c.nombre), txt(c.desc), txt(c.img), i]);
  (c.subs || []).forEach((s, j) =>
    ins("subcategorias", ["id", "categoria_id", "nombre", "orden"],
      [txt(s.id), txt(c.id), txt(s.nombre), j]));
});

T.FAMILIAS.forEach((f, i) =>
  ins("familias", ["id", "nombre", "hex", "orden"], [txt(f.id), txt(f.nombre), txt(f.hex), i]));

T.ENVIO.zonas.forEach((z, i) =>
  ins("zonas_envio", ["id", "nombre", "costo", "plazo", "orden"],
    [txt(z.id), txt(z.nombre), num(z.costo), txt(z.plazo), i]));

/* --- productos --- */
const posEn = (lista, id) => { const i = lista.indexOf(id); return i < 0 ? null : i; };

T.PRODUCTOS.forEach((p, i) => {
  /* El stock de los que tienen tonos se recalcula al servir; guardamos 0 para
     que no queden dos números diciendo cosas distintas. Lo mismo con el
     precio_antes de los kits, que sale de sus componentes. */
  const stock = p.tonos ? 0 : p.stock;
  const precioAntes = p.componentes ? null : p.precioAntes;
  ins("productos",
    ["id", "categoria_id", "sub_id", "marca", "nombre", "precio", "precio_antes", "stock",
     "envio", "contenido", "rinde", "uso", "descripcion", "img", "img_kit", "color",
     "destacado", "habitual", "orden"],
    [txt(p.id), txt(p.cat), txt(p.sub), txt(p.marca), txt(p.nombre), num(p.precio),
     num(precioAntes), num(stock), txt(p.envio), txt(p.contenido), txt(p.rinde), txt(p.uso),
     txt(p.desc), txt(p.img), txt(p.imgKit), txt(p.color),
     num(posEn(T.DESTACADOS, p.id)), num(posEn(T.HABITUALES, p.id)), i]);

  (p.tonos || []).forEach((t, j) =>
    ins("tonos", ["producto_id", "nombre", "hex", "familia_id", "stock", "orden"],
      [txt(p.id), txt(t.nombre), txt(t.hex), txt(t.fam), num(t.stock), j]));

  (p.incluye || []).forEach((texto, j) =>
    ins("kit_incluye", ["kit_id", "texto", "orden"], [txt(p.id), txt(texto), j]));
});

/* Los componentes van al final: apuntan a productos que tienen que existir. */
T.PRODUCTOS.forEach((p) => {
  if (!p.componentes) return;
  /* Un mismo producto puede venir repetido: es la cantidad que lleva el kit. */
  const cuenta = new Map();
  for (const id of p.componentes) cuenta.set(id, (cuenta.get(id) || 0) + 1);
  [...cuenta.entries()].forEach(([id, cant], j) =>
    ins("kit_componentes", ["kit_id", "producto_id", "cantidad", "orden"],
      [txt(p.id), txt(id), num(cant), j]));
});

await mkdir("db", { recursive: true });
await writeFile("db/semilla.sql", filas.join("\n") + "\n");

const cuenta = (t) => filas.filter((f) => f.startsWith(`INSERT INTO ${t} `)).length;
console.log("db/semilla.sql escrito");
for (const t of ["config", "categorias", "subcategorias", "familias", "zonas_envio",
                 "productos", "tonos", "kit_componentes", "kit_incluye"])
  console.log(`  ${t.padEnd(16)} ${cuenta(t)}`);

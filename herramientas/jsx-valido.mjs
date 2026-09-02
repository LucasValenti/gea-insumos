/* Comprueba que el JSX del sitio compile.
 *
 *   node herramientas/jsx-valido.mjs
 *
 * El sitio no tiene paso de build: el JSX lo traduce Babel en el navegador de
 * quien entra. Eso quiere decir que un error de sintaxis no lo agarra nadie
 * hasta que alguien abre la página, y lo que ve es una pantalla en blanco.
 *
 * Se traduce con el mismo Babel que carga el sitio, y de la misma versión, para
 * que lo que pasa acá sea lo que va a pasar en el navegador. Se descarga una
 * vez y queda guardado al lado del proyecto.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const RAIZ = process.cwd();
const ARCHIVOS = [
  "public/tienda/ui.jsx",
  "public/tienda/pantallas-tienda.jsx",
  "public/tienda/pantallas-pedido.jsx",
  "public/ios-frame.jsx",
  "public/tweaks-panel.jsx",
];
/* Los dos html traen su aplicación adentro, en un <script type="text/babel">. */
const HTML = ["public/index.html", "public/admin/index.html"];

/* La versión sale del propio html, así no se puede desincronizar. */
const indice = await readFile(path.join(RAIZ, "public/index.html"), "utf8");
const m = indice.match(/@babel\/standalone@([\d.]+)\/babel\.min\.js/);
if (!m) { console.error("No encontré la versión de Babel en public/index.html"); process.exit(1); }
const VERSION = m[1];
const cache = path.join(RAIZ, "node_modules", ".cache", `babel-standalone-${VERSION}.js`);

if (!existsSync(cache)) {
  await mkdir(path.dirname(cache), { recursive: true });
  const url = `https://unpkg.com/@babel/standalone@${VERSION}/babel.min.js`;
  const r = await fetch(url);
  if (!r.ok) { console.error(`No pude bajar Babel ${VERSION}: ${r.status}`); process.exit(1); }
  const txt = await r.text();
  /* Se compara contra el integrity que ya declara el html: si no coincide, el
     navegador tampoco lo iba a ejecutar, y acá no queremos correr otra cosa. */
  const esperado = (indice.match(/babel\.min\.js"\s+integrity="([^"]+)"/) || [])[1];
  if (esperado) {
    const propio = "sha384-" + createHash("sha384").update(Buffer.from(txt)).digest("base64");
    if (propio !== esperado) {
      console.error(`El Babel que bajé no coincide con el integrity del html.\n  html: ${esperado}\n  bajado: ${propio}`);
      process.exit(1);
    }
  }
  await writeFile(cache, txt);
}

const { default: Babel } = await import("file://" + cache.replace(/\\/g, "/"));
const babel = Babel || globalThis.Babel;

let fallos = 0;
const probar = (nombre, codigo) => {
  try {
    babel.transform(codigo, { presets: ["react"], filename: nombre });
    console.log("  ok   " + nombre);
  } catch (e) {
    fallos++;
    console.log("  MAL  " + nombre + "\n       " + String(e.message).split("\n").slice(0, 3).join("\n       "));
  }
};

for (const f of ARCHIVOS) probar(f, await readFile(path.join(RAIZ, f), "utf8"));

for (const f of HTML) {
  const html = await readFile(path.join(RAIZ, f), "utf8");
  const bloques = [...html.matchAll(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((x) => x[1]).filter((x) => x.trim());
  if (!bloques.length) { console.log("  --   " + f + " (sin bloques en línea)"); continue; }
  bloques.forEach((b, i) => probar(`${f} · bloque ${i + 1}`, b));
}

console.log(fallos ? `\n${fallos} archivos no compilan\n` : "\nTodo compila\n");
process.exit(fallos ? 1 : 0);

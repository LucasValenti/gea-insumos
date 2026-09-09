/* Comprueba que el JSX del sitio compile.
 *
 *   node herramientas/jsx-valido.mjs
 *
 * Antes esta era la única red que había: el JSX lo traducía Babel en el
 * navegador de quien entraba, así que un error de sintaxis no lo agarraba nadie
 * hasta que alguien abría la página, y lo que veía era una pantalla en blanco.
 * Ahora hay paso de build y el error salta al compilar, pero esto sigue
 * sirviendo: tarda un segundo, no escribe ningún archivo y no necesita levantar
 * el sitio.
 *
 * Usa el mismo compilador, las mismas opciones y la misma lista de archivos que
 * herramientas/compilar.mjs, importados de ahí y no copiados. Copiados, se podía
 * agregar un archivo al build y no acá, o cambiar una opción de un solo lado, y
 * esta comprobación seguía dando verde sobre algo que ya no era lo que se
 * publica.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";
import { FUENTES, OPCIONES, RAIZ } from "./compilar.mjs";

let fallos = 0;

const probar = async (nombre, codigo) => {
  try {
    await esbuild.transform(codigo, { ...OPCIONES, sourcefile: nombre });
    console.log("  ok   " + nombre);
  } catch (e) {
    fallos++;
    const detalle = (e.errors || [])
      .map((x) => `${x.text}${x.location ? ` (línea ${x.location.line})` : ""}`).join("\n       ")
      || String(e && e.message || e);
    console.log("  MAL  " + nombre + "\n       " + detalle);
  }
};

for (const f of FUENTES) await probar(f, await readFile(path.join(RAIZ, f), "utf8"));

/* Y que no vuelva a aparecer JSX suelto adentro de un html. Ya no se carga
   Babel, así que un <script type="text/babel"> no lo traduce nadie: esa
   pantalla quedaría en blanco sin un solo error a la vista, que es exactamente
   la clase de falla que este archivo existe para evitar. */
const HTML = ["public/index.html", "public/admin/index.html"];
for (const f of HTML) {
  const html = await readFile(path.join(RAIZ, f), "utf8");
  if (/<script[^>]*type=["']text\/babel["']/.test(html)) {
    fallos++;
    console.log(`  MAL  ${f}\n       tiene un <script type="text/babel"> y Babel ya no se carga`);
  } else {
    console.log(`  ok   ${f} (sin JSX en línea)`);
  }
}

console.log(fallos ? `\n${fallos} archivos no compilan\n` : "\nTodo compila\n");
process.exit(fallos ? 1 : 0);

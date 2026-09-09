/* Traduce el JSX del sitio a JS, antes de publicar y no en el navegador.
 *
 *   node herramientas/compilar.mjs            una vez
 *   node herramientas/compilar.mjs --mirar    y se queda mirando los archivos
 *
 * Por qué existe: hasta acá el sitio cargaba @babel/standalone —3 MB, el 91 %
 * de todo el JavaScript de la página— para traducir 113 KB de JSX en el
 * teléfono de cada visitante, en cada visita. Se descargaba, se parseaba y se
 * compilaba en el hilo principal antes de que se viera un solo producto.
 *
 * Cada .jsx deja su .js hermano. No hay empaquetado ni imports: los archivos
 * siguen siendo IIFE que se cuelgan de window y React sigue entrando por el
 * CDN, exactamente como antes. Lo único que cambia es quién traduce el JSX y
 * cuándo.
 */
import { readFile, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* En el orden en que los carga index.html. Es la única lista que hay:
   herramientas/jsx-valido.mjs la importa de acá en vez de copiarla, porque una
   copia deja agregar un archivo de un lado y no del otro sin que nada avise. */
export const FUENTES = [
  "public/tweaks-panel.jsx",
  "public/ios-frame.jsx",
  "public/tienda/ui.jsx",
  "public/tienda/pantallas-tienda.jsx",
  "public/tienda/pantallas-pedido.jsx",
  "public/app.jsx",
  /* El panel es su propia página y no comparte nada con la tienda, pero traía
     el mismo Babel de 3 MB. Y sin sacarlo de ahí no se puede poner una CSP sin
     unsafe-eval, porque la cabecera vale para todo el sitio. */
  "public/admin/panel.jsx",
];

/* Runtime clásico, que es lo que hacía Babel con el preset "react": React y
   ReactDOM entran como globales desde el CDN. Con el runtime automático
   esbuild emitiría un import de react/jsx-runtime y acá no hay empaquetador
   que lo resuelva. Y target esnext porque el preset "react" tampoco bajaba de
   versión el resto del lenguaje: lo que llegaba al navegador antes es lo mismo
   que llega ahora. */
export const OPCIONES = {
  loader: "jsx",
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  target: "esnext",
};

const salidaDe = (rel) => rel.replace(/\.jsx$/, ".js");

export async function compilarUno(rel) {
  const codigo = await readFile(path.join(RAIZ, rel), "utf8");
  const { code } = await esbuild.transform(codigo, { ...OPCIONES, sourcefile: rel });
  const destino = salidaDe(rel);
  const aviso = `/* Generado desde ${path.basename(rel)} por herramientas/compilar.mjs.\n`
    + `   No lo edites: se sobrescribe en cada build. */\n`;
  await writeFile(path.join(RAIZ, destino), aviso + code, "utf8");
  return destino;
}

export async function compilarTodo({ callado = false } = {}) {
  const hechos = [];
  for (const rel of FUENTES) {
    hechos.push(await compilarUno(rel));
    if (!callado) console.log("  " + salidaDe(rel));
  }
  return hechos;
}

/* Los <script> en línea de los html están permitidos en la CSP de
   public/_headers por su hash. Si alguien toca uno y no actualiza el hash, el
   navegador lo bloquea sin decir una palabra: en index.html eso es el destello
   blanco de vuelta al abrir la página, y en el panel es una pantalla que no
   arranca. Se comprueba acá para que falle antes de publicar y no después. */
export const HTML_CON_CSP = ["public/index.html", "public/admin/index.html"];

export async function revisarCSP() {
  const headers = await readFile(path.join(RAIZ, "public/_headers"), "utf8");
  const faltan = [];
  for (const rel of HTML_CON_CSP) {
    const html = await readFile(path.join(RAIZ, rel), "utf8");
    /* Solo los que traen el código adentro: los que tienen src los cubre 'self'. */
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      /* Con los saltos normalizados: el parser de HTML convierte cada \r\n en
         \n antes de que el contenido llegue a ser texto del script, así que el
         navegador hashea la versión con \n. Calcularlo sobre el archivo crudo
         daba un hash que no coincidía con ninguno, y en un repo con archivos
         CRLF eso bloquea el script sin que el build se entere. */
      const contenido = m[1].replace(/\r\n/g, "\n");
      const hash = "sha256-" + createHash("sha256").update(contenido, "utf8").digest("base64");
      if (!headers.includes(hash)) faltan.push(`${rel}\n     falta '${hash}' en la CSP de public/_headers`);
    }
  }
  return faltan;
}

/* Solo cuando se lo llama como comando: importarlo no tiene que compilar nada. */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await compilarTodo();
  } catch (e) {
    console.error("\nNo compila:\n" + (e && e.message ? e.message : e) + "\n");
    process.exit(1);
  }

  const faltan = await revisarCSP();
  if (faltan.length) {
    console.error("\nLa CSP no cubre los scripts en línea:\n  " + faltan.join("\n  ")
      + "\n\n  Pegá el hash en public/_headers, en script-src.\n");
    process.exit(1);
  }

  if (process.argv.includes("--mirar")) {
    console.log("\nMirando. Ctrl+C para salir.\n");
    /* Los editores disparan el evento dos o tres veces por guardado, y guardar
       mientras se compila deja el .js a medias. Un pelo de espera lo junta
       todo en una sola compilación. */
    const pendientes = new Map();
    for (const rel of FUENTES) {
      watch(path.join(RAIZ, rel), () => {
        clearTimeout(pendientes.get(rel));
        pendientes.set(rel, setTimeout(async () => {
          try {
            await compilarUno(rel);
            console.log(`  ${new Date().toLocaleTimeString("es-AR")}  ${salidaDe(rel)}`);
          } catch (e) {
            console.error(`  ${new Date().toLocaleTimeString("es-AR")}  MAL  ${rel}\n     `
              + String(e && e.message || e).split("\n").slice(0, 3).join("\n      "));
          }
        }, 40));
      });
    }
  }
}

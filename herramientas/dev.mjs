/* npm run dev.
 *
 * Compila el JSX, se queda mirándolo y levanta wrangler al lado, todo en una
 * terminal. La idea es que el paso de build no cambie cómo se trabaja: se
 * guarda un archivo y se refresca el navegador, igual que cuando el JSX lo
 * traducía Babel en vivo. La diferencia es que ahora lo traduce esta máquina
 * una vez, y no el teléfono de cada visitante en cada visita.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilarTodo, RAIZ } from "./compilar.mjs";

console.log("Compilando el JSX…");
try {
  await compilarTodo({ callado: true });
} catch (e) {
  console.error("\nNo compila, así que no levanto nada:\n"
    + (e && e.message ? e.message : e) + "\n");
  process.exit(1);
}

const hijos = [];
let cerrando = false;

const cerrar = (codigo = 0) => {
  if (cerrando) return;
  cerrando = true;
  for (const h of hijos) { try { h.kill(); } catch (e) {} }
  process.exit(codigo);
};

/* El shell hace falta solo para npx, que en Windows es un .cmd y spawn no
   encuentra sin él. Para node va sin shell a propósito: con shell los
   argumentos se concatenan sin comillas, y como node vive en "Program Files"
   el intérprete cortaba en el espacio y contestaba que no conoce "C:\\Program". */
const lanzar = (cmd, args, { shell = false } = {}) => {
  const h = spawn(cmd, args, { cwd: RAIZ, stdio: "inherit", shell });
  hijos.push(h);
  /* Si uno de los dos se muere, el otro no sirve solo: mejor caerse entero y
     que se vea, que quedar con medio entorno andando y no darse cuenta. */
  h.on("exit", (codigo) => cerrar(codigo || 0));
  return h;
};

process.on("SIGINT", () => cerrar(0));
process.on("SIGTERM", () => cerrar(0));

lanzar(process.execPath, [path.join(RAIZ, "herramientas", "compilar.mjs"), "--mirar"]);
lanzar("npx", ["wrangler", "dev"], { shell: true });

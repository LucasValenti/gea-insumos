/* npm run dev.
 *
 * Compila el JSX, se queda mirándolo y levanta wrangler al lado, todo en una
 * terminal. La idea es que el paso de build no cambie cómo se trabaja: se
 * guarda un archivo y se refresca el navegador, igual que cuando el JSX lo
 * traducía Babel en vivo. La diferencia es que ahora lo traduce esta máquina
 * una vez, y no el teléfono de cada visitante en cada visita.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilarTodo, RAIZ } from "./compilar.mjs";

/* Todas las herramientas apuntan a 127.0.0.1:8787 por defecto, así que el
   puerto es parte del contrato y no un detalle.

   Si está ocupado, wrangler no falla: se corre al 8788 y sigue como si nada.
   Eso es un fallo silencioso de los caros — con un wrangler viejo todavía
   escuchando en el 8787, `npm run audita` y `npm run flujo` miden el build
   anterior y dan verde sobre código que ya no existe. Pasó. Por eso acá se
   comprueba antes y, si está tomado, no se levanta nada. */
const PUERTO = 8787;

const libre = (puerto) => new Promise((resolver) => {
  const s = net.createServer();
  s.once("error", () => resolver(false));
  s.once("listening", () => s.close(() => resolver(true)));
  s.listen(puerto, "127.0.0.1");
});

if (!(await libre(PUERTO))) {
  console.error(`\nEl puerto ${PUERTO} está ocupado, y wrangler se correría al siguiente`);
  console.error("sin avisar. Las herramientas seguirían apuntando acá y medirían");
  console.error("lo que esté sirviendo el de antes.\n");
  console.error("Casi siempre es un wrangler de una sesión anterior. Para verlo:");
  console.error(`  netstat -ano | findstr :${PUERTO}\n`);
  process.exit(1);
}

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

/* kill() se lleva puesto al hijo directo y nada más. Acá el hijo directo es npx,
   que abre wrangler, que abre otro node, que abre workerd — y workerd es el que
   tiene el puerto. Matando solo a npx quedaba toda esa cola viva y el 8787
   tomado. Con /T se va el árbol entero. */
const matarArbol = (h) => {
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(h.pid), "/T", "/F"], { stdio: "ignore" });
    else h.kill();
  } catch (e) {}
};

const cerrar = (codigo = 0) => {
  if (cerrando) return;
  cerrando = true;
  for (const h of hijos) matarArbol(h);
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

/* Baja las librerías de terceros a public/vendor/, verificando los bytes.
 *
 *   node herramientas/vendor.mjs
 *
 * Por qué dejaron de venir de un CDN: cada origen ajeno cuesta DNS, TCP y TLS
 * antes del primer byte, y los tres eran render-blocking. Lighthouse los midió
 * bloqueando el pintado 1019 ms (react), 693 ms (react-dom) y 1004 ms
 * (animate.css) en un celular de gama media con 4G. Sirviéndolos del propio
 * dominio viajan por la conexión que ya está abierta para el html.
 *
 * El hash no es decorativo: es el mismo sha384 que estaba en el atributo
 * integrity cuando los servía el CDN. Verificarlo acá prueba que la copia local
 * es byte a byte lo que se venía sirviendo, y que actualizar una versión es una
 * decisión y no un accidente. Si no coincide, no se escribe nada.
 *
 * El nombre lleva la versión adentro a propósito: así public/_headers los puede
 * cachear para siempre sin dejar a nadie clavado con una versión vieja.
 */
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { RAIZ } from "./compilar.mjs";

const DESTINO = path.join(RAIZ, "public", "vendor");

const PAQUETES = [
  {
    url: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
    archivo: "react-18.3.1.min.js",
    sha384: "DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z",
  },
  {
    url: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
    archivo: "react-dom-18.3.1.min.js",
    sha384: "gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1",
  },
  {
    url: "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css",
    archivo: "animate-4.1.1.min.css",
    sha384: "Gu3KVV2H9d+yA4QDpVB7VcOyhJlAVrcXd0thEjr4KznfaFPLe0xQJyonVxONa4ZC",
  },
];

/* La hoja de Google Fonts era el mayor bloqueador del pintado que quedaba:
   1385 bytes que costaban 844 ms porque son DNS + TCP + TLS a un origen nuevo
   antes de saber siquiera qué archivo de fuente pedir.
 *
 * Lo único que devuelve son declaraciones @font-face apuntando a gstatic, así
 * que se traen acá y se meten en el bundle propio. Las fuentes siguen saliendo
 * de gstatic —no hay binarios de fuente en el repo, que es la decisión de
 * siempre— pero ahora se descubren al leer un CSS que ya estaba viajando, y con
 * display=swap no bloquean nada.
 *
 * El User-Agent importa: sin uno moderno, Google contesta con .ttf en vez de
 * .woff2 y el archivo pesa el triple. */
const FUENTES = {
  url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap",
  archivo: "fuentes.css",
  ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
};

await fs.mkdir(DESTINO, { recursive: true });

let fallos = 0;
for (const p of PAQUETES) {
  const salida = path.join(DESTINO, p.archivo);
  let bytes;
  try {
    const r = await fetch(p.url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    bytes = Buffer.from(await r.arrayBuffer());
  } catch (e) {
    console.error(`  MAL  ${p.archivo} — no lo pude bajar: ${e.message}`);
    fallos++;
    continue;
  }

  const hash = createHash("sha384").update(bytes).digest("base64");
  if (hash !== p.sha384) {
    console.error(`  MAL  ${p.archivo} — el hash no coincide, no lo escribo`);
    console.error(`       esperaba sha384-${p.sha384}`);
    console.error(`       vino     sha384-${hash}`);
    fallos++;
    continue;
  }

  await fs.writeFile(salida, bytes);
  console.log(`  ok   ${p.archivo}  ${(bytes.length / 1024).toFixed(1)} KB  sha384 verificado`);
}

/* Las fuentes no llevan hash: Google reescribe esa hoja cuando actualiza una
   familia, así que un hash fijo daría un fallo por cada actualización de ellos.
   Lo que sí se comprueba es que sea lo que decimos que es —solo @font-face, solo
   URLs de gstatic, y en woff2—, porque acá entra texto de un tercero a un CSS
   nuestro y "vino de Google" no es una comprobación. */
try {
  const r = await fetch(FUENTES.url, { headers: { "User-Agent": FUENTES.ua } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const css = await r.text();

  const caras = (css.match(/@font-face/g) || []).length;
  const ajenas = (css.match(/url\((https?:)?\/\/(?!fonts\.gstatic\.com)/g) || []).length;
  if (!caras) throw new Error("no vino ni una declaración @font-face");
  if (ajenas) throw new Error(`${ajenas} URL apuntan fuera de fonts.gstatic.com`);
  if (!css.includes("format('woff2')")) throw new Error("no vino en woff2 — ¿el User-Agent?");

  await fs.writeFile(path.join(DESTINO, FUENTES.archivo), css);
  console.log(`  ok   ${FUENTES.archivo}  ${(css.length / 1024).toFixed(1)} KB  ${caras} caras, todas de gstatic en woff2`);
} catch (e) {
  console.error(`  MAL  ${FUENTES.archivo} — ${e.message}`);
  fallos++;
}

if (fallos) {
  console.error(`\n${fallos} no se pudieron verificar — no toqué esos archivos\n`);
  process.exit(1);
}
console.log(`\nTodo en public/vendor/, verificado\n`);

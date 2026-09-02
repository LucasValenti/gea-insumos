/* Prepara las fotos para la web: convierte a WebP y deja anotadas las medidas.
 *
 *   node herramientas/imagenes.mjs           # convierte lo que falte
 *   node herramientas/imagenes.mjs --forzar  # rehace todo
 *
 * Las medidas van a parar a public/tienda/img/medidas.js, que el sitio usa
 * para declarar width y height en cada <img>. Sin eso el navegador no sabe
 * cuánto lugar reservar y la página salta cuando entran las fotos.
 *
 * WebP y no JPEG porque pesa cerca de un tercio, y porque el sitio ya pide
 * navegadores más nuevos que WebP para otras cosas (color-mix, aspect-ratio):
 * un respaldo en JPEG no sumaría compatibilidad real, solo peso al repo.
 */
import sharp from "sharp";
import { readdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, parse } from "node:path";

const DIR = "public/tienda/img";
const CALIDAD = 80;
/* Ninguna foto se muestra a más de ~770px de ancho real, ni siquiera en un
   escritorio grande con pantalla 2x. Guardar originales de 1440 era mandar
   píxeles que el navegador tira. 1100 deja margen y no se nota. */
const ANCHO_MAX = 1100;
const forzar = process.argv.includes("--forzar");

const archivos = (await readdir(DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
const medidas = {};
let antes = 0, despues = 0;

for (const f of archivos) {
  const { name } = parse(f);
  const origen = join(DIR, f);
  const destino = join(DIR, name + ".webp");
  antes += (await stat(origen)).size;

  if (!existsSync(destino) || forzar) {
    await sharp(origen).resize({ width: ANCHO_MAX, withoutEnlargement: true })
      .webp({ quality: CALIDAD }).toFile(destino);
  }
  const m = await sharp(destino).metadata();
  medidas[name + ".webp"] = { w: m.width, h: m.height };
  despues += (await stat(destino)).size;
  console.log(`${name}.webp  ${m.width}x${m.height}`);
}

/* Las que ya estaban en WebP también necesitan sus medidas anotadas. */
for (const f of (await readdir(DIR)).filter((f) => f.endsWith(".webp"))) {
  if (medidas[f]) continue;
  const m = await sharp(join(DIR, f)).metadata();
  medidas[f] = { w: m.width, h: m.height };
}

/* Sale como JS y no como JSON para que el sitio lo lea con un <script> normal:
   sin build, un fetch solo para esto sería un pedido más y una espera antes de
   poder dibujar. */
await writeFile(join(DIR, "medidas.js"),
  "/* Generado por herramientas/imagenes.mjs. No editar a mano. */\n" +
  "window.MEDIDAS = " + JSON.stringify(medidas, null, 1) + ";\n");

const kb = (n) => Math.round(n / 1024) + "KB";
console.log(`\n${archivos.length} convertidas: ${kb(antes)} -> ${kb(despues)} ` +
  `(${Math.round((1 - despues / antes) * 100)}% menos)`);
console.log(`medidas.js con ${Object.keys(medidas).length} entradas`);

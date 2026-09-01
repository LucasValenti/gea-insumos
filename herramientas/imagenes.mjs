/* Redimensiona cada foto al doble de lo que el sitio realmente la muestra
   (medido con herramientas/medidas-img.json), que es lo que necesita una
   pantalla 2x. Conserva nombre y formato para no tocar referencias; los
   originales quedan en el historial de git y en la carpeta del escritorio. */
import sharp from 'sharp';
import fs from 'fs/promises';

const DIR = 'public/tienda/img';
const TOPE = 1800;          // ninguna foto necesita más que esto
const POR_DEFECTO = 1200;   // para las que no llegué a medir en pantalla
const CALIDAD = 82;

const medidas = JSON.parse(await fs.readFile('herramientas/medidas-img.json', 'utf8'));
const files = (await fs.readdir(DIR)).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
let antes = 0, despues = 0, tocados = 0;

for (const f of files) {
  const p = DIR + '/' + f;
  const bruto = await fs.readFile(p);
  const m = await sharp(bruto).metadata();
  antes += bruto.length;

  const vista = medidas[f];
  /* Las fotos se pintan con object-fit: cover, así que el archivo tiene que
     cubrir AMBOS ejes en una pantalla 2x. Con fit outside la imagen envuelve
     la caja: usar el lado mayor como tope dejaba el otro eje corto. */
  const anchoObj = Math.min(TOPE, vista ? Math.ceil(vista.w * 2) : POR_DEFECTO);
  const altoObj  = Math.min(TOPE, vista ? Math.ceil(vista.h * 2) : POR_DEFECTO);
  const objetivo = Math.max(anchoObj, altoObj);

  if (Math.max(m.width, m.height) <= objetivo && bruto.length < 250 * 1024) { despues += bruto.length; continue; }

  let t = sharp(bruto).resize({ width: anchoObj, height: altoObj, fit: 'outside', withoutEnlargement: true });
  t = m.format === 'webp' ? t.webp({ quality: CALIDAD })
    : m.format === 'png' ? t.png({ compressionLevel: 9 })
      : t.jpeg({ quality: CALIDAD, mozjpeg: true, progressive: true });

  const salida = await t.toBuffer();
  if (salida.length >= bruto.length) { despues += bruto.length; continue; }
  await fs.writeFile(p, salida);
  const m2 = await sharp(salida).metadata();
  despues += salida.length;
  tocados++;
  console.log(`  ${f.padEnd(24)} ${String(Math.round(bruto.length / 1024)).padStart(5)}KB ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)}`
    + ` → ${String(Math.round(salida.length / 1024)).padStart(4)}KB ${m2.width}x${m2.height}`
    + (vista ? `  (en pantalla ${vista.w}x${vista.h})` : '  (sin medir)'));
}
console.log(`\n  ${tocados} optimizadas · total ${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(2)} MB (-${Math.round((1 - despues / antes) * 100)}%)`);

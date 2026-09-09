import { chromium } from 'playwright';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/* El sitio ya no se puede probar contra archivos estáticos: el catálogo lo
   sirve el Worker en /api/catalogo. Por eso apunta a `wrangler dev`
   (npm run dev), no a herramientas/servidor.mjs. Se puede pasar otra
   dirección por GEA_URL para auditar producción. */
const BASE = process.env.GEA_URL || 'http://127.0.0.1:8787/';
/* Igual que auditoria.mjs: las capturas van a la carpeta temporal del
   sistema. Se puede fijar otra con GEA_OUT. */
const OUT = process.env.GEA_OUT || path.join(os.tmpdir(), 'gea-recorrido');
await fs.mkdir(OUT, { recursive: true });

const variante = process.argv[2] || 'esc';
const conf = variante === 'movil'
  ? { w: 390, h: 844, tw: {} }
  : { w: 1440, h: 900, tw: {} };

function tweaks(o) {
  return JSON.stringify({ direccion: 'editorial', vista: 'escritorio', tema: 'claro',
    boton: 'cápsula', movimiento: 'expresivo', barras: 'vidrio', ...o }, null, 2);
}

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: conf.w, height: conf.h } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push('[pageerror] ' + String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errores.push('[error] ' + m.text().slice(0, 200)); });

/* La variante se fija inyectando window.GEA_TWEAKS arriba de app.js. Antes se
   reescribía el bloque EDITMODE sobre la respuesta del documento, que dejó de
   contener la app cuando el JSX pasó a compilarse — y en app.js esbuild borra el
   comentario de cierre, así que la expresión regular tampoco coincide ahí.
   Ninguna de las dos fallaba: replace() sin coincidencia devuelve el texto
   igual, y el recorrido salía con los valores por defecto haciéndose pasar por
   otro. Se comprueba contra la página cargada. */
const esperado = tweaks(conf.tw);
await page.route('**/app.js', async (route) => {
  const res = await route.fetch();
  const body = await res.text();
  await route.fulfill({ response: res, body: `window.GEA_TWEAKS = ${esperado};\n${body}` });
});
await page.goto(BASE, { waitUntil: 'networkidle' });
const aplicada = await page.evaluate(() => (window.GEA_TWEAKS ? JSON.stringify(window.GEA_TWEAKS, null, 2) : null));
if (aplicada !== esperado) throw new Error('la variante no llegó a la página — la página tiene ' + aplicada);
await page.waitForSelector('.ap');
await page.waitForTimeout(1000);

// Baja despacio para que el IntersectionObserver dispare todos los revelados.
async function revelarTodo() {
  await page.evaluate(async () => {
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
    const alto = document.documentElement.scrollHeight;
    for (let y = 0; y < alto; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo(0, y); await dormir(140);
    }
    window.scrollTo(0, alto); await dormir(400);
    window.scrollTo(0, 0); await dormir(300);
  });
  await page.waitForTimeout(500);
}

async function estado(nombre) {
  await revelarTodo();
  const sin = await page.evaluate(() => ({
    sinRevelar: document.querySelectorAll('.rev:not(.vis), .rev-esc:not(.vis)').length,
    totalRev: document.querySelectorAll('.rev, .rev-esc').length,
    alto: document.documentElement.scrollHeight,
  }));
  await page.screenshot({ path: `${OUT}/${variante}-${nombre}.png`, fullPage: true });
  const botones = await page.evaluate(() => [...document.querySelectorAll('button, a[href]')]
    .map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(Boolean).slice(0, 40));
  console.log(`\n── ${nombre} · alto ${sin.alto}px · sin revelar ${sin.sinRevelar}/${sin.totalRev}`);
  console.log('   clicables: ' + JSON.stringify(botones));
  return sin;
}

await estado('inicio');
await nav.close();
console.log('\nerrores JS: ' + JSON.stringify(errores));
console.log('capturas en ' + OUT);

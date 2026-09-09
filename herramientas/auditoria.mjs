import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/* El sitio ya no se puede probar contra archivos estáticos: el catálogo lo
   sirve el Worker en /api/catalogo. Por eso apunta a `wrangler dev`
   (npm run dev), no a herramientas/servidor.mjs. Se puede pasar otra
   dirección por GEA_URL para auditar producción. */
const BASE = process.env.GEA_URL || 'http://127.0.0.1:8787/';
/* Las capturas son de usar y tirar: van a la carpeta temporal del sistema, no
   al repositorio ni a una ruta de una maquina en particular. Se puede fijar
   otra con GEA_OUT. */
const OUT = process.env.GEA_OUT || path.join(os.tmpdir(), 'gea-auditoria');
await fs.mkdir(OUT, { recursive: true });

/* Fija la variante inyectando window.GEA_TWEAKS arriba de app.js, sin tocar
   archivos.

   Antes reescribía el bloque EDITMODE sobre la respuesta del documento. Eso
   funcionaba cuando la app vivía adentro de index.html; desde que se compila
   aparte no puede funcionar de dos maneras a la vez: el bloque ya no está en el
   html, y en app.js esbuild conserva el comentario de apertura pero borra el de
   cierre, así que la expresión regular no coincide. Ninguna de las dos fallaba
   —replace() sin coincidencia devuelve el texto igual—, y las siete variantes
   corrieron con los valores por defecto mientras el informe las nombraba una por
   una: tema oscuro, movil-preview y reposición nunca se auditaron.

   Ahora se comprueba contra la página cargada, que es lo único que prueba que la
   variante llegó, y si no llegó el caso es un fallo y no un silencio. */
/* El marco se inyecta justo antes de app.js, y con defer como los demás: así
   entra en la misma cola y corre después de React y antes de la app, que es el
   orden que necesita. */
const TAG_APP = '<script defer src="app.js"></script>';
const TAG_MARCO = '<script defer src="ios-frame.js"></script>';

function tweaks(o) {
  return JSON.stringify({
    direccion: 'editorial', vista: 'escritorio', tema: 'claro',
    boton: 'cápsula', movimiento: 'expresivo', barras: 'vidrio', ...o,
  }, null, 2);
}

const CASOS = [
  { id: 'esc-1440-claro',  w: 1440, h: 900, tw: {} },
  { id: 'esc-1440-oscuro', w: 1440, h: 900, tw: { tema: 'oscuro' } },
  { id: 'esc-768-claro',   w: 768,  h: 1024, tw: {} },
  { id: 'real-390-claro',  w: 390,  h: 844, tw: {} },
  { id: 'real-390-oscuro', w: 390,  h: 844, tw: { tema: 'oscuro' } },
  /* Este mira la previsualización enmarcada, que es una herramienta de diseño:
     el marco de iPhone ya no se publica y se inyecta solo para este caso. Su
     axe:1 —"region", contenido fuera de landmarks— es del reloj de la barra de
     estado falsa del marco, no de la tienda. No lo persigas. */
  { id: 'movil-preview',   w: 1440, h: 900, tw: { vista: 'movil' } },
  { id: 'esc-1440-repos',  w: 1440, h: 900, tw: { direccion: 'reposición' } },
];

const navegador = await chromium.launch();
const informe = [];

for (const c of CASOS) {
  const ctx = await navegador.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const consola = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
  page.on('pageerror', (e) => consola.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on('requestfailed', (r) => consola.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText}`));

  const esperado = tweaks(c.tw);
  await page.route('**/app.js', async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    await route.fulfill({ response: res, body: `window.GEA_TWEAKS = ${esperado};\n${body}` });
  });

  /* El marco de iPhone ya no se publica —es de prototipado y bloqueaba el
     pintado—, y esta variante es justamente la que lo mira. Se inyecta solo acá:
     lo demás se audita tal como se sirve. */
  let marco = c.tw.vista !== 'movil';
  if (!marco) {
    await page.route(BASE, async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      marco = body.includes(TAG_APP);
      await route.fulfill({ response: res, body: body.replace(TAG_APP, TAG_MARCO + TAG_APP) });
    });
  }

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  /* Contra la página cargada, no contra el texto que mandamos: es lo único que
     prueba que la variante llegó, se parseó y es la que se está mirando. */
  const aplicada = await page.evaluate(() => (window.GEA_TWEAKS ? JSON.stringify(window.GEA_TWEAKS, null, 2) : null));
  if (aplicada !== esperado) throw new Error(`${c.id}: la variante no llegó a la página — se pidió ${JSON.stringify(c.tw)} y la página tiene ${aplicada}`);
  if (!marco) throw new Error(`${c.id}: no encontré ${TAG_APP} en el html — no pude inyectar el marco`);
  await page.waitForSelector('.ap', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const mount = Date.now() - t0;

  // ¿Desborde horizontal? Y si lo hay, quién lo causa.
  const desborde = await page.evaluate(() => {
    const de = document.documentElement;
    const hay = de.scrollWidth > de.clientWidth + 1;
    const culpables = [];
    if (hay) {
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right > de.clientWidth + 1 && r.width > 0) {
          culpables.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 3).join('.')} → derecha ${Math.round(r.right)}px de ${de.clientWidth}px`);
        }
        if (culpables.length > 12) break;
      }
    }
    return { hay, ancho: de.scrollWidth, viewport: de.clientWidth, culpables };
  });

  // Clase de régimen realmente aplicada.
  const regimen = await page.evaluate(() => {
    const ap = document.querySelector('.ap');
    return { clases: ap ? ap.className : null, tema: document.documentElement.getAttribute('data-theme') };
  });

  await page.screenshot({ path: `${OUT}/${c.id}.png`, fullPage: true });

  let axe = { violaciones: [], error: null };
  try {
    const r = await new AxeBuilder({ page }).analyze();
    axe.violaciones = r.violations.map((v) => ({
      id: v.id, impacto: v.impact, cuantos: v.nodes.length,
      desc: v.help,
      ejemplo: v.nodes[0]?.html?.slice(0, 160),
      detalle: v.nodes[0]?.any?.[0]?.message || v.nodes[0]?.failureSummary?.slice(0, 200),
    }));
  } catch (e) { axe.error = String(e).slice(0, 200); }

  informe.push({ caso: c.id, viewport: `${c.w}x${c.h}`, tweaks: c.tw, mount_ms: mount, regimen, desborde, consola, axe });
  console.log(`✓ ${c.id} — montó en ${mount}ms · desborde:${desborde.hay} · axe:${axe.violaciones.length} · consola:${consola.length}`);
  await ctx.close();
}

await navegador.close();
await fs.writeFile(`${OUT}/informe.json`, JSON.stringify(informe, null, 2));
console.log('\nInforme en ' + OUT + '/informe.json');

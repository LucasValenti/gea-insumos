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

// Reescribe el bloque EDITMODE al vuelo para fijar la variante, sin tocar archivos.
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

  await page.route(BASE, async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace(/\/\*EDITMODE-BEGIN\*\/[\s\S]*?\/\*EDITMODE-END\*\//,
      `/*EDITMODE-BEGIN*/${tweaks(c.tw)}/*EDITMODE-END*/`);
    await route.fulfill({ response: res, body });
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'networkidle' });
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

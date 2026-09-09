/* Mide la tienda como la mide Google, con freno de CPU y de red.
 *
 *   node herramientas/lighthouse.mjs [url]
 *
 * Por qué hace falta otra herramienta si ya existe audita:rendimiento: esa mide
 * pesos y tiempos contra 127.0.0.1, sin frenar nada. Es útil, pero es justo la
 * configuración donde el problema no se ve — una máquina rápida contra un
 * servidor local esconde exactamente lo que sufre un celular de gama media con
 * 4G. Lighthouse en modo mobile frena la CPU 4× y simula 4G, que es el
 * escenario real de quien entra desde Instagram.
 *
 * Los tres números que importan y sus umbrales, que son los de Google:
 *   LCP  cuándo se ve lo más grande de la pantalla      bueno: ≤ 2,5 s
 *   TBT  cuánto tiempo el teléfono queda trabado        bueno: ≤ 200 ms
 *   CLS  cuánto se mueve el contenido mientras carga    bueno: ≤ 0,1
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";

const URL_BASE = process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787";

/* chrome-launcher busca un Chrome instalado en el sistema. Si no hay, se usa el
   que ya bajó playwright para las otras herramientas, así no hace falta
   instalar nada más. */
if (!process.env.CHROME_PATH) {
  try { process.env.CHROME_PATH = chromium.executablePath(); } catch (e) {}
}

const UMBRALES = [
  ["largest-contentful-paint", "LCP", 2500, (v) => (v / 1000).toFixed(2) + " s"],
  ["total-blocking-time", "TBT", 200, (v) => Math.round(v) + " ms"],
  ["cumulative-layout-shift", "CLS", 0.1, (v) => v.toFixed(3)],
];

let chrome;
try {
  chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
} catch (e) {
  console.error("No pude abrir un Chrome: " + (e && e.message || e));
  console.error("Probá con CHROME_PATH apuntando a un Chrome instalado.");
  process.exit(2);
}

try {
  const { lhr } = await lighthouse(URL_BASE, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
  });

  console.log(`\n${URL_BASE}\n`);
  let fallos = 0;
  for (const [id, sigla, tope, formato] of UMBRALES) {
    const auditoria = lhr.audits[id];
    const v = auditoria && auditoria.numericValue;
    if (v == null) { console.log(`  --   ${sigla}  sin dato`); continue; }
    const bien = v <= tope;
    if (!bien) fallos++;
    console.log(`  ${bien ? "OK  " : "MAL "} ${sigla}  ${formato(v).padStart(9)}   tope ${formato(tope)}`);
  }
  /* Qué elemento es el LCP: sin esto, un LCP alto no dice qué hay que arreglar,
     y se termina optimizando lo que no era. */
  const elem = lhr.audits["largest-contentful-paint-element"];
  const nodo = elem && elem.details && elem.details.items && elem.details.items[0];
  const dato = nodo && nodo.items && nodo.items[0] && nodo.items[0].node;
  if (dato) console.log(`\n  El LCP es: ${(dato.nodeLabel || dato.snippet || "").slice(0, 90)}`);

  const puntaje = Math.round((lhr.categories.performance.score || 0) * 100);
  console.log(`\n  Rendimiento: ${puntaje}/100`);

  console.log(fallos ? `\n${fallos} de 3 métricas por encima del tope\n` : "\nLas tres dentro del tope\n");
  process.exit(fallos ? 1 : 0);
} catch (e) {
  console.error("\nLighthouse falló: " + (e && e.message || e) + "\n");
  process.exit(2);
} finally {
  if (chrome) await chrome.kill();
}

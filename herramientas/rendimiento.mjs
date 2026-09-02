import { chromium } from 'playwright';
const BASE = process.argv[2] || process.env.GEA_URL || 'http://127.0.0.1:8787/';
const nav = await chromium.launch();
const page = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const t0 = Date.now();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.ap', { timeout: 30000 });
const montaje = Date.now() - t0;
await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const rs = performance.getEntriesByType('resource').map((e) => ({
    url: e.name.replace(/^https?:\/\//, '').slice(0, 58),
    ms: Math.round(e.duration),
    kb: Math.round((e.transferSize || e.encodedBodySize || 0) / 1024),
    fin: Math.round(e.responseEnd),
  })).sort((a, b) => b.ms - a.ms);
  const nav = performance.getEntriesByType('navigation')[0];
  const pintado = performance.getEntriesByType('paint').map((p) => p.name + ': ' + Math.round(p.startTime) + 'ms');
  return { rs: rs.slice(0, 9), dcl: Math.round(nav.domContentLoadedEventEnd), pintado,
    totalKb: Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || e.encodedBodySize || 0), 0) / 1024) };
});
console.log(`\nmontaje de React: ${montaje}ms · DOMContentLoaded ${r.dcl}ms`);
console.log('pintado: ' + r.pintado.join(' · '));
console.log('peso total descargado: ' + r.totalKb + ' KB\n');
console.log('recursos más lentos:');
r.rs.forEach((x) => console.log(`  ${String(x.ms).padStart(5)}ms  ${String(x.kb).padStart(4)}KB  fin ${String(x.fin).padStart(5)}ms  ${x.url}`));
await nav.close();

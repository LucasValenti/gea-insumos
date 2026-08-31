import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8788/';
const nav = await chromium.launch();

for (const v of [{ id: 'movil-390', w: 390, h: 844 }, { id: 'escritorio-1440', w: 1440, h: 900 }]) {
  const ctx = await nav.newContext({ viewport: { width: v.w, height: v.h } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ap'); await page.waitForTimeout(1200);

  const m = await page.evaluate(() => {
    const sel = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
      ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : '');

    // Texto diminuto
    const chico = new Map();
    for (const el of document.querySelectorAll('*')) {
      if (!el.childNodes.length) continue;
      const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!propio) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) {
        const k = sel(el) + ' @' + fs + 'px';
        chico.set(k, (chico.get(k) || 0) + 1);
      }
    }

    // Áreas táctiles chicas (mínimo recomendado 44x44)
    const tap = new Map();
    for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        const k = `${sel(el)} → ${Math.round(r.width)}x${Math.round(r.height)}`;
        tap.set(k, (tap.get(k) || 0) + 1);
      }
    }

    return {
      textoChico: [...chico.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14),
      tapChico: [...tap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14),
      totalInteractivos: document.querySelectorAll('button, a[href], input, textarea').length,
      altoPagina: document.documentElement.scrollHeight,
    };
  });

  console.log('\n' + '='.repeat(64));
  console.log(v.id + '  (alto de la home: ' + m.altoPagina + 'px, ' + m.totalInteractivos + ' interactivos)');
  console.log('\n  TEXTO DE MENOS DE 12px:');
  m.textoChico.forEach(([k, n]) => console.log(`    ${n}×  ${k}`));
  console.log('\n  ÁREA TÁCTIL MENOR A 44px:');
  m.tapChico.forEach(([k, n]) => console.log(`    ${n}×  ${k}`));
  await ctx.close();
}
await nav.close();

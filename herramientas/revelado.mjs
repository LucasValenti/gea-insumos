import { chromium } from 'playwright';
const nav = await chromium.launch();
const page = await (await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
await page.goto(process.env.GEA_URL || 'http://127.0.0.1:8787/', { waitUntil: 'networkidle' });
await page.waitForSelector('.ap'); await page.waitForTimeout(1000);
const tabs = page.locator('.barra-bot button');

/* Baja despacio por toda la pantalla y recién después mira qué quedó sin
   revelar: un .rev debajo del pliegue TIENE que estar invisible, eso es el
   diseño. El bug es que siga invisible después de pasarle por encima. */
const revisar = async (paso) => {
  await page.waitForTimeout(700);
  await page.evaluate(async () => { const d = (m) => new Promise((r) => setTimeout(r, m));
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await d(110); }
    window.scrollTo(0, h); await d(350); window.scrollTo(0, 0); await d(250); });
  const malos = await page.evaluate(() => [...document.querySelectorAll('.rev, .rev-esc')]
    .filter((x) => !x.classList.contains('vis') && x.getBoundingClientRect().height > 0)
    .map((x) => x.className).slice(0, 4));
  console.log(`  ${paso.padEnd(40)} ${malos.length ? 'SIGUEN INVISIBLES: ' + JSON.stringify(malos) : 'ok'}`);
};

await revisar('inicio');
await tabs.nth(1).click(); await revisar('tab catálogo');
await page.locator('.chip').filter({ hasText: /Esmaltes semis/i }).first().click(); await revisar('filtrar por categoría');
await tabs.nth(2).click(); await page.locator('.busca input').first().fill('gel'); await revisar('buscar');
await tabs.nth(1).click(); await page.waitForTimeout(400);
const ag = page.getByRole('button', { name: 'Agregar', exact: true }).first();
if (await ag.count()) { await ag.scrollIntoViewIfNeeded(); await ag.click(); }
await tabs.nth(3).click(); await revisar('carrito con un producto');
await page.locator('.carro-fila button').filter({ hasText: /Quitar/i }).first().click(); await revisar('vaciar el carrito');
await tabs.nth(4).click(); await revisar('tab ayuda');
await tabs.nth(0).click(); await revisar('volver al inicio');
await nav.close();

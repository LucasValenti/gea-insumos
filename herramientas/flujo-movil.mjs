import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const BASE = 'http://127.0.0.1:8788/';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push('[pageerror] ' + String(e).slice(0, 180)));
page.on('console', (m) => { if (m.type() === 'error') errores.push('[error] ' + m.text().slice(0, 180)); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.ap'); await page.waitForTimeout(1200);

const axe = async (d) => {
  const r = await new AxeBuilder({ page }).analyze();
  console.log(`   axe ${d}: ${r.violations.length ? r.violations.map((x) => x.id + ' x' + x.nodes.length).join(', ') : 'limpio'}`);
};
const ORDEN = ['Inicio','Catálogo','Buscar','Pedido','Ayuda'];
const tab = (n) => page.locator('.barra-bot button').nth(ORDEN.indexOf(n));

console.log('1. HOME MÓVIL'); await axe('home');
console.log('   tabs:', await page.locator('.barra-bot button').count());

console.log('\n2. AGREGO PRODUCTOS');
const ag = page.getByRole('button', { name: 'Agregar', exact: true });
const n = await ag.count();
for (let i = 0; i < n; i++) { await ag.nth(i).scrollIntoViewIfNeeded(); await ag.nth(i).click(); await page.waitForTimeout(220); }
console.log(`   ${n} agregados · contador: ` + await page.locator('.barra-bot .globo').first().textContent().catch(() => 'sin contador'));

console.log('\n3. TAB CATÁLOGO'); await tab('Catálogo').click(); await page.waitForTimeout(900); await axe('catálogo');
console.log('4. TAB BUSCAR'); await tab('Buscar').click(); await page.waitForTimeout(700);
await page.locator('.busca input').first().fill('acrilico'); await page.waitForTimeout(700);
console.log('   resultados para "acrilico": ' + await page.locator('.card, .cat-fila').count());

console.log('\n5. TAB PEDIDO'); await tab('Pedido').click(); await page.waitForTimeout(2000); await axe('carrito');
await page.getByRole('button', { name: /Continuar/i }).first().click();
await page.waitForTimeout(1000);
console.log('6. CHECKOUT'); await axe('checkout');
await page.getByPlaceholder('Ana Gómez').fill('Ana Gómez');
await page.getByPlaceholder('11 5555 5555').fill('341 555 1234');
await page.getByPlaceholder('Calle 123, Piso 4 B').fill('San Martín 1234');
await page.getByText('Rosario y Gran Rosario').first().click().catch(async () => { await page.locator('[role="radiogroup"] >> nth=1').locator('button, div').first().click(); });
await page.waitForTimeout(600);
const enviar = page.locator('.accion-checkout button').first();
console.log('   botón enviar deshabilitado: ' + await enviar.isDisabled());
await enviar.click(); await page.waitForTimeout(1000);
console.log('\n7. CONFIRMACIÓN'); await axe('confirmación');
const msg = await page.locator('pre').first().textContent().catch(() => null);
console.log('   ' + (msg ? msg.split('\n').slice(-6).join('\n   | ') : 'sin mensaje'));
console.log('\nerrores JS: ' + JSON.stringify(errores));
await nav.close();

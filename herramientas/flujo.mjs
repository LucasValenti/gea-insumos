import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

/* El sitio ya no se puede probar contra archivos estáticos: el catálogo lo
   sirve el Worker en /api/catalogo. Por eso apunta a `wrangler dev`
   (npm run dev), no a herramientas/servidor.mjs. Se puede pasar otra
   dirección por GEA_URL para auditar producción. */
const BASE = process.env.GEA_URL || 'http://127.0.0.1:8787/';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push('[pageerror] ' + String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errores.push('[error] ' + m.text().slice(0, 200)); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.ap'); await page.waitForTimeout(1200);

/* Las apariciones al entrar en pantalla animan la opacidad durante .6s. Si axe
   mide en el medio, lee el texto mezclado con el fondo y reporta contrastes
   que no existen: el .eyebrow del carrito daba 4.31 al 95% de opacidad y 4.77
   ya terminado. Esperamos a que lo visible esté asentado. */
const asentado = async () => {
  await page.waitForFunction(() => ![...document.querySelectorAll('.rev,.rev-esc')].some((e) => {
    const r = e.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(e).opacity) < 0.99;
  }), null, { timeout: 4000 }).catch(() => {});
};

const axe = async (donde) => {
  await asentado();
  const r = await new AxeBuilder({ page }).analyze();
  const v = r.violations;
  console.log(`   axe ${donde}: ${v.length ? v.map((x) => x.id + ' x' + x.nodes.length).join(', ') : 'limpio'}`);
};

console.log('\n1. HOME');
await axe('home');

console.log('\n2. AGREGAR AL PEDIDO');
/* La tarjeta ya no lleva un botón que diga "Agregar" a secas: es redondo y su
   nombre accesible incluye el producto ("Agregar Kit Esculpidas al pedido"). */
const agregar = page.getByRole('button', { name: /^Agregar .+ al pedido$/ });
const n = await agregar.count();
for (let i = 0; i < n; i++) { await agregar.nth(i).click(); await page.waitForTimeout(260); }
const toast = await page.locator('.toast span').first().textContent().catch(() => null);
console.log(`   ${n} botones "Agregar" · último toast: ${JSON.stringify(toast)}`);

console.log('\n3. TOPE DE STOCK (mismo botón muchas veces)');
for (let i = 0; i < 30; i++) { await agregar.nth(0).click(); await page.waitForTimeout(45); }
await page.waitForTimeout(400);
console.log('   toast al tope: ' + JSON.stringify(await page.locator('.toast span').first().textContent().catch(() => null)));

console.log('\n4. CARRITO');
await page.getByRole('button', { name: /^Pedido,/ }).click();
await page.waitForTimeout(900);
await axe('carrito');

console.log('\n5. CHECKOUT');
await page.getByRole('button', { name: /Continuar/i }).first().click();
await page.waitForTimeout(900);
await axe('checkout');
console.log('   aviso: ' + JSON.stringify(await page.locator('.carro-aviso').first().textContent().catch(() => null)));

console.log('\n6. COMPLETO DATOS Y ELIJO ZONA SIN TARIFA');
await page.getByPlaceholder('Ana Gómez').fill('Ana Gómez');
await page.getByPlaceholder('11 5555 5555').fill('341 555 1234');
await page.getByPlaceholder('Calle 123, Piso 4 B').fill('San Martín 1234, Piso 2 B');
await page.getByPlaceholder('Rosario · 2000').fill('Rosario · 2000');
await page.getByPlaceholder(/Si no hay Rojo/).fill('Si no hay Rojo Clásico, mandá Rojo Cereza.');
await page.getByText('No sé en qué zona entro').click();
await page.waitForTimeout(500);
console.log('   aviso: ' + JSON.stringify(await page.locator('.carro-aviso').first().textContent().catch(() => null)));
const cta = page.locator('.carro-cta button').first();
console.log('   botón enviar deshabilitado: ' + await cta.isDisabled());

console.log('\n7. CONFIRMACIÓN Y MENSAJE DE WHATSAPP');
await cta.click();
await page.waitForTimeout(1000);
const msg = await page.locator('pre').first().textContent().catch(() => null);
console.log('   ' + (msg ? msg.split('\n').map((l) => '   | ' + l).join('\n').trim() : 'no encontré el mensaje'));
await axe('confirmación');

console.log('\n8. AYUDA Y CONTACTO');
for (const [nombre, etiqueta] of [['Cómo comprar', 'ayuda'], ['Contacto', 'contacto'], ['Catálogo', 'catálogo']]) {
  await page.getByRole('button', { name: nombre, exact: true }).first().click();
  await page.waitForTimeout(800);
  await axe(etiqueta);
}

console.log('\nerrores JS: ' + JSON.stringify(errores));
await nav.close();

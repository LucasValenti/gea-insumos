/* Revisa que ningún botón tenga esquinas cuadradas.
 *
 *   node herramientas/formas.mjs [url]
 *
 * La regla del sistema (tokens/layout.css) es de dos radios: las superficies
 * van casi rectas y todo lo que se toca es cápsula. A ojo eso no se puede
 * revisar: los botones están repartidos en siete pantallas de la tienda más el
 * panel, y basta que a uno se le haya escrito el radio a mano para que quede
 * cuadrado sin que se note hasta verlo en el celular.
 *
 * Así que se mide. Para cada control con caja visible —fondo propio o borde—
 * se compara el radio contra la mitad del lado más corto: si llega, es
 * cápsula; si no, está cuadrado y se reporta con la pantalla y el texto que
 * tiene adentro, para poder ir a buscarlo.
 *
 * Los controles sin caja (los de la barra de abajo, "QUITAR", los acordeones)
 * no tienen forma que mirar salvo el anillo de foco, y se listan aparte.
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const BASE = process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787";

const MEDIR = () => {
  const transparente = (c) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c);
  /* Algunos controles son <a> y no <button> —la acción de la tarjeta manda a
     WhatsApp cuando el producto está agotado—, así que van por clase. */
  const controles = [...document.querySelectorAll(
    'button, [role="button"], [role="radio"], [role="tab"], input, select, textarea,' +
    'a.btn, a.card-accion, a.mas, a.chip'
  )];
  return controles.map((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") return null;
    const radios = [s.borderTopLeftRadius, s.borderTopRightRadius,
      s.borderBottomRightRadius, s.borderBottomLeftRadius]
      .map((v) => parseFloat(v) || 0);
    const conBorde = parseFloat(s.borderTopWidth) > 0 && !transparente(s.borderTopColor);
    const conFondo = !transparente(s.backgroundColor);
    return {
      /* Cuatro cosas se tocan y no son botones: la tarjeta de una categoría, su
         fila en el listado, la baldosa de un tono y la fila de una opción de
         envío o de pago. Llevan el radio de las superficies porque son
         superficies, y con forma de píldora quedarían ridículas.

         Van nombradas y no medidas. Antes esto se decidía por la altura —menos
         de 56px es un botón—, y en producción una zona de envío sin costo quedó
         de un solo renglón, bajó a 53px y la herramienta la denunció como botón
         cuadrado. El tamaño no dice qué es una cosa.

         Va con matches y no con closest a propósito: el botón de agregar vive
         adentro de la tarjeta y sí tiene que ser cápsula. */
      superficie: el.matches(".cat-carta, .cat-fila, .tono, .opt"),
      etiqueta: (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : el.tagName.toLowerCase()),
      texto: (el.getAttribute("aria-label") || el.value || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34),
      w: Math.round(r.width), h: Math.round(r.height),
      radio: Math.min(...radios),
      caja: conBorde || conFondo,
      campo: ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) && !el.closest(".pa-paso, .step"),
    };
  }).filter(Boolean);
};

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 402, height: 860 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

let cuadrados = 0, sinCaja = 0, medidos = 0, superficies = 0;
const revisar = async (pantalla) => {
  await page.waitForTimeout(500);
  let n = 0, mal = 0;
  for (const c of await page.evaluate(MEDIR)) {
    /* Los campos de texto van con el radio de las superficies a propósito: no
       son botones. Se cuentan pero no se exigen. */
    if (c.campo) continue;
    if (!c.caja) { sinCaja++; continue; }
    if (c.superficie) { superficies++; continue; }
    medidos++; n++;
    const capsula = c.radio >= Math.min(c.w, c.h) / 2 - 1;
    if (!capsula) {
      cuadrados++; mal++;
      console.log(`  CUADRADO  ${pantalla.padEnd(13)} ${c.etiqueta}  ${c.w}x${c.h}  radio ${c.radio}px  ${JSON.stringify(c.texto)}`);
    }
  }
  console.log(`  ${pantalla.padEnd(13)} ${String(n).padStart(3)} botones  ${mal ? mal + " cuadrados" : "todos cápsula"}`);
};

console.log("\nTIENDA");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector(".ap");
await revisar("inicio");

await page.getByRole("button", { name: "Catálogo", exact: true }).first().click();
await revisar("catálogo");

/* La foto es el link a la ficha; el nombre queda debajo del pie de la tarjeta
   y el clic se lo lleva el botón de acción. */
await page.locator(".card-media").first().click();
await page.waitForTimeout(600);
await revisar("ficha");

await page.locator(".accion .btn").first().click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^Pedido,/ }).click();
await revisar("carrito");

await page.getByRole("button", { name: /Continuar/i }).first().click();
await revisar("checkout");

await page.getByRole("button", { name: "Ayuda", exact: true }).first().click();
await revisar("ayuda");

console.log("\nPANEL");
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
await page.goto(BASE + "/admin/", { waitUntil: "networkidle" });
await revisar("ingreso");
await page.locator('input[type="password"]').fill(vars.ADMIN_PASSWORD);
await page.getByRole("button", { name: /Entrar/i }).click();
await page.waitForTimeout(1200);
await revisar("pedidos");
for (const t of ["Productos y stock", "Datos del negocio", "Envíos"]) {
  await page.getByRole("button", { name: t }).click();
  await revisar(t.split(" ")[0].toLowerCase());
}

console.log(`\n${medidos} botones medidos · ${superficies} superficies que se tocan (tarjetas, tonos, opciones) · ` +
  `${sinCaja} controles sin caja · ` + (cuadrados ? `${cuadrados} BOTONES CUADRADOS` : "ningún botón cuadrado"));
await nav.close();
process.exit(cuadrados ? 1 : 0);

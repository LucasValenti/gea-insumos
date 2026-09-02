/* Recorre la ficha de producto del panel como la usaría Lucas, en un celular.
 *
 *   node herramientas/panel-ficha.mjs [url]
 *
 * La API ya está probada aparte (catalogo-prueba.mjs). Lo que falta demostrar
 * es que la pantalla la usa bien: que abrir una ficha muestra lo que hay, que
 * guardar cambia de verdad, que el borrado pide confirmación antes, y que las
 * pantallas nuevas no tienen fallas de accesibilidad.
 *
 * Crea un producto de prueba y lo borra al terminar.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

const BASE = process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787";
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));

let fallos = 0;
const ok = (bien, txt, extra = "") => {
  console.log((bien ? "  OK   " : "  MAL  ") + txt + (extra ? "  ← " + extra : ""));
  if (!bien) fallos++;
};

const NOMBRE = "Producto De Prueba Visual";
const catalogo = () => fetch(BASE + "/api/catalogo").then((r) => r.json());

/* Una corrida que se corta a la mitad deja el producto de prueba en la base, y
   la siguiente crea otro con el mismo nombre y otro id. Buscar por nombre
   encontraría el viejo y la prueba fallaría diciendo una mentira. Así que se
   limpia antes y después, y adentro se trabaja siempre contra el id. */
const entrar = await fetch(BASE + "/api/admin/entrar", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ contrasena: vars.ADMIN_PASSWORD }),
});
const cookie = (entrar.headers.get("set-cookie") || "").split(";")[0];
const limpiar = async () => {
  for (const p of (await catalogo()).PRODUCTOS.filter((x) => x.nombre === NOMBRE))
    await fetch(`${BASE}/api/admin/producto/${p.id}`, { method: "DELETE", headers: { cookie } });
};
await limpiar();

const nav = await chromium.launch();
/* Ancho de celular pero sin isMobile. El diseño depende del ancho, no de la
   emulación, así que la pantalla que se prueba es la misma; con isMobile, en
   cambio, Playwright calcula mal el punto del clic cuando el documento está
   scrolleado y falla en controles que están perfectamente a la vista. */
const ctx = await nav.newContext({ viewport: { width: 402, height: 860 } });
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 200)); });

const axe = async (donde) => {
  await page.waitForTimeout(400);
  const { violations } = await new AxeBuilder({ page }).analyze();
  ok(!violations.length, `axe en ${donde}`,
    violations.map((v) => `${v.id} x${v.nodes.length}`).join(", "));
  await sinDesborde(donde);
};

/* La página no se mueve para el costado. axe no lo mira y a simple vista en el
   escritorio tampoco se nota, pero en el celular deja los campos cortados: un
   <select> con una opción larga alcanza para empujar la grilla entera. */
const sinDesborde = async (donde) => {
  const d = await page.evaluate(() => ({ ancho: document.body.clientWidth, scroll: document.body.scrollWidth }));
  ok(d.scroll <= d.ancho, `no se desborda a lo ancho en ${donde}`,
    `mide ${d.scroll}px en una pantalla de ${d.ancho}px`);
};

await page.goto(BASE + "/admin/", { waitUntil: "networkidle" });
await page.locator('input[type="password"]').fill(vars.ADMIN_PASSWORD);
await page.getByRole("button", { name: /Entrar/i }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Productos y stock" }).click();
await page.waitForTimeout(700);

console.log("\n1. ALTA DESDE LA PANTALLA");
await page.getByRole("button", { name: "Nuevo producto" }).click();
await page.waitForTimeout(400);
await axe("alta de producto");
ok(await page.getByRole("button", { name: /Crear producto/ }).isDisabled(),
  "el botón de crear arranca apagado hasta que haya nombre y precio");
await page.getByLabel("Nombre").fill(NOMBRE);
await page.getByLabel("Precio").fill("31500");
await page.getByLabel("Stock inicial").fill("9");
await page.getByRole("button", { name: /Crear producto/ }).click();
await page.waitForTimeout(1600);
ok(await page.getByRole("button", { name: /Volver a la lista/ }).isVisible(),
  "después de crearlo se abre su ficha");

/* La ficha muestra el id arriba a la derecha. Es el que hay que seguir: buscar
   por nombre daría cualquiera de los que se llamen igual. */
const ID = (await page.locator(".pa-ficha-h .pa-marca").textContent()).trim();
const enTienda = async () => (await catalogo()).PRODUCTOS.find((x) => x.id === ID);
ok(/^producto-de-prueba-visual/.test(ID), `la ficha abierta es la del producto nuevo (${ID})`);

console.log("\n2. LA FICHA MUESTRA LO QUE HAY");
ok(await page.getByLabel("Nombre", { exact: true }).inputValue() === NOMBRE, "el nombre");
ok(await page.getByLabel("Precio", { exact: true }).inputValue() === "31500", "el precio");
await axe("ficha de producto");

console.log("\n3. GUARDAR CAMBIA DE VERDAD");
await page.getByLabel("Descripción").fill("Texto escrito desde el panel.");
await page.getByLabel("Contenido").fill("15 ml");
await page.getByRole("button", { name: /Guardar cambios/ }).click();
await page.waitForTimeout(1400);
{
  const p = await enTienda();
  ok(p && p.desc === "Texto escrito desde el panel.", "la descripción llegó al catálogo público");
  ok(p && p.contenido === "15 ml", "y el contenido también");
}

console.log("\n4. DESTACADO");
await page.getByRole("checkbox", { name: /Destacados/ }).check();
await page.getByRole("button", { name: /Guardar cambios/ }).click();
await page.waitForTimeout(1400);
ok((await catalogo()).DESTACADOS.includes(ID), "queda marcado como destacado en la portada");
await page.getByRole("checkbox", { name: /Destacados/ }).uncheck();
await page.getByRole("button", { name: /Guardar cambios/ }).click();
await page.waitForTimeout(1400);
ok(!(await catalogo()).DESTACADOS.includes(ID), "y al destildarlo sale de la portada");

console.log("\n5. TONOS DESDE LA PANTALLA");
await page.getByRole("button", { name: "Agregar un tono" }).click();
await page.waitForTimeout(300);
await page.getByLabel("Nombre del tono").fill("Tono De Prueba");
await page.getByLabel("Stock", { exact: true }).last().fill("5");
await page.getByRole("button", { name: "Agregar tono" }).click();
await page.waitForTimeout(1500);
ok(await page.getByText("Tono De Prueba").isVisible(), "el tono aparece en la lista");
ok(await page.getByText(/Es el último tono/).isVisible(),
  "y avisa que sacarlo dejaría el producto sin stock");

console.log("\n6. BORRAR PIDE CONFIRMACIÓN");
const borrarProducto = page.getByRole("button", { name: "Borrar este producto" });
await borrarProducto.click();
await page.waitForTimeout(300);
ok(await page.getByText(new RegExp("¿Borro " + NOMBRE)).isVisible(), "primero pregunta");
await page.getByRole("button", { name: "No", exact: true }).click();
await page.waitForTimeout(300);
ok(await borrarProducto.isVisible(), "y se puede arrepentir");
ok(!!(await enTienda()), "el producto sigue estando");

console.log("\n7. BORRAR DE VERDAD Y VOLVER A LA LISTA");
await borrarProducto.click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Sí, borrar" }).click();
await page.waitForTimeout(1800);
ok(await page.getByRole("button", { name: "Nuevo producto" }).isVisible(),
  "vuelve a la lista después de borrar");
ok(!(await enTienda()), "y el producto ya no está en el catálogo");

console.log("\n8. LA FICHA DE UN PRODUCTO CON TONOS");
await page.getByRole("button", { name: "Editar la ficha" }).first().click();
await page.waitForTimeout(800);
await axe("ficha con tonos");

console.log("\nerrores JS: " + JSON.stringify(errores));
if (errores.length) fallos++;
await nav.close();
await limpiar();
console.log(fallos ? `\n${fallos} comprobaciones fallaron\n` : "\nTodo en orden\n");
process.exit(fallos ? 1 : 0);

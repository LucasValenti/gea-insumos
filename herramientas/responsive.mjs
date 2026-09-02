/* Barrido de anchos y temas, en la tienda y en el panel.
 *
 *   node herramientas/responsive.mjs [url]
 *
 * Tres cosas por pantalla y por ancho:
 *   - que la página no se mueva para el costado (es lo que más se nota y lo
 *     que menos avisa: en el escritorio no se ve y en el celular corta textos);
 *   - que ningún elemento se salga de la pantalla, con nombre y apellido;
 *   - que axe no encuentre fallas, que dependen del ancho porque el layout
 *     cambia y con él los contrastes y el orden de los encabezados.
 *
 * Los anchos no son redondos por gusto: 320 es el iPhone SE y el piso real,
 * 360 y 390 son los Android y iPhone más comunes, 430 el iPhone grande, 768 y
 * 1024 los quiebres de tablet, y 1440 y 1920 los monitores.
 *
 * El bucle va con el ancho y el tema afuera y las pantallas adentro. Al revés
 * —un navegador nuevo por combinación— tardaba veinte minutos y era imposible
 * iterar sobre lo que iba encontrando.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

const BASE = (process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
/* Se puede pasar un ancho, o varios separados por coma, para repetir solo la
   parte que interesa sin esperar el barrido entero. */
const ANCHOS = process.argv[3]
  ? process.argv[3].split(",").map(Number).filter((n) => n > 0)
  : [320, 360, 390, 430, 768, 1024, 1440, 1920];
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));

let fallos = 0;

/* Qué se sale de la pantalla. Se ignora lo que está adentro de un contenedor
   que scrollea a propósito —los carruseles de chips, la barra de pestañas—,
   que es justamente cómo tiene que funcionar. */
const DESBORDES = () => {
  const limite = document.documentElement.clientWidth;
  const scrollea = (e) => {
    for (let p = e.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden") return true;
    }
    return false;
  };
  const fuera = [];
  for (const e of document.querySelectorAll("body *")) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= limite + 1 && r.left >= -1) continue;
    if (scrollea(e)) continue;
    /* Si el padre ya se sale, el hijo no agrega información. */
    if (fuera.some((f) => f.nodo.contains(e))) continue;
    fuera.push({
      nodo: e,
      que: e.tagName.toLowerCase() + (e.className && typeof e.className === "string"
        ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""),
      izq: Math.round(r.left), der: Math.round(r.right),
    });
  }
  return fuera.slice(0, 4).map(({ que, izq, der }) => ({ que, izq, der }));
};

const TIENDA = ["inicio", "catalogo", "ficha", "carrito", "checkout", "ayuda"];
const PANEL = ["ingreso", "pedidos", "productos", "ficha", "negocio", "envios"];

const abrirTienda = async (page, donde) => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".ap");
  await page.waitForTimeout(600);
  if (donde === "inicio") return;
  /* Arriba de 820px la barra de abajo desaparece y la navegación pasa al
     encabezado, donde "Ayuda" se llama "Cómo comprar". El nombre del control
     cambia con el ancho, así que la prueba tiene que aceptar los dos. */
  if (donde === "ayuda") {
    await page.getByRole("button", { name: /^(Ayuda|Cómo comprar)$/ }).first().click();
    await page.waitForTimeout(600);
    return;
  }
  await page.getByRole("button", { name: "Catálogo", exact: true }).first().click();
  await page.waitForTimeout(600);
  if (donde === "catalogo") return;
  if (donde === "ficha") { await page.locator(".card-media").first().click(); await page.waitForTimeout(700); return; }

  const ag = page.getByRole("button", { name: /^Agregar .+ al pedido$/ });
  for (let i = 0; i < Math.min(2, await ag.count()); i++) { await ag.nth(i).click(); await page.waitForTimeout(200); }
  await page.getByRole("button", { name: /^Pedido,/ }).click();
  await page.waitForTimeout(700);
  if (donde === "checkout") {
    await page.getByRole("button", { name: /Continuar/i }).first().click();
    await page.waitForTimeout(700);
  }
};

const abrirPanel = async (page, donde) => {
  await page.goto(BASE + "/admin/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  if (donde === "ingreso") return;
  if (await page.locator('input[type="password"]').count()) {
    await page.locator('input[type="password"]').fill(vars.ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.waitForTimeout(1200);
  }
  if (donde === "pedidos") return;
  await page.getByRole("button", { name: "Productos y stock" }).click();
  await page.waitForTimeout(700);
  if (donde === "productos") return;
  if (donde === "ficha") { await page.getByRole("button", { name: "Editar la ficha" }).first().click(); }
  else if (donde === "negocio") { await page.getByRole("button", { name: "Datos del negocio" }).click(); }
  else if (donde === "envios") { await page.getByRole("button", { name: "Envíos" }).click(); }
  await page.waitForTimeout(700);
};

/* axe mide colores ya compuestos: si lo hace a mitad de un fundido lee el texto
   mezclado con el fondo y denuncia contrastes que no existen. Se espera a que
   las apariciones terminen. Las animaciones infinitas quedan afuera o esto no
   terminaría nunca. */
const asentado = async (page) => {
  /* El cartel de "Agregado" tapa el contenido mientras dura, y axe mide contra
     lo que hay debajo: daba fallas de contraste que no se reproducen. No es
     parte de la pantalla que se está revisando, así que se espera a que se
     vaya. */
  await page.waitForFunction(() => !document.querySelector(".toast"), null, { timeout: 6000 }).catch(() => {});
  await page.waitForFunction(() => ![...document.querySelectorAll(".rev,.rev-esc")].some((e) => {
    const r = e.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(e).opacity) < 0.99;
  }), null, { timeout: 4000 }).catch(() => {});
  await page.evaluate(() => Promise.race([
    Promise.allSettled(document.getAnimations()
      .filter((a) => a.playState === "running" && a.effect?.getComputedTiming?.().iterations !== Infinity)
      .map((a) => a.finished)),
    new Promise((r) => setTimeout(r, 4000)),
  ])).catch(() => {});
};

async function revisar(page, etiqueta, errores) {
  await page.waitForTimeout(400);
  await asentado(page);
  const d = await page.evaluate(() => ({
    ancho: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  const fuera = await page.evaluate(DESBORDES);
  const { violations } = await new AxeBuilder({ page }).analyze();

  const problemas = [];
  if (d.scroll > d.ancho + 1) problemas.push(`se mueve al costado (${d.scroll} en ${d.ancho})`);
  if (fuera.length) problemas.push("se salen: " + fuera.map((f) => `${f.que} [${f.izq}..${f.der}]`).join(", "));
  if (violations.length) problemas.push("axe: " + violations.map((v) => `${v.id} x${v.nodes.length}`).join(", "));
  if (errores.length) problemas.push("js: " + errores[0]);
  errores.length = 0;

  if (problemas.length) { fallos++; console.log(`  MAL  ${etiqueta} · ${problemas.join(" · ")}`); }
  return !problemas.length;
}

const nav = await chromium.launch();
for (const tema of ["light", "dark"]) {
  for (const w of ANCHOS) {
    const ctx = await nav.newContext({ viewport: { width: w, height: 900 }, colorScheme: tema });
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(String(e).slice(0, 120)));
    let bien = 0, total = 0;
    const et = `${String(w).padStart(4)}px ${tema.padEnd(5)}`;

    for (const [abrir, lista, quien] of [[abrirTienda, TIENDA, "tienda"], [abrirPanel, PANEL, "panel"]]) {
      for (const donde of lista) {
        total++;
        try {
          await abrir(page, donde);
          if (await revisar(page, `${et} ${quien}/${donde}`, errores)) bien++;
        } catch (e) {
          fallos++;
          console.log(`  MAL  ${et} ${quien}/${donde} · no se pudo abrir: ${String(e.message).split("\n")[0].slice(0, 80)}`);
        }
      }
    }
    console.log(`  ${et} · ${bien}/${total} pantallas limpias`);
    await ctx.close();
  }
}
await nav.close();
console.log(fallos ? `\n${fallos} pantallas con problemas\n` : "\nTodo en orden\n");
process.exit(fallos ? 1 : 0);

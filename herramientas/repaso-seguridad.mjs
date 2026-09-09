/* Repaso de seguridad y robustez de la API, de punta a punta.
 *
 *   node herramientas/repaso-seguridad.mjs [url]
 *
 * panel-seguridad.mjs ya cubre lo básico del panel: que sin cookie no se
 * escriba y que la lista blanca de campos se respete. Esto va por lo otro:
 * carreras, datos de configuración en estados raros, cabeceras de respuesta,
 * qué se filtra en los mensajes de error y qué pasa cuando llega basura.
 *
 * Deja todo como estaba: lo que cambia para probar, lo devuelve.
 */
import { readFile } from "node:fs/promises";

const BASE = (process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));

let fallos = 0, avisos = 0;
const ok = (bien, txt, extra = "") => {
  console.log((bien ? "  OK   " : "  MAL  ") + txt + (extra ? "  ← " + extra : ""));
  if (!bien) fallos++;
};
const nota = (txt, extra = "") => { console.log("  ojo  " + txt + (extra ? "  ← " + extra : "")); avisos++; };

/* El bloque de frenos gasta los ocho intentos permitidos y deja la IP frenada
   quince minutos, con lo cual la corrida siguiente no puede ni entrar. Por eso
   va aparte y solo cuando se pide. */
const CON_FRENOS = process.argv.includes("--frenos");

const entrar = await fetch(BASE + "/api/admin/entrar", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ contrasena: vars.ADMIN_PASSWORD }),
});
if (entrar.status === 429) {
  console.error("\nLa IP está frenada por intentos fallidos: hay que esperar 15 minutos.\n" +
    "Si es por una corrida anterior con --frenos, se puede limpiar con:\n" +
    "  npx wrangler d1 execute gea-catalogo --local --command \"DELETE FROM intentos_login\"\n");
  process.exit(1);
}
if (!entrar.ok) { console.error("No pude entrar al panel: " + entrar.status); process.exit(1); }
const cookie = (entrar.headers.get("set-cookie") || "").split(";")[0];
const admin = (ruta, o = {}) => fetch(BASE + "/api/admin" + ruta, {
  method: o.method || "GET", headers: { "content-type": "application/json", cookie },
  body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined,
});
const catalogo = () => fetch(BASE + "/api/catalogo").then((r) => r.json());
const pedir = (cuerpo) => fetch(BASE + "/api/pedidos", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo),
});
/* Los pedidos también tienen freno por hora, y una corrida gasta varios. Si se
   frena, lo que sigue mide cualquier cosa: mejor decirlo y cortar. */
const pedirOk = async (cuerpo) => {
  const r = await pedir(cuerpo);
  const d = await r.json().catch(() => ({}));
  if (r.status === 429) {
    console.error("\nEl alta de pedidos está frenada por esta IP. Para seguir probando:\n" +
      "  npx wrangler d1 execute gea-catalogo --local --command \"DELETE FROM pedidos_ritmo\"\n");
    process.exit(1);
  }
  if (!r.ok) console.log("       (el pedido no entró: " + (d.error || r.status) + ")");
  return d;
};
const DATOS = { nombre: "Repaso", tel: "3415551234", envio: "retiro", pago: "efectivo" };

console.log("\n1. CABECERAS DE RESPUESTA");
for (const [ruta, quien] of [["/", "la tienda"], ["/admin/", "el panel"], ["/api/catalogo", "el catálogo"]]) {
  const r = await fetch(BASE + ruta);
  const h = (n) => r.headers.get(n);
  const faltan = [
    !h("x-content-type-options") && "x-content-type-options",
    !h("referrer-policy") && "referrer-policy",
    !h("x-frame-options") && !/frame-ancestors/.test(h("content-security-policy") || "") && "protección contra iframes",
  ].filter(Boolean);
  if (faltan.length) nota(`${quien} sale sin ${faltan.join(", ")}`);
  else ok(true, `${quien} trae las cabeceras de seguridad`);
}
{
  const r = await fetch(BASE + "/api/catalogo");
  ok(/no-store|private/.test(r.headers.get("cache-control") || "") === false,
    "el catálogo se puede cachear (es público, corresponde)", r.headers.get("cache-control"));
  const r2 = await fetch(BASE + "/api/admin/sesion", { headers: { cookie } });
  ok(/no-store/.test(r2.headers.get("cache-control") || ""),
    "las respuestas del panel van sin caché", r2.headers.get("cache-control"));
}

console.log("\n2. RUTAS QUE NO EXISTEN BAJO /admin");
{
  const r = await fetch(BASE + "/admin/lo-que-sea");
  const cuerpo = await r.text();
  const esPanel = cuerpo.includes("Panel · GEA");
  const esTienda = cuerpo.includes("GEA Insumos") && !esPanel;
  ok(r.status === 200 && (esPanel || esTienda),
    `/admin/lo-que-sea devuelve ${esPanel ? "el panel" : esTienda ? "la tienda" : "otra cosa"} (${r.status})`);
  if (esTienda) nota("una dirección inventada bajo /admin abre la tienda, no un 404");
}

console.log("\n3. QUÉ CUENTAN LOS MENSAJES DE ERROR");
{
  const r = await fetch(BASE + "/api/pedidos", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{ esto no es json",
  });
  const t = await r.text();
  ok(!/at \w+ \(|\.js:\d+|SQLITE|D1_/.test(t), "un cuerpo roto no devuelve rastros internos", t.slice(0, 120));
  const r2 = await admin("/producto/no-existe", { method: "PATCH", cuerpo: { precio: "x" } });
  const t2 = await r2.text();
  ok(!/at \w+ \(|\.js:\d+|SQLITE|D1_/.test(t2), "ni un campo inválido en el panel", t2.slice(0, 120));
}

console.log("\n4. MÉTODOS Y CUERPOS RAROS");
for (const [m, ruta, esperado] of [
  ["POST", "/api/catalogo", 405], ["DELETE", "/api/catalogo", 405], ["PUT", "/api/catalogo", 405],
  ["GET", "/api/pedidos", 404], ["GET", "/api/nada", 404],
]) {
  const r = await fetch(BASE + ruta, { method: m });
  ok(r.status === esperado, `${m} ${ruta} responde ${esperado}`, "respondió " + r.status);
}
{
  const gigante = { items: [{ id: "removedor-500", n: 2 }], datos: { ...DATOS, nota: "x".repeat(200000) } };
  const r = await pedir(gigante);
  const d = await r.json().catch(() => ({}));
  if (r.ok) {
    const lista = await (await admin("/pedidos?estado=nuevo")).json();
    const p = lista.pedidos.find((x) => x.id === d.id);
    ok(p && p.nota.length <= 500, "una nota de 200.000 caracteres se recorta a 500", p && "quedó en " + p.nota.length);
    await admin(`/pedido/${d.id}/cancelar`, { method: "POST" });
  } else ok(true, "rechaza el pedido gigante", "respondió " + r.status);
}

console.log("\n5. LA COOKIE DE SESIÓN");
{
  const token = cookie.split("=").slice(1).join("=");
  const [cuerpoTok, firma] = token.split(".");
  for (const [txt, falsa] of [
    ["con la firma cambiada", cuerpoTok + "." + firma.slice(0, -2) + "AA"],
    ["sin firma", cuerpoTok],
    ["con el cuerpo cambiado", btoa(JSON.stringify({ exp: Date.now() + 9e9 })).replace(/=+$/, "") + "." + firma],
    ["vacía", ""],
    ["con basura", "../../etc/passwd"],
  ]) {
    const r = await fetch(BASE + "/api/admin/productos", { headers: { cookie: "gea_sesion=" + falsa } });
    ok(r.status === 401, `una cookie ${txt} no entra`, "respondió " + r.status);
  }
  /* Salir borra la cookie del navegador, pero el token en sí sigue firmado y
     con fecha válida: si alguien lo copió antes, sigue sirviendo. */
  const r = await fetch(BASE + "/api/admin/salir", { method: "POST", headers: { cookie } });
  const sigue = await fetch(BASE + "/api/admin/productos", { headers: { cookie } });
  if (sigue.status === 200) nota("el token sigue valiendo después de salir: salir borra la cookie, no invalida el token");
  else ok(true, "el token deja de valer al salir");
}

/* La sesión se rehace: la anterior quedó marcada como cerrada del lado del
   navegador y el resto de las pruebas necesita entrar. */
const entrar2 = await fetch(BASE + "/api/admin/entrar", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ contrasena: vars.ADMIN_PASSWORD }),
});
const cookie2 = (entrar2.headers.get("set-cookie") || "").split(";")[0];
const admin2 = (ruta, o = {}) => fetch(BASE + "/api/admin" + ruta, {
  method: o.method || "GET", headers: { "content-type": "application/json", cookie: cookie2 },
  body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined,
});

console.log("\n6. CONFIRMAR DOS VECES AL MISMO TIEMPO");
{
  const antes = (await catalogo()).PRODUCTOS.find((p) => p.id === "removedor-500").stock;
  const d = await pedirOk({ items: [{ id: "removedor-500", n: 3 }], datos: DATOS });
  /* En paralelo, no una después de otra: el chequeo de "sigue nuevo" y el
     descuento son dos pasos, y entre uno y otro entra la segunda. */
  const [a, b] = await Promise.all([
    admin2(`/pedido/${d.id}/confirmar`, { method: "POST" }),
    admin2(`/pedido/${d.id}/confirmar`, { method: "POST" }),
  ]);
  const despues = (await catalogo()).PRODUCTOS.find((p) => p.id === "removedor-500").stock;
  ok([a.status, b.status].filter((s) => s === 200).length === 1,
    "solo una de las dos confirma", `respondieron ${a.status} y ${b.status}`);
  ok(despues === antes - 3, "y el stock baja una sola vez",
    `bajó ${antes - despues}, tenía que bajar 3`);
  await admin2("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: antes } });
}

console.log("\n7. CONFIGURACIÓN EN BLANCO");
{
  const c0 = await catalogo();
  const gratisDesde = c0.ENVIO.gratisDesde;
  const minimo = c0.NEGOCIO.minimo;
  const zona = c0.ENVIO.zonas.find((z) => z.costo > 0);
  /* Un pedido que pase el mínimo pero no llegue al envío gratis: es el único
     tramo donde se ve si el umbral se está respetando.

     Sin tonos y con stock de sobra a propósito. Un producto con tonos exige que
     se elija uno, y el servidor rechaza pedir más de lo que hay: las dos reglas
     están bien, pero acá hacían fallar la sección por un motivo que no es el
     que está probando. Pasó de verdad, y el mensaje decía "elegí un tono"
     mientras la comprobación hablaba del costo de envío. */
  const suficiente = (p) => p.stock >= Math.max(1, Math.ceil(minimo / p.precio));
  const p0 = c0.PRODUCTOS.find((p) => p.precio > 0 && !p.tonos && suficiente(p));
  if (!p0) ok(false, "hay un producto sin tonos con stock para probar el envío");
  const n = Math.max(1, Math.ceil(minimo / p0.precio));
  const conEnvio = () => pedirOk({
    items: [{ id: p0.id, n }],
    datos: { ...DATOS, envio: "domicilio", zona: zona.id, direccion: "Calle 1" },
  });

  const base = await conEnvio();
  ok(base.envio === zona.costo, "con la configuración normal el envío se cobra",
    `cobró ${JSON.stringify(base.envio)} sobre un subtotal de ${base.subtotal}, la zona vale ${zona.costo}`);
  if (base.id) await admin2(`/pedido/${base.id}/cancelar`, { method: "POST" });

  /* Vaciar "envío sin cargo desde" en el panel guarda NULL. Si el servidor lo
     lee como cero, todo pedido pasa el umbral y el envío sale gratis. */
  await admin2("/config", { method: "PATCH", cuerpo: { envioGratisDesde: "" } });
  const d = await conEnvio();
  ok(d.envio === zona.costo,
    "con el envío gratis en blanco, el envío se sigue cobrando",
    `cobró ${JSON.stringify(d.envio)}, la zona vale ${zona.costo}`);
  if (d.id) await admin2(`/pedido/${d.id}/cancelar`, { method: "POST" });
  await admin2("/config", { method: "PATCH", cuerpo: { envioGratisDesde: String(gratisDesde) } });
  ok((await catalogo()).ENVIO.gratisDesde === gratisDesde, "y queda como estaba");

  /* Lo mismo con el pedido mínimo: en blanco no puede volverse cero silencioso. */
  await admin2("/config", { method: "PATCH", cuerpo: { minimo: "" } });
  const chico = await pedirOk({ items: [{ id: p0.id, n: 1 }], datos: DATOS });
  if (chico.id) {
    nota("con el pedido mínimo en blanco se acepta cualquier importe (es lo esperable, pero conviene saberlo)");
    await admin2(`/pedido/${chico.id}/cancelar`, { method: "POST" });
  } else ok(true, "con el pedido mínimo en blanco sigue habiendo un piso");
  await admin2("/config", { method: "PATCH", cuerpo: { minimo: String(minimo) } });
  ok((await catalogo()).NEGOCIO.minimo === minimo, "y el mínimo queda como estaba");
}

console.log("\n8. TEXTO PELIGROSO GUARDADO Y DEVUELTO");
{
  const veneno = '<script>alert(1)</script>"><img src=x onerror=alert(1)>';
  const d = await pedirOk({
    items: [{ id: "removedor-500", n: 3 }], datos: { ...DATOS, nombre: veneno, nota: veneno },
  });
  const lista = await (await admin2("/pedidos?estado=nuevo")).json();
  const p = lista.pedidos.find((x) => x.id === d.id);
  ok(p && p.nombre === veneno, "el texto se guarda tal cual (React lo escapa al pintarlo)");
  /* En el JSON viaja crudo y está bien: no es HTML. Lo que importa es que el
     navegador no pueda tomarlo por HTML, y eso lo decide el content-type. */
  const r = await admin2("/pedidos?estado=nuevo");
  ok(/application\/json/.test(r.headers.get("content-type") || ""),
    "la respuesta se declara JSON, así que el navegador no la pinta como página",
    r.headers.get("content-type"));
  await admin2(`/pedido/${d.id}/cancelar`, { method: "POST" });
}

console.log("\n9. FRENOS" + (CON_FRENOS ? "" : "  (salteado: se corre con --frenos)"));
if (CON_FRENOS) {
  const malas = await Promise.all(Array.from({ length: 12 }, () =>
    fetch(BASE + "/api/admin/entrar", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contrasena: "no-es-la-clave-" + Math.random() }),
    })));
  const frenadas = malas.filter((r) => r.status === 429).length;
  ok(frenadas > 0, "probar contraseñas a repetición se frena", `${frenadas} de 12 dieron 429`);
  /* Entrar bien limpia el contador, así que el freno no deja afuera al dueño. */
  const buena = await fetch(BASE + "/api/admin/entrar", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contrasena: vars.ADMIN_PASSWORD }),
  });
  if (buena.status === 429) nota("después del freno, la contraseña correcta tampoco entra hasta que pase la ventana");
  else ok(buena.ok, "y con la contraseña correcta se entra igual");
}

console.log(`\n${fallos ? fallos + " fallas" : "sin fallas"} · ${avisos} para mirar\n`);
process.exit(fallos ? 1 : 0);

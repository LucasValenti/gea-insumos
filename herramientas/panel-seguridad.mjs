/* Comprueba que el panel no se pueda usar sin entrar.
 *
 *   node herramientas/panel-seguridad.mjs [url]
 *
 * Escribir en el catálogo sin sesión tiene que ser imposible, y una cookie
 * inventada tiene que valer lo mismo que ninguna. Esto no se mira a ojo.
 */
import { readFile } from "node:fs/promises";

const BASE = process.argv[2] || process.env.GEA_URL || "http://127.0.0.1:8787";
const vars = Object.fromEntries((await readFile(".dev.vars", "utf8")).split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));

let fallos = 0;
const ok = (bien, txt, extra = "") => {
  console.log((bien ? "  OK   " : "  MAL  ") + txt + (extra ? "  ← " + extra : ""));
  if (!bien) fallos++;
};

const pedir = (ruta, opciones = {}) => fetch(BASE + "/api/admin" + ruta, {
  headers: { "content-type": "application/json", ...(opciones.cookie ? { cookie: opciones.cookie } : {}) },
  method: opciones.method || "GET",
  body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
  redirect: "manual",
});

console.log("\n1. SIN SESIÓN NO SE PUEDE NADA");
for (const [ruta, method, cuerpo] of [
  ["/productos", "GET", null],
  ["/producto/removedor-500", "PATCH", { stock: 999 }],
  ["/tono/semi-15-basicos", "PATCH", { nombre: "Nude Rosado", stock: 999 }],
  ["/config", "PATCH", { whatsapp: "000" }],
  ["/zona/cerca", "PATCH", { costo: 1 }],
]) {
  const r = await pedir(ruta, { method, cuerpo });
  ok(r.status === 401, `${method} ${ruta} responde 401`, r.status !== 401 ? "respondió " + r.status : "");
}

console.log("\n2. COOKIE INVENTADA O ALTERADA");
for (const [nombre, cookie] of [
  ["basura", "gea_sesion=cualquiera"],
  ["firma vacía", "gea_sesion=eyJleHAiOjk5OTk5OTk5OTk5OTl9."],
  ["payload cambiado", "gea_sesion=eyJleHAiOjk5OTk5OTk5OTk5OTl9.ZmlybWFmYWxzYQ"],
]) {
  const r = await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: 999 }, cookie });
  ok(r.status === 401, `cookie ${nombre} rechazada`, r.status !== 401 ? "respondió " + r.status : "");
}

console.log("\n3. CONTRASEÑA INCORRECTA");
{
  const r = await pedir("/entrar", { method: "POST", cuerpo: { contrasena: "no-es" } });
  ok(r.status === 401, "contraseña incorrecta responde 401", r.status !== 401 ? "respondió " + r.status : "");
  const c = r.headers.get("set-cookie");
  ok(!c, "no entrega cookie al fallar", c ? "entregó una" : "");
}

console.log("\n4. CON LA CONTRASEÑA CORRECTA");
const entrar = await pedir("/entrar", { method: "POST", cuerpo: { contrasena: vars.ADMIN_PASSWORD } });
ok(entrar.status === 200, "entra con la contraseña correcta", entrar.status !== 200 ? "respondió " + entrar.status : "");
const bruta = entrar.headers.get("set-cookie") || "";
ok(/HttpOnly/i.test(bruta), "la cookie es HttpOnly (ningún script la puede leer)");
ok(/SameSite=Strict/i.test(bruta), "la cookie es SameSite=Strict (no viaja desde otro sitio)");
ok(!bruta.includes(vars.ADMIN_PASSWORD), "la cookie no contiene la contraseña");
const cookie = bruta.split(";")[0];

const lista = await pedir("/productos", { cookie });
ok(lista.status === 200, "con sesión sí lista los productos");
const { productos } = await lista.json();
ok(Array.isArray(productos) && productos.length === 34, `lista los 34 productos`, `vinieron ${productos?.length}`);

console.log("\n5. ESCRIBIR Y DEJAR TODO COMO ESTABA");
{
  const antes = productos.find((p) => p.id === "removedor-500");
  const nuevo = antes.stock + 7;
  let r = await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: nuevo }, cookie });
  ok(r.status === 200, "guarda el stock con sesión");
  const cat = await (await fetch(BASE + "/api/catalogo")).json();
  ok(cat.PRODUCTOS.find((p) => p.id === "removedor-500").stock === nuevo,
    "el cambio se ve en la tienda");
  await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: antes.stock }, cookie });
  const vuelta = await (await fetch(BASE + "/api/catalogo")).json();
  ok(vuelta.PRODUCTOS.find((p) => p.id === "removedor-500").stock === antes.stock, "vuelve al valor original");
}

console.log("\n6. LO QUE NO SE PUEDE ESCRIBIR");
{
  let r = await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { id: "otro-id", orden: 999 }, cookie });
  ok(r.status === 400, "rechaza campos que no están en la lista blanca", "respondió " + r.status);
  r = await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: -5 }, cookie });
  ok(r.status === 400, "rechaza stock negativo", "respondió " + r.status);
  r = await pedir("/producto/removedor-500", { method: "PATCH", cuerpo: { precio: "gratis" }, cookie });
  ok(r.status === 400, "rechaza precio que no es número", "respondió " + r.status);
  r = await pedir("/producto/no-existe", { method: "PATCH", cuerpo: { stock: 1 }, cookie });
  ok(r.status === 404, "404 si el producto no existe", "respondió " + r.status);
}

console.log("\n7. SALIR");
{
  const r = await pedir("/salir", { method: "POST", cookie });
  ok(/Max-Age=0/.test(r.headers.get("set-cookie") || ""), "salir borra la cookie");
}

console.log(fallos ? `\n${fallos} comprobaciones fallaron\n` : "\nTodo en orden\n");
process.exit(fallos ? 1 : 0);

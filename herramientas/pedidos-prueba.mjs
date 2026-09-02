/* Recorre un pedido de punta a punta contra la API.
 *
 *   node herramientas/pedidos-prueba.mjs [url]
 *
 * Lo que hay que demostrar: que el pedido queda registrado, que confirmarlo
 * descuenta el stock exacto, que cancelarlo no lo toca, que no se puede cerrar
 * dos veces, y que los precios los pone el servidor y no el que pide.
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

const entrar = await fetch(BASE + "/api/admin/entrar", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ contrasena: vars.ADMIN_PASSWORD }),
});
const cookie = (entrar.headers.get("set-cookie") || "").split(";")[0];

const catalogo = () => fetch(BASE + "/api/catalogo").then((r) => r.json());
const stockDe = async (id, tono) => {
  const c = await catalogo();
  const p = c.PRODUCTOS.find((x) => x.id === id);
  return tono ? p.tonos.find((t) => t.nombre === tono).stock : p.stock;
};
const admin = (ruta, opciones = {}) => fetch(BASE + "/api/admin" + ruta, {
  method: opciones.method || "GET",
  headers: { "content-type": "application/json", cookie },
  body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
});
const pedir = (cuerpo) => fetch(BASE + "/api/pedidos", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo),
});

const DATOS = {
  nombre: "Prueba automática", tel: "3415551234", envio: "retiro", pago: "efectivo",
  nota: "Pedido de prueba, se cancela solo.",
};

console.log("\n1. SE REGISTRA Y DEVUELVE NÚMERO CORRELATIVO");
const antes = await stockDe("removedor-500");
const antesTono = await stockDe("semi-15-basicos", "Nude Rosado");
let r = await pedir({ items: [{ id: "removedor-500", n: 3 }, { id: "semi-15-basicos", tono: "Nude Rosado", n: 2 }], datos: DATOS });
let d = await r.json();
ok(r.ok && d.numero, "el pedido se registra", d.error || "");
ok(/^\d{6}-\d{4}$/.test(d.numero || ""), `el número tiene forma de correlativo (${d.numero})`);
const idA = d.id;

console.log("\n2. LOS PRECIOS LOS PONE EL SERVIDOR");
{
  const c = await catalogo();
  const esperado = c.PRODUCTOS.find((p) => p.id === "removedor-500").precio * 3
    + c.PRODUCTOS.find((p) => p.id === "semi-15-basicos").precio * 2;
  ok(d.subtotal === esperado, "el subtotal sale del catálogo", `dio ${d.subtotal}, esperaba ${esperado}`);
  /* Un pedido con precio inventado tiene que valer lo mismo que sin él. Van
     cuatro unidades para superar el pedido mínimo, si no lo rechaza antes. */
  const t = await (await pedir({ items: [{ id: "removedor-500", n: 4, precio: 1 }], datos: DATOS })).json();
  const real = c.PRODUCTOS.find((p) => p.id === "removedor-500").precio * 4;
  ok(t.subtotal === real, "ignora el precio que manda el cliente", `dio ${t.subtotal}, el real es ${real}`);
  await admin(`/pedido/${t.id}/cancelar`, { method: "POST" });
}

console.log("\n3. HASTA CONFIRMAR, EL STOCK NO SE TOCA");
ok(await stockDe("removedor-500") === antes, "el stock del producto sigue igual");
ok(await stockDe("semi-15-basicos", "Nude Rosado") === antesTono, "el stock del tono sigue igual");

console.log("\n4. CONFIRMAR DESCUENTA LO EXACTO");
r = await admin(`/pedido/${idA}/confirmar`, { method: "POST" });
ok(r.ok, "confirma el pedido");
ok(await stockDe("removedor-500") === antes - 3, `descuenta 3 del producto`, `quedó en ${await stockDe("removedor-500")}, esperaba ${antes - 3}`);
ok(await stockDe("semi-15-basicos", "Nude Rosado") === antesTono - 2, "descuenta 2 del tono");

console.log("\n5. NO SE PUEDE CONFIRMAR DOS VECES");
r = await admin(`/pedido/${idA}/confirmar`, { method: "POST" });
ok(r.status === 409, "el segundo confirmar se rechaza", "respondió " + r.status);
ok(await stockDe("removedor-500") === antes - 3, "y el stock no bajó de nuevo");

console.log("\n6. CANCELAR NO TOCA EL STOCK");
d = await (await pedir({ items: [{ id: "removedor-500", n: 5 }], datos: DATOS })).json();
const previo = await stockDe("removedor-500");
r = await admin(`/pedido/${d.id}/cancelar`, { method: "POST" });
ok(r.ok, "cancela el pedido");
ok(await stockDe("removedor-500") === previo, "el stock quedó igual");

console.log("\n7. LO QUE NO SE ACEPTA");
for (const [txt, cuerpo, esperado] of [
  ["pedido vacío", { items: [], datos: DATOS }, 400],
  ["producto inexistente", { items: [{ id: "no-existe", n: 1 }], datos: DATOS }, 400],
  ["cantidad cero", { items: [{ id: "removedor-500", n: 0 }], datos: DATOS }, 400],
  ["cantidad negativa", { items: [{ id: "removedor-500", n: -3 }], datos: DATOS }, 400],
  ["tono que no existe", { items: [{ id: "semi-15-basicos", tono: "Inventado", n: 1 }], datos: DATOS }, 400],
  ["pedido por debajo del mínimo", { items: [{ id: "removedor-500", n: 1 }], datos: DATOS }, 400],
]) {
  const x = await pedir(cuerpo);
  ok(x.status === esperado, `rechaza ${txt}`, "respondió " + x.status);
}

console.log("\n8. SIN SESIÓN NO SE CIERRAN PEDIDOS");
{
  const d2 = await (await pedir({ items: [{ id: "removedor-500", n: 1 }], datos: DATOS })).json();
  const x = await fetch(`${BASE}/api/admin/pedido/${d2.id}/confirmar`, { method: "POST" });
  ok(x.status === 401, "confirmar sin sesión responde 401", "respondió " + x.status);
  const y = await fetch(`${BASE}/api/admin/pedidos`);
  ok(y.status === 401, "listar pedidos sin sesión responde 401", "respondió " + y.status);
  await admin(`/pedido/${d2.id}/cancelar`, { method: "POST" });
}

console.log("\n9. DEJO EL STOCK COMO ESTABA");
await admin("/producto/removedor-500", { method: "PATCH", cuerpo: { stock: antes } });
await admin("/tono/semi-15-basicos", { method: "PATCH", cuerpo: { nombre: "Nude Rosado", stock: antesTono } });
ok(await stockDe("removedor-500") === antes, "producto restaurado");
ok(await stockDe("semi-15-basicos", "Nude Rosado") === antesTono, "tono restaurado");

console.log(fallos ? `\n${fallos} comprobaciones fallaron\n` : "\nTodo en orden\n");
process.exit(fallos ? 1 : 0);

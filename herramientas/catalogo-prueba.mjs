/* Alta, edición y baja de productos y tonos, de punta a punta contra la API.
 *
 *   node herramientas/catalogo-prueba.mjs [url]
 *
 * Lo que hay que demostrar: que un producto nuevo aparece en la tienda con
 * todos sus campos, que se puede editar y borrar, que borrarlo no rompe los
 * pedidos que ya lo tenían, que un producto que está dentro de un kit no se
 * puede borrar, y que sin sesión no se escribe nada.
 *
 * Deja el catálogo como estaba: todo lo que crea lo borra al final.
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

const admin = (ruta, opciones = {}) => fetch(BASE + "/api/admin" + ruta, {
  method: opciones.method || "GET",
  headers: { "content-type": "application/json", cookie },
  body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
});
const catalogo = () => fetch(BASE + "/api/catalogo").then((r) => r.json());
const enTienda = async (id) => (await catalogo()).PRODUCTOS.find((p) => p.id === id);

const creados = [];
console.log("\n1. ALTA");
{
  const cats = (await catalogo()).CATEGORIAS;
  const r = await admin("/producto", {
    method: "POST",
    cuerpo: { nombre: "Prueba Automática Ñandú x 15 ml", marca: "Prueba", precio: 9900, categoria_id: cats[0].id, stock: 7 },
  });
  const d = await r.json();
  ok(r.status === 201 && d.id, "crea el producto", d.error || "");
  ok(d.id === "prueba-automatica-nandu-x-15-ml", `el id sale del nombre sin acentos (${d.id})`);
  creados.push(d.id);

  const p = await enTienda(d.id);
  ok(!!p, "aparece en el catálogo público");
  ok(p && p.precio === 9900 && p.stock === 7, "con su precio y su stock", p && `${p.precio} / ${p.stock}`);

  /* Dos productos con el mismo nombre no pueden pisarse el id. */
  const d2 = await (await admin("/producto", {
    method: "POST",
    cuerpo: { nombre: "Prueba Automática Ñandú x 15 ml", precio: 100, categoria_id: cats[0].id },
  })).json();
  ok(d2.id && d2.id !== d.id, `el segundo con el mismo nombre recibe otro id (${d2.id})`);
  creados.push(d2.id);
}

console.log("\n2. LO QUE NO SE ACEPTA AL CREAR");
{
  const cats = (await catalogo()).CATEGORIAS;
  for (const [txt, cuerpo] of [
    ["sin nombre", { precio: 100, categoria_id: cats[0].id }],
    ["sin precio", { nombre: "Sin precio", categoria_id: cats[0].id }],
    ["sin categoría", { nombre: "Sin categoría", precio: 100 }],
    ["con una categoría inventada", { nombre: "Categoría falsa", precio: 100, categoria_id: "no-existe" }],
    ["con precio negativo", { nombre: "Negativo", precio: -50, categoria_id: cats[0].id }],
  ]) {
    const r = await admin("/producto", { method: "POST", cuerpo });
    ok(r.status === 400, `rechaza crear ${txt}`, "respondió " + r.status);
    if (r.ok) creados.push((await r.json()).id);
  }
  /* El id no lo elige quien pide: aunque lo mande, se ignora. */
  const d = await (await admin("/producto", {
    method: "POST", cuerpo: { id: "id-elegido-a-mano", nombre: "Id propio", precio: 100, categoria_id: cats[0].id },
  })).json();
  ok(d.id === "id-propio", `ignora el id que manda el cliente (quedó ${d.id})`);
  creados.push(d.id);
}

console.log("\n3. EDICIÓN DE LA FICHA");
{
  const id = creados[0];
  const r = await admin("/producto/" + id, {
    method: "PATCH",
    cuerpo: {
      nombre: "Prueba Editada", marca: "Otra", precio: 12345, precio_antes: 15000,
      contenido: "15 ml", rinde: "40 aplicaciones", uso: "Dos capas",
      envio: "Viaja con protección", descripcion: "Descripción de prueba.", color: "#c4756b",
    },
  });
  ok(r.ok, "guarda todos los campos de la ficha", r.ok ? "" : (await r.json()).error);
  const p = await enTienda(id);
  ok(p.nombre === "Prueba Editada" && p.precio === 12345 && p.precioAntes === 15000,
    "el nombre, el precio y el precio anterior llegan a la tienda");
  ok(p.contenido === "15 ml" && p.rinde === "40 aplicaciones" && p.uso === "Dos capas"
    && p.envio === "Viaja con protección" && p.desc === "Descripción de prueba." && p.color === "#c4756b",
    "y también el contenido, el rinde, el uso, el envío, la descripción y el color");

  /* Lo que no está en la lista blanca no se escribe. */
  await admin("/producto/" + id, { method: "PATCH", cuerpo: { orden: -999, id: "otro" } });
  const q = await enTienda(id);
  ok(!!q, "un intento de escribir el id o el orden no cambia nada");
}

console.log("\n4. DESTACADO Y HABITUAL");
{
  const id = creados[0];
  await admin("/producto/" + id, { method: "PATCH", cuerpo: { destacado: 99, habitual: 99 } });
  let c = await catalogo();
  ok(c.DESTACADOS.includes(id), "marcado como destacado, entra en la lista de portada");
  ok(c.HABITUALES.includes(id), "y en la de siempre");
  await admin("/producto/" + id, { method: "PATCH", cuerpo: { destacado: null, habitual: null } });
  c = await catalogo();
  ok(!c.DESTACADOS.includes(id) && !c.HABITUALES.includes(id), "y al desmarcarlo sale de las dos");
}

console.log("\n5. TONOS");
{
  const id = creados[0];
  const fam = (await catalogo()).FAMILIAS[0];
  let r = await admin("/tono/" + id, { method: "POST", cuerpo: { nombre: "Rojo Prueba", hex: "#B3121B", familia_id: fam.id, stock: 4 } });
  ok(r.status === 201, "agrega un tono", r.ok ? "" : (await r.json()).error);
  r = await admin("/tono/" + id, { method: "POST", cuerpo: { nombre: "Azul Prueba", hex: "#2B3A67", stock: 6 } });
  ok(r.status === 201, "agrega un segundo tono");

  let p = await enTienda(id);
  ok(p.tonos && p.tonos.length === 2, "los dos llegan a la tienda");
  ok(p.stock === 10, "y el stock del producto pasa a ser la suma de los tonos", "dio " + p.stock);

  r = await admin("/tono/" + id, { method: "POST", cuerpo: { nombre: "Rojo Prueba", hex: "#000000" } });
  ok(r.status === 409, "no deja repetir el nombre de un tono", "respondió " + r.status);
  r = await admin("/tono/" + id, { method: "POST", cuerpo: { nombre: "Sin color", hex: "rojo" } });
  ok(r.status === 400, "no acepta un color que no sea hexadecimal", "respondió " + r.status);
  r = await admin("/tono/" + id, { method: "POST", cuerpo: { nombre: "Familia falsa", hex: "#123456", familia_id: "no-existe" } });
  ok(r.status === 400, "no acepta una familia inventada", "respondió " + r.status);

  await admin("/tono/" + id, { method: "PATCH", cuerpo: { nombre: "Rojo Prueba", stock: 1 } });
  p = await enTienda(id);
  ok(p.stock === 7, "editar el stock de un tono cambia el total", "dio " + p.stock);

  r = await admin(`/tono/${id}?nombre=${encodeURIComponent("Rojo Prueba")}`, { method: "DELETE" });
  ok(r.ok, "borra un tono");
  p = await enTienda(id);
  ok(p.tonos.length === 1 && p.stock === 6, "queda uno y el total se recalcula", `${p.tonos.length} tonos, stock ${p.stock}`);

  /* Las unidades se van con el tono. Al irse el último el producto pasa a usar
     su propia columna, y tiene que quedar en cero: no puede resucitar el número
     que traía de antes de tener tonos, que ya no representa nada. */
  await admin(`/tono/${id}?nombre=${encodeURIComponent("Azul Prueba")}`, { method: "DELETE" });
  p = await enTienda(id);
  ok(!p.tonos, "sin tonos, la clave desaparece igual que en el catálogo original");
  ok(p.stock === 0, "y el producto queda sin stock, no con el número viejo", "dio " + p.stock);

  r = await admin(`/tono/${id}?nombre=Inventado`, { method: "DELETE" });
  ok(r.status === 404, "borrar un tono que no existe responde 404", "respondió " + r.status);
}

console.log("\n6. UN PRODUCTO QUE ESTÁ DENTRO DE UN KIT NO SE BORRA");
{
  const c = await catalogo();
  const kit = c.PRODUCTOS.find((p) => p.componentes && p.componentes.length);
  const dentro = kit.componentes[0];
  const r = await admin("/producto/" + dentro, { method: "DELETE" });
  ok(r.status === 409, `no deja borrar ${dentro}, que arma ${kit.nombre}`, "respondió " + r.status);
  ok((await r.json()).error.includes(kit.nombre), "y el aviso dice de qué kit se trata");
  ok(!!(await enTienda(dentro)), "el producto sigue en el catálogo");
}

console.log("\n7. BAJA");
{
  const id = creados.pop();
  const r = await admin("/producto/" + id, { method: "DELETE" });
  ok(r.ok, "borra un producto suelto");
  ok(!(await enTienda(id)), "y desaparece del catálogo");
  ok((await admin("/producto/" + id, { method: "DELETE" })).status === 404,
    "borrarlo de nuevo responde 404");
}

console.log("\n8. BORRAR NO ROMPE LOS PEDIDOS VIEJOS");
{
  const cats = (await catalogo()).CATEGORIAS;
  const { id } = await (await admin("/producto", {
    method: "POST", cuerpo: { nombre: "Efímero de prueba", precio: 30000, categoria_id: cats[0].id, stock: 5 },
  })).json();
  const pedido = await (await fetch(BASE + "/api/pedidos", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ items: [{ id, n: 1 }], datos: { nombre: "Prueba", tel: "3415551234", envio: "retiro", pago: "efectivo" } }),
  })).json();
  ok(!!pedido.numero, "se puede pedir el producto nuevo", pedido.error || "");

  await admin("/producto/" + id, { method: "DELETE" });
  const lista = await (await admin("/pedidos")).json();
  const guardado = lista.pedidos.find((x) => x.id === pedido.id);
  ok(!!guardado, "el pedido sigue existiendo después de borrar el producto");
  ok(guardado && guardado.items.some((i) => i.nombre === "Efímero de prueba"),
    "y sigue diciendo qué se pidió, con el nombre congelado");
  await admin(`/pedido/${pedido.id}/cancelar`, { method: "POST" });
}

console.log("\n9. SIN SESIÓN NO SE ESCRIBE NADA");
{
  const cats = (await catalogo()).CATEGORIAS;
  for (const [txt, ruta, opciones] of [
    ["crear un producto", "/producto", { method: "POST", body: JSON.stringify({ nombre: "Intruso", precio: 1, categoria_id: cats[0].id }) }],
    ["borrar un producto", "/producto/" + creados[0], { method: "DELETE" }],
    ["agregar un tono", "/tono/" + creados[0], { method: "POST", body: JSON.stringify({ nombre: "x", hex: "#000000" }) }],
    ["borrar un tono", "/tono/" + creados[0] + "?nombre=x", { method: "DELETE" }],
  ]) {
    const r = await fetch(BASE + "/api/admin" + ruta, { headers: { "content-type": "application/json" }, ...opciones });
    ok(r.status === 401, `${txt} sin sesión responde 401`, "respondió " + r.status);
  }
}

console.log("\n10. DEJO EL CATÁLOGO COMO ESTABA");
for (const id of creados) await admin("/producto/" + id, { method: "DELETE" });
const quedan = (await catalogo()).PRODUCTOS.filter((p) => /prueba|efímero|id propio/i.test(p.nombre));
ok(!quedan.length, "no quedó ningún producto de prueba", quedan.map((p) => p.id).join(", "));

console.log(fallos ? `\n${fallos} comprobaciones fallaron\n` : "\nTodo en orden\n");
process.exit(fallos ? 1 : 0);

/* Pedidos.
 *
 * Antes el pedido no lo veía ningún servidor: el navegador inventaba un número
 * al azar y abría WhatsApp. Ahora queda registrado antes de abrir el chat.
 *
 * Regla que ordena todo lo de acá: los precios los pone el servidor. Lo que
 * manda el navegador son ids, tonos y cantidades; el resto se busca en la base.
 * Confiar en el precio que llega sería dejar que cualquiera arme un pedido de
 * cien mil pesos por dos mil cambiando un número en la consola.
 */

const MAX_LINEAS = 60;
const MAX_UNIDADES = 500;
const MAX_POR_IP_HORA = 12;

const json = (data, { status = 200 } = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const recorte = (v, max) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};

/* Mismo criterio que costoEnvio() en el navegador, pero acá manda el servidor.
   Devuelve el costo, 0 si no corresponde cobrar, o null si hay que cotizar. */
function costoEnvio({ modo, zona }, subtotal, zonas, gratisDesde) {
  if (modo !== "domicilio") return 0;
  const z = zonas.find((x) => x.id === zona);
  if (!z || z.costo === null) return null;
  return subtotal >= gratisDesde ? 0 : z.costo;
}

export async function crearPedido(request, env) {
  const db = env.DB;
  const ip = request.headers.get("cf-connecting-ip") || "desconocida";

  /* Ruta pública que escribe: sin freno, se puede llenar la base desde afuera. */
  const desde = Date.now() - 60 * 60 * 1000;
  const ritmo = await db.prepare("SELECT COUNT(*) AS n FROM pedidos_ritmo WHERE ip = ? AND cuando > ?")
    .bind(ip, desde).first();
  if ((ritmo?.n || 0) >= MAX_POR_IP_HORA)
    return json({ error: "Demasiados pedidos seguidos. Escribinos por WhatsApp." }, { status: 429 });

  const cuerpo = await request.json().catch(() => null);
  if (!cuerpo || !Array.isArray(cuerpo.items) || !cuerpo.items.length)
    return json({ error: "El pedido llegó vacío" }, { status: 400 });
  if (cuerpo.items.length > MAX_LINEAS)
    return json({ error: "El pedido tiene demasiadas líneas" }, { status: 400 });

  /* --- precios y nombres, siempre de la base --- */
  const ids = [...new Set(cuerpo.items.map((i) => String(i.id)))];
  const marcas = ids.map(() => "?").join(", ");
  const [prods, tonos, zonasR, cfgR] = await db.batch([
    db.prepare(`SELECT id, nombre, precio FROM productos WHERE id IN (${marcas})`).bind(...ids),
    db.prepare(`SELECT producto_id, nombre FROM tonos WHERE producto_id IN (${marcas})`).bind(...ids),
    db.prepare("SELECT id, costo FROM zonas_envio"),
    db.prepare("SELECT clave, valor FROM config WHERE clave IN ('envioGratisDesde', 'minimo')"),
  ]);
  const porId = new Map(prods.results.map((p) => [p.id, p]));
  const tonosDe = new Map();
  for (const t of tonos.results) {
    if (!tonosDe.has(t.producto_id)) tonosDe.set(t.producto_id, new Set());
    tonosDe.get(t.producto_id).add(t.nombre);
  }
  /* Vacío no es cero. Si el panel deja "envío sin cargo desde" en blanco se
     guarda NULL, y Number(null) da 0: con eso todo pedido superaba el umbral y
     el envío salía gratis siempre. Vacío tiene que significar "no hay envío
     gratis", no "gratis desde cero". */
  const aNumero = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  const conf = Object.fromEntries(cfgR.results.map((r) => [r.clave, aNumero(r.valor)]));

  const lineas = [];
  for (const it of cuerpo.items) {
    const p = porId.get(String(it.id));
    if (!p) return json({ error: `Ya no tenemos ${it.id} en el catálogo` }, { status: 400 });
    const n = Number(it.n);
    if (!Number.isInteger(n) || n < 1 || n > MAX_UNIDADES)
      return json({ error: `Cantidad inválida en ${p.nombre}` }, { status: 400 });
    const tono = it.tono ? String(it.tono) : null;
    if (tono && !(tonosDe.get(p.id) || new Set()).has(tono))
      return json({ error: `El tono ${tono} ya no está disponible` }, { status: 400 });
    lineas.push({ producto_id: p.id, tono, cantidad: n, precio: p.precio, nombre: p.nombre });
  }

  const subtotal = lineas.reduce((a, l) => a + l.precio * l.cantidad, 0);
  const d = cuerpo.datos || {};
  const envioCosto = costoEnvio({ modo: d.envio, zona: d.zona }, subtotal,
    zonasR.results, conf.envioGratisDesde == null ? Infinity : conf.envioGratisDesde);
  const total = subtotal + (envioCosto || 0);

  if (conf.minimo && subtotal < conf.minimo)
    return json({ error: `El pedido mínimo es $${conf.minimo.toLocaleString("es-AR")}` }, { status: 400 });

  const alta = await db.prepare(
    `INSERT INTO pedidos (creado, estado, nombre, telefono, gabinete, envio_modo, envio_zona,
       direccion, cp, transporte, pago, nota, subtotal, envio_costo, total)
     VALUES (?, 'nuevo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(Date.now(), recorte(d.nombre, 120), recorte(d.tel, 40), recorte(d.gabinete, 120),
      recorte(d.envio, 20), recorte(d.zona, 40), recorte(d.direccion, 200), recorte(d.cp, 20),
      recorte(d.transporte, 120), recorte(d.pago, 20), recorte(d.nota, 500),
      subtotal, envioCosto, total).run();

  const id = alta.meta.last_row_id;
  await db.batch([
    ...lineas.map((l) => db.prepare(
      "INSERT INTO pedido_items (pedido_id, producto_id, tono, cantidad, precio, nombre) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, l.producto_id, l.tono, l.cantidad, l.precio, l.nombre)),
    db.prepare("INSERT INTO pedidos_ritmo (ip, cuando) VALUES (?, ?)").bind(ip, Date.now()),
    db.prepare("DELETE FROM pedidos_ritmo WHERE cuando < ?").bind(Date.now() - 24 * 60 * 60 * 1000),
  ]);

  /* Número legible y ordenable, con el correlativo real adentro: antes el
     navegador ponía 100 + azar y se repetía entre clientas distintas. */
  const f = new Date();
  const numero = String(f.getFullYear()).slice(2) + String(f.getMonth() + 1).padStart(2, "0") +
    String(f.getDate()).padStart(2, "0") + "-" + String(id).padStart(4, "0");

  return json({ ok: true, id, numero, subtotal, envio: envioCosto, total });
}

/* ---------- lo que ve y hace el panel ---------- */

export async function listarPedidos(db, estado) {
  const filtro = ["nuevo", "confirmado", "cancelado"].includes(estado) ? estado : null;
  const ped = await (filtro
    ? db.prepare("SELECT * FROM pedidos WHERE estado = ? ORDER BY creado DESC LIMIT 100").bind(filtro)
    : db.prepare("SELECT * FROM pedidos ORDER BY creado DESC LIMIT 100")).all();

  /* Solo los ítems de los pedidos que se están mostrando. Antes traía los de
     todos los pedidos de la historia y después descartaba: con cien pedidos no
     se nota, con diez mil el panel tarda y la respuesta pesa de más. */
  const ids = ped.results.map((p) => p.id);
  const items = ids.length
    ? await db.prepare(
        `SELECT * FROM pedido_items WHERE pedido_id IN (${ids.map(() => "?").join(", ")})`)
        .bind(...ids).all()
    : { results: [] };

  const porPedido = new Map();
  for (const i of items.results) {
    if (!porPedido.has(i.pedido_id)) porPedido.set(i.pedido_id, []);
    porPedido.get(i.pedido_id).push(i);
  }
  return { pedidos: ped.results.map((p) => ({ ...p, items: porPedido.get(p.id) || [] })) };
}

/* Confirmar descuenta el stock; cancelar no toca nada. Solo se puede una vez:
   sin esa condición, tocar dos veces "confirmar" descontaría el doble. */
export async function cerrarPedido(db, id, estado) {
  const pedido = await db.prepare("SELECT id, estado FROM pedidos WHERE id = ?").bind(id).first();
  if (!pedido) return { error: "No existe ese pedido", status: 404 };
  if (pedido.estado !== "nuevo")
    return { error: `El pedido ya estaba ${pedido.estado}`, status: 409 };

  const marcar = db.prepare("UPDATE pedidos SET estado = ?, cerrado = ? WHERE id = ? AND estado = 'nuevo'")
    .bind(estado, Date.now(), id);

  if (estado === "cancelado") {
    const r = await marcar.run();
    if (!r.meta.changes) return { error: "El pedido ya estaba cerrado", status: 409 };
    return { ok: true, cambiados: r.meta.changes };
  }

  const { results: items } = await db.prepare(
    "SELECT producto_id, tono, cantidad FROM pedido_items WHERE pedido_id = ?").bind(id).run();

  /* Todo en un batch: D1 lo corre como una sola transacción, así que o se
     descuenta todo y se marca el pedido, o no pasa nada. Un descuento a medias
     dejaría el stock mintiendo.
     El MAX(0, ...) es para no dejar stock negativo si algo ya se vendió por
     otro lado entre que entró el pedido y se confirmó.

     Cada descuento lleva su propia condición de que el pedido siga en "nuevo".
     No alcanza con haberlo comprobado arriba: esa lectura pasa fuera de la
     transacción, y dos confirmaciones en paralelo la pasaban las dos antes de
     que ninguna escribiera. El UPDATE de "marcar" no se repetía, pero los
     descuentos sí, y el stock bajaba el doble.

     Local no lo mostraba: SQLite en un archivo serializa las escrituras y las
     dos confirmaciones salían una después de la otra. En producción D1 está
     distribuido y las dos entraron juntas. Apareció recién probando contra
     producción, con 200 y 200 y el stock bajando seis en vez de tres. */
  const sigueNuevo = "(SELECT estado FROM pedidos WHERE id = ?) = 'nuevo'";
  const ops = items.map((i) => i.tono
    ? db.prepare(`UPDATE tonos SET stock = MAX(0, stock - ?)
                  WHERE producto_id = ? AND nombre = ? AND ${sigueNuevo}`)
        .bind(i.cantidad, i.producto_id, i.tono, id)
    : db.prepare(`UPDATE productos SET stock = MAX(0, stock - ?)
                  WHERE id = ? AND ${sigueNuevo}`)
        .bind(i.cantidad, i.producto_id, id));

  /* "marcar" va último: los descuentos tienen que leer el estado todavía en
     "nuevo". Si cambió 0 filas, otra confirmación llegó primero y esta no
     descontó nada. */
  const r = await db.batch([...ops, marcar]);
  if (!r[r.length - 1].meta.changes)
    return { error: "El pedido ya estaba cerrado", status: 409 };
  return { ok: true, descontadas: items.length };
}

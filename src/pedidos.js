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

import { leerMapaEnvio, costoPorMapa } from "./envio.js";

/* Las coordenadas del pin, o null. Se valida el rango acá y no se confía en
   que lleguen bien: una coordenada fuera de rango haría que el punto caiga
   siempre afuera de la zona y se cobre un envío que no corresponde. */
const puntoDe = (d) => {
  const lat = Number(d && d.lat), lng = Number(d && d.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng } : null;
};

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
    db.prepare(`SELECT id, nombre, precio, stock FROM productos WHERE id IN (${marcas})`).bind(...ids),
    db.prepare(`SELECT producto_id, nombre, stock FROM tonos WHERE producto_id IN (${marcas})`).bind(...ids),
    db.prepare("SELECT id, costo FROM zonas_envio"),
    db.prepare("SELECT clave, valor FROM config WHERE clave LIKE 'envio%' OR clave = 'minimo'"),
  ]);
  const porId = new Map(prods.results.map((p) => [p.id, p]));
  /* Nombre del tono -> stock. Que el producto esté en este mapa es además la
     forma de saber que tiene tonos, y por lo tanto que su stock no está en
     productos.stock sino repartido acá. */
  const tonosDe = new Map();
  for (const t of tonos.results) {
    if (!tonosDe.has(t.producto_id)) tonosDe.set(t.producto_id, new Map());
    tonosDe.get(t.producto_id).set(t.nombre, t.stock);
  }
  /* Vacío no es cero. Si el panel deja "envío sin cargo desde" en blanco se
     guarda NULL, y Number(null) da 0: con eso todo pedido superaba el umbral y
     el envío salía gratis siempre. Vacío tiene que significar "no hay envío
     gratis", no "gratis desde cero". */
  const aNumero = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  /* Dos vistas de la misma config, y hacen falta las dos. La consulta ahora
     trae también envioZonaGratis, envioOrigen y envioTramos, que son texto —un
     polígono en JSON y un par de coordenadas—: pasarlos por Number() los
     convertía en NaN y el mapa nunca se leía. Así que los números se convierten
     por separado y el resto queda como vino. */
  const crudo = Object.fromEntries(cfgR.results.map((r) => [r.clave, r.valor]));
  const conf = { ...crudo, envioGratisDesde: aNumero(crudo.envioGratisDesde), minimo: aNumero(crudo.minimo) };

  /* El stock se comprueba acá y no solo al confirmar. El freno que hay en el
     navegador no cuenta: un POST armado a mano no lo ejecuta, y un pedido que
     entra por más de lo que hay deja al panel eligiendo entre dejar el stock en
     negativo o descontar de menos. Las dos son mentiras distintas. */
  const lineas = [];
  const pedidas = new Map();   // producto+tono -> unidades que pide el pedido entero
  for (const it of cuerpo.items) {
    const p = porId.get(String(it.id));
    if (!p) return json({ error: `Ya no tenemos ${it.id} en el catálogo` }, { status: 400 });
    const n = Number(it.n);
    if (!Number.isInteger(n) || n < 1 || n > MAX_UNIDADES)
      return json({ error: `Cantidad inválida en ${p.nombre}` }, { status: 400 });
    const tono = it.tono ? String(it.tono) : null;
    const suyos = tonosDe.get(p.id);
    /* Un producto con tonos reparte el stock entre ellos y deja productos.stock
       en 0. Sin tono, el descuento al confirmar iría contra esa columna que no
       mira nadie: el pedido quedaría confirmado sin bajar una sola unidad. */
    if (suyos && !tono)
      return json({ error: `Elegí un tono para ${p.nombre}` }, { status: 400 });
    if (tono && !(suyos && suyos.has(tono)))
      return json({ error: `El tono ${tono} ya no está disponible` }, { status: 400 });

    /* Lo que decide es la suma: el mismo producto puede venir en dos líneas. */
    const clave = p.id + "\u0000" + (tono || "");
    const acumulado = (pedidas.get(clave) || 0) + n;
    pedidas.set(clave, acumulado);
    const hay = tono ? suyos.get(tono) : p.stock;
    if (acumulado > hay) {
      const cual = p.nombre + (tono ? ` (${tono})` : "");
      return json({
        error: hay > 0
          ? `Nos queda${hay === 1 ? "" : "n"} ${hay} de ${cual}`
          : `Nos quedamos sin ${cual}`,
      }, { status: 400 });
    }

    lineas.push({ producto_id: p.id, tono, cantidad: n, precio: p.precio, nombre: p.nombre });
  }

  const subtotal = lineas.reduce((a, l) => a + l.precio * l.cantidad, 0);
  const d = cuerpo.datos || {};

  /* Modo y pago salen de una lista corta, y la zona tiene que existir de verdad.
     costoEnvio no distingue "zona sin tarifa" de "zona que no existe": las dos
     dan null, o sea "a cotizar". Con una zona inventada quedaba registrado un
     pedido con el envío a cotizar y un total que no cierra con nada, y del otro
     lado no hay forma de saber qué se quiso pedir. */
  const MODOS = ["domicilio", "retiro", "transporte"];
  const PAGOS = ["efectivo", "mp"];
  if (!MODOS.includes(d.envio))
    return json({ error: "Elegí cómo querés recibir el pedido" }, { status: 400 });
  if (!PAGOS.includes(d.pago))
    return json({ error: "Elegí cómo vas a pagar" }, { status: 400 });
  /* Dos formas de resolver el envío a domicilio, y la que manda es la que esté
     configurada. Con zona de mapa cargada, el costo sale del pin; sin ella,
     sigue la lista de zonas con nombre de siempre. Nunca las dos: si hubiera
     mapa y además pidiéramos elegir zona, el que compra tendría que declarar
     dos veces lo mismo y las dos respuestas podrían no coincidir. */
  const mapa = leerMapaEnvio(conf);
  const pin = puntoDe(d);

  if (d.envio === "domicilio" && mapa && !pin)
    return json({ error: "Marcá en el mapa dónde te lo llevamos" }, { status: 400 });
  if (d.envio === "domicilio" && !mapa && !zonasR.results.some((z) => z.id === d.zona))
    return json({ error: "Elegí una zona de envío de la lista" }, { status: 400 });

  const gratisDesde = conf.envioGratisDesde == null ? Infinity : conf.envioGratisDesde;
  /* El precio lo pone el servidor, igual que el de cada producto: del navegador
     llegan las coordenadas, nunca un costo. Mandar el costo desde el navegador
     sería dejar que cualquiera se ponga el envío en cero. */
  const envioCosto = d.envio === "domicilio" && mapa && pin
    ? costoPorMapa(mapa, pin, subtotal, gratisDesde)
    : costoEnvio({ modo: d.envio, zona: d.zona }, subtotal, zonasR.results, gratisDesde);
  const total = subtotal + (envioCosto || 0);

  if (conf.minimo && subtotal < conf.minimo)
    return json({ error: `El pedido mínimo es $${conf.minimo.toLocaleString("es-AR")}` }, { status: 400 });

  const alta = await db.prepare(
    `INSERT INTO pedidos (creado, estado, nombre, telefono, gabinete, envio_modo, envio_zona,
       direccion, cp, transporte, pago, nota, subtotal, envio_lat, envio_lng, envio_costo, total)
     VALUES (?, 'nuevo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(Date.now(), recorte(d.nombre, 120), recorte(d.tel, 40), recorte(d.gabinete, 120),
      recorte(d.envio, 20), recorte(d.zona, 40), recorte(d.direccion, 200), recorte(d.cp, 20),
      recorte(d.transporte, 120), recorte(d.pago, 20), recorte(d.nota, 500),
      subtotal, pin && pin.lat, pin && pin.lng, envioCosto, total).run();

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

  /* Las líneas van con el precio que quedó anotado. El mensaje de WhatsApp se
     arma con esto y no con el catálogo del navegador, que puede tener precios de
     hace horas: cuando diferían, el mensaje mostraba renglones que no sumaban el
     subtotal escrito abajo, y la clienta leía la contradicción antes que GEA. */
  return json({
    ok: true, id, numero, subtotal, envio: envioCosto, total,
    items: lineas.map((l) => ({
      id: l.producto_id, tono: l.tono, n: l.cantidad, precio: l.precio, nombre: l.nombre,
    })),
  });
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

  /* ¿Alcanza el stock? Ya se comprobó cuando entró el pedido, pero entre que
     entró y se confirma pudo venderse lo mismo por otro lado. Sin esta lectura
     el panel confirma igual y el faltante aparece mucho después, o nunca.
     Contesta con nombres y números: el que confirma tiene que poder saber qué
     pasó, no solo que no se pudo. */
  const clave = (pid, tono) => JSON.stringify([pid, tono || null]);
  const pide = new Map();
  for (const i of items) {
    const k = clave(i.producto_id, i.tono);
    pide.set(k, (pide.get(k) || 0) + i.cantidad);
  }

  const idsPedidos = [...new Set(items.map((i) => i.producto_id))];
  const marcasP = idsPedidos.map(() => "?").join(", ");
  const [prodR, tonoR] = await db.batch([
    db.prepare(`SELECT id, nombre, stock FROM productos WHERE id IN (${marcasP})`).bind(...idsPedidos),
    db.prepare(`SELECT producto_id, nombre, stock FROM tonos WHERE producto_id IN (${marcasP})`).bind(...idsPedidos),
  ]);
  const prodPorId = new Map(prodR.results.map((p) => [p.id, p]));
  const stockTono = new Map(tonoR.results.map((t) => [clave(t.producto_id, t.nombre), t.stock]));

  const faltan = [];
  for (const [k, cantidad] of pide) {
    const [pid, tono] = JSON.parse(k);
    const p = prodPorId.get(pid);
    const hay = tono ? stockTono.get(k) : (p ? p.stock : undefined);
    const cual = (p ? p.nombre : pid) + (tono ? ` (${tono})` : "");
    if (hay === undefined) faltan.push(`${cual}: ya no está en el catálogo`);
    else if (hay < cantidad) faltan.push(`${cual}: hay ${hay} y el pedido pide ${cantidad}`);
  }
  if (faltan.length)
    return { error: "No alcanza el stock. " + faltan.join("; "), status: 409 };

  /* Todo en un batch: D1 lo corre como una sola transacción, así que o se
     descuenta todo y se marca el pedido, o no pasa nada. Un descuento a medias
     dejaría el stock mintiendo.

     Acá había un MAX(0, stock - ?), y era justamente lo que rompía esa promesa:
     cuando el stock no alcanzaba, la resta se recortaba a cero, el pedido
     quedaba confirmado y no quedaba rastro de las unidades vendidas sin existir.
     Ahora la resta escribe NULL en ese caso; la columna es NOT NULL, SQLite
     corta el batch entero y no se aplica nada. Es a propósito: la comprobación
     de arriba es la que avisa bien, y esta es la red por si el stock cambió
     entre esa lectura y este batch.

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
  const resta = "CASE WHEN stock >= ? THEN stock - ? ELSE NULL END";
  const ops = items.map((i) => i.tono
    ? db.prepare(`UPDATE tonos SET stock = ${resta}
                  WHERE producto_id = ? AND nombre = ? AND ${sigueNuevo}`)
        .bind(i.cantidad, i.cantidad, i.producto_id, i.tono, id)
    : db.prepare(`UPDATE productos SET stock = ${resta}
                  WHERE id = ? AND ${sigueNuevo}`)
        .bind(i.cantidad, i.cantidad, i.producto_id, id));

  /* "marcar" va último: los descuentos tienen que leer el estado todavía en
     "nuevo". Si cambió 0 filas, otra confirmación llegó primero y esta no
     descontó nada. */
  let r;
  try {
    r = await db.batch([...ops, marcar]);
  } catch (e) {
    /* La resta escribió NULL: entre la lectura de arriba y este batch se vendió
       lo mismo por otro lado. No se aplicó nada, así que se puede reintentar. */
    console.error("cerrar pedido:", e && e.stack || e);
    return { error: "El stock cambió mientras se confirmaba. Probá de nuevo.", status: 409 };
  }
  if (!r[r.length - 1].meta.changes)
    return { error: "El pedido ya estaba cerrado", status: 409 };

  /* Cada descuento tenía que tocar su fila. Si alguno no lo hizo —el producto
     se borró entre medio, por ejemplo—, el pedido quedó marcado sin descontar.
     Eso hay que verlo, no suponerlo: un ok acá sería el fallo silencioso que
     todo lo de arriba trata de evitar. */
  const mudos = r.slice(0, ops.length).filter((x) => !x.meta.changes).length;
  if (mudos)
    return {
      error: `El pedido quedó confirmado pero ${mudos} de ${ops.length} líneas no descontaron stock. Revisalo a mano.`,
      status: 500,
    };

  return { ok: true, descontadas: items.length };
}

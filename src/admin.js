/* Rutas del panel. Todas exigen sesión salvo el propio ingreso.
 *
 * Los campos que se pueden escribir están enumerados uno por uno. No es
 * paranoia: sin esa lista, un pedido armado a mano podría escribir cualquier
 * columna, incluida la que decide el orden o el id.
 */
import {
  contrasenaCorrecta, firmarSesion, sesionValida, leerCookie,
  cookieSesion, cookieBorrada, frenado, registrarFallo, limpiarIntentos, MINUTOS_BLOQUEO,
} from "./auth.js";

const json = (data, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

/* Cada campo dice cómo se limpia lo que llega. Lo que no está acá, no se escribe. */
const texto = (max) => (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) throw new Error(`El texto supera los ${max} caracteres`);
  return s;
};
const entero = ({ min = 0, max = 100000000 } = {}) => (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error("Tiene que ser un número entero");
  if (n < min || n > max) throw new Error(`Tiene que estar entre ${min} y ${max}`);
  return n;
};
const enteroObligatorio = (o) => (v) => {
  const n = entero(o)(v);
  if (n === null) throw new Error("Falta el número");
  return n;
};

const CAMPOS_PRODUCTO = {
  nombre: texto(120), marca: texto(60), precio: enteroObligatorio({ min: 0 }),
  precio_antes: entero({ min: 0 }), stock: entero({ min: 0, max: 100000 }),
  envio: texto(60), contenido: texto(80), rinde: texto(80), uso: texto(200),
  descripcion: texto(600), color: texto(9), categoria_id: texto(40), sub_id: texto(40),
  destacado: entero({ min: 0, max: 999 }), habitual: entero({ min: 0, max: 999 }),
};

const CAMPOS_CONFIG = new Set([
  "nombre", "rubro", "whatsapp", "instagram", "instagramUsuario", "saludo",
  "minimo", "ciudad", "horarios", "envioGratisDesde",
]);

const CAMPOS_ZONA = { nombre: texto(80), costo: entero({ min: 0 }), plazo: texto(60) };

/* Limpia lo que llegó contra una tabla de campos y devuelve qué escribir. */
function depurar(cuerpo, campos) {
  const cols = [], vals = [];
  for (const [k, v] of Object.entries(cuerpo || {})) {
    if (!(k in campos)) continue;
    try { cols.push(k); vals.push(campos[k](v)); }
    catch (e) { throw new Error(`${k}: ${e.message}`); }
  }
  return { cols, vals };
}

const ip = (request) => request.headers.get("cf-connecting-ip") || "desconocida";

export async function rutasAdmin(request, env, url) {
  const ruta = url.pathname.replace(/^\/api\/admin/, "") || "/";
  const db = env.DB;

  /* --- ingreso: la única sin sesión --- */
  if (ruta === "/entrar" && request.method === "POST") {
    const quien = ip(request);
    if (await frenado(db, quien))
      return json({ error: `Demasiados intentos. Probá de nuevo en ${MINUTOS_BLOQUEO} minutos.` }, { status: 429 });

    const { contrasena } = await request.json().catch(() => ({}));
    if (!(await contrasenaCorrecta(contrasena, env.ADMIN_PASSWORD))) {
      await registrarFallo(db, quien);
      return json({ error: "Contraseña incorrecta" }, { status: 401 });
    }
    await limpiarIntentos(db, quien);
    const token = await firmarSesion(env.SESION_SECRETO);
    return json({ ok: true }, { headers: { "set-cookie": cookieSesion(token, url) } });
  }

  /* --- de acá para abajo hace falta sesión --- */
  const activa = await sesionValida(leerCookie(request), env.SESION_SECRETO);

  if (ruta === "/sesion" && request.method === "GET") return json({ activa });

  if (ruta === "/salir" && request.method === "POST")
    return json({ ok: true }, { headers: { "set-cookie": cookieBorrada(url) } });

  if (!activa) return json({ error: "Necesitás entrar al panel" }, { status: 401 });

  try {
    /* --- listado para el panel: incluye lo que la tienda no muestra --- */
    if (ruta === "/productos" && request.method === "GET") {
      const [prods, tonos] = await db.batch([
        db.prepare(`SELECT id, nombre, marca, precio, precio_antes, stock, categoria_id, sub_id,
                           envio, contenido, rinde, uso, descripcion, color, img, img_kit,
                           destacado, habitual
                    FROM productos ORDER BY orden`),
        db.prepare("SELECT producto_id, nombre, hex, familia_id, stock FROM tonos ORDER BY producto_id, orden"),
      ]);
      const porProd = new Map();
      for (const t of tonos.results) {
        if (!porProd.has(t.producto_id)) porProd.set(t.producto_id, []);
        porProd.get(t.producto_id).push(t);
      }
      return json({
        productos: prods.results.map((p) => ({ ...p, tonos: porProd.get(p.id) || [] })),
      });
    }

    /* --- editar un producto --- */
    let m = ruta.match(/^\/producto\/([a-z0-9\-]+)$/i);
    if (m && request.method === "PATCH") {
      const { cols, vals } = depurar(await request.json(), CAMPOS_PRODUCTO);
      if (!cols.length) return json({ error: "No mandaste nada para cambiar" }, { status: 400 });
      const sql = `UPDATE productos SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`;
      const r = await db.prepare(sql).bind(...vals, m[1]).run();
      if (!r.meta.changes) return json({ error: "No existe ese producto" }, { status: 404 });
      return json({ ok: true, cambiados: cols });
    }

    /* --- stock de un tono --- */
    m = ruta.match(/^\/tono\/([a-z0-9\-]+)$/i);
    if (m && request.method === "PATCH") {
      const { nombre, stock } = await request.json();
      const n = entero({ min: 0, max: 100000 })(stock);
      if (n === null) return json({ error: "Falta el stock" }, { status: 400 });
      const r = await db.prepare("UPDATE tonos SET stock = ? WHERE producto_id = ? AND nombre = ?")
        .bind(n, m[1], String(nombre)).run();
      if (!r.meta.changes) return json({ error: "No existe ese tono" }, { status: 404 });
      return json({ ok: true });
    }

    /* --- datos del negocio y condiciones de compra --- */
    if (ruta === "/config" && request.method === "PATCH") {
      const cuerpo = await request.json();
      const pares = Object.entries(cuerpo).filter(([k]) => CAMPOS_CONFIG.has(k));
      if (!pares.length) return json({ error: "No mandaste nada para cambiar" }, { status: 400 });
      for (const [k, v] of pares) {
        if ((k === "minimo" || k === "envioGratisDesde") && v !== null && v !== "" && !Number.isInteger(Number(v)))
          return json({ error: `${k} tiene que ser un número entero` }, { status: 400 });
        if (String(v ?? "").length > 300)
          return json({ error: `${k} es demasiado largo` }, { status: 400 });
      }
      await db.batch(pares.map(([k, v]) =>
        db.prepare("INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor")
          .bind(k, v === null || v === "" ? null : String(v))));
      return json({ ok: true, cambiados: pares.map(([k]) => k) });
    }

    /* --- zonas de envío --- */
    m = ruta.match(/^\/zona\/([a-z0-9\-]+)$/i);
    if (m && request.method === "PATCH") {
      const { cols, vals } = depurar(await request.json(), CAMPOS_ZONA);
      if (!cols.length) return json({ error: "No mandaste nada para cambiar" }, { status: 400 });
      const r = await db.prepare(`UPDATE zonas_envio SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`)
        .bind(...vals, m[1]).run();
      if (!r.meta.changes) return json({ error: "No existe esa zona" }, { status: 404 });
      return json({ ok: true });
    }

    return json({ error: "No existe" }, { status: 404 });
  } catch (e) {
    return json({ error: String(e.message || e) }, { status: 400 });
  }
}

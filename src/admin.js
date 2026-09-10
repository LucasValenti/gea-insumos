/* Rutas del panel. Todas exigen sesión salvo el propio ingreso.
 *
 * Los campos que se pueden escribir están enumerados uno por uno. No es
 * paranoia: sin esa lista, un pedido armado a mano podría escribir cualquier
 * columna, incluida la que decide el orden o el id.
 */
import {
  contrasenaCorrecta, firmarSesion, sesionValida, leerCookie,
  cookieSesion, cookieBorrada, frenado, registrarFallo, limpiarIntentos, MINUTOS_BLOQUEO,
  epocaSesion, cambiarEpoca,
} from "./auth.js";
import { listarPedidos, cerrarPedido } from "./pedidos.js";
import { guardarImagen } from "./imagenes.js";

const json = (data, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

/* Un error que causó quien pidió va marcado, para que el catch del final pueda
   contestarlo con su mensaje —que le sirve para corregir— y contestar todo lo
   demás sin detalles. Se marca acá, en el validador, y no en quien lo llama:
   estos se usan sueltos además de adentro de depurar(), y marcar solo en un
   camino convertía un precio negativo en un error interno. */
const deValidacion = (mensaje) => {
  const e = new Error(mensaje);
  e.deValidacion = true;
  return e;
};

/* Cada campo dice cómo se limpia lo que llega. Lo que no está acá, no se escribe. */
const texto = (max) => (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) throw deValidacion(`El texto supera los ${max} caracteres`);
  return s;
};
const entero = ({ min = 0, max = 100000000 } = {}) => (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n)) throw deValidacion("Tiene que ser un número entero");
  if (n < min || n > max) throw deValidacion(`Tiene que estar entre ${min} y ${max}`);
  return n;
};
const enteroObligatorio = (o) => (v) => {
  const n = entero(o)(v);
  if (n === null) throw deValidacion("Falta el número");
  return n;
};
/* Las dos formas de ruta que existen, y ninguna otra: la foto estática de
   siempre y la que sube la clienta. Vacío borra la foto, que es cómo se saca
   una que quedó mal. */
const rutaDeFoto = (v) => {
  const s = texto(120)(v);
  if (s === null) return null;
  if (!/^(tienda\/img\/[\w.-]+\.(webp|jpe?g|png)|img\/[a-f0-9]{6,64}\.webp)$/.test(s))
    throw deValidacion("Esa no es una ruta de foto válida");
  return s;
};

const CAMPOS_PRODUCTO = {
  nombre: texto(120), marca: texto(60), precio: enteroObligatorio({ min: 0 }),
  precio_antes: entero({ min: 0 }), stock: entero({ min: 0, max: 100000 }),
  envio: texto(60), contenido: texto(80), rinde: texto(80), uso: texto(200),
  descripcion: texto(600), color: texto(9), categoria_id: texto(40), sub_id: texto(40),
  /* La ruta de la foto, no la foto. Entran las dos formas que conviven: las
     estáticas de siempre (tienda/img/algo.webp) y las que sube la clienta
     (img/<clave>.webp). El patrón las acota a esas dos para que esto no se
     convierta en un campo donde escribir cualquier URL: una ruta ajena acá
     pondría una imagen de otro sitio en el catálogo. */
  img: rutaDeFoto, img_kit: rutaDeFoto,
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
    /* hasOwn y no "in": con "in" también entran las claves del prototipo. Un
       cuerpo con {"constructor": 1} armaba UPDATE productos SET constructor = ?
       y, aunque no es inyección —las claves posibles son las fijas de
       Object.prototype y ninguna es columna—, SQLite contestaba "no such
       column" y ese texto salía tal cual al cliente. */
    if (!Object.hasOwn(campos, k)) continue;
    try { cols.push(k); vals.push(campos[k](v)); }
    catch (e) { throw deValidacion(`${k}: ${e.message}`); }
  }
  return { cols, vals };
}

/* stock es NOT NULL con default 0. Si en un alta viene vacío conviene sacarlo y
   dejar que la base ponga el default, en vez de insertar NULL y que rechace el
   alta entera por un campo que ni hacía falta. */
function sacarSiEsNulo(cols, vals, cual) {
  const i = cols.indexOf(cual);
  if (i >= 0 && vals[i] === null) { cols.splice(i, 1); vals.splice(i, 1); }
}

/* El id sale del nombre. Tiene que entrar en [a-z0-9-] porque es lo que
   aceptan las rutas, y además se ve en el link de la ficha. */
const aSlug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

async function idLibre(db, nombre) {
  const base = aSlug(nombre) || "producto";
  const { results } = await db.prepare("SELECT id FROM productos WHERE id = ? OR id LIKE ?")
    .bind(base, base + "-%").all();
  const tomados = new Set(results.map((r) => r.id));
  if (!tomados.has(base)) return base;
  for (let i = 2; i < 999; i++) if (!tomados.has(`${base}-${i}`)) return `${base}-${i}`;
  throw deValidacion("Ya hay demasiados productos con ese nombre");
}

const existe = async (db, tabla, id) =>
  !!(await db.prepare(`SELECT 1 FROM ${tabla} WHERE id = ?`).bind(id).first());

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
    const token = await firmarSesion(env.SESION_SECRETO, await epocaSesion(db));
    return json({ ok: true }, { headers: { "set-cookie": cookieSesion(token, url) } });
  }

  /* --- de acá para abajo hace falta sesión --- */
  const activa = await sesionValida(leerCookie(request), env.SESION_SECRETO, await epocaSesion(db));

  if (ruta === "/sesion" && request.method === "GET") return json({ activa });

  /* Salir borra la cookie y además cambia la época, así que cualquier token
     que ya se hubiera emitido deja de servir. Con un solo administrador, que
     salir cierre la sesión en todos lados es justamente lo que se espera. */
  if (ruta === "/salir" && request.method === "POST") {
    if (activa) await cambiarEpoca(db);
    return json({ ok: true }, { headers: { "set-cookie": cookieBorrada(url) } });
  }

  if (!activa) return json({ error: "Necesitás entrar al panel" }, { status: 401 });

  try {
    /* --- subir una foto ---
       Llega el WebP crudo en el cuerpo, ya achicado y convertido por el
       navegador, con las medidas en la query. Devuelve la ruta para guardar en
       el producto; quién la usa y para qué campo lo decide el PATCH de después,
       así que la misma foto sirve para el producto y para el kit. */
    if (ruta === "/imagen" && request.method === "POST") {
      const r = await guardarImagen(request, db);
      if (r.error) return json({ error: r.error }, { status: r.estado });
      return json(r, { status: 201 });
    }

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

    /* --- pedidos --- */
    if (ruta === "/pedidos" && request.method === "GET")
      return json(await listarPedidos(db, url.searchParams.get("estado")));

    let mp = ruta.match(/^\/pedido\/(\d+)\/(confirmar|cancelar)$/);
    if (mp && request.method === "POST") {
      const r = await cerrarPedido(db, Number(mp[1]), mp[2] === "confirmar" ? "confirmado" : "cancelado");
      if (r.error) return json({ error: r.error }, { status: r.status });
      return json(r);
    }

    /* --- alta de producto ---
       El id lo genera el servidor a partir del nombre. Dejar que lo elija el
       navegador sería regalarle la clave primaria a quien mande el pedido. */
    if (ruta === "/producto" && request.method === "POST") {
      const cuerpo = (await request.json()) || {};
      const nombre = texto(120)(cuerpo.nombre);
      if (!nombre) return json({ error: "Falta el nombre del producto" }, { status: 400 });
      if (entero({ min: 0 })(cuerpo.precio) === null)
        return json({ error: "Falta el precio" }, { status: 400 });
      const categoria = texto(40)(cuerpo.categoria_id);
      if (!categoria) return json({ error: "Elegí una categoría" }, { status: 400 });
      if (!await existe(db, "categorias", categoria))
        return json({ error: "Esa categoría no existe" }, { status: 400 });

      const { cols, vals } = depurar(cuerpo, CAMPOS_PRODUCTO);
      sacarSiEsNulo(cols, vals, "stock");
      const id = await idLibre(db, nombre);
      const ultimo = await db.prepare("SELECT MAX(orden) AS m FROM productos").first();
      cols.push("id", "orden");
      vals.push(id, ((ultimo && ultimo.m) || 0) + 1);
      await db.prepare(`INSERT INTO productos (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
        .bind(...vals).run();
      return json({ ok: true, id }, { status: 201 });
    }

    /* --- editar un producto --- */
    let m = ruta.match(/^\/producto\/([a-z0-9\-]+)$/i);
    if (m && request.method === "PATCH") {
      const cuerpo = (await request.json()) || {};
      /* El alta comprueba que la categoría exista y la edición no lo hacía, así
         que un producto podía quedar apuntando a una que no está y desaparecer
         de la tienda sin dar error. La clave foránea no lo cubre: el Worker
         nunca ejecuta PRAGMA foreign_keys=ON —solo lo hace la semilla—, así que
         SQLite no la aplica en esta conexión. */
      if (cuerpo.categoria_id !== undefined) {
        const categoria = texto(40)(cuerpo.categoria_id);
        if (!categoria || !await existe(db, "categorias", categoria))
          return json({ error: "Esa categoría no existe" }, { status: 400 });
      }
      const { cols, vals } = depurar(cuerpo, CAMPOS_PRODUCTO);
      if (!cols.length) return json({ error: "No mandaste nada para cambiar" }, { status: 400 });
      const sql = `UPDATE productos SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`;
      const r = await db.prepare(sql).bind(...vals, m[1]).run();
      if (!r.meta.changes) return json({ error: "No existe ese producto" }, { status: 404 });
      return json({ ok: true, cambiados: cols });
    }

    /* --- baja de producto ---
       Los pedidos viejos no se rompen: pedido_items guarda el nombre y el
       precio congelados y a propósito no tiene clave foránea contra productos,
       así que el historial sigue diciendo lo que se pidió aunque el producto ya
       no exista. Los tonos y, si era un kit, sus componentes, se van con él por
       cascada. Lo que sí frena el borrado es que el producto esté DENTRO de un
       kit: ahí el kit quedaría mintiendo sobre lo que trae. */
    if (m && request.method === "DELETE") {
      const { results: kits } = await db.prepare(
        `SELECT p.nombre FROM kit_componentes k JOIN productos p ON p.id = k.kit_id
         WHERE k.producto_id = ? ORDER BY p.nombre`).bind(m[1]).all();
      if (kits.length)
        return json({
          error: `No se puede borrar: forma parte de ${kits.map((k) => k.nombre).join(", ")}. ` +
            "Sacalo del kit primero.",
        }, { status: 409 });
      const r = await db.prepare("DELETE FROM productos WHERE id = ?").bind(m[1]).run();
      if (!r.meta.changes) return json({ error: "No existe ese producto" }, { status: 404 });
      return json({ ok: true });
    }

    /* --- alta de tono --- */
    m = ruta.match(/^\/tono\/([a-z0-9\-]+)$/i);
    if (m && request.method === "POST") {
      const c = (await request.json()) || {};
      const nombre = texto(60)(c.nombre);
      if (!nombre) return json({ error: "Falta el nombre del tono" }, { status: 400 });
      const hex = texto(9)(c.hex);
      if (!hex || !/^#[0-9a-f]{6}$/i.test(hex))
        return json({ error: "El color va en hexadecimal, por ejemplo #C4756B" }, { status: 400 });
      if (!await existe(db, "productos", m[1]))
        return json({ error: "No existe ese producto" }, { status: 404 });
      if (await db.prepare("SELECT 1 FROM tonos WHERE producto_id = ? AND nombre = ?").bind(m[1], nombre).first())
        return json({ error: "Ese producto ya tiene un tono con ese nombre" }, { status: 409 });
      const familia = texto(40)(c.familia_id);
      if (familia && !await existe(db, "familias", familia))
        return json({ error: "Esa familia de color no existe" }, { status: 400 });
      const ultimo = await db.prepare("SELECT MAX(orden) AS m FROM tonos WHERE producto_id = ?").bind(m[1]).first();
      await db.prepare("INSERT INTO tonos (producto_id, nombre, hex, familia_id, stock, orden) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(m[1], nombre, hex, familia, entero({ min: 0, max: 100000 })(c.stock) || 0, ((ultimo && ultimo.m) || 0) + 1)
        .run();
      return json({ ok: true }, { status: 201 });
    }

    /* --- baja de tono ---
       El nombre viaja por la query y no por el cuerpo: no todos los caminos
       respetan un cuerpo en DELETE.

       Al borrar se recalcula productos.stock con la suma de los que quedan. Las
       unidades de un tono se van con el tono: si tenía seis frascos de Azul y
       el Azul deja de existir, esos seis no están. Mientras haya tonos esa
       columna se ignora, pero al irse el último el producto pasa a usarla, y
       entonces queda en cero en vez de resucitar el número viejo que traía de
       antes de tener tonos. El panel avisa antes de borrar el último. */
    if (m && request.method === "DELETE") {
      const nombre = url.searchParams.get("nombre");
      if (!nombre) return json({ error: "Falta el nombre del tono" }, { status: 400 });
      const [borrado] = await db.batch([
        db.prepare("DELETE FROM tonos WHERE producto_id = ? AND nombre = ?").bind(m[1], nombre),
        db.prepare(`UPDATE productos SET stock = (SELECT COALESCE(SUM(stock), 0) FROM tonos WHERE producto_id = ?)
                    WHERE id = ?`).bind(m[1], m[1]),
      ]);
      if (!borrado.meta.changes) return json({ error: "No existe ese tono" }, { status: 404 });
      return json({ ok: true });
    }

    /* --- stock de un tono --- */
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
    /* Lo que causó quien pidió vuelve con su mensaje; lo demás, no. El detalle
       de un error de SQL cuenta nombres de tablas y de columnas, y devolverlo
       contradecía la política que el propio proyecto aplica en src/index.js
       para el catálogo. */
    if (e instanceof SyntaxError)
      return json({ error: "El cuerpo no es JSON válido" }, { status: 400 });
    if (e && e.deValidacion)
      return json({ error: String(e.message) }, { status: 400 });
    console.error("panel:", e && e.stack || e);
    return json({ error: "No se pudo completar la operación" }, { status: 500 });
  }
}

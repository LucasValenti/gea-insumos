/* Worker de GEA Insumos.
 *
 * Hasta acá el sitio era solo archivos estáticos. Ahora las rutas /api/* las
 * atiende este script y todo lo demás sigue saliendo de public/ igual que
 * antes, a través del binding ASSETS.
 *
 * La única ruta por ahora es GET /api/catalogo, que devuelve exactamente la
 * misma forma de datos que armaba public/tienda/datos.js a mano, para que las
 * pantallas no se enteren del cambio.
 */

import { rutasAdmin } from "./admin.js";

const CACHE = "public, max-age=60, stale-while-revalidate=600";

const json = (data, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

/* Deja afuera las claves vacías: el catálogo escrito a mano no traía "color:
   null" ni "tonos: null", traía la clave ausente, y las pantallas preguntan
   por presencia. */
const limpio = (o) => {
  const r = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined) r[k] = v;
  return r;
};

async function catalogo(db) {
  const [cats, subs, fams, zonas, cfg, prods, tonos, comps, incluye] = await db.batch([
    db.prepare("SELECT id, nombre, descripcion, img FROM categorias ORDER BY orden"),
    db.prepare("SELECT id, categoria_id, nombre FROM subcategorias ORDER BY categoria_id, orden"),
    db.prepare("SELECT id, nombre, hex FROM familias ORDER BY orden"),
    db.prepare("SELECT id, nombre, costo, plazo FROM zonas_envio ORDER BY orden"),
    db.prepare("SELECT clave, valor FROM config"),
    db.prepare(`SELECT id, categoria_id, sub_id, marca, nombre, precio, precio_antes, stock,
                       envio, contenido, rinde, uso, descripcion, img, img_kit, color,
                       destacado, habitual
                FROM productos ORDER BY orden`),
    db.prepare("SELECT producto_id, nombre, hex, familia_id, stock FROM tonos ORDER BY producto_id, orden"),
    db.prepare("SELECT kit_id, producto_id, cantidad FROM kit_componentes ORDER BY kit_id, orden"),
    db.prepare("SELECT kit_id, texto FROM kit_incluye ORDER BY kit_id, orden"),
  ]);

  const conf = Object.fromEntries(cfg.results.map((r) => [r.clave, r.valor]));
  const entero = (v) => (v === undefined || v === null || v === "" ? null : Number(v));

  const porProducto = new Map();
  for (const t of tonos.results) {
    if (!porProducto.has(t.producto_id)) porProducto.set(t.producto_id, []);
    porProducto.get(t.producto_id).push({ nombre: t.nombre, hex: t.hex, fam: t.familia_id, stock: t.stock });
  }
  /* Se expande a la lista repetida que el catálogo tenía escrita a mano: nada
     la muestra en pantalla, pero es la forma que las pantallas ya conocían y
     de la que sale el precio suelto del kit. */
  const compsDe = new Map();
  for (const c of comps.results) {
    if (!compsDe.has(c.kit_id)) compsDe.set(c.kit_id, []);
    const lista = compsDe.get(c.kit_id);
    for (let i = 0; i < c.cantidad; i++) lista.push(c.producto_id);
  }
  const incluyeDe = new Map();
  for (const i of incluye.results) {
    if (!incluyeDe.has(i.kit_id)) incluyeDe.set(i.kit_id, []);
    incluyeDe.get(i.kit_id).push(i.texto);
  }

  const PRODUCTOS = prods.results.map((p) => {
    const t = porProducto.get(p.id);
    return limpio({
      id: p.id, cat: p.categoria_id, sub: p.sub_id, marca: p.marca, nombre: p.nombre,
      precio: p.precio, precioAntes: p.precio_antes,
      /* Con tonos, el stock es la suma de los tonos: una sola fuente de verdad,
         para que no se desincronice al editar un tono suelto. */
      stock: t ? t.reduce((a, x) => a + x.stock, 0) : p.stock,
      envio: p.envio, contenido: p.contenido, rinde: p.rinde, uso: p.uso,
      desc: p.descripcion, img: p.img, imgKit: p.img_kit, color: p.color,
      tonos: t, componentes: compsDe.get(p.id), incluye: incluyeDe.get(p.id),
    });
  });

  /* El "antes" de un kit sale de sumar sus componentes, y solo si comprarlo
     suelto sale más caro: si el kit no ahorra nada no corresponde mostrar
     cinta de descuento. sueltoSuma queda para poder auditarlo. */
  const precioDe = new Map(PRODUCTOS.map((p) => [p.id, p.precio]));
  for (const k of PRODUCTOS) {
    if (!k.componentes) continue;
    k.sueltoSuma = k.componentes.reduce((a, id) => a + (precioDe.get(id) || 0), 0);
    if (k.sueltoSuma > k.precio) k.precioAntes = k.sueltoSuma;
    else delete k.precioAntes;
  }

  const orden = (campo) => prods.results
    .filter((p) => p[campo] !== null)
    .sort((a, b) => a[campo] - b[campo])
    .map((p) => p.id);

  return {
    NEGOCIO: {
      nombre: conf.nombre, rubro: conf.rubro, whatsapp: conf.whatsapp,
      instagram: conf.instagram, instagramUsuario: conf.instagramUsuario,
      saludo: conf.saludo, minimo: entero(conf.minimo),
      ciudad: conf.ciudad || null, horarios: conf.horarios || null,
    },
    CATEGORIAS: cats.results.map((c) => ({
      id: c.id, nombre: c.nombre, desc: c.descripcion, img: c.img,
      subs: subs.results.filter((s) => s.categoria_id === c.id).map((s) => ({ id: s.id, nombre: s.nombre })),
    })),
    FAMILIAS: fams.results,
    PRODUCTOS,
    DESTACADOS: orden("destacado"),
    HABITUALES: orden("habitual"),
    ENVIO: {
      gratisDesde: entero(conf.envioGratisDesde),
      provisorio: conf.envioProvisorio === "1",
      zonas: zonas.results.map((z) => ({ id: z.id, nombre: z.nombre, costo: z.costo, plazo: z.plazo })),
    },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/catalogo") {
      if (request.method !== "GET") return json({ error: "Método no permitido" }, { status: 405 });
      try {
        return json(await catalogo(env.DB), { headers: { "cache-control": CACHE } });
      } catch (e) {
        /* Si la base falla, el sitio queda sin catálogo: conviene que se vea
           el error y no una tienda vacía que parece no tener productos. */
        return json({ error: "No se pudo leer el catálogo", detalle: String(e && e.message || e) }, { status: 500 });
      }
    }

    if (url.pathname.startsWith("/api/admin")) {
      if (!env.ADMIN_PASSWORD || !env.SESION_SECRETO)
        return json({ error: "El panel no está configurado en este entorno" }, { status: 503 });
      return rutasAdmin(request, env, url);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "No existe" }, { status: 404 });

    return env.ASSETS.fetch(request);
  },
};

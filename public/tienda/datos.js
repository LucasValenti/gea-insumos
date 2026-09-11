/* Catálogo de la tienda. Los datos ya no viven acá: los sirve /api/catalogo
   desde la base, y este archivo los pide y los deja a mano.

   Detalle importante: las pantallas hacen `const { PRODUCTOS } = window.T` al
   cargarse, o sea que capturan estas referencias una sola vez y para siempre.
   Por eso los contenedores se crean vacíos y después se LLENAN, nunca se
   reemplazan. Si acá se hiciera `PRODUCTOS = [...]`, las pantallas seguirían
   mirando el array viejo y la tienda se vería vacía.

   Las funciones de lectura no cambiaron: leen los mismos contenedores en el
   momento en que se las llama, así que funcionan igual antes y después de que
   lleguen los datos. */
window.T = (() => {
const NEGOCIO = {};
const CATEGORIAS = [];
const FAMILIAS = [];
const PRODUCTOS = [];
const DESTACADOS = [];
const HABITUALES = [];
/* Infinity y no 0: sin umbral cargado, nada llega al envío sin cargo. Con 0
   pasaba lo contrario —cualquier subtotal lo superaba— y la tienda anunciaba
   envío gratis en todos los pedidos. */
const ENVIO = { gratisDesde: Infinity, provisorio: false, zonas: [], mapa: null };

const rellenar = (destino, origen) => { destino.length = 0; destino.push(...(origen || [])); };

let cargado = false;
const estaCargado = () => cargado;

/* El pedido del catálogo sale apenas se carga este archivo, no cuando React
   monta. Hasta acá se pedía adentro de un efecto, o sea después de bajar React,
   montar y renderizar: medido, el fetch salía a los 2,9 s cuando este archivo ya
   estaba en el navegador a los 75 ms. Nada de lo que se ve en pantalla existe
   antes de que llegue esta respuesta, así que arrancarla tarde retrasa todo.
   Si falla, se olvida, y el botón de reintentar vuelve a pedirla de cero. */
let enVuelo = null;
const pedir = () => {
  if (!enVuelo) {
    enVuelo = fetch("/api/catalogo", { headers: { accept: "application/json" } })
      .then((r) => {
        if (!r.ok) throw new Error("El catálogo respondió " + r.status);
        return r.json();
      })
      .catch((e) => { enVuelo = null; throw e; });
  }
  return enVuelo;
};
pedir();

const cargar = async () => {
  const d = await pedir();
  if (!d || !Array.isArray(d.PRODUCTOS)) throw new Error("El catálogo vino incompleto");

  Object.assign(NEGOCIO, d.NEGOCIO);
  rellenar(CATEGORIAS, d.CATEGORIAS);
  rellenar(FAMILIAS, d.FAMILIAS);
  rellenar(PRODUCTOS, d.PRODUCTOS);
  rellenar(DESTACADOS, d.DESTACADOS);
  rellenar(HABITUALES, d.HABITUALES);
  /* Las medidas de las fotos que subió la clienta se suman a las de medidas.js,
     que trae las estáticas. Se agregan y no se reemplaza el objeto: ui.jsx lee
     window.MEDIDAS en cada render, pero medidas.js ya lo dejó puesto y pisarlo
     dejaría a las fotos de siempre sin ancho ni alto. */
  if (d.MEDIDAS) Object.assign(window.MEDIDAS || (window.MEDIDAS = {}), d.MEDIDAS);
  ENVIO.gratisDesde = d.ENVIO.gratisDesde == null ? Infinity : d.ENVIO.gratisDesde;
  ENVIO.provisorio = d.ENVIO.provisorio;
  ENVIO.mapa = d.ENVIO.mapa || null;
  rellenar(ENVIO.zonas, d.ENVIO.zonas);
  cargado = true;
  return d;
};

/* Las categorías que hoy tienen algo adentro.
   El catálogo dejó de vender esmaltes y esas dos categorías quedaron vacías,
   pero seguían en la portada, en el menú y en el pie, y llevaban a una pantalla
   sin un solo producto. No se borran a propósito: si mañana vuelve a cargarse
   un esmalte desde el panel, la categoría reaparece sola, sin tocar código.
   El filtro va acá y no en /api/catalogo porque el panel lee esa misma
   respuesta, y si le escondiéramos las categorías vacías no habría forma de
   elegirlas al dar de alta un producto —quedarían vacías para siempre—.
   Son funciones y no listas porque las pantallas capturan las referencias una
   sola vez al cargarse: una lista calculada ahora saldría siempre vacía. */
const catsVisibles = () => CATEGORIAS.filter((c) => PRODUCTOS.some((p) => p.cat === c.id));
/* Lo mismo con las familias de color: sin un producto que las use, el filtro
   ofrecía un recorte que devolvía una pantalla vacía. */
const famsVisibles = () => FAMILIAS.filter((f) => PRODUCTOS.some((p) => (p.tonos || []).some((t) => t.fam === f.id)));

/* ---- envío por mapa ----
   Mismo criterio que src/envio.js, pero el que manda es el servidor: acá esto
   solo sirve para contestar "entrás / no entrás" en el acto, sin esperar una
   respuesta, mientras se arrastra el pin. El precio nunca se calcula acá.

   El punto desde el que se mide la distancia no está en esta página a
   propósito: es la casa de la clienta y no sale del servidor, así que el precio
   de lo que queda afuera se pide a /api/envio. */
const dentroDeZona = (punto, zona) => {
  let dentro = false;
  for (let i = 0, j = zona.length - 1; i < zona.length; j = i++) {
    const [yi, xi] = zona[i];
    const [yj, xj] = zona[j];
    const cruza = (yi > punto.lat) !== (yj > punto.lat)
      && punto.lng < ((xj - xi) * (punto.lat - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
};

/* Le pide el costo al servidor para un punto. Devuelve { costo, enZona }, donde
   costo null significa "hay que cotizarlo por chat" y 0 "sin cargo". */
const cotizarEnvio = async (lat, lng, subtotal) => {
  const r = await fetch("/api/envio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lat, lng, subtotal }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "No se pudo calcular el envío");
  return d;
};

const zonaDe = (id) => ENVIO.zonas.find((z) => z.id === id) || null;
/* Devuelve el costo, 0 si no corresponde cobrar, o null si todavía no se puede calcular. */
const costoEnvio = (datos, sub) => {
  if (!datos || datos.envio !== "domicilio") return 0;
  /* Con zona de mapa cargada manda el pin, y el número ya lo contestó
     /api/envio: viaja en datos solo para mostrarlo. El que vale es el que el
     servidor vuelve a calcular al registrar el pedido, así que tocar este acá
     no abarata nada. */
  if (ENVIO.mapa) return datos.lat == null ? null : (datos.envioCosto ?? null);
  const z = zonaDe(datos.zona);
  if (!z || z.costo == null) return null;
  return sub >= ENVIO.gratisDesde ? 0 : z.costo;
};

/* Tolera que no haya número: antes, un precio indefinido tiraba TypeError
   y con él la página entera, en blanco y sin forma de salir. */
/* "Lo de siempre" era una lista fija igual para todos. Ahora, si el cliente
   guardó su propio pedido habitual, manda el suyo. No hay cuentas de usuario:
   vive en su navegador, que es donde ya vive su carrito. Se filtra contra el
   catálogo por si guardó algo que después dejó de existir. */
const HAB_LS = "gea_habituales_v1";
const guardarHabituales = (ids) => {
  try { localStorage.setItem(HAB_LS, JSON.stringify([...new Set(ids)].slice(0, 12))); return true; }
  catch (e) { return false; }
};
const habitualesDe = () => {
  let propios = null;
  try { propios = JSON.parse(localStorage.getItem(HAB_LS)); } catch (e) {}
  const lista = Array.isArray(propios) && propios.length ? propios : HABITUALES;
  return lista.filter((id) => prod(id));
};

/* La dirección de un producto, en un solo lugar: la usan los enlaces de las
   pantallas, el historial de la app y el sitemap del servidor tiene que coincidir
   con ella. El servidor arma el <head> de esta dirección en src/paginas.js. */
const urlProducto = (id) => "/p/" + encodeURIComponent(id);

/* Un clic con Ctrl, Cmd, Shift o con la rueda tiene que abrir la dirección de
   verdad en otra pestaña, no navegar en esta. Los enlaces que llaman a esto
   antes hacían preventDefault siempre, y como el href era "#" abrir en otra
   pestaña llevaba a una página rota. */
const clicPropio = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);

const precio = (n) => (typeof n === "number" && isFinite(n) ? "$ " + n.toLocaleString("es-AR") : "");
const cat = (id) => CATEGORIAS.find((c) => c.id === id) || {};
const prod = (id) => PRODUCTOS.find((p) => p.id === id);
const nombreSub = (c, s) => ((cat(c).subs || []).find((x) => x.id === s) || {}).nombre || "";
const stockDe = (p, tono) => (tono ? (p.tonos.find((x) => x.nombre === tono) || {}).stock ?? 0 : p.stock);
/* El subtotal del carrito, en un solo lugar. Estaba escrito igual en cuatro
   pantallas, y de ahí salía que el mensaje de WhatsApp pudiera sumar distinto
   que el resumen de al lado. Sin guarda contra el producto que no existe a
   propósito: saneaCarrito ya los sacó, y valuar en 0 lo que no encuentra sería
   convertir un error en un importe equivocado. */
const subtotalDe = (carrito) => (carrito || []).reduce((a, it) => a + prod(it.id).precio * it.n, 0);
const familiasDe = (p) => [...new Set((p.tonos || []).map((x) => x.fam))];
const porFamilia = (fam) => PRODUCTOS.filter((p) => familiasDe(p).includes(fam));
/* En el celular casi nadie escribe "acrílico" ni "uñas" con tilde, y el includes
   crudo devolvía cero resultados: "acrilico" 0, "unas" 0, "construccion" 0.
   NFD separa la tilde de la letra y el filtro por código saca las marcas
   combinantes (768-879), que también convierte la ñ en n. */
const sinTildes = (s) => String(s).normalize("NFD").split("")
  .filter((c) => c.charCodeAt(0) < 768 || c.charCodeAt(0) > 879).join("").toLowerCase();
/* Por palabras y no por frase entera, para que "gel nude" encuentre el polygel. */
const buscar = (q) => {
  const palabras = sinTildes(q).trim().split(" ").filter(Boolean);
  if (!palabras.length) return [];
  return PRODUCTOS.filter((p) => {
    /* Con || "" y no a secas: desde que el panel deja crear productos, la marca
       puede no estar, y "nombre" + " " + undefined metía la palabra "undefined"
       en el índice. Buscar "undefined" devolvía medio catálogo. */
    const heno = sinTildes([p.nombre, p.marca, cat(p.cat).nombre,
      (p.tonos || []).map((x) => x.nombre).join(" ")].filter(Boolean).join(" "));
    return palabras.every((w) => heno.includes(w));
  });
};
return { NEGOCIO, CATEGORIAS, FAMILIAS, PRODUCTOS, DESTACADOS, HABITUALES, ENVIO, cargar, estaCargado,
  guardarHabituales, habitualesDe,
  catsVisibles, famsVisibles, dentroDeZona, cotizarEnvio,
  zonaDe, costoEnvio, precio, cat, prod, nombreSub, stockDe, subtotalDe, familiasDe, porFamilia, buscar,
  urlProducto, clicPropio };
})();

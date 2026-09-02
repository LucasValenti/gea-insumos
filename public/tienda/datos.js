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
const ENVIO = { gratisDesde: 0, provisorio: false, zonas: [] };

const rellenar = (destino, origen) => { destino.length = 0; destino.push(...(origen || [])); };

let cargado = false;
const estaCargado = () => cargado;

const cargar = async () => {
  const r = await fetch("/api/catalogo", { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error("El catálogo respondió " + r.status);
  const d = await r.json();
  if (!d || !Array.isArray(d.PRODUCTOS)) throw new Error("El catálogo vino incompleto");

  Object.assign(NEGOCIO, d.NEGOCIO);
  rellenar(CATEGORIAS, d.CATEGORIAS);
  rellenar(FAMILIAS, d.FAMILIAS);
  rellenar(PRODUCTOS, d.PRODUCTOS);
  rellenar(DESTACADOS, d.DESTACADOS);
  rellenar(HABITUALES, d.HABITUALES);
  ENVIO.gratisDesde = d.ENVIO.gratisDesde;
  ENVIO.provisorio = d.ENVIO.provisorio;
  rellenar(ENVIO.zonas, d.ENVIO.zonas);
  cargado = true;
  return d;
};

const zonaDe = (id) => ENVIO.zonas.find((z) => z.id === id) || null;
/* Devuelve el costo, 0 si no corresponde cobrar, o null si todavía no se puede calcular. */
const costoEnvio = (datos, sub) => {
  if (!datos || datos.envio !== "domicilio") return 0;
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

const precio = (n) => (typeof n === "number" && isFinite(n) ? "$ " + n.toLocaleString("es-AR") : "");
const cat = (id) => CATEGORIAS.find((c) => c.id === id) || {};
const prod = (id) => PRODUCTOS.find((p) => p.id === id);
const nombreSub = (c, s) => ((cat(c).subs || []).find((x) => x.id === s) || {}).nombre || "";
const stockDe = (p, tono) => (tono ? (p.tonos.find((x) => x.nombre === tono) || {}).stock ?? 0 : p.stock);
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
    const heno = sinTildes(p.nombre + " " + p.marca + " " + cat(p.cat).nombre + " " + (p.tonos || []).map((x) => x.nombre).join(" "));
    return palabras.every((w) => heno.includes(w));
  });
};
return { NEGOCIO, CATEGORIAS, FAMILIAS, PRODUCTOS, DESTACADOS, HABITUALES, ENVIO, cargar, estaCargado,
  guardarHabituales, habitualesDe,
  zonaDe, costoEnvio, precio, cat, prod, nombreSub, stockDe, familiasDe, porFamilia, buscar };
})();

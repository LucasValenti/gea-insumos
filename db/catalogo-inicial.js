/* Datos de ejemplo para el prototipo de tienda. Estructura de categorías
   inspirada en un distribuidor de insumos de estética; precios en ARS. */
window.T = (() => {
const NEGOCIO = {
  nombre: "GEA Insumos", rubro: "Insumos de belleza",
  whatsapp: "5490000000000", instagram: "https://instagram.com/", instagramUsuario: "@geainsumos",
  saludo: "Hola GEA, quiero hacer este pedido:",
  minimo: 25000, ciudad: null, horarios: null,
};

const CATEGORIAS = [
  { id: "semis", img: "tienda/img/cat-semis.webp", nombre: "Esmaltes semis", desc: "Semipermanentes por 15 y 7 ml, y colecciones completas.",
    subs: [{ id: "s15", nombre: "Semis x 15 ml" }, { id: "s7", nombre: "Semis x 7 ml" }, { id: "colec", nombre: "Colecciones" }] },
  { id: "tradicionales", img: "tienda/img/cat-tradicionales.webp", nombre: "Esmaltes tradicionales", desc: "Secado al aire, tratamientos y top coats.",
    subs: [{ id: "trad", nombre: "Color" }, { id: "trat", nombre: "Tratamientos y top coat" }] },
  { id: "construccion", img: "tienda/img/cat-construccion.webp", nombre: "Construcción de uñas", desc: "Acrílico, gel, polygel y soft gel.",
    subs: [{ id: "acrilico", nombre: "Uñas acrílicas" }, { id: "gel", nombre: "Uñas en gel" }, { id: "polygel", nombre: "Poly gel" }, { id: "soft", nombre: "Soft gel y tips" }] },
  { id: "decoracion", img: "tienda/img/cat-decoracion.webp", nombre: "Decoración de uñas", desc: "Stamping, apliques, glitters y gel paint.",
    subs: [{ id: "stamping", nombre: "Stamping" }, { id: "apliques", nombre: "Apliques y efectos" }, { id: "paint", nombre: "Gel paint" }] },
  { id: "herramientas", img: "tienda/img/cat-herramientas.webp", nombre: "Herramientas y equipos", desc: "Limas, tornos, fresas, cabinas y accesorios.",
    subs: [{ id: "limas", nombre: "Limas y bloques" }, { id: "tornos", nombre: "Tornos y fresas" }, { id: "cabinas", nombre: "Cabinas" }, { id: "acces", nombre: "Accesorios" }] },
  { id: "preparacion", img: "tienda/img/cat-preparacion.webp", nombre: "Preparación y removedores", desc: "Primers, deshidratadores, quitaesmaltes y descartables.",
    subs: [{ id: "prep", nombre: "Primers y prep" }, { id: "remo", nombre: "Quitaesmaltes y removedores" }, { id: "desc", nombre: "Descartables" }] },
  { id: "kits", img: "tienda/img/cat-kits.webp", nombre: "Kits por servicio", desc: "Todo lo de un servicio, armado y con precio cerrado.", subs: [] },
];

const FAMILIAS = [
  { id: "nudes", nombre: "Nudes", hex: "#E2C2B9" },
  { id: "rosas", nombre: "Rosas", hex: "#D98BA3" },
  { id: "rojos", nombre: "Rojos", hex: "#B4142B" },
  { id: "oscuros", nombre: "Oscuros", hex: "#241E2B" },
  { id: "pasteles", nombre: "Pasteles", hex: "#D9CFE8" },
  { id: "metalizados", nombre: "Metalizados", hex: "#C8A24B" },
];

const t = (nombre, hex, fam, stock = 6) => ({ nombre, hex, fam, stock });

const PRODUCTOS = [
  { id:"semi-15-basicos", cat:"semis", sub:"s15", marca:"Pink Mask", nombre:"Semipermanente x 15 ml", precio:12400, stock:24, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"25 a 30 aplicaciones", uso:"Dos capas finas, 90 s en cabina LED.",
    desc:"El semi de todos los días: cubre en dos capas, no se corre en la cutícula y no se opaca con el lavado.",
    tonos:[t("Nude Rosado","#E2C2B9","nudes",9),t("Cappuccino","#C9A48F","nudes",4),t("Rosa Viejo","#D98BA3","rosas",7),t("Fucsia Real","#C0246B","rosas",3),t("Rojo Clásico","#B4142B","rojos",8),t("Bordó Vino","#6E1526","rojos",5),t("Negro Intenso","#141414","oscuros",6),t("Verde Bosque","#26433A","oscuros",2),t("Lila Bruma","#D9CFE8","pasteles",6),t("Celeste Hielo","#CBDDE6","pasteles",4),t("Dorado Espejo","#C8A24B","metalizados",3),t("Plata Cromo","#B9BCC2","metalizados",0)] },
  { id:"semi-7-cortos", cat:"semis", sub:"s7", marca:"Bompassy", nombre:"Semipermanente x 7 ml", precio:7900, stock:31, envio:"2 a 4 días",
    contenido:"7 ml", rinde:"12 a 15 aplicaciones", uso:"Dos capas finas, 60 s en LED.",
    desc:"Mismo pigmento en frasco chico. Para probar tonos nuevos sin comprar los 15 ml.",
    tonos:[t("Nude Leche","#EFE0D8","nudes",8),t("Coral Suave","#E68A72","rosas",5),t("Rojo Cereza","#A31128","rojos",6),t("Azul Noche","#1B2440","oscuros",4),t("Menta","#BFDCD0","pasteles",3),t("Champagne","#D6C39A","metalizados",2)] },
  { id:"coleccion-starlight", cat:"semis", sub:"colec", marca:"Bompassy", nombre:"Colección Starlight x 11 tonos", precio:96500, precioAntes:112000, stock:4, envio:"2 a 4 días",
    contenido:"11 frascos de 15 ml", rinde:"Uso profesional", uso:"Curado 90 s por capa.",
    desc:"Los once tonos de la temporada en una sola compra, más barato que llevarlos de a uno.",
    color:"#8A5C4E" },
  { id:"base-rubber", img:"tienda/img/base-rubber.webp", cat:"semis", sub:"s15", marca:"Pink Mask", nombre:"Base Rubber Nivelante", precio:13200, stock:18, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"20 a 25 aplicaciones", uso:"Capa fina de anclaje más una de nivelación.",
    desc:"Base espesa que corrige irregularidades y aporta resistencia en uñas finas.", color:"#F6E3DC" },
  { id:"top-coat-espejo", img:"tienda/img/top-coat-espejo.webp", cat:"semis", sub:"s15", marca:"Pink Mask", nombre:"Top Coat Brillo Espejo", precio:11800, stock:22, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"25 a 30 aplicaciones", uso:"Una capa generosa, 60 s en cabina.",
    desc:"Sellador sin capa pegajosa. Mantiene el brillo hasta el retiro.", color:"#F0EDEA" },
  { id:"trad-pasteles-x6", cat:"tradicionales", sub:"trad", marca:"Opción", nombre:"Esmalte Tradicional x 6 Pasteles", precio:9600, stock:12, envio:"2 a 4 días",
    contenido:"6 frascos de 11 ml", rinde:"Secado al aire", uso:"Dos capas, sin cabina.",
    desc:"Set de seis pasteles para clientas que prefieren el esmalte tradicional.", color:"#D9CFE8" },
  { id:"secaesmalte-aerosol", cat:"tradicionales", sub:"trat", marca:"Raffiné", nombre:"Secaesmalte en Aerosol 410 ml", precio:8500, stock:9, envio:"2 a 4 días",
    contenido:"410 ml", rinde:"60 servicios", uso:"Rociar a 20 cm, secado en 60 s.",
    desc:"Corta el tiempo de secado del tradicional y evita marcas de dedos." },
  { id:"aceite-cuticula", cat:"tradicionales", sub:"trat", marca:"Cherimoya", nombre:"Aceite de Cutícula con Pipeta", precio:6400, stock:2, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"120 aplicaciones", uso:"Una gota por uña al terminar el servicio.",
    desc:"Cierre del servicio: hidrata la cutícula y deja la piel prolija en la foto final." },
  { id:"acrilico-clear", cat:"construccion", sub:"acrilico", marca:"Keila", nombre:"Acrílico Polímero Clear", precio:24800, stock:11, envio:"2 a 4 días",
    contenido:"100 g", rinde:"30 manos", uso:"Relación 1 a 1 con monómero.",
    desc:"Grano fino y fraguado medio: da tiempo a trabajar sin perder dureza final." },
  { id:"monomero-sin-olor", cat:"construccion", sub:"acrilico", marca:"Keila", nombre:"Monómero Sin Olor", precio:19700, stock:7, envio:"2 a 4 días",
    contenido:"100 ml", rinde:"Según técnica", uso:"Usar en ambiente ventilado.",
    desc:"Olor reducido, pensado para gabinetes chicos o trabajo a domicilio." },
  { id:"gel-constructor", cat:"construccion", sub:"gel", marca:"IBD", nombre:"Gel Constructor Transparente", precio:18900, stock:14, envio:"2 a 4 días",
    contenido:"30 g", rinde:"18 a 22 manos", uso:"Curado de 60 s por capa.",
    desc:"Gel de media densidad, autonivelante, no chorrea sobre el molde." },
  { id:"polygel-nude", cat:"construccion", sub:"polygel", marca:"Navi", nombre:"Polygel Nude Cover", precio:21500, stock:3, envio:"2 a 4 días",
    contenido:"30 g", rinde:"20 manos", uso:"Modelar con pincel y alcohol, curar 90 s.",
    desc:"Resistencia del acrílico con la comodidad del gel. Sin olor, no fragua solo.",
    tonos:[t("Nude Cover","#E8CDC4","nudes",3),t("Rosa Cover","#EFD3D6","rosas",2),t("Clear","#F3F0EE","nudes",4)] },
  { id:"soft-gel-tips", img:"tienda/img/soft-gel-tips.webp", cat:"construccion", sub:"soft", marca:"Paris Night", nombre:"Tips Soft Gel Caja x 500", precio:15900, stock:16, envio:"2 a 4 días",
    contenido:"500 unidades, 10 medidas", rinde:"50 manos", uso:"Pegar con gel adhesivo y curar 60 s.",
    desc:"Cápsula preesculpida: la extensión queda lista en la mitad del tiempo que el molde.",
    tonos:[t("Coffin","#EDE7E3","nudes",6),t("Almendra","#EDE7E3","nudes",5),t("Stiletto","#EDE7E3","nudes",3),t("Cuadrada","#EDE7E3","nudes",2)] },
  { id:"placas-stamping", cat:"decoracion", sub:"stamping", marca:"City Girl", nombre:"Placas de Stamping x 5 Diseños", precio:7200, stock:10, envio:"2 a 4 días",
    contenido:"5 placas de acero", rinde:"Reutilizable", uso:"Rascar el esmalte de stamping y transferir con sello.",
    desc:"Cinco placas de líneas, flores, letras y geométricos, grabado profundo." },
  { id:"sello-silicona", cat:"decoracion", sub:"stamping", marca:"City Girl", nombre:"Sello de Silicona Transparente", precio:5400, stock:0, envio:"Repone en 10 días",
    contenido:"1 unidad", rinde:"Cabezal reemplazable", uso:"Limpiar con cinta adhesiva, nunca con acetona.",
    desc:"Cabezal transparente para ver dónde apoyás el diseño." },
  { id:"gel-paint-x6", cat:"decoracion", sub:"paint", marca:"Navi", nombre:"Gel Paint x 6 Colores", precio:14800, stock:6, envio:"2 a 4 días",
    contenido:"6 potes de 5 g", rinde:"Uso profesional", uso:"Aplicar sobre gel sin curar y sellar.",
    desc:"Consistencia densa para líneas finas que no se corren.",
    tonos:[t("Blanco","#F7F5F3","pasteles",6),t("Negro","#141414","oscuros",6),t("Rojo","#B4142B","rojos",4),t("Dorado","#C8A24B","metalizados",3)] },
  { id:"piedras-x1000", img:"tienda/img/piedras-x1000.webp", cat:"decoracion", sub:"apliques", marca:"City Girl", nombre:"Piedras Surtidas x 1000", precio:8700, stock:20, envio:"2 a 4 días",
    contenido:"1000 unidades, 5 tamaños", rinde:"Uso profesional", uso:"Fijar con gel adhesivo y curar.",
    desc:"Mil cristales surtidos con estuche separador." },
  { id:"glitter-x12", cat:"decoracion", sub:"apliques", marca:"City Girl", nombre:"Glitter Holográfico x 12 Potes", precio:11200, stock:8, envio:"2 a 4 días",
    contenido:"12 potes", rinde:"Uso profesional", uso:"Aplicar sobre gel sin curar.",
    desc:"Doce holográficos de grano fino que no raspan al sellar.", color:"#C9A5D6" },
  { id:"lima-100-180", img:"tienda/img/lima-100-180.webp", cat:"herramientas", sub:"limas", marca:"Opción", nombre:"Lima Recta 100/180 x 10", precio:4200, stock:40, envio:"2 a 4 días",
    contenido:"10 unidades", rinde:"Reutilizable", uso:"Lado 100 para acrílico, 180 para terminación.",
    desc:"Doble grano, base que no se dobla al limar el borde libre." },
  { id:"bloque-pulidor", img:"tienda/img/bloque-pulidor.webp", cat:"herramientas", sub:"limas", marca:"Opción", nombre:"Bloque Pulidor 4 Caras x 5", precio:3100, stock:35, envio:"2 a 4 días",
    contenido:"5 unidades", rinde:"Descartable por clienta", uso:"Seguir el orden numerado de las caras.",
    desc:"Cuatro granos progresivos: uña natural con brillo sin esmalte." },
  { id:"torno-35000", cat:"herramientas", sub:"tornos", marca:"Bompassy", nombre:"Torno Inalámbrico 35.000 rpm", precio:179900, stock:2, envio:"3 a 6 días",
    contenido:"1 unidad", rinde:"Batería de 6 horas", uso:"Arrancar siempre en la velocidad más baja.",
    desc:"Giro reversible, control de velocidad y poca vibración para jornadas largas." },
  { id:"fresas-x10", img:"tienda/img/fresas-x10.webp", cat:"herramientas", sub:"tornos", marca:"Bompassy", nombre:"Set 10 Fresas de Tungsteno", precio:22300, stock:9, envio:"2 a 4 días",
    contenido:"10 unidades", rinde:"Esterilizable", uso:"Cada forma tiene su uso en el estuche.",
    desc:"Tungsteno y cerámica para retiro, cutícula y terminación, con estuche." },
  { id:"cabina-48w", cat:"herramientas", sub:"cabinas", marca:"Duga", nombre:"Cabina LED/UV 48 W Doble Mano", precio:58900, stock:5, envio:"3 a 6 días",
    contenido:"1 unidad", rinde:"50.000 horas", uso:"Temporizador de 10, 30, 60 y 99 s.",
    desc:"Sensor automático y fondo espejado. Entra la mano completa o los dos pies." },
  { id:"lampara-lupa", cat:"herramientas", sub:"acces", marca:"Coldrose", nombre:"Lámpara de Escritorio con Lupa", precio:39000, stock:0, envio:"Repone en 15 días",
    contenido:"1 unidad", rinde:"LED regulable", uso:"Brazo articulado con morsa.",
    desc:"Lupa de 5 aumentos con aro de luz fría. Menos cansancio de vista en detalle." },
  { id:"apoyamano", cat:"herramientas", sub:"acces", marca:"Cherimoya", nombre:"Apoyamano Anatómico", precio:9500, stock:13, envio:"2 a 4 días",
    contenido:"1 unidad + mantel", rinde:"Funda lavable", uso:"Ubicar a la altura del codo de la clienta.",
    desc:"Sostiene la mano en posición sin que la clienta tense el antebrazo.",
    tonos:[t("Rosa","#EFD3D6","rosas",6),t("Blanco","#F7F5F3","pasteles",5),t("Negro","#141414","oscuros",2)] },
  { id:"alicate-cuticula", img:"tienda/img/alicate-cuticula.webp", cat:"herramientas", sub:"acces", marca:"City Girl", nombre:"Alicate Cutícula Acero Inoxidable", precio:14600, stock:6, envio:"2 a 4 días",
    contenido:"1 unidad, corte 4 mm", rinde:"Afilable", uso:"Esterilizar entre clientas.",
    desc:"Corte preciso con resorte doble, acero apto para autoclave." },
  { id:"primer-acido", cat:"preparacion", sub:"prep", marca:"Cherimoya", nombre:"Primer Ácido", precio:7900, stock:17, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"60 aplicaciones", uso:"Una gota por uña, no tocar la piel.",
    desc:"Mejora la adherencia en uñas grasas o con tendencia al desprendimiento." },
  { id:"deshidratador", cat:"preparacion", sub:"prep", marca:"Cherimoya", nombre:"Deshidratador de Uña", precio:7400, stock:19, envio:"2 a 4 días",
    contenido:"15 ml", rinde:"70 aplicaciones", uso:"Aplicar y esperar 30 s antes del primer.",
    desc:"Paso previo obligatorio para que el semipermanente dure las tres semanas." },
  { id:"removedor-500", cat:"preparacion", sub:"remo", marca:"Pink Mask", nombre:"Removedor de Semipermanente 500 ml", precio:9800, stock:26, envio:"2 a 4 días",
    contenido:"500 ml", rinde:"40 retiros", uso:"Envolver 10 minutos con papel aluminio.",
    desc:"Remoción sin limado agresivo. Fórmula con aceite que no reseca la cutícula." },
  { id:"aluminio-x100", cat:"preparacion", sub:"desc", marca:"Opción", nombre:"Papel Aluminio Precortado x 100", precio:5600, stock:44, envio:"2 a 4 días",
    contenido:"100 unidades", rinde:"10 retiros completos", uso:"Un cuadrado por uña.",
    desc:"Precortados con almohadilla de algodón incorporada: ahorra tiempo en el retiro." },
  { id:"guantes-nitrilo", cat:"preparacion", sub:"desc", marca:"Wypall", nombre:"Guantes de Nitrilo x 100", precio:12900, stock:5, envio:"2 a 4 días",
    contenido:"100 unidades", rinde:"Descartable", uso:"Talles S, M y L.",
    desc:"Sin polvo, tacto fino para no perder sensibilidad al limar." },
  { id:"kit-esculpidas", imgKit:"tienda/img/kit-esculpidas.webp", cat:"kits", marca:"GEA", nombre:"Kit Esculpidas en Gel", precio:74900, stock:6, envio:"3 a 6 días",
    componentes:["gel-constructor","primer-acido","deshidratador","lima-100-180","top-coat-espejo"],
    contenido:"6 productos", rinde:"Aprox. 18 servicios", uso:"Incluye guía de pasos impresa.",
    desc:"Todo lo que entra en un servicio de esculpidas, sin que te falte nada a mitad de la jornada.",
    incluye:["Gel Constructor Transparente 30 g","Primer Ácido 15 ml","Deshidratador 15 ml","Set 5 Pinceles para Gel","Lima Recta 100/180 x 10","Top Coat Brillo Espejo"], color:"#E2C2B9" },
  { id:"kit-semi-basico", imgKit:"tienda/img/kit-semi-basico.webp", cat:"kits", marca:"GEA", nombre:"Kit Semipermanente Inicial", precio:52400, stock:8, envio:"2 a 4 días",
    componentes:["base-rubber","top-coat-espejo","semi-15-basicos","semi-15-basicos","semi-15-basicos","deshidratador","removedor-500"],
    contenido:"5 productos + 3 tonos", rinde:"Aprox. 25 servicios", uso:"Requiere cabina LED (no incluida).",
    desc:"Arranque completo de semi: preparación, base, tres tonos y sellado.",
    incluye:["Base Rubber Nivelante","Top Coat Brillo Espejo","3 semis x 15 ml a elección","Deshidratador 15 ml","Removedor 500 ml"], color:"#D98BA3" },
  { id:"kit-retiro", img:"tienda/img/kit-retiro.webp", imgKit:"tienda/img/kit-retiro-w.webp", cat:"kits", marca:"GEA", nombre:"Kit Retiro y Reposición", precio:28900, stock:11, envio:"2 a 4 días",
    componentes:["removedor-500","aluminio-x100","lima-100-180","aceite-cuticula"],
    contenido:"4 productos", rinde:"Aprox. 30 retiros", uso:"Reposición mensual del gabinete.",
    desc:"Lo que se termina primero: removedor, aluminio, limas y aceite de cutícula.",
    incluye:["Removedor 500 ml","Papel Aluminio x 100","Lima Recta 100/180 x 10","Aceite de Cutícula 15 ml"], color:"#C9A48F" },
];

/* Tabla de envíos PROVISORIA: los montos se reemplazan cuando estén los reales. */
const ENVIO = {
  gratisDesde: 120000, provisorio: true,
  zonas: [
    { id: "cerca", nombre: "Ciudad y alrededores", costo: 3500, plazo: "24 a 48 h" },
    { id: "amba", nombre: "AMBA y Gran Buenos Aires", costo: 6900, plazo: "2 a 4 días" },
    { id: "interior", nombre: "Interior del país", costo: 9800, plazo: "3 a 6 días" },
    { id: "otra", nombre: "No sé en qué zona entro", costo: null, plazo: "Se cotiza por chat" },
  ],
};
const zonaDe = (id) => ENVIO.zonas.find((z) => z.id === id) || null;
/* Devuelve el costo, 0 si no corresponde cobrar, o null si todavía no se puede calcular. */
const costoEnvio = (datos, sub) => {
  if (!datos || datos.envio !== "domicilio") return 0;
  const z = zonaDe(datos.zona);
  if (!z || z.costo == null) return null;
  return sub >= ENVIO.gratisDesde ? 0 : z.costo;
};

/* El stock del producto no cerraba con la suma de sus tonos en 4 de los 6
   productos con tonos (semi-15-basicos decía 24 con 57 repartidos en tonos).
   Se deriva de los tonos para que haya una sola fuente de verdad y no se
   vuelva a desincronizar cuando se edite un tono a mano. */
PRODUCTOS.forEach((p) => { if (p.tonos) p.stock = p.tonos.reduce((a, t) => a + t.stock, 0); });

/* El "antes" de los kits sale de la suma real de sus componentes, no de un
   número escrito a mano que no cerraba con el catálogo. Y solo se fija cuando
   comprarlo suelto sale MÁS caro: si el kit no ahorra nada no corresponde
   mostrar cinta de descuento. sueltoSuma queda para poder auditarlo. */
PRODUCTOS.forEach((k) => {
  if (!k.componentes) return;
  k.sueltoSuma = k.componentes.reduce((a, id) => {
    const p = PRODUCTOS.find((x) => x.id === id);
    return a + (p ? p.precio : 0);
  }, 0);
  if (k.sueltoSuma > k.precio) k.precioAntes = k.sueltoSuma;
  else delete k.precioAntes;
});

const DESTACADOS = ["kit-esculpidas","semi-15-basicos","coleccion-starlight","torno-35000","polygel-nude","soft-gel-tips","cabina-48w","removedor-500"];
const HABITUALES = ["removedor-500","aluminio-x100","lima-100-180","top-coat-espejo","guantes-nitrilo","primer-acido"];

const precio = (n) => "$ " + n.toLocaleString("es-AR");
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
return { NEGOCIO, CATEGORIAS, FAMILIAS, PRODUCTOS, DESTACADOS, HABITUALES, ENVIO, zonaDe, costoEnvio, precio, cat, prod, nombreSub, stockDe, familiasDe, porFamilia, buscar };
})();

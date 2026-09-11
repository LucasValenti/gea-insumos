/* La aplicación de la tienda: el estado general —ruta, carrito, búsqueda, datos
   del checkout, tema— y el armado de cada pantalla.

   Vivía adentro de un <script type="text/babel"> en index.html. Salió de ahí
   cuando el JSX pasó a compilarse antes de publicar: así el html queda escrito a
   mano, sin JSX adentro, y este archivo se compila igual que los demás.
   El app.js de al lado lo genera herramientas/compilar.mjs — no lo edites. */
(() => {
const { I, Marca, Boton, SelectorTono, InterruptorTema } = window;
const { NEGOCIO, PRODUCTOS, prod, precio, stockDe, subtotalDe, costoEnvio, urlProducto, clicPropio } = window.T;
/* El panel de prototipado y el marco de teléfono ya no se publican: index.html
   no los carga más. Estos cuatro quedan por si están —los inyectan las
   herramientas de auditoría cuando hacen falta—, y si no están la tienda anda
   con los valores fijos de acá abajo, que son los que se publican. */
const { TweaksPanel, TweakSection, TweakRadio, TweakSelect } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direccion": "editorial",
  "vista": "escritorio",
  "tema": "automático",
  "movimiento": "expresivo",
  "barras": "vidrio"
}/*EDITMODE-END*/;

/* Las herramientas de auditoría fijan la variante con window.GEA_TWEAKS, que
   inyectan arriba de este archivo.

   Antes reescribían el bloque EDITMODE de acá arriba sobre la respuesta HTTP, y
   eso dejó de poder funcionar cuando el JSX pasó a compilarse: esbuild se queda
   con el comentario de apertura y borra el de cierre, así que la expresión
   regular no encuentra nada — y replace() sin coincidencia no falla, devuelve el
   texto igual. Las siete variantes de auditoria.mjs corrieron con estos valores
   mientras el informe decía cuál era cada una. Parchear la salida de un
   compilador con una expresión regular no se sostiene: acá abajo esbuild además
   escribe "automático" como "autom\xE1tico".

   El bloque EDITMODE se queda igual porque es del fuente, y es lo que reescribe
   el anfitrión del panel cuando se elige una opción. */
const TWEAKS = { ...TWEAK_DEFAULTS, ...(window.GEA_TWEAKS || {}) };

const LS = "gea_tienda_v1";
const cargar = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };

/* Preferencias de visualización, en su propia llave: vaciar el carrito no
   tiene por qué devolverle a nadie el tema que le molestaba. */
const VER_LS = "gea_ver_v1";
const TEMA_ATTR = { "claro": "light", "oscuro": "dark" };
const leerVer = () => { try { return JSON.parse(localStorage.getItem(VER_LS)) || {}; } catch (e) { return {}; } };


/* Lo guardado puede venir de una versión anterior del catálogo. Si un producto
   o un tono ya no existe, prod(it.id).precio tiraba TypeError y la tienda
   quedaba en blanco, sin forma de salir salvo borrar el localStorage a mano.

   Va partido en dos porque el catálogo ahora llega por red: contrastar el
   carrito contra los productos hay que hacerlo DESPUÉS de que lleguen, o se
   borraría entero por comparar contra una lista vacía. Lo que no depende del
   catálogo se puede sanear de entrada. */
const saneaDatos = (g) => (g && g.datos && typeof g.datos === "object" ? g.datos : null);

/* Devuelve el carrito contrastado contra el catálogo y, aparte, qué hubo que
   tocar. Lo segundo no es un adorno: bajarle la cantidad a alguien sin decirle
   nada es cambiarle el pedido por atrás, y lo descubriría al leer el mensaje de
   WhatsApp. */
const saneaCarrito = (carrito) => {
  const items = [];
  const ajustes = [];
  for (const it of Array.isArray(carrito) ? carrito : []) {
    const p = it && prod(it.id);
    if (!p || !(it.n > 0)) continue;
    if (it.tono && !(p.tonos || []).some((x) => x.nombre === it.tono)) continue;
    /* El stock pudo bajar desde la última visita. Sin acotar acá, la cantidad
       vieja viaja igual y la rechaza el servidor recién al confirmar, que es el
       peor momento para enterarse. */
    const hay = stockDe(p, it.tono);
    const cual = p.nombre + (it.tono ? ` · ${it.tono}` : "");
    if (hay <= 0) { ajustes.push(`${cual}: sin stock`); continue; }
    if (it.n > hay) { ajustes.push(`${cual}: quedan ${hay}`); items.push({ ...it, n: hay }); continue; }
    items.push(it);
  }
  return { items, ajustes };
};

/* Solo la ficha tiene dirección propia. Es lo único que se comparte por
   WhatsApp y lo único que un buscador puede indexar por separado: el resto de
   las pantallas —carrito, checkout, búsqueda— no son contenido, son momentos de
   un pedido. El servidor arma el <head> de /p/<id> en src/paginas.js. */
const urlDe = (r) => (r && r.v === "ficha" && r.id ? urlProducto(r.id) : "/");

/* Y al revés: si alguien abre /p/<id> directo, la app arranca en esa ficha en
   vez de en el inicio. Sin esto la dirección existía para el buscador pero le
   mostraba la portada a quien la abría. */
const rutaInicial = () => {
  const m = String(location.pathname).match(/^\/p\/(.+)$/);
  if (!m) return { v: "inicio" };
  try { return { v: "ficha", id: decodeURIComponent(m[1]) }; }
  catch (e) { return { v: "inicio" }; }
};

/* Número legible y ordenable por fecha. El azar solo desempata dentro del
   mismo día: 1200 + random(800) se repetía entre clientas distintas. */
const nroPedido = () => {
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  return "#" + ymd + "-" + String(100 + Math.floor(Math.random() * 900));
};

/* Un celular real no tiene por qué recibir el layout de escritorio. Abajo de
   820px mandamos la vista móvil, y el tweak "vista" sigue decidiendo en
   pantallas grandes, que es donde sirve para previsualizar. */
const usarAncho = (consulta) => {
  const [coincide, setCoincide] = React.useState(() => window.matchMedia(consulta).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(consulta);
    const alCambiar = (e) => setCoincide(e.matches);
    setCoincide(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [consulta]);
  return coincide;
};

/* Vivía en tweaks-panel.jsx, y esa era la razón por la que el panel de
   prototipado no se podía sacar de producción: el archivo era del panel, pero la
   app dependía de él para arrancar. Acá queda lo único que la tienda necesita
   —los valores—, sin las 6 KB del panel.

   El aviso al anfitrión, que es lo que persiste la elección reescribiendo el
   bloque EDITMODE en disco, solo tiene sentido con el panel abierto: sin panel
   nadie cambia nada y postMessage a window.parent no tiene a quién hablarle. */
function useTweaks(defaults) {
  const [valores, setValores] = React.useState(defaults);
  /* Acepta setTweak('clave', valor) o setTweak({ clave: valor }), porque una
     llamada al estilo useState escribía una clave "[object Object]" en el JSON
     persistido. */
  const setTweak = React.useCallback((claveOEdiciones, val) => {
    const ediciones = typeof claveOEdiciones === "object" && claveOEdiciones !== null
      ? claveOEdiciones : { [claveOEdiciones]: val };
    setValores((prev) => ({ ...prev, ...ediciones }));
    if (window.TweaksPanel) {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: ediciones }, "*");
      window.dispatchEvent(new CustomEvent("tweakchange", { detail: ediciones }));
    }
  }, []);
  return [valores, setTweak];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAKS);
  const angosto = usarAncho("(max-width: 820px)");
  const guardado = React.useRef(cargar());
  const [ruta, setRuta] = React.useState(rutaInicial);
  /* Entra crudo: recién se contrasta contra el catálogo cuando el catálogo
     llega, más abajo. */
  const [carrito, setCarrito] = React.useState(() =>
    Array.isArray(guardado.current.carrito) ? guardado.current.carrito : []);
  const [catalogo, setCatalogo] = React.useState({ estado: "cargando", error: null });
  const [q, setQ] = React.useState("");
  const [hoja, setHoja] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [pedido, setPedido] = React.useState(null);
  const [capa, setCapa] = React.useState(null);
  /* Identidad estable: con la flecha inline, el guard "n &&" se comía la llamada
     de desmontaje y capa quedaba apuntando a un nodo muerto al volver de la
     vista móvil a escritorio; las hojas y el toast dejaban de verse. */
  const capaRef = React.useCallback((n) => setCapa(n), []);
  const [datos, setDatos] = React.useState(saneaDatos(guardado.current) || { nombre: "", tel: "", gabinete: "", envio: "domicilio", zona: "", direccion: "", cp: "", transporte: "", pago: "mp", nota: "" });
  const [ver, setVer] = React.useState(leerVer);
  const [osOscuro, setOsOscuro] = React.useState(() => !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches));
  /* Al volver de oscuro se restituye lo que había —"automático" incluido— y
     no "claro" a la fuerza. */
  const claroPrevio = React.useRef(null);
  const cont = React.useRef(null);
  const sent = React.useRef(null);
  const [pegado, setPegado] = React.useState(false);
  const [busca, setBusca] = React.useState(false);
  const vuelta = React.useRef({ v: "inicio" });

  /* El catálogo llega de /api/catalogo. Hasta que llega no hay productos, así
     que las pantallas mostrarían una tienda vacía: por eso se espera. Y recién
     con los productos a mano se puede contrastar el carrito guardado, que
     puede traer cosas que ya no existen. */
  React.useEffect(() => {
    let vivo = true;
    window.T.cargar()
      .then(() => {
        if (!vivo) return;
        /* Se sanea lo guardado y no el estado actual porque son lo mismo: hasta
           que el catálogo no llega la tienda muestra "cargando" y no hay forma
           de tocar el carrito. Así el aviso se puede calcular acá afuera, sin
           meter un efecto adentro del actualizador. */
        const { items, ajustes } = saneaCarrito(guardado.current.carrito);
        setCarrito(items);
        /* Si entraron por /p/<id> de un producto que ya no está, el servidor ya
           contestó 404. Acá se completa: sin esto la ficha caía en PR[0] y les
           mostraba un producto cualquiera como si fuera el que buscaban. */
        setRuta((r) => (r.v === "ficha" && !prod(r.id) ? { v: "inicio" } : r));
        setCatalogo({ estado: "listo", error: null });
        if (ajustes.length)
          setToast({ txt: `Cambió el stock desde tu última visita — ${ajustes.join("; ")}` });
      })
      .catch((e) => { if (vivo) setCatalogo({ estado: "error", error: String(e.message || e) }); });
    return () => { vivo = false; };
  }, []);

  window.usarRevelado([ruta, t.direccion, t.vista, angosto, catalogo.estado]);
  /* Barra de vidrio: se activa recién cuando el contenido pasó por debajo. */
  React.useEffect(() => {
    const n = sent.current;
    if (!n || !window.IntersectionObserver) return;
    const io = new IntersectionObserver(([e]) => setPegado(!e.isIntersecting), { threshold: 1 });
    io.observe(n);
    return () => io.disconnect();
  }, [t.vista]);
  /* El tema del visitante manda. Si no eligió nada cae al valor de Tweaks, que
     es lo que fijan las herramientas de prueba; "automático" no estampa
     atributo y deja decidir a prefers-color-scheme. Antes esto escribía
     data-theme="light" siempre, así que el sitio pisaba el modo oscuro del
     sistema y no había forma de cambiarlo fuera del panel de prototipo. */
  React.useEffect(() => {
    const r = document.documentElement, a = TEMA_ATTR[ver.tema || t.tema];
    if (a) r.setAttribute("data-theme", a); else r.removeAttribute("data-theme");
  }, [ver.tema, t.tema]);
  React.useEffect(() => { try { localStorage.setItem(VER_LS, JSON.stringify(ver)); } catch (e) {} }, [ver]);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const m = matchMedia("(prefers-color-scheme: dark)"), h = () => setOsOscuro(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  /* El interruptor del header es binario; los temas son cuatro. Con
     "automático" hay que mirar el sistema para saber en cuál está parado. */
  const temaActual = ver.tema || t.tema;
  const temaOscuro = temaActual === "oscuro" || (temaActual === "automático" && osOscuro);
  const alternarTema = () => {
    if (temaOscuro) setVer((x) => ({ ...x, tema: claroPrevio.current || "claro" }));
    else { claroPrevio.current = temaActual; setVer((x) => ({ ...x, tema: "oscuro" })); }
  };
  React.useEffect(() => { try { localStorage.setItem(LS, JSON.stringify({ carrito, datos })); } catch (e) {} }, [carrito, datos]);
  React.useEffect(() => {
    let n = cont.current;
    while (n) { if (n.scrollHeight > n.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(n).overflowY)) { n.scrollTop = 0; return; } n = n.parentElement; }
    window.scrollTo(0, 0);
  }, [ruta]);

  /* Una posición de historial alcanza: volver desde la ficha te devuelve al
     catálogo en la categoría donde estabas, en vez de tirarte siempre al
     catálogo completo y perder el filtro. */
  const anterior = React.useRef({ v: "inicio" });
  const ir = (r) => { anterior.current = ruta; setRuta(r); };

  /* El botón atrás del celular cerraba el sitio. La app no registraba nada en
     el historial —ni una llamada a pushState— así que atrás no tenía a dónde
     volver y salía. Pasaba con la búsqueda, con la ficha y con el carrito.
     Ahora cada pantalla, la búsqueda y la hoja de tonos dejan una marca, y
     atrás deshace la última en vez de irse. */
  const hist = React.useRef(0);
  const desdePop = React.useRef(false);
  const primera = React.useRef(true);
  React.useEffect(() => {
    history.replaceState({ gea: { ruta, busca: false, hoja: null, i: 0 } }, "", urlDe(ruta));
    const alVolver = (e) => {
      const s = e.state && e.state.gea;
      desdePop.current = true;
      hist.current = s ? s.i : 0;
      setRuta(s && s.ruta ? s.ruta : { v: "inicio" });
      setBusca(!!(s && s.busca));
      setHoja(s && s.hoja ? prod(s.hoja) : null);
      if (!(s && s.busca)) setQ("");
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);
  React.useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    /* Lo que vino de atrás ya está en el historial: registrarlo otra vez
       dejaría al botón rebotando entre las dos últimas pantallas. */
    if (desdePop.current) { desdePop.current = false; return; }
    hist.current += 1;
    history.pushState({ gea: { ruta, busca, hoja: hoja ? hoja.id : null, i: hist.current } }, "", urlDe(ruta));
  }, [ruta, busca, hoja]);

  /* Todo lo que cierra algo pasa por el historial, así la flecha de la pantalla
     y la del teléfono hacen exactamente lo mismo. */
  const atras = () => { if (hist.current > 0) { history.back(); return true; } return false; };
  const volver = () => {
    if (atras()) return;
    const prev = anterior.current;
    setRuta(ruta.v === "checkout" ? { v: "carrito" }
      : prev && prev.v !== ruta.v ? prev : { v: "catalogo" });
  };
  const cerrarBusca = () => {
    if (busca && atras()) return;
    setBusca(false); setQ(""); setRuta((r) => (r.v === "buscar" ? vuelta.current : r));
  };
  const abrirBusca = () => {
    if (busca) { cerrarBusca(); return; }
    vuelta.current = ruta.v === "buscar" ? { v: "inicio" } : ruta;
    setBusca(true);
  };
  const tipear = (val) => {
    setQ(val);
    if (val.trim()) setRuta((r) => (r.v === "buscar" ? r : { v: "buscar" }));
    else setRuta((r) => (r.v === "buscar" ? vuelta.current : r));
  };
  React.useEffect(() => { if (ruta.v === "buscar") setBusca(true); }, [ruta.v]);
  const unidades = carrito.reduce((a, i) => a + i.n, 0);

  /* Lo que realmente entra: el stock del tono, descontando lo que ya cargó de
     los otros tonos del mismo producto. Antes cada tono se acotaba por su
     cuenta, así que tres tonos de 3 dejaban armar 9 de un producto con 3. */
  const cupo = (c, p, tono) => {
    const otros = c.reduce((a, x) => a + (x.id === p.id && x.tono !== tono ? x.n : 0), 0);
    return Math.max(0, Math.min(stockDe(p, tono), p.stock - otros));
  };

  const agregar = (p, tono = null, n = 1) => {
    if (p.tonos && tono == null) { setHoja(p); return; }
    const i = carrito.findIndex((x) => x.id === p.id && x.tono === tono);
    const previo = i >= 0 ? carrito[i].n : 0;
    const nuevo = Math.min(cupo(carrito, p, tono), previo + n);
    const etiqueta = `${p.nombre}${tono ? ` · ${tono}` : ""}`;
    /* Antes el toast decía "Agregado" aun cuando el tope de stock impedía sumar. */
    if (nuevo <= previo) { setToast({ txt: `Ya cargaste todo el stock disponible de ${etiqueta}` }); return; }
    setCarrito((c) => {
      const j = c.findIndex((x) => x.id === p.id && x.tono === tono);
      if (j >= 0) { const cp = [...c]; cp[j] = { ...cp[j], n: nuevo }; return cp; }
      return [...c, { id: p.id, tono, n: nuevo }];
    });
    setToast({ txt: `Agregado: ${etiqueta}`, pedido: true });
  };

  /* Sumar en lote no puede pasar por agregar() una vez por producto: con tonos,
     agregar() abre la hoja y vuelve sin sumar nada, así que un botón que decía
     "Sumar 6" sumaba 3 y abría la hoja del último. Los que necesitan tono no
     desaparecen: se cuentan y se nombran.
     Va todo en un solo setCarrito porque cupo() mira el carrito entero, y
     llamarlo seis veces contra el mismo estado viejo dejaría pasar de largo el
     tope de stock. */
  const agregarVarios = (lista) => {
    const conTono = [];
    let cp = carrito;
    let sumados = 0;
    for (const { p, n } of lista) {
      if (p.tonos) { conTono.push(p.nombre); continue; }
      const j = cp.findIndex((x) => x.id === p.id && x.tono === null);
      const previo = j >= 0 ? cp[j].n : 0;
      const nuevo = Math.min(cupo(cp, p, null), previo + n);
      if (nuevo <= previo) continue;
      sumados++;
      if (j >= 0) { cp = [...cp]; cp[j] = { ...cp[j], n: nuevo }; }
      else cp = [...cp, { id: p.id, tono: null, n: nuevo }];
    }
    if (sumados) setCarrito(cp);
    const nombres = conTono.length === 1 ? conTono[0] : `${conTono.length} productos`;
    setToast(
      sumados && conTono.length ? { txt: `Sumé ${sumados}. Para ${nombres} hay que elegir el tono.`, pedido: true }
      : sumados ? { txt: `Agregado: ${sumados} ${sumados === 1 ? "producto" : "productos"}`, pedido: true }
      : conTono.length ? { txt: `Elegí el tono de ${nombres} para sumarlos.` }
      : { txt: "Ya cargaste todo el stock disponible" });
  };
  React.useEffect(() => { if (!toast) return; const x = setTimeout(() => setToast(null), 2400); return () => clearTimeout(x); }, [toast]);

  const setCant = (it, n) => setCarrito((c) => c.map((x) => (x === it || (x.id === it.id && x.tono === it.tono) ? { ...x, n } : x)).filter((x) => x.n > 0));
  const quitar = (it) => setCarrito((c) => c.filter((x) => !(x.id === it.id && x.tono === it.tono)));
  const enPedido = (id) => carrito.some((x) => x.id === id);
  /* El botón "Guardar como habitual" mostraba un cartel y no guardaba nada.
     Sin cuentas de usuario, el único lugar honesto es el navegador del propio
     cliente, que es donde ya vive su carrito. */
  const guardarHabitual = () => {
    const ids = (pedido ? pedido.items : carrito).map((it) => it.id);
    if (!ids.length) return;
    const guardo = window.T.guardarHabituales(ids);
    setToast({ txt: guardo
      ? `Guardado: ${ids.length} productos en "Lo de siempre"`
      : "No pudimos guardarlo en este navegador" });
  };

  /* El último pedido que sí quedó registrado, con la firma de lo que lo formaba.
     El carrito no se vacía al registrar —el pedido todavía no salió—, así que
     volver atrás desde la confirmación dejaba el checkout listo para mandar de
     nuevo: dos filas en la base, dos números, y si se confirmaban las dos, el
     stock bajaba dos veces. */
  const ultimo = React.useRef(null);
  const firmaDe = (items, d) => JSON.stringify([
    items.map((it) => [it.id, it.tono, it.n]),
    d.nombre, d.tel, d.gabinete, d.envio, d.zona, d.direccion, d.cp, d.transporte, d.pago, d.nota,
  ]);

  /* Devuelve null si el pedido quedó armado, o el texto del problema si el
     servidor lo rechazó. Quien llama decide qué hacer con eso. */
  const confirmar = async () => {
    const sub = subtotalDe(carrito);
    /* null = no se puede calcular todavía (zona sin tarifa). No lo aplastamos a 0:
       el mensaje de WhatsApp anunciaba "sin cargo" un envío que falta cotizar. */
    const env = costoEnvio(datos, sub);
    const base = { items: carrito, sub, envio: env, total: sub + (env || 0), datos };

    const firma = firmaDe(carrito, datos);
    if (ultimo.current && ultimo.current.firma === firma) {
      setPedido(ultimo.current.pedido);
      ir({ v: "ok" });
      return null;
    }

    /* El pedido queda registrado antes de abrir WhatsApp, y de ahí sale el
       número. Los importes que valen son los que devuelve el servidor: los de
       acá son para mostrar mientras tanto. */
    let nro = nroPedido(), registrado = false;
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: carrito, datos }),
      });
      const d = await r.json().catch(() => ({}));
      /* Que el servidor conteste que no es distinto de que no conteste. Si
         rechazó —se acabó el stock, se dio de baja un producto, el pedido no
         llega al mínimo— hay un motivo concreto que la clienta puede resolver.
         Mandarla igual a "Pedido armado" le hacía enviar un WhatsApp con un
         número que del otro lado no existe. */
      if (!r.ok) return d.error || "No pudimos registrar el pedido. Probá de nuevo.";
      if (d.numero) {
        nro = d.numero; registrado = true;
        /* Y los importes también son los suyos. El navegador los calcula para
           mostrarlos mientras tanto, pero si difieren —cambió un precio entre
           que se cargó la página y se confirmó— el mensaje de WhatsApp tiene
           que decir lo mismo que quedó anotado, o se discute por la diferencia
           con la clienta del otro lado. Las líneas vienen con su precio por la
           misma razón: armarlas con el catálogo del navegador hacía que los
           renglones no sumaran el subtotal de abajo. */
        if (Array.isArray(d.items) && d.items.length) base.items = d.items;
        if (typeof d.subtotal === "number") {
          base.sub = d.subtotal;
          base.envio = d.envio;
          base.total = d.total;
        }
      }
    } catch (e) {
      /* No llegó. Acá sí sale igual: perder la venta porque falló la conexión
         con nuestra base sería peor que no tener el registro, porque el pedido
         de verdad se cierra por WhatsApp. La confirmación lo avisa. */
    }

    const armado = { ...base, nro, registrado };
    if (registrado) ultimo.current = { firma, pedido: armado };
    setPedido(armado);
    /* El carrito NO se vacía acá: el pedido todavía no salió. Se vacía recién
       cuando tocan "Enviar por WhatsApp" en la confirmación. */
    ir({ v: "ok" });
    return null;
  };

  /* Mientras el catálogo viaja no hay nada que mostrar, y una tienda vacía se
     lee como una tienda sin productos. Si además falla, hay que decirlo: el
     silencio haría pensar que no hay stock. */
  const P = catalogo.estado !== "listo" ? (
    <div className="cargando-pantalla">
      {catalogo.estado === "error" ? (
        <>
          <p className="serif cargando-t">No pudimos cargar el catálogo</p>
          <p className="cargando-p">Puede ser la conexión. Probá de nuevo en un momento.</p>
          <Boton variante="primary" onClick={() => location.reload()}>Reintentar</Boton>
        </>
      ) : (
        <>
          <span className="cargando-marca" aria-hidden="true"><Marca tamano="medio" /></span>
          <p className="cargando-p" role="status">Cargando el catálogo…</p>
        </>
      )}
    </div>
  ) : {
    inicio: <window.Inicio ir={ir} agregar={agregar} agregarVarios={agregarVarios} enPedido={enPedido} direccion={t.direccion} />,
    catalogo: <window.Catalogo ir={ir} ruta={ruta} agregar={agregar} destino={capa} />,
    buscar: <window.Busqueda ir={ir} agregar={agregar} q={q} setQ={setQ} />,
    ficha: <window.Ficha ir={ir} ruta={ruta} agregar={agregar} direccion={t.direccion} />,
    carrito: <window.Carrito ir={ir} carrito={carrito} setCant={setCant} quitar={quitar} agregar={agregar} enPedido={enPedido} />,
    checkout: <window.Checkout ir={ir} carrito={carrito} datos={datos} setDatos={setDatos} confirmar={confirmar} />,
    ok: <window.Confirmacion ir={ir} pedido={pedido} vaciar={() => setCarrito([])} guardarHabituales={guardarHabitual} />,
    ayuda: <window.Ayuda ir={ir} />,
    contacto: <window.Contacto ir={ir} />,
  }[ruta.v];

  const tabs = [["inicio", "inicio", "Inicio"], ["catalogo", "grilla", "Catálogo"], ["buscar", "buscar", "Buscar"], ["carrito", "carrito", "Pedido"], ["ayuda", "ayuda", "Ayuda"]];
  const nav = [["inicio", "Inicio"], ["catalogo", "Catálogo"], ["ayuda", "Cómo comprar"], ["contacto", "Contacto"]];
  const conAtras = ["ficha", "checkout", "ok"].includes(ruta.v);
  /* angosto = celular de verdad: layout móvil y sin marco de teléfono.
     enmarcado = previsualización del prototipo en una pantalla grande, y para eso
     hace falta el marco, que ya no se publica. Sin él la tienda se dibuja
     entera, que es lo correcto: la alternativa era un hueco. */
  const esc = !angosto && t.vista === "escritorio";
  const enmarcado = !angosto && t.vista === "movil" && !!window.IOSDevice;
  const expr = t.movimiento === "expresivo";
  const entra = expr ? "animate__animated animate__fadeInUp" : "animate__animated animate__fadeIn";

  const campoBusca = (
    <div className={"busca" + (esc ? " busca-inline" : "")}>
      <I n="buscar" />
      <input autoFocus value={q} onChange={(e) => tipear(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") cerrarBusca(); }} placeholder="Buscar producto, marca o tono…" aria-label="Buscar" />
      <button className="busca-x" onClick={cerrarBusca} aria-label="Cerrar búsqueda"><I n="cerrar" size="15px" /></button>
    </div>
  );

  const app = (
    <div className={"ap" + (esc ? " esc" : " movil")} ref={cont}
      data-mov={expr ? "expresivo" : "sobrio"} data-barras={t.barras === "vidrio" ? "vidrio" : "opaco"} data-pegado={pegado}>
      {enmarcado && <div className="tapa"></div>}
      {/* La franja anunciaba "Prototipo con catálogo de ejemplo" al cliente. Ese
          lugar vale para las dos condiciones que el mayorista necesita saber
          antes de armar el pedido. */}
      {/* Solo las condiciones que existen de verdad. El mínimo se sacó —se
          compra desde una unidad— y la franja no tiene por qué anunciar un
          "Pedido mínimo $ 0". Si vuelve a cargarse desde el panel, vuelve a
          aparecer sin tocar código. */}
      {catalogo.estado === "listo" && (() => {
        const cond = [
          NEGOCIO.minimo > 0 && `Pedido mínimo ${precio(NEGOCIO.minimo)}`,
          Number.isFinite(window.T.ENVIO.gratisDesde) && `Envío sin cargo desde ${precio(window.T.ENVIO.gratisDesde)}`,
        ].filter(Boolean);
        return cond.length ? (
          <aside className="aviso" aria-label="Condiciones de compra">{cond.join(" · ")}</aside>
        ) : null;
      })()}
      {/* Con teclado, cada pantalla arrancaba por el header: buscador, tema,
          pedido y las pestañas, una y otra vez, antes de llegar a lo que se vino
          a mirar. Va primero en el marcado y solo se ve cuando tiene el foco. */}
      <a className="saltar" href="#contenido" onClick={(e) => {
        e.preventDefault();
        const m = document.getElementById("contenido");
        if (m) { m.focus(); m.scrollIntoView(); }
      }}>Saltar al contenido</a>
      <div ref={sent} className="sentinela" aria-hidden="true"></div>
      <header className="barra-top">
        <div className="barra-top-in">
          {conAtras && !esc ? (
            <button className="ico-btn" onClick={volver} aria-label="Volver"><I n="atras" /></button>
          ) : (
            <a href="/" onClick={(e) => { if (!clicPropio(e)) return; e.preventDefault(); ir({ v: "inicio" }); }} aria-label="GEA Insumos, ir al inicio"><Marca tamano={esc ? "medio" : "chico"} colorInsumos="var(--nude-600)" /></a>
          )}
          {esc ? (busca ? campoBusca : (
            <nav className="nav-esc">{nav.map(([v, l]) => <button key={v} aria-current={ruta.v === v} onClick={() => ir({ v })}>{l}</button>)}</nav>
          )) : <span></span>}
          <InterruptorTema oscuro={temaOscuro} onClick={alternarTema} />
          <button className="ico-btn" onClick={abrirBusca} aria-label="Buscar" aria-expanded={busca}><I n="buscar" /></button>
          <button className="ico-btn" onClick={() => ir({ v: "carrito" })} aria-label={`Pedido, ${unidades} unidades`}>
            <I n="carrito" />{unidades > 0 && <span key={unidades} className={"globo num" + (expr ? " animate__animated animate__bounceIn" : "")}>{unidades}</span>}
          </button>
        </div>
        {!esc && busca && campoBusca}
      </header>

      {/* tabIndex -1: sin eso el salto mueve el scroll pero no el foco, y el
          teclado sigue donde estaba. */}
      <main id="contenido" tabIndex={-1} className={"vista " + entra} key={ruta.v} style={{ "--animate-duration": expr ? ".52s" : ".38s" }}>{P}</main>

      {!esc && (
        <nav className="barra-bot" aria-label="Secciones">
          {tabs.map(([v, ic, l]) => (
            <button key={v} className="tab" aria-current={ruta.v === v || (v === "catalogo" && ruta.v === "ficha") || (v === "carrito" && ["checkout", "ok"].includes(ruta.v))} onClick={() => ir({ v })}>
              <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
                <I n={ic} />{v === "carrito" && unidades > 0 && <span key={unidades} className={"globo num" + (expr ? " animate__animated animate__bounceIn" : "")} style={{ top: -5, right: -9 }}>{unidades}</span>}
              </span>
              <span>{l}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Cerrar la hoja pasa por el historial igual que todo lo demás: así el
          botón atrás del teléfono la cierra en vez de salir del sitio, y
          después de agregar no queda una marca que la reabra. */}
      {hoja && <SelectorTono p={hoja} onAgregar={agregar} onCerrar={() => { if (!atras()) setHoja(null); }} destino={capa} />}
      {toast && ReactDOM.createPortal(
        <div className={"toast animate__animated " + (expr ? "animate__fadeInUp" : "animate__fadeIn")} role="status">
          <span>{toast.txt}</span>
          {toast.pedido && <button onClick={() => { setToast(null); ir({ v: "carrito" }); }}>Ver pedido</button>}
        </div>, capa || document.body)}
    </div>
  );

  return (
    <>
      {/* La condición se dice por lo positivo a propósito: era "esc || angosto ?
          app : marco", así que cualquier tercer valor de vista —o el marco sin
          cargar— caía en la rama del marco y dejaba la pantalla vacía. */}
      {enmarcado ? (
        <div className="escenario">
          <div className="enmarcado" style={{ position: "relative" }}>
            <window.IOSDevice width={402} height={860}>{app}</window.IOSDevice>
            <div className="capa" ref={capaRef}></div>
          </div>
        </div>
      ) : app}
      {TweaksPanel && <TweaksPanel>
        <TweakSection label="Dirección de diseño" />
        <TweakRadio label="Inicio y ficha" value={t.direccion} options={["editorial", "reposición"]}
          onChange={(v) => setTweak("direccion", v)} />
        <TweakSection label="Vista" />
        <TweakRadio label="Dispositivo" value={t.vista} options={["movil", "escritorio"]} onChange={(v) => setTweak("vista", v)} />
        <TweakRadio label="Tema" value={t.tema} options={["automático", "claro", "oscuro"]} onChange={(v) => setTweak("tema", v)} />
        <TweakSection label="Movimiento y materia" />
        <TweakRadio label="Transiciones" value={t.movimiento} options={["sobrio", "expresivo"]} onChange={(v) => setTweak("movimiento", v)} />
        <TweakRadio label="Barras" value={t.barras} options={["opaco", "vidrio"]} onChange={(v) => setTweak("barras", v)} />
      </TweaksPanel>}
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();

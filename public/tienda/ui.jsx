(() => {
/* Primitivos compartidos de la tienda. Todo apoyado en tokens del sistema. */
const { PRODUCTOS, CATEGORIAS, NEGOCIO, precio, cat, stockDe, urlProducto, clicPropio } = window.T;

/* Pedido de aviso de reposición, con el producto ya escrito en el mensaje. */
const avisoWhatsapp = (p) => "https://wa.me/" + NEGOCIO.whatsapp + "?text="
  + encodeURIComponent("Hola GEA, me avisan cuando entre " + p.nombre + "?");

const Ico = {
  buscar: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  carrito: <path d="M6.4 4h13.1l-1.6 8.6H8.3l.4 2h9.6v2H7.1L4.8 4H2V2h4.4l.3 2zm3.4 14.5a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0zm8 0a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z"/>,
  inicio: <path d="M12 3l9 7.5-1.2 1.5-1.3-1.1V21h-5v-6h-3v6H5.5v-10.1L4.2 12 3 10.5 12 3z"/>,
  grilla: <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>,
  ayuda: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.1 15.5a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm2.2-6.3c-.8.7-1.2 1.1-1.2 2.1h-2c0-1.7.7-2.5 1.6-3.2.7-.6 1-.9 1-1.6 0-.9-.7-1.4-1.6-1.4-1 0-1.7.6-1.8 1.7h-2C8.4 6.6 9.9 5.2 12 5.2c2.2 0 3.7 1.3 3.7 3.1 0 1.2-.5 1.9-1.4 2.9z"/>,
  wa: <path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.03.79.81-2.95-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.55.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-1.98-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.85 2.03c0 1.2.87 2.35.99 2.51.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.17-.06-.11-.22-.17-.46-.29Z"/>,
  ig: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" /></>,
  flecha: <path d="M15.4 4.6L14 6l5 5H3v2h16l-5 5 1.4 1.4L22.8 12 15.4 4.6z"/>,
  atras: <path d="M8.6 4.6L10 6l-5 5h16v2H5l5 5-1.4 1.4L1.2 12 8.6 4.6z"/>,
  cerrar: <path d="M18.3 5.7l-1.4-1.4L12 9.2 7.1 4.3 5.7 5.7 10.6 10.6 5.7 15.5l1.4 1.4L12 12l4.9 4.9 1.4-1.4-4.9-4.9 4.9-4.9z"/>,
  check: <path d="M9.6 16.2L4.8 11.4l-1.4 1.4 6.2 6.2L20.6 6.9l-1.4-1.4z"/>,
  filtro: <path d="M3 5h18v2.2l-7 6.4V21l-4-2.2v-5.2L3 7.2V5z"/>,
  camion: <path d="M3 5h11v9H3V5zm12 3h3.5L21 11.2V14h-6V8zM7 15.5a2 2 0 110 4 2 2 0 010-4zm11 0a2 2 0 110 4 2 2 0 010-4z"/>,
  reloj: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.6l4 2.4-1 1.7-5-3V7h2z"/>,
  sol: <><circle cx="12" cy="12" r="4.1" /><path d="M12 1.9v2.6M12 19.5v2.6M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M1.9 12h2.6M19.5 12h2.6M4.8 19.2l1.9-1.9M17.3 6.7l1.9-1.9" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></>,
  luna: <path d="M20.6 14.7A8.9 8.9 0 019.3 3.4a8.9 8.9 0 1011.3 11.3z" />,
  mas: <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"/>,
  tonos: <><circle cx="8.4" cy="9.6" r="4.3" /><circle cx="15.6" cy="9.6" r="4.3" /><circle cx="12" cy="15.4" r="4.3" /></>,
  campana: <path d="M12 2.5a5.5 5.5 0 00-5.5 5.5v3.4L5 14.6v1.6h14v-1.6l-1.5-3.2V8A5.5 5.5 0 0012 2.5zM9.8 18a2.2 2.2 0 004.4 0H9.8z"/>,
};
/* wa, ig y buscar salen del sistema (components/core/IconoWhatsapp.jsx): los dos
   últimos son de trazo, así que cada icono declara sus atributos de svg. */
const IcoProps = {
  ig: { fill: "none", stroke: "currentColor", strokeWidth: 1.7 },
  buscar: { fill: "none", stroke: "currentColor", strokeWidth: 2 },
  tonos: { fill: "none", stroke: "currentColor", strokeWidth: 1.6 },
};
function I({ n, size }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...(IcoProps[n] || {})} aria-hidden="true" style={size ? { width: size, height: size, flex: "none" } : { flex: "none" }}>{Ico[n]}</svg>;
}

/* Interruptor de tema. Es binario y los temas son cuatro: acá solo viven
   claro y oscuro, que es lo que se toca todos los días. Papel y Automático
   quedan en la hoja "Cómo se ve", y el interruptor no los pisa —al volver de
   oscuro devuelve el tema claro que había antes, no "Claro" a la fuerza. */
function InterruptorTema({ oscuro, onClick }) {
  return (
    <button className="sw-tema" role="switch" aria-checked={oscuro} onClick={onClick}
      aria-label={oscuro ? "Tema oscuro. Tocá para pasar a claro" : "Tema claro. Tocá para pasar a oscuro"}>
      <span className="sw-pista" aria-hidden="true"><I n="sol" size="12px" /><I n="luna" size="12px" /></span>
      <span className="sw-bolita" aria-hidden="true"><I n={oscuro ? "luna" : "sol"} size="13px" /></span>
    </button>
  );
}

function Marca({ tamano = "medio", colorInsumos }) {
  const T = { chico: { g: "1rem", i: ".3rem" }, medio: { g: "1.2rem", i: ".34rem" }, grande: { g: "2.2rem", i: ".62rem" } }[tamano];
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
      <span style={{ fontFamily: "var(--serif)", fontWeight: 500, letterSpacing: ".18em", textIndent: ".18em", fontSize: T.g }}>GEA</span>
      <span style={{ width: "100%", height: 1, background: "currentColor", margin: ".4em 0 .36em" }}></span>
      <span style={{ letterSpacing: ".42em", textIndent: ".42em", fontSize: T.i, color: colorInsumos || "inherit" }}>INSUMOS</span>
    </span>
  );
}

function Boton({ variante = "primary", tamano = "md", ancho, children, style, href, ...r }) {
  const T = { sm: { padding: ".6rem .85rem", fontSize: "var(--fs-btn-sm)" }, md: { padding: ".8rem 1.2rem", fontSize: "var(--fs-btn)" }, lg: { padding: "1rem 1.5rem", fontSize: ".8rem", minHeight: 52 } }[tamano];
  const p = { className: `btn btn-${variante}`, style: { ...T, width: ancho ? "100%" : undefined, ...style }, ...r };
  return href ? <a href={href} {...p}>{children}</a> : <button type="button" {...p}>{children}</button>;
}

/* Imagen con sus medidas reales declaradas. Sin width y height el navegador no
   sabe cuánto lugar reservar, así que la página salta cuando entra cada foto.
   Las medidas salen de medidas.js, que genera herramientas/imagenes.mjs. */
/* Las rutas del catálogo vienen sin barra adelante —"tienda/img/x.webp",
   "img/<clave>.webp"— y el navegador las resuelve contra la dirección que está
   mirando. En / daba bien; en /p/<producto> pedía /p/tienda/img/x.webp y la
   foto no aparecía. Se normaliza acá, que es por donde pasan todas. */
const desdeLaRaiz = (s) => (!s || /^(https?:)?\/\//.test(s) || s[0] === "/" ? s : "/" + s);

function Img({ src, alt = "", className, prioridad = false }) {
  const m = (window.MEDIDAS || {})[(src || "").split("/").pop()];
  return (
    <img src={desdeLaRaiz(src)} alt={alt} className={className}
      width={m && m.w} height={m && m.h}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async" />
  );
}

function Foto({ p, tono, className = "foto" }) {
  const c = tono ? tono.hex : p.color || (p.tonos && p.tonos[0] && p.tonos[0].hex);
  if (p.img) return (
    <div className={className}>
      <Img src={p.img} alt={p.nombre} />
      {tono && <span className="tono-chip" style={{ background: tono.hex }} title={tono.nombre}></span>}
    </div>
  );
  /* Sin foto, el color del producto ocupa el cuadro entero. Antes era un punto
     chico flotando en un fondo vacío con la chapita "Foto pendiente" debajo:
     la tarjeta anunciaba lo que le faltaba en vez de mostrar lo que tiene. */
  if (c) return (
    <div className={`${className} campo-color`} style={{ "--tono": c }}>
      <span className="campo-velo" aria-hidden="true"></span>
    </div>
  );
  /* Sin color ni foto (tornos, cabinas, líquidos): placa de marca. Va como SVG
     decorativo, no como texto: el monograma en texto daba 1.98:1 de contraste
     y axe lo marcaba en todo el catálogo. */
  return (
    <div className={`${className} campo-marca`}>
      <svg className="campo-placa" aria-hidden="true" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gea-placa" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--nude-100)" />
            <stop offset="1" stopColor="var(--nude-200)" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" fill="url(#gea-placa)" />
        <text x="60" y="58" textAnchor="middle" fill="var(--nude-400)" opacity=".55"
          style={{ fontFamily: "var(--serif)", fontSize: "23px", letterSpacing: "4px" }}>GEA</text>
        <rect x="41" y="66" width="38" height="1" fill="var(--nude-400)" opacity=".5" />
        <text x="60" y="79" textAnchor="middle" fill="var(--nude-400)" opacity=".5"
          style={{ fontSize: "6.5px", letterSpacing: "4.2px" }}>INSUMOS</text>
      </svg>
    </div>
  );
}

function Stock({ p, tono, envio = true, breve = false }) {
  const n = stockDe(p, tono);
  const cls = n === 0 ? "no" : n <= 5 ? "bajo" : "ok";
  /* En la tarjeta el renglón es angosto y "Últimas 4 unidades" se partía en
     dos líneas. Al lado del precio, "Últimas 4" se entiende igual. */
  const txt = n === 0 ? "Sin stock" : n <= 5 ? (breve ? `Últimas ${n}` : `Últimas ${n} unidades`) : "En stock";
  return (
    <span className={`stock ${cls}`}><i></i>{txt}{envio && n > 0 && <em style={{ fontStyle: "normal", color: "var(--ink-faint)" }}>· llega en {p.envio}</em>}</span>
  );
}

function Tarjeta({ p, ir, onAgregar }) {
  const agot = p.stock === 0;
  const t0 = p.tonos && p.tonos.find((x) => x.stock > 0);
  const abrir = (e) => { e.preventDefault(); ir({ v: "ficha", id: p.id }); };
  /* En un enlace, el clic con Ctrl/Cmd o con la rueda se deja pasar: ahora el
     href es la dirección real del producto y abre bien en otra pestaña. */
  const abrirLink = (e) => { if (clicPropio(e)) abrir(e); };
  /* La acción pasó de una barra negra al ancho de la tarjeta a un botón redondo
     sobre la foto: con ocho tarjetas en pantalla, ocho barras negras pesaban
     más que los productos. Cada caso lleva al mismo lugar que antes, y
     "avisame" sigue abriendo WhatsApp con el pedido ya escrito. */
  const accion = agot
    ? { ico: "campana", etiqueta: `Avisame cuando entre ${p.nombre}`, href: avisoWhatsapp(p) }
    : p.tonos
      ? { ico: "tonos", etiqueta: `Elegir tono de ${p.nombre}`, onClick: abrir }
      : { ico: "mas", etiqueta: `Agregar ${p.nombre} al pedido`, onClick: () => onAgregar(p) };
  return (
    <div className="card">
      {p.precioAntes && <span className="cinta">Ahorrás {Math.round((1 - p.precio / p.precioAntes) * 100)}%</span>}
      {agot && <span className="cinta gris">Sin stock</span>}
      <a href={urlProducto(p.id)} onClick={abrirLink} className="card-media" aria-label={p.nombre}>
        <Foto p={p} tono={t0} />
      </a>
      <div className="card-body">
        <span className="eyebrow">{p.marca}</span>
        <a href={urlProducto(p.id)} className="card-nom" onClick={abrirLink}>{p.nombre}</a>
        {/* El renglón de tonos ocupa lugar aunque el producto no tenga tonos,
            así las tarjetas de una misma fila terminan alineadas abajo. */}
        <span className="tonos-mini">
          {p.tonos && <>
            {p.tonos.slice(0, 6).map((t) => <i key={t.nombre} style={{ background: t.hex }}></i>)}
            {p.tonos.length > 6 && <u>+{p.tonos.length - 6}</u>}
          </>}
        </span>
        {/* La acción va al lado del precio, que es donde se decide la compra, y
            no encima de la foto: tapaba el producto y competía con la cinta de
            descuento. */}
        <div className="card-pie">
          {/* El precio ocupa su renglón entero: al lado del botón, en dos
              columnas de celular, el precio tachado se caía a otra línea. */}
          <span className={"card-precio num" + (p.precioAntes ? " precio-oferta" : "")}>{precio(p.precio)}{p.precioAntes && <span className="antes">{precio(p.precioAntes)}</span>}</span>
          <div className="card-pie-b">
            <Stock p={p} envio={false} breve />
            {accion.href
              ? <a className="card-accion" href={accion.href} target="_blank" rel="noopener" aria-label={accion.etiqueta}><I n={accion.ico} size="17px" /></a>
              : <button type="button" className="card-accion" onClick={accion.onClick} aria-label={accion.etiqueta}><I n={accion.ico} size="17px" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hoja({ titulo, onCerrar, children, destino }) {
  const caja = React.useRef(null);
  React.useEffect(() => {
    const k = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onCerrar]);

  /* El foco entra al abrir, se queda adentro mientras está abierta y vuelve a
     donde estaba al cerrar. Sin esto, aria-modal anunciaba "esto es un diálogo"
     y el foco seguía tabulando por detrás del velo: con teclado o con lector de
     pantalla el selector de tono —que es el camino de compra de todo esmalte—
     no se podía usar. */
  React.useEffect(() => {
    const antes = document.activeElement;
    /* getClientRects y no offsetParent: la hoja está posicionada, y para lo que
       vive adentro offsetParent no dice si se ve. */
    const focosables = () => Array.from(caja.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((n) => n.getClientRects().length > 0);

    const primeros = focosables();
    (primeros[0] || caja.current).focus();

    const alTab = (e) => {
      if (e.key !== "Tab" || !caja.current) return;
      const f = focosables();
      if (!f.length) { e.preventDefault(); return; }
      const primero = f[0], ultimo = f[f.length - 1];
      if (!caja.current.contains(document.activeElement)) { e.preventDefault(); primero.focus(); return; }
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener("keydown", alTab, true);
    return () => {
      document.removeEventListener("keydown", alTab, true);
      /* Volver a donde estaba: si no, cerrar la hoja deja el foco en el body y
         el siguiente Tab arranca desde arriba de todo. */
      if (antes && antes.focus) antes.focus();
    };
  }, []);

  const cuerpo = (
    <>
      <div className="velo" onClick={onCerrar}></div>
      <div className="hoja" ref={caja} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="hoja-h"><b>{titulo}</b><button className="ico-btn" onClick={onCerrar} aria-label="Cerrar"><I n="cerrar" /></button></div>
        <div style={{ padding: "0 1rem 1.25rem" }}>{children}</div>
      </div>
    </>
  );
  return destino ? ReactDOM.createPortal(cuerpo, destino) : cuerpo;
}

function Paso({ n, max, onCambiar }) {
  return (
    <span className="step">
      <button onClick={() => onCambiar(n - 1)} disabled={n <= 1} aria-label="Quitar uno">−</button>
      <span className="num">{n}</span>
      <button onClick={() => onCambiar(n + 1)} disabled={max != null && n >= max} aria-label="Sumar uno">+</button>
    </span>
  );
}

function Campo({ label, ayuda, children }) {
  return <label className="campo"><span>{label}</span>{children}{ayuda && <em>{ayuda}</em>}</label>;
}

function Opcion({ activa, titulo, detalle, onClick }) {
  return (
    <button className="opt" role="radio" aria-checked={activa} onClick={onClick}>
      <s></s><div><b>{titulo}</b>{detalle && <em>{detalle}</em>}</div>
    </button>
  );
}

function Acordeon({ titulo, children, abierto = false }) {
  const [a, setA] = React.useState(abierto);
  return (
    <div className="acc">
      <button onClick={() => setA(!a)} aria-expanded={a}>{titulo}<u>{a ? "−" : "+"}</u></button>
      {a && <div className="acc-cuerpo">{children}</div>}
    </div>
  );
}

function GrillaTonos({ tonos, valor, onElegir }) {
  return (
    <div className="tonos-gr">
      {tonos.map((t) => (
        <button key={t.nombre} className="tono" aria-pressed={valor === t.nombre} data-agotado={t.stock === 0}
          onClick={() => t.stock > 0 && onElegir(t.nombre)} disabled={t.stock === 0}>
          <s style={{ background: t.hex }}></s><span>{t.nombre}</span>
        </button>
      ))}
    </div>
  );
}

function SelectorTono({ p, onAgregar, onCerrar, destino }) {
  const [tono, setTono] = React.useState((p.tonos.find((x) => x.stock > 0) || {}).nombre);
  const [n, setN] = React.useState(1);
  const t = p.tonos.find((x) => x.nombre === tono);
  return (
    <Hoja titulo={p.nombre} onCerrar={onCerrar} destino={destino}>
      <p style={{ margin: "0 0 .9rem", fontSize: ".84rem", color: "var(--ink-soft)" }}>{p.tonos.length} tonos · {precio(p.precio)} cada uno</p>
      <GrillaTonos tonos={p.tonos} valor={tono} onElegir={setTono} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", margin: "1.1rem 0 .9rem" }}>
        <Stock p={p} tono={tono} />
        <Paso n={n} max={t ? t.stock : 1} onCambiar={setN} />
      </div>
      <Boton variante="primary" tamano="lg" ancho onClick={() => { onAgregar(p, tono, n); onCerrar(); }}>
        Agregar {n > 1 ? `${n} unidades` : "al pedido"} · {precio(p.precio * n)}
      </Boton>
    </Hoja>
  );
}

function Pie({ ir }) {
  const { NEGOCIO } = window.T;
  return (
    <footer className="pie">
      <div><Marca colorInsumos="var(--nude-600)" /><p style={{ margin: ".9rem 0 0", fontSize: ".84rem", color: "var(--ink-soft)", maxWidth: "22rem" }}>Insumos de manicuría para profesionales. Armás el pedido acá y lo cerramos por WhatsApp.</p></div>
      <div><h2>Catálogo</h2><div style={{ display: "grid", gap: ".35rem", justifyItems: "start" }}>{CATEGORIAS.slice(0, 5).map((c) => <button type="button" key={c.id} onClick={() => ir({ v: "catalogo", cat: c.id })}>{c.nombre}</button>)}</div></div>
      <div><h2>Ayuda</h2><div style={{ display: "grid", gap: ".35rem" }}>
        <button type="button" onClick={() => ir({ v: "ayuda" })}>Cómo comprar</button>
        <button type="button" onClick={() => ir({ v: "ayuda" })}>Envíos y pagos</button>
        <button type="button" onClick={() => ir({ v: "contacto" })}>Contacto</button>
      </div></div>
      <div><h2>Escribinos</h2><div style={{ display: "grid", gap: ".35rem" }}>
        <a href={`https://wa.me/${NEGOCIO.whatsapp}`} target="_blank" rel="noopener" style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><I n="wa" size="15px" /> WhatsApp</a>
        <a href={NEGOCIO.instagram} target="_blank" rel="noopener" style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><I n="ig" size="15px" /> {NEGOCIO.instagramUsuario}</a>
      </div></div>
    </footer>
  );
}

function usarRevelado(deps) {
  React.useEffect(() => {
    /* Sin IntersectionObserver esto tiraba ReferenceError y se caía la app
       entera. El CSS ya deja todo visible cuando falta (no se estampa
       .rev-on), así que acá alcanza con no hacer nada. */
    if (!window.IntersectionObserver) return;
    const SEL = ".rev:not(.vis), .rev-esc:not(.vis)";
    let sc = document.querySelector(".ap");
    while (sc && sc !== document.body && !/auto|scroll/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    const raiz = sc && sc !== document.body ? sc : null;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add("vis"); io.unobserve(e.target); }
    }), { root: raiz, rootMargin: "0px 0px -6% 0px", threshold: 0.04 });

    const observar = (n) => {
      if (!n || n.classList.contains("vis")) return;
      /* El tope se recalcula por nodo: el contenedor puede haberse movido
         entre el montaje inicial y lo que aparece después. */
      const tope = raiz ? raiz.getBoundingClientRect().top : 0;
      if (n.getBoundingClientRect().bottom < tope) n.classList.add("vis"); else io.observe(n);
    };
    document.querySelectorAll(SEL).forEach(observar);

    /* Lo que se monta DESPUÉS de este efecto no pasaba por acá y quedaba en
       opacity 0 para siempre: las dependencias solo cambian al cambiar de
       pantalla, no al agregar o quitar del carrito. Por eso el pedido no
       mostraba lo recién agregado, y al vaciarlo la reposición quedaba en
       blanco. El MutationObserver engancha esos nodos nuevos. */
    const mo = new MutationObserver((cambios) => {
      for (const c of cambios) for (const n of c.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches && n.matches(SEL)) observar(n);
        if (n.querySelectorAll) n.querySelectorAll(SEL).forEach(observar);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, deps);
}

Object.assign(window, { usarRevelado, I, Ico, Img, InterruptorTema, Marca, Boton, Foto, Stock, Tarjeta, Hoja, Paso, Campo, Opcion, Acordeon, GrillaTonos, SelectorTono, Pie });
})();

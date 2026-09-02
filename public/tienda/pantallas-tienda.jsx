(() => {
  /* Pantallas de tienda: inicio (dos direcciones), catálogo, búsqueda y ficha. */
  const { PRODUCTOS: PR, CATEGORIAS: CATS, FAMILIAS, DESTACADOS, HABITUALES, NEGOCIO,
    precio: $, cat: catDe, prod, nombreSub, stockDe, familiasDe, buscar } = window.T;
  const { I, Marca, Boton, Foto, Stock, Tarjeta, Paso, Acordeon, GrillaTonos, Pie } = window;

  const conteo = Object.fromEntries(CATS.map((c) => [c.id, PR.filter((p) => p.cat === c.id).length]));

  function Rail({ children }) {return <div className="rail">{children}</div>;}

  function Reposicion({ ir, agregar, enPedido, compacto }) {
    const items = HABITUALES.map(prod);
    return (
      <div className="repo">
      {items.slice(0, compacto ? 4 : 6).map((p, i) =>
        <div className="repo-fila rev" key={p.id} style={{ "--i": i }}>
          {/* Misma imagen que en las tarjetas. Antes acá había un puntito de
              color o un ícono de foto genérico, así que la misma tienda usaba
              dos lenguajes distintos para lo mismo. */}
          <a href="#" className="mini" onClick={(e) => {e.preventDefault();ir({ v: "ficha", id: p.id });}} aria-label={p.nombre}>
            <Foto p={p} className="foto mini-foto" />
          </a>
          <span>
            <a href="#" className="repo-nom" style={{ display: "block" }} onClick={(e) => {e.preventDefault();ir({ v: "ficha", id: p.id });}}>{p.nombre}</a>
            <span className="repo-meta num">{$(p.precio)} · {p.stock <= 5 ? `últimas ${p.stock}` : "en stock"}</span>
          </span>
          <button className="mas" data-en={enPedido(p.id)} onClick={() => agregar(p, null, 1)} aria-label={`Agregar ${p.nombre}`}>
            {enPedido(p.id) ? <I n="check" size="16px" /> : "+"}
          </button>
        </div>
        )}
    </div>);

  }

  /* Repedido: patrón de recompra B2B — el set entero en una carta, cantidades
     editables, faltantes marcados y un solo botón que lo suma completo. */
  function Repedido({ ir, agregar, enPedido }) {
    const items = HABITUALES.map(prod);
    const [cant, setCant] = React.useState(() => Object.fromEntries(items.map((p) => [p.id, 1])));
    const hay = items.filter((p) => p.stock > 0);
    const total = hay.reduce((a, p) => a + p.precio * (cant[p.id] || 0), 0);
    const listos = hay.filter((p) => (cant[p.id] || 0) > 0).length;
    const sinStock = items.length - hay.length;
    const mover = (id, d) => setCant((c) => ({ ...c, [id]: Math.max(0, Math.min(prod(id).stock, (c[id] || 0) + d)) }));
    return (
      <div className="pad">
        <div className="repedido rev">
          <div className="repedido-h">
            <div>
              <span className="eyebrow">Pedido habitual</span>
              <span className="serif repedido-t">Lo de siempre, en un toque</span>
            </div>
            <span className="repedido-meta num">{listos} de {items.length}{sinStock > 0 ? ` · ${sinStock} sin stock` : ""}</span>
          </div>
          <ul className="repedido-lista">
            {items.map((p, i) => {
              const n = cant[p.id] || 0;
              const off = p.stock === 0;
              return (
                <li key={p.id} className="repedido-fila" data-off={off} data-activo={n > 0 && !off} style={{ "--i": i }}>
                  <a href="#" className="repedido-mini" onClick={(e) => { e.preventDefault(); ir({ v: "ficha", id: p.id }); }} aria-label={p.nombre}>
                    {p.color || p.tonos ? <s style={{ background: p.color || p.tonos[0].hex }}></s> : <span>GEA</span>}
                  </a>
                  <span className="repedido-txt">
                    <a href="#" className="repedido-nom" onClick={(e) => { e.preventDefault(); ir({ v: "ficha", id: p.id }); }}>{p.nombre}</a>
                    <span className="repedido-sub num">
                      {$(p.precio)}
                      {off ? <em className="repedido-flag">Sin stock · te avisamos</em>
                        : p.stock <= 5 ? <em className="repedido-flag bajo">Últimas {p.stock}</em> : null}
                    </span>
                  </span>
                  {off ? <span className="repedido-off">—</span> :
                  <span className="repedido-paso">
                    <button onClick={() => mover(p.id, -1)} disabled={n === 0} aria-label={`Quitar una unidad de ${p.nombre}`}>–</button>
                    <b className="num">{n}</b>
                    <button onClick={() => mover(p.id, 1)} disabled={n >= p.stock} aria-label={`Sumar una unidad de ${p.nombre}`}>+</button>
                  </span>
                  }
                </li>);

            })}
          </ul>
          <div className="repedido-pie">
            <span className="repedido-total">
              <span className="lbl">Total del repedido</span>
              <b key={total} className="serif num animate__animated animate__pulse">{$(total)}</b>
            </span>
            <div className="repedido-cta">
              <Boton variante="primary" disabled={!listos} onClick={() => hay.forEach((p) => cant[p.id] > 0 && agregar(p, null, cant[p.id]))}>
                Sumar {listos} al pedido
              </Boton>
              <button className="ver-mas" onClick={() => ir({ v: "catalogo" })}>Ver todo el catálogo</button>
            </div>
          </div>
        </div>
      </div>);

  }

  /* Cartas de categoría: foto con zoom, brillo que sigue al cursor y CTA que aparece. */
  function CartasCategoria({ ir }) {
    const mover = (e) => {
      const n = e.currentTarget, r = n.getBoundingClientRect();
      n.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      n.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    };
    return (
      <div className="pad cats-gr">
        {CATS.map((c, i) =>
        <button key={c.id} className="cat-carta rev-esc" style={{ "--i": i }} onMouseMove={mover} onClick={() => ir({ v: "catalogo", cat: c.id })}>
          <span className="cat-carta-foto">
            <img src={c.img} alt="" loading="lazy" decoding="async" />
            <span className="cat-carta-glow" aria-hidden="true"></span>
          </span>
          {/* El conteo estaba en blanco sobre la foto y se leía distinto en cada
              imagen. Pasarlo al lado del nombre lo rompía cuando el nombre
              ocupaba dos líneas, así que va abajo, como dato tranquilo que no
              compite con el título. El "Ver la categoría" se fue: la tarjeta
              entera ya es el botón, y repetirlo cuatro veces era ruido. */}
          <span className="cat-carta-txt">
            <span className="serif cat-carta-nom">{c.nombre}</span>
            <span className="cat-carta-desc">{c.desc}</span>
            <span className="cat-carta-conteo">{conteo[c.id]} productos</span>
          </span>
        </button>
        )}
      </div>);

  }

  function TarjetaKit({ p, ir }) {
    const ahorro = p.precioAntes ? Math.round((1 - p.precio / p.precioAntes) * 100) : null;
    return (
      <div className="card kit">
      <a href="#" className="kit-a" onClick={(e) => {e.preventDefault();ir({ v: "ficha", id: p.id });}}>
        <span className="kit-foto">
          {p.imgKit && <img src={p.imgKit} alt="" loading="lazy" decoding="async" />}
          <span className="brillo"></span>
          <span className="eyebrow kit-eyebrow">Kit · {p.contenido}</span>
          {ahorro && <span className="kit-ahorro">Ahorrás {ahorro}%</span>}
        </span>
        <span className="kit-cuerpo">
          <span className="serif kit-nom">{p.nombre}</span>
          <span className="kit-desc">{p.desc}</span>
          <span className={"serif num kit-precio" + (p.precioAntes ? " precio-oferta" : "")}>{$(p.precio)}{p.precioAntes && <span className="antes">{$(p.precioAntes)}</span>}</span>
          <span className="ver-mas kit-cta">Ver qué incluye</span>
        </span>
      </a>
    </div>);

  }

  /* ===================== INICIO ===================== */
  function Inicio({ ir, agregar, enPedido, direccion }) {
    const destacados = DESTACADOS.map(prod);
    const kits = PR.filter((p) => p.cat === "kits");
    const editorial = direccion === "editorial";

    return (
      <>
      {editorial ?
        <section className="hero">
          <div className="hero-foto">
            <img src="tienda/img/hero.jpg" alt="Manos con manicura terminada junto a un abanico de tips" />
            <span className="gloss" aria-hidden="true"></span>
            <span className="hero-cue" aria-hidden="true"><i></i></span>
          </div>
          <div className="pad hero-txt">
            <span className="lbl hero-lbl">Insumos de manicuría · Mayorista</span>
            <span className="filete" style={{ maxWidth: "3.5rem" }}></span>
            <h1 className="serif h1-hero">
              {"El gabinete completo, en un solo pedido.".split(" ").map((w, i) =>
              <span className="w" key={i}><i style={{ animationDelay: 0.34 + i * 0.075 + "s" }}>{w}</i></span>
              )}
            </h1>
            <p className="hero-p">
              {PR.length} productos con stock y tiempos de envío a la vista. Armás el pedido y lo cerramos por WhatsApp.
            </p>
            <div className="hero-cta">
              <Boton variante="primary" onClick={() => ir({ v: "catalogo" })}>Ver el catálogo</Boton>
              <Boton variante="ghost" onClick={() => ir({ v: "catalogo", cat: "kits" })}>Kits por servicio</Boton>
            </div>
          </div>
        </section> :

        <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--hairline)", paddingBottom: ".4rem" }}>
          <div className="pad" style={{ paddingBlock: "1.1rem .3rem", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
            <h1 className="serif" style={{ fontSize: "1.25rem", margin: 0 }}>Reponé lo de siempre</h1>
            <button className="ver-mas" onClick={() => ir({ v: "catalogo" })}>Todo el catálogo</button>
          </div>
          <p className="pad" style={{ margin: "0 0 .8rem", fontSize: ".82rem", color: "var(--ink-soft)" }}>Lo que más pediste, listo para sumar de un toque.</p>
          <div className="pad"><Reposicion ir={ir} agregar={agregar} enPedido={enPedido} /></div>
          <div className="pad" style={{ paddingTop: ".8rem" }}>
            <Boton variante="ghost" ancho onClick={() => HABITUALES.map(prod).forEach((p) => agregar(p, null, 1))}>Sumar los 6 al pedido</Boton>
          </div>
        </section>
        }

      <section className="sec">
        <div className="pad sec-h"><h2 className="rev">{editorial ? "Lo más pedido" : "Novedades"}</h2><button className="ver-mas" onClick={() => ir({ v: "catalogo" })}>Ver los {PR.length}</button></div>
        <div className="pad"><div className="gr">{destacados.map((p, i) =>
              <div className="rev" key={p.id} style={{ "--i": i % 4, display: "grid" }}><Tarjeta p={p} ir={ir} onAgregar={agregar} /></div>
              )}</div></div>
      </section>

      {editorial &&
        <div className="pad" style={{ paddingTop: "2.2rem" }}>
          <div className="banda-mod banda-gab rev">
            <div className="banda-gab-mosaico">
              <span className="gab-a"><img src="tienda/img/gab-servicio.jpg" alt="Manicura trabajando sobre la mano de una clienta" loading="lazy" decoding="async" /></span>
              <span className="gab-b"><img src="tienda/img/gab-torno.jpg" alt="Limado sobre el aspirador de mesa" loading="lazy" decoding="async" /></span>
              <span className="gab-c"><img src="tienda/img/gab-mesa.webp" alt="Herramientas de manicuría sobre toalla" loading="lazy" decoding="async" /></span>
              <span className="gab-d"><img src="tienda/img/gab-herramienta.jpg" alt="Tijera de cutícula en mano enguantada" loading="lazy" decoding="async" /></span>
            </div>
            <div className="banda-mod-txt">
              <span className="lbl">Todo el gabinete</span>
              <span className="filete" style={{ maxWidth: "3.5rem" }}></span>
              <p className="serif banda-mod-t">Lo que usás en cada servicio, en un solo proveedor.</p>
              <p className="banda-mod-p">Preparación, color, construcción y herramientas. Stock real y tiempos de envío a la vista, sin pedir precio por chat.</p>
              <button className="ver-mas" onClick={() => ir({ v: "catalogo" })}>Ver los {PR.length} productos</button>
            </div>
          </div>
        </div>
      }

      {editorial ?
        <>
          <section className="sec sec-aparte">
            <div className="pad sec-h"><h2 className="rev">Por categoría</h2><button className="ver-mas" onClick={() => ir({ v: "catalogo" })}>Ver todo</button></div>
            <CartasCategoria ir={ir} />
          </section>
        </> :

        <>
          <section className="sec">
            <div className="pad sec-h"><h2>Categorías</h2></div>
            <Rail>{CATS.map((c) => <button key={c.id} className="chip" onClick={() => ir({ v: "catalogo", cat: c.id })}>{c.nombre}<b>{conteo[c.id]}</b></button>)}</Rail>
          </section>
        </>
        }

      <section className="sec">
        {editorial &&
        <div className="pad">
          <div className="banda-mod rev">
            <div className="banda-mod-txt">
              <span className="lbl">Kits por servicio</span>
              <span className="filete" style={{ maxWidth: "3.5rem" }}></span>
              <p className="serif banda-mod-t">Un servicio entero cubierto, a precio cerrado.</p>
              <p className="banda-mod-p">Preparación, color y sellado en un solo código. Sin faltantes a mitad de la jornada.</p>
              <button className="ver-mas" onClick={() => ir({ v: "catalogo", cat: "kits" })}>Ver los {kits.length} kits</button>
            </div>
            <div className="banda-mod-pila" aria-hidden="true">
              {kits.slice(0, 3).map((p, i) =>
              <span key={p.id} className="banda-mod-carta" style={{ "--n": i }}>
                <img src={p.imgKit} alt="" loading="lazy" decoding="async" {...(i === 0 ? { "data-comment-anchor": "6074be1d3b-img-172-53" } : {})} />
              </span>
              )}
            </div>
          </div>
        </div>
        }
        {editorial ?
          <div className="pad kits" style={{ display: "grid", gap: ".7rem" }}>{kits.map((p, i) => <div className="rev" key={p.id} style={{ "--i": i }}><TarjetaKit p={p} ir={ir} /></div>)}</div> :

          <div className="rail-prod" style={{ gap: ".7rem" }}>{kits.map((p, i) => <div className="rev" key={p.id} style={{ "--i": i, width: "16rem" }}><TarjetaKit p={p} ir={ir} /></div>)}</div>
          }
      </section>

      {editorial &&
        <section className="sec">
          <div className="pad sec-h"><h2 className="rev">Volver a pedir</h2><span className="eyebrow">Un toque y va completo</span></div>
          <Repedido ir={ir} agregar={agregar} enPedido={enPedido} />
        </section>
        }

      <section className="sec pad" style={{ paddingBottom: ".5rem" }}>
        <div className="nota rev" style={{ display: "grid", gap: ".5rem" }}>
          <b style={{ fontWeight: 500, color: "var(--ink)" }}>¿Cómo se cierra la compra?</b>
          Armás el carrito, completás tus datos y el pedido se envía por WhatsApp con todo escrito. Confirmamos stock y te pasamos los datos de pago.
          <button className="ver-mas" style={{ justifySelf: "start" }} onClick={() => ir({ v: "ayuda" })}>Cómo comprar paso a paso</button>
        </div>
      </section>
      <Pie ir={ir} />
    </>);

  }

  /* ===================== CATÁLOGO ===================== */
  function Catalogo({ ir, ruta, agregar, destino }) {
    const [c, setC] = React.useState(ruta.cat || "todos");
    const [sub, setSub] = React.useState(null);
    const [fam, setFam] = React.useState(ruta.fam || null);
    const [orden, setOrden] = React.useState("relevancia");
    const [soloStock, setSoloStock] = React.useState(false);
    const [filtros, setFiltros] = React.useState(false);
    React.useEffect(() => {setC(ruta.cat || "todos");setSub(null);setFam(ruta.fam || null);}, [ruta.cat, ruta.fam, ruta.k]);

    /* Antes elegir una familia descartaba la categoría por completo: la hoja
       las presenta como dos filtros al lado, así que se esperan combinables. */
    let lista = c === "todos" ? PR : PR.filter((p) => p.cat === c);
    if (fam) lista = lista.filter((p) => familiasDe(p).includes(fam));
    if (sub) lista = lista.filter((p) => p.sub === sub);
    if (soloStock) lista = lista.filter((p) => p.stock > 0);
    lista = [...lista].sort((a, b) => orden === "menor" ? a.precio - b.precio : orden === "mayor" ? b.precio - a.precio : 0);
    const subs = c !== "todos" ? catDe(c).subs || [] : [];
    const titulo = fam ? `Tonos ${FAMILIAS.find((f) => f.id === fam).nombre.toLowerCase()}` : c === "todos" ? "Catálogo completo" : catDe(c).nombre;

    return (
      <>
      <Rail>
        {/* La categoría va en la ruta y no en estado local: así el botón atrás
            de la ficha devuelve al catálogo filtrado, y no al catálogo entero.
            El efecto de arriba sincroniza c, sub y fam desde la ruta. */}
        <button className="chip" aria-pressed={c === "todos"} onClick={() => ir({ v: "catalogo" })}>Todo<b>{PR.length}</b></button>
        {CATS.map((x) => <button key={x.id} className="chip" aria-pressed={c === x.id} onClick={() => ir({ v: "catalogo", cat: x.id })}>{x.nombre}<b>{conteo[x.id]}</b></button>)}
      </Rail>
      {subs.length > 0 &&
        <Rail>
          <button className="chip" aria-pressed={!sub} onClick={() => setSub(null)}>Todo en {catDe(c).nombre.toLowerCase()}</button>
          {subs.map((s) => <button key={s.id} className="chip" aria-pressed={sub === s.id} onClick={() => setSub(s.id)}>{s.nombre}</button>)}
        </Rail>
        }

      <div className="pad" style={{ paddingTop: "1.4rem" }}>
        <h1 className="serif" style={{ margin: 0, fontSize: "1.6rem", lineHeight: 1.15 }}>{titulo}</h1>
        {!fam && c !== "todos" && <p style={{ margin: ".35rem 0 0", color: "var(--ink-soft)", fontSize: ".9rem" }}>{catDe(c).desc}</p>}
        {fam && <p style={{ margin: ".35rem 0 0", color: "var(--ink-soft)", fontSize: ".9rem" }}>Productos que tienen tonos de esta familia. Elegís el tono exacto al agregar.</p>}
      </div>

      <div className="pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: ".9rem 1rem .8rem" }}>
        <span style={{ fontSize: ".8rem", color: "var(--ink-faint)" }} className="num">{lista.length} {lista.length === 1 ? "producto" : "productos"}</span>
        <button className="chip" onClick={() => setFiltros(true)} style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><I n="filtro" size="14px" /> Ordenar y filtrar</button>
      </div>

      <div className="pad">
        {lista.length ? <div className="gr">{lista.map((p) => <Tarjeta key={p.id} p={p} ir={ir} onAgregar={agregar} />)}</div> :
          <div className="vacio">No hay productos con esos filtros.<Boton variante="ghost" onClick={() => {setSoloStock(false);setSub(null);}}>Limpiar filtros</Boton></div>
          }
      </div>

      {filtros &&
        <window.Hoja titulo="Ordenar y filtrar" onCerrar={() => setFiltros(false)} destino={destino}>
          <span className="lbl">Ordenar por</span>
          <div style={{ display: "grid", gap: ".5rem", margin: ".6rem 0 1.4rem" }} role="radiogroup">
            {[["relevancia", "Relevancia"], ["menor", "Menor precio"], ["mayor", "Mayor precio"]].map(([k, l]) =>
            <window.Opcion key={k} activa={orden === k} titulo={l} onClick={() => setOrden(k)} />
            )}
          </div>
          <span className="lbl">Disponibilidad</span>
          <div style={{ margin: ".6rem 0 1.4rem" }}>
            <window.Opcion activa={soloStock} titulo="Solo con stock" detalle="Oculta lo que hay que esperar a que repongan" onClick={() => setSoloStock(!soloStock)} />
          </div>
          <span className="lbl">Familia de tono</span>
          <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", margin: ".6rem 0 1.4rem" }}>
            <button className="chip" aria-pressed={!fam} onClick={() => setFam(null)}>Todas</button>
            {FAMILIAS.map((f) => <button key={f.id} className="chip" aria-pressed={fam === f.id} onClick={() => setFam(f.id)}>{f.nombre}</button>)}
          </div>
          <Boton variante="primary" tamano="lg" ancho onClick={() => setFiltros(false)}>Ver {lista.length} productos</Boton>
        </window.Hoja>
        }
      <Pie ir={ir} />
    </>);

  }

  /* ===================== BÚSQUEDA ===================== */
  function Busqueda({ ir, agregar, q, setQ }) {
    const res = buscar(q);
    const sugeridas = ["removedor", "polygel", "nude", "torno", "aluminio", "kit"];
    return (
      <>
      <div className="pad" style={{ paddingTop: "1.2rem" }}>
        {!q.trim() ?
          <>
            <span className="lbl">Búsquedas frecuentes</span>
            <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", margin: ".7rem 0 2rem" }}>
              {sugeridas.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}
            </div>
          </> :
          res.length ?
          <>
            <p className="num" style={{ margin: "0 0 1rem", fontSize: ".82rem", color: "var(--ink-faint)" }}>{res.length} {res.length === 1 ? "resultado" : "resultados"} para “{q}”</p>
            <div className="gr">{res.map((p) => <Tarjeta key={p.id} p={p} ir={ir} onAgregar={agregar} />)}</div>
          </> :

          <div className="vacio">
            <span>No encontramos nada para “{q}”.</span>
            <span style={{ fontSize: ".85rem" }}>Probá con el tipo de producto (removedor, gel, lima) o la marca.</span>
            <Boton variante="ghost" onClick={() => {setQ("");ir({ v: "catalogo" });}}>Ver todo el catálogo</Boton>
          </div>
          }
      </div>
    </>);

  }

  /* ===================== FICHA ===================== */
  function Ficha({ ir, ruta, agregar, direccion }) {
    const p = prod(ruta.id) || PR[0];
    const [tono, setTono] = React.useState(p.tonos ? (p.tonos.find((x) => x.stock > 0) || {}).nombre : null);
    const [n, setN] = React.useState(1);
    React.useEffect(() => {setTono(p.tonos ? (p.tonos.find((x) => x.stock > 0) || {}).nombre : null);setN(1);}, [p.id]);
    /* Al cambiar de tono la cantidad quedaba en el valor viejo: el botón ofrecía
       9 unidades y $ 111.600 de un tono que tenía 3 disponibles. */
    React.useEffect(() => {setN((v) => Math.max(1, Math.min(v, stockDe(p, tono) || 1)));}, [tono]);
    const editorial = direccion === "editorial";
    const disp = stockDe(p, tono);
    const t = p.tonos && p.tonos.find((x) => x.nombre === tono);
    const relacionados = PR.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const filas = [["Marca", p.marca], ["Contenido", p.contenido], ["Rendimiento", p.rinde], ["Modo de uso", p.uso], ["Envío", p.envio]].filter(([, v]) => v);

    const Tabla = () =>
    <dl className="ficha-tabla">{filas.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;


    return (
      <>
      <nav className="pad miga" aria-label="Estás acá">
        <a href="#" onClick={(e) => {e.preventDefault();ir({ v: "catalogo" });}}>Catálogo</a>
        <span aria-hidden="true">›</span>
        <a href="#" onClick={(e) => {e.preventDefault();ir({ v: "catalogo", cat: p.cat, k: Date.now() });}}>{catDe(p.cat).nombre}</a>
        <span aria-hidden="true">›</span><span aria-current="page">{p.nombre}</span>
      </nav>

      <div className={"pad " + (editorial ? "dos" : "compacta")}>
        {editorial ?
          <>
            <Foto p={p} tono={t} className="foto" />
            <div style={{ paddingTop: "1.1rem" }}>
              <span className="lbl">{p.marca} · {catDe(p.cat).nombre}{p.sub ? ` · ${nombreSub(p.cat, p.sub)}` : ""}</span>
              <h1 className="serif h1-ficha" style={{ margin: ".45rem 0 0" }}>{p.nombre}</h1>
              <p className={"serif num" + (p.precioAntes ? " precio-oferta" : "")} style={{ fontSize: "1.9rem", margin: "1rem 0 .2rem" }}>{$(p.precio)}{p.precioAntes && <span className="antes" style={{ fontSize: ".9rem" }}>{$(p.precioAntes)}</span>}</p>
              <p style={{ margin: 0, fontSize: ".78rem", color: "var(--ink-faint)" }}>Precio por unidad · consultá bonificación por cantidad</p>
              <div style={{ margin: "1rem 0 0" }}><Stock p={p} tono={tono} /></div>
              {p.desc && <p style={{ margin: "1.2rem 0 0", color: "var(--ink-soft)" }}>{p.desc}</p>}
              {p.incluye &&
              <div style={{ marginTop: "1.3rem" }}>
                  <span className="lbl">Qué incluye</span>
                  <ul style={{ margin: ".6rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: ".4rem" }}>
                    {p.incluye.map((x) => <li key={x} style={{ display: "flex", gap: ".55rem", fontSize: ".9rem", color: "var(--ink-soft)" }}><span style={{ color: "var(--nude-400)" }}><I n="check" size="14px" /></span>{x}</li>)}
                  </ul>
                </div>
              }
              {p.tonos &&
              <div style={{ marginTop: "1.5rem" }}>
                  <div className="tono-head"><span className="lbl">Tono</span><span style={{ fontSize: ".84rem" }}>{tono}</span></div>
                  <GrillaTonos tonos={p.tonos} valor={tono} onElegir={setTono} />
                </div>
              }
              <Tabla />
            </div>
          </> :

          <>
            <div style={{ display: "grid", gridTemplateColumns: "8rem 1fr", gap: "1rem", alignItems: "start" }}>
              <Foto p={p} tono={t} className="foto" />
              <div>
                <span className="eyebrow">{p.marca}</span>
                <h1 className="serif" style={{ margin: ".2rem 0 0", fontSize: "1.35rem", lineHeight: 1.2 }}>{p.nombre}</h1>
                <p className={"serif num" + (p.precioAntes ? " precio-oferta" : "")} style={{ fontSize: "1.55rem", margin: ".55rem 0 .3rem" }}>{$(p.precio)}{p.precioAntes && <span className="antes">{$(p.precioAntes)}</span>}</p>
                <Stock p={p} tono={tono} />
              </div>
            </div>
            {p.tonos &&
            <div style={{ marginTop: "1.2rem" }}>
                <div className="tono-head"><span className="lbl">Tono · {p.tonos.length} disponibles</span><span style={{ fontSize: ".84rem" }}>{tono}</span></div>
                <GrillaTonos tonos={p.tonos} valor={tono} onElegir={setTono} />
              </div>
            }
            <div style={{ display: "flex", gap: ".7rem", alignItems: "center", marginTop: "1.2rem" }}>
              <Paso n={n} max={disp || 1} onCambiar={setN} />
              <Boton variante="primary" style={{ flex: 1, minHeight: 48 }} onClick={() => agregar(p, tono, n)} disabled={disp === 0}>
                {disp === 0 ? "Sin stock" : `Agregar · ${$(p.precio * n)}`}
              </Boton>
            </div>
            <div style={{ marginTop: "1.4rem" }}>
              {p.desc && <p style={{ margin: "0 0 1rem", color: "var(--ink-soft)", fontSize: ".92rem" }}>{p.desc}</p>}
              {p.incluye && <Acordeon titulo={`Qué incluye (${p.incluye.length})`} abierto><ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: ".4rem" }}>{p.incluye.map((x) => <li key={x} style={{ display: "flex", gap: ".5rem" }}><span style={{ color: "var(--nude-400)" }}><I n="check" size="14px" /></span>{x}</li>)}</ul></Acordeon>}
              <Acordeon titulo="Ficha técnica" abierto><Tabla /></Acordeon>
              <Acordeon titulo="Modo de uso">{p.uso}</Acordeon>
              <Acordeon titulo="Envío y stock">Llega en {p.envio}. {p.stock > 0 ? `Hoy hay ${p.stock} unidades en depósito.` : "Sin stock: te avisamos cuando repone."}</Acordeon>
            </div>
          </>
          }
      </div>

      {relacionados.length > 0 &&
        <section className="sec">
          <div className="pad sec-h"><h2>Otros de {catDe(p.cat).nombre.toLowerCase()}</h2></div>
          <div className="rail-prod">{relacionados.map((x) => <Tarjeta key={x.id} p={x} ir={ir} onAgregar={agregar} />)}</div>
        </section>
        }

      {editorial &&
        <div className="accion">
          <div className="fila">
            <Paso n={n} max={disp || 1} onCambiar={setN} />
            {disp === 0
              ? <Boton variante="ghost" tamano="lg" target="_blank" rel="noopener"
                  href={`https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(`Hola GEA, me avisan cuando entre ${p.nombre}${tono ? ` en ${tono}` : ""}?`)}`}>
                  Avisame cuando entre
                </Boton>
              : <Boton variante="primary" tamano="lg" onClick={() => agregar(p, tono, n)}>
                  Agregar al pedido · {$(p.precio * n)}
                </Boton>}
          </div>
        </div>
        }
      <Pie ir={ir} />
    </>);

  }

  Object.assign(window, { Inicio, Catalogo, Busqueda, Ficha, Reposicion, Repedido, CartasCategoria, Rail });
})();
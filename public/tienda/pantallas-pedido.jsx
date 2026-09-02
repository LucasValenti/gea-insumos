(() => {
  /* Pantallas de pedido: carrito, checkout, confirmación, ayuda y contacto. */
  const { NEGOCIO: NEG, precio: $$, prod: prodP, stockDe: stockP, HABITUALES: HAB, ENVIO: ENV, zonaDe, costoEnvio } = window.T;
  const { I, Boton, Img, Foto, Stock, Paso, Campo, Opcion, Acordeon, Pie, Marca } = window;

  function LineaItem({ it, setCant, quitar }) {
    const p = prodP(it.id);
    const t = p.tonos && p.tonos.find((x) => x.nombre === it.tono);
    const max = stockP(p, it.tono);
    return (
      <div className="item">
      <Foto p={p} tono={t} />
      <div style={{ display: "grid", gap: ".3rem" }}>
        <div className="item-top">
          <div style={{ display: "grid", gap: ".1rem" }}>
            <span className="eyebrow">{p.marca}</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: ".98rem", lineHeight: 1.25, display: "block" }}>{p.nombre}</span>
            {it.tono && <span style={{ display: "flex", gap: ".35rem", alignItems: "center", fontSize: ".78rem", color: "var(--ink-soft)", marginTop: ".15rem" }}>
              <i style={{ width: 10, height: 10, flex: "none", borderRadius: "50%", background: t ? t.hex : "var(--nude-200)", border: "1px solid rgba(17,17,17,.14)" }}></i>{it.tono}
            </span>}
          </div>
          <span className="serif num" style={{ fontSize: "1.05rem", whiteSpace: "nowrap" }}>{$$(p.precio * it.n)}</span>
        </div>
        {max <= 5 && <span style={{ fontSize: ".72rem", color: "var(--nude-600)" }}>Quedan {max} en depósito</span>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: ".3rem" }}>
          <Paso n={it.n} max={max} onCambiar={(v) => setCant(it, v)} />
          <button className="quitar" onClick={() => quitar(it)}>Quitar</button>
        </div>
      </div>
    </div>);

  }

  function Resumen({ carrito, datos }) {
    const sub = carrito.reduce((a, it) => a + prodP(it.id).precio * it.n, 0);
    const unidades = carrito.reduce((a, it) => a + it.n, 0);
    const env = costoEnvio(datos, sub);
    const z = datos && zonaDe(datos.zona);
    const etiqueta = !datos ? "Se calcula en el checkout" :
    datos.envio === "retiro" ? "Retiro en local · sin cargo" :
    datos.envio === "transporte" ? "Lo abonás al transporte" :
    env === null ? (z ? "Se cotiza por chat" : "Elegí la zona para calcular") :
    env === 0 ? "Sin cargo" : null;
    const falta = env === null || env === 0 ? null : ENV.gratisDesde - sub;
    const t = sub + (env || 0);
    return (
      <div className="res">
      <dl>
        <div><dt>{unidades} {unidades === 1 ? "unidad" : "unidades"}</dt><dd className="num">{$$(sub)}</dd></div>
        <div>
          <dt>Envío{z && datos.envio === "domicilio" ? ` · ${z.nombre}` : ""}</dt>
          <dd className={etiqueta ? "" : "num"} style={etiqueta ? { color: "var(--ink-soft)", fontSize: ".84rem" } : null}>{etiqueta || $$(env)}</dd>
        </div>
        <div className="total"><dt>Total del pedido</dt><dd key={t} className="num animate__animated animate__pulse">{$$(t)}</dd></div>
      </dl>
      {sub < NEG.minimo && <p style={{ margin: ".8rem 0 0", fontSize: ".78rem", color: "var(--nude-600)" }}>Faltan {$$(NEG.minimo - sub)} para el pedido mínimo mayorista de {$$(NEG.minimo)}.</p>}
    </div>);

  }

  /* Progreso hacia el envío sin cargo: la misma info, medible de un vistazo. */
  function MetaEnvio({ sub, mostrar = true }) {
    if (!mostrar) return null;
    const listo = sub >= ENV.gratisDesde;
    const pct = Math.min(100, Math.round(sub / ENV.gratisDesde * 100));
    return (
      <div className={"meta-envio" + (listo ? " ok" : "")}>
        <div className="meta-barra"><i style={{ width: (listo ? 100 : Math.max(4, pct)) + "%" }}></i></div>
        <span>{listo ? "Envío sin cargo desbloqueado" : `Faltan ${$$(ENV.gratisDesde - sub)} para el envío sin cargo`}</span>
      </div>);

  }

  function Carrito({ ir, carrito, setCant, quitar, agregar, enPedido }) {
    const sub = carrito.reduce((a, it) => a + prodP(it.id).precio * it.n, 0);
    const unidades = carrito.reduce((a, it) => a + it.n, 0);
    if (!carrito.length) return (
      <>
      <div className="vacio">
        <span className="serif" style={{ fontSize: "1.3rem", color: "var(--ink)" }}>Tu pedido está vacío</span>
        <span style={{ fontSize: ".9rem" }}>Sumá productos del catálogo y después lo cerramos por WhatsApp.</span>
        <Boton variante="primary" onClick={() => ir({ v: "catalogo" })}>Ver el catálogo</Boton>
      </div>
      <div className="pad sec">
        <div className="sec-h"><h2>Reponé lo de siempre</h2></div>
        <window.Reposicion ir={ir} agregar={agregar} enPedido={enPedido} compacto />
      </div>
      <Pie ir={ir} />
    </>);

    return (
      <>
      <div className="pad carro">
        <div className="carro-col">
          <div className="carro-h">
            <h1 className="serif">Tu pedido</h1>
            <span key={unidades} className="carro-cuenta num animate__animated animate__fadeIn">{unidades} {unidades === 1 ? "unidad" : "unidades"}</span>
          </div>
          <div className="carro-lista">
            {carrito.map((it, i) =>
              <div className="carro-fila rev" key={it.id + (it.tono || "")} style={{ "--i": i }}>
              <LineaItem it={it} setCant={setCant} quitar={quitar} />
            </div>
              )}
          </div>

          <div className="nota" style={{ marginTop: "1rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
            <span style={{ color: "var(--nude-400)", flex: "none", marginTop: 2 }}><I n="reloj" size="15px" /></span>
            <span>Confirmamos stock por WhatsApp antes de que pagues. Si algo no está, te ofrecemos el reemplazo.</span>
          </div>
          <div className="sec">
            <div className="sec-h"><h2>¿Te falta algo?</h2></div>
            <window.Reposicion ir={ir} agregar={agregar} enPedido={enPedido} compacto />
          </div>
        </div>

        <aside className="carro-lado" aria-label="Resumen del pedido">
          <div className="carro-tarjeta">
            <span className="lbl">Resumen</span>
            <Resumen carrito={carrito} />
            <MetaEnvio sub={sub} />
            <Boton variante="primary" tamano="lg" style={{ width: "100%" }} onClick={() => ir({ v: "checkout" })}>Continuar<I n="flecha" size="15px" /></Boton>
            <ul className="carro-garantias">
              <li><I n="check" size="14px" /> Stock confirmado por WhatsApp antes de pagar</li>
              <li><I n="check" size="14px" /> Pagás recién cuando está todo chequeado</li>
              <li><I n="check" size="14px" /> Si falta un tono, te ofrecemos el reemplazo</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="accion accion-carro">
        <div className="accion-total">
          <span>Total</span><b key={sub} className="serif num animate__animated animate__pulse">{$$(sub)}</b>
        </div>
        <Boton variante="primary" tamano="lg" onClick={() => ir({ v: "checkout" })}>Continuar<I n="flecha" size="15px" /></Boton>
      </div>
      <Pie ir={ir} />
    </>);

  }

  /* ===================== CHECKOUT ===================== */
  function Checkout({ ir, carrito, datos, setDatos, confirmar }) {
  /* El pedido ahora se registra en el servidor antes de abrir WhatsApp, así que
     confirmar tarda. Sin este freno, dos toques seguidos daban dos pedidos. */
  const [enviando, setEnviando] = React.useState(false);
  const mandar = async () => {
    if (enviando) return;
    setEnviando(true);
    try { await confirmar(); } finally { setEnviando(false); }
  };
    const sub = carrito.reduce((a, it) => a + prodP(it.id).precio * it.n, 0);
    const set = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });
    /* Sin aplastar el null: la zona "No sé en qué zona entro" no tiene tarifa y
       antes se cobraba como envío gratis. */
    const env = costoEnvio(datos, sub);
    const digitos = (s) => (String(s || "").match(/[0-9]/g) || []).length;
    /* Una lista en vez de un booleano: el aviso nombra lo que falta de verdad,
       en vez de repetir siempre los cuatro campos. Y el mínimo mayorista, que
       se anunciaba en tres pantallas, por fin frena el pedido. */
    const faltan = [
      !datos.nombre.trim() && "tu nombre",
      digitos(datos.tel) < 8 && "un WhatsApp válido",
      datos.envio === "domicilio" && !datos.zona && "la zona de envío",
      datos.envio === "domicilio" && !datos.direccion.trim() && "la dirección",
      datos.envio === "transporte" && !(datos.transporte || "").trim() && "el transporte",
      sub < NEG.minimo && `llegar al mínimo mayorista de ${$$(NEG.minimo)} (faltan ${$$(NEG.minimo - sub)})`,
    ].filter(Boolean);
    const falta = faltan.length > 0;
    const aviso = "Falta " + (faltan.length > 1 ? faltan.slice(0, -1).join(", ") + " y " + faltan[faltan.length - 1] : faltan[0]) + ".";
    return (
      <>
      <div className="pasos"><b>1 · Datos</b><i></i>2 · Envío<i></i>3 · Pago</div>
      <div className="pad checkout" style={{ paddingTop: "1.3rem" }}>
        <div>
          <h1 className="serif" style={{ margin: "0 0 1.1rem", fontSize: "1.5rem" }}>Tus datos</h1>
          <Campo label="Nombre y apellido"><input value={datos.nombre} onChange={set("nombre")} placeholder="Ana Gómez" autoComplete="name" /></Campo>
          <Campo label="WhatsApp" ayuda="Ahí te confirmamos stock y te pasamos los datos de pago."><input value={datos.tel} onChange={set("tel")} placeholder="11 5555 5555" inputMode="tel" autoComplete="tel" /></Campo>
          <Campo label="Nombre del gabinete o marca" ayuda="Opcional. Sirve para el remito."><input value={datos.gabinete} onChange={set("gabinete")} placeholder="Estudio Ana Nails" /></Campo>

          <h2 className="serif" style={{ margin: "1.8rem 0 .9rem", fontSize: "1.25rem" }}>Entrega</h2>
          <div role="radiogroup" style={{ display: "grid", gap: ".55rem" }}>
            <Opcion activa={datos.envio === "domicilio"} titulo="Envío a domicilio" detalle={`Costo según zona · sin cargo desde ${$$(ENV.gratisDesde)}`} onClick={() => setDatos({ ...datos, envio: "domicilio" })} />
            <Opcion activa={datos.envio === "retiro"} titulo="Retiro en el local" detalle="Sin costo · dirección y horarios a confirmar" onClick={() => setDatos({ ...datos, envio: "retiro" })} />
            <Opcion activa={datos.envio === "transporte"} titulo="Encomienda o transporte propio" detalle="Despachamos al transporte que uses" onClick={() => setDatos({ ...datos, envio: "transporte" })} />
          </div>
          {datos.envio === "domicilio" &&
            <div style={{ marginTop: "1.1rem" }}>
              <span className="lbl">Zona de envío</span>
              <div role="radiogroup" style={{ display: "grid", gap: ".5rem", margin: ".6rem 0 .7rem" }}>
                {ENV.zonas.map((z) =>
                <Opcion key={z.id} activa={datos.zona === z.id} titulo={z.nombre}
                detalle={z.costo == null ? z.plazo : `${$$(z.costo)} · llega en ${z.plazo}`}
                onClick={() => setDatos({ ...datos, zona: z.id })} />
                )}
              </div>
              {ENV.provisorio && <p style={{ margin: "0 0 1.1rem", fontSize: ".76rem", color: "var(--ink-faint)" }}>Montos provisorios del prototipo: se reemplazan por la tabla real de envíos.</p>}
              <Campo label="Dirección"><input value={datos.direccion} onChange={set("direccion")} placeholder="Calle 123, Piso 4 B" autoComplete="street-address" /></Campo>
              <Campo label="Localidad y código postal"><input value={datos.cp} onChange={set("cp")} placeholder="Rosario · 2000" autoComplete="postal-code" /></Campo>
            </div>
            }
          {datos.envio === "transporte" &&
            <div style={{ marginTop: "1rem" }}><Campo label="Transporte" ayuda="Nombre de la empresa y sucursal."><input value={datos.transporte || ""} onChange={set("transporte")} placeholder="Vía Cargo · Sucursal Centro" /></Campo></div>
            }

          <h2 className="serif" style={{ margin: "1.8rem 0 .9rem", fontSize: "1.25rem" }}>Pago</h2>
          <div role="radiogroup" style={{ display: "grid", gap: ".55rem" }}>
            <Opcion activa={datos.pago === "efectivo"} titulo="Efectivo" detalle="Al retirar o contra entrega" onClick={() => setDatos({ ...datos, pago: "efectivo" })} />
            <Opcion activa={datos.pago === "mp"} titulo="Mercado Pago" detalle="Te enviamos el link de pago por WhatsApp" onClick={() => setDatos({ ...datos, pago: "mp" })} />
          </div>
          <p style={{ margin: ".8rem 0 0", fontSize: ".78rem", color: "var(--ink-faint)" }}>Todavía no hay pago en línea en el sitio: el cobro se hace por el canal que elijas.</p>

          <div style={{ marginTop: "1.6rem" }}><Campo label="Nota para el pedido" ayuda="Opcional: cambios de tono, urgencias, aclaraciones."><textarea rows="3" value={datos.nota} onChange={set("nota")} placeholder="Si no hay Rojo Clásico, mandá Rojo Cereza."></textarea></Campo></div>
        </div>

        <aside className="carro-lado" aria-label="Resumen del pedido">
          <div className="carro-tarjeta">
            <span className="lbl">Resumen</span>
            <Resumen carrito={carrito} datos={datos} />
            <MetaEnvio sub={sub} mostrar={datos.envio === "domicilio"} />
            <ul className="carro-detalle">
              {carrito.map((it) => <li key={it.id + (it.tono || "")}><span>{it.n} × {prodP(it.id).nombre}{it.tono ? ` · ${it.tono}` : ""}</span><span className="num">{$$(prodP(it.id).precio * it.n)}</span></li>)}
            </ul>
            <div className="carro-cta">
              {falta && <span className="carro-aviso">{aviso}</span>}
              <Boton variante="primary" tamano="lg" style={{ width: "100%", opacity: falta || enviando ? .45 : 1 }} disabled={falta || enviando} onClick={() => !falta && mandar()}>
                <I n="wa" size="16px" /> {enviando ? "Registrando…" : "Enviar el pedido"}
              </Boton>
            </div>
          </div>
        </aside>
      </div>
      <div className="accion accion-checkout">
        {falta && <span style={{ fontSize: ".76rem", color: "var(--ink-faint)" }}>{aviso}</span>}
        <Boton variante="primary" tamano="lg" disabled={falta || enviando} style={{ opacity: falta || enviando ? .45 : 1 }} onClick={() => !falta && mandar()}>
          <I n="wa" size="16px" /> Enviar el pedido · {$$(sub + (env || 0))}{env == null && datos.zona ? " + envío" : ""}
        </Boton>
      </div>
      <Pie ir={ir} />
    </>);

  }

  /* ===================== CONFIRMACIÓN ===================== */
  function Confirmacion({ ir, pedido, vaciar, guardarHabituales }) {
    if (!pedido) return <div className="vacio">No hay un pedido reciente.<Boton variante="primary" onClick={() => ir({ v: "inicio" })}>Ir al inicio</Boton></div>;
    const d = pedido.datos;
    const zEnv = zonaDe(d.zona);
    const entrega = d.envio === "domicilio" ? `envío a domicilio${zEnv ? ` (${zEnv.nombre})` : ""}` : d.envio === "retiro" ? "retiro en local" : "encomienda o transporte";
    /* Los tres casos que antes se fundían en "sin cargo": retiro, transporte y
       zona sin tarifa (costoEnvio devuelve null, y el || 0 lo volvía gratis). */
    const lineaEnvio = d.envio === "retiro" ? "Envío: retiro en el local, sin cargo"
      : d.envio === "transporte" ? "Envío: por transporte, lo abona quien recibe"
      : pedido.envio == null ? "Envío: A COTIZAR (esa zona no tiene tarifa cargada)"
      : pedido.envio === 0 ? `Envío: sin cargo (el pedido superó ${$$(ENV.gratisDesde)})`
      : `Envío: ${$$(pedido.envio)}`;
    /* El mensaje se lleva todo lo que el checkout pidió. Antes viajaban solo el
       nombre y el total: GEA no recibía ni dirección ni teléfono para despachar. */
    const entregaDetalle = d.envio === "domicilio" ? `\nDirección: ${d.direccion}${d.cp ? ` · ${d.cp}` : ""}`
      : d.envio === "transporte" && d.transporte ? `\nTransporte: ${d.transporte}` : "";
    const texto = `${NEG.saludo}\n\n${pedido.items.map((it) => `• ${it.n} × ${prodP(it.id).nombre}${it.tono ? ` (${it.tono})` : ""} — ${$$(prodP(it.id).precio * it.n)}`).join("\n")}\n\nSubtotal: ${$$(pedido.sub != null ? pedido.sub : pedido.total)}\n${lineaEnvio}\nTotal: ${$$(pedido.total)}${pedido.envio == null ? " + envío a cotizar" : ""}\nEntrega: ${entrega}${entregaDetalle}\nPago: ${d.pago === "mp" ? "Mercado Pago" : "efectivo"}\n\nNombre: ${d.nombre}${d.gabinete ? ` · ${d.gabinete}` : ""}\nWhatsApp: ${d.tel}${d.nota ? `\nNota: ${d.nota}` : ""}\nPedido ${pedido.nro}`;
    return (
      <>
      <div className="pad" style={{ paddingTop: "2rem", maxWidth: "34rem", marginInline: "auto" }}>
        <span className="animate__animated animate__bounceIn" style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--nude-100)", color: "var(--nude-600)", display: "grid", placeItems: "center" }}><I n="check" size="22px" /></span>
        <h1 className="serif animate__animated animate__fadeInUp" style={{ margin: "1rem 0 .4rem", fontSize: "1.7rem", lineHeight: 1.15, animationDelay: ".16s" }}>Pedido armado</h1>
        <p className="animate__animated animate__fadeInUp" style={{ margin: 0, color: "var(--ink-soft)", animationDelay: ".26s" }}>Falta un paso: enviarlo por WhatsApp. Ya está todo escrito, no tenés que explicar nada.</p>
        <p className="num" style={{ margin: ".9rem 0 0", fontSize: ".8rem", color: "var(--ink-faint)" }}>Pedido {pedido.nro} · {pedido.items.reduce((a, i) => a + i.n, 0)} unidades · {$$(pedido.total)}</p>

        <div style={{ marginTop: "1.4rem" }}>
          <Boton variante="primary" tamano="lg" ancho onClick={vaciar} href={`https://wa.me/${NEG.whatsapp}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener">
            <I n="wa" size="17px" /> Enviar por WhatsApp
          </Boton>
        </div>

        <div style={{ marginTop: "1.4rem" }}>
          <span className="lbl">Mensaje que se envía</span>
          <pre style={{ margin: ".6rem 0 0", background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radio)", padding: ".9rem", fontFamily: "var(--sans)", fontSize: ".82rem", color: "var(--ink-soft)", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{texto}</pre>
        </div>

        <div className="nota" style={{ marginTop: "1.2rem" }}>
          <b style={{ fontWeight: 500, color: "var(--ink)", display: "block", marginBottom: ".3rem" }}>Qué sigue</b>
          Confirmamos stock y el costo final de envío, y te pasamos los datos para pagar{pedido.datos.pago === "mp" ? " por Mercado Pago" : " en efectivo"}. Despachamos apenas se acredita.
        </div>

        <div style={{ marginTop: "1.6rem", display: "grid", gap: ".6rem" }}>
          <Boton variante="ghost" ancho onClick={guardarHabituales}>Guardar este pedido como habitual</Boton>
          <Boton variante="ghost" ancho onClick={() => ir({ v: "catalogo" })}>Seguir viendo el catálogo</Boton>
        </div>
      </div>
      <Pie ir={ir} />
    </>);

  }

  /* ===================== AYUDA ===================== */
  const PASOS = [
  ["Armá el pedido", "Buscá por nombre, por categoría o por tono. Cada producto muestra el stock real y en cuántos días llega."],
  ["Elegí tonos y cantidades", "En los esmaltes elegís el tono exacto; si un tono está agotado te lo marcamos tachado."],
  ["Completá tus datos", "Nombre, WhatsApp y cómo querés recibirlo. Nada de crear cuenta."],
  ["Cerramos por WhatsApp", "El pedido llega escrito al chat. Confirmamos stock, envío y forma de pago."]];

  function Ayuda({ ir }) {
    return (
      <>
      <div className="pad ayuda-wrap">
        <div className="ayuda-dos">
          <div className="ayuda-txt">
            <h1 className="serif" style={{ margin: 0, fontSize: "1.7rem" }}>Cómo comprar</h1>
            <p style={{ color: "var(--ink-soft)", margin: ".5rem 0 0" }}>El carrito arma el pedido; la compra se cierra por WhatsApp. Así podés preguntar antes de pagar.</p>
            <ol style={{ listStyle: "none", margin: "1.8rem 0 0", padding: 0, display: "grid", gap: "1.1rem" }}>
              {PASOS.map(([t, d], i) =>
                <li key={t} style={{ display: "grid", gridTemplateColumns: "2rem 1fr", gap: "1rem", borderTop: "1px solid var(--hairline)", paddingTop: "1.1rem" }}>
                  <span className="serif" style={{ fontSize: "1.4rem", color: "var(--nude-300)", lineHeight: 1.1 }}>{i + 1}</span>
                  <div><b style={{ display: "block", fontWeight: 500, marginBottom: ".2rem" }}>{t}</b><span style={{ color: "var(--ink-soft)", fontSize: ".92rem" }}>{d}</span></div>
                </li>
                )}
            </ol>
          </div>
          <figure className="ayuda-foto rev">
            <Img src="tienda/img/manos-editorial.webp" alt="Manos con esmaltado negro y tortuga" />
          </figure>
        </div>

        <h2 className="serif" style={{ margin: "2.4rem 0 .6rem", fontSize: "1.3rem" }}>Preguntas frecuentes</h2>
        <Acordeon titulo="¿Hay pedido mínimo?" abierto>Sí, {$$(NEG.minimo)} por ser precio mayorista. El carrito te avisa cuánto falta.</Acordeon>
        <Acordeon titulo="¿Cómo pago?">Efectivo al retirar o contra entrega, y Mercado Pago con link que te enviamos por WhatsApp. Vamos a sumar más medios.</Acordeon>
        <Acordeon titulo="¿Cuánto sale el envío?">Depende de la zona: {ENV.zonas.filter((z) => z.costo != null).map((z) => `${z.nombre} ${$$(z.costo)}`).join(", ")}. Sin cargo desde {$$(ENV.gratisDesde)}. Si no sabés en qué zona entrás, lo cotizamos por chat.</Acordeon>
        <Acordeon titulo="¿Hacen precio por cantidad?">Sí, desde 6 unidades del mismo producto. Preguntá en el chat antes de cerrar.</Acordeon>
        <Acordeon titulo="¿Qué pasa si un tono está sin stock?">Te aparece tachado y no se puede agregar. Si lo querés igual, te avisamos cuando repone.</Acordeon>
        <Acordeon titulo="¿Puedo cambiar el pedido después de enviarlo?">Sí, mientras no lo hayamos despachado. Se ajusta por el mismo chat.</Acordeon>

        <div style={{ display: "grid", gap: ".6rem", marginTop: "2rem" }}>
          <Boton variante="primary" tamano="lg" href={`https://wa.me/${NEG.whatsapp}`} target="_blank" rel="noopener"><I n="wa" size="16px" /> Escribinos por WhatsApp</Boton>
          <Boton variante="ghost" ancho onClick={() => ir({ v: "catalogo" })}>Ver el catálogo</Boton>
        </div>
      </div>
      <Pie ir={ir} />
    </>);

  }

  /* ===================== CONTACTO ===================== */
  function Contacto({ ir }) {
    const canal = { background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radio)", padding: "1.2rem 1.15rem", display: "grid", gap: ".2rem" };
    const pend = <span style={{ color: "var(--nude-600)", fontStyle: "italic" }}>A confirmar</span>;
    return (
      <>
      <div className="pad" style={{ paddingTop: "1.5rem", maxWidth: "36rem", marginInline: "auto" }}>
        <h1 className="serif" style={{ margin: 0, fontSize: "1.7rem" }}>Contacto</h1>
        <p style={{ color: "var(--ink-soft)", margin: ".5rem 0 0" }}>Lo más rápido es WhatsApp: consultas de productos, precio por cantidad y envíos.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(11rem,1fr))", gap: ".7rem", marginTop: "1.6rem" }}>
          <a href={`https://wa.me/${NEG.whatsapp}`} target="_blank" rel="noopener" style={canal}>
            <span style={{ color: "var(--nude-600)", marginBottom: ".4rem" }}><I n="wa" size="22px" /></span>
            <span className="serif" style={{ fontSize: "1.1rem" }}>WhatsApp</span>
            <span style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>Pedidos y consultas</span>
          </a>
          <a href={NEG.instagram} target="_blank" rel="noopener" style={canal}>
            <span style={{ color: "var(--nude-600)", marginBottom: ".4rem" }}><I n="ig" size="22px" /></span>
            <span className="serif" style={{ fontSize: "1.1rem" }}>Instagram</span>
            <span style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>{NEG.instagramUsuario}</span>
          </a>
        </div>
        <dl className="ficha-tabla" style={{ marginTop: "1.6rem" }}>
          {[["Ciudad", pend], ["Local", pend], ["Horarios", pend], ["Mínimo mayorista", $$(NEG.minimo)]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
      <Pie ir={ir} />
    </>);

  }

  Object.assign(window, { Carrito, Checkout, Confirmacion, Ayuda, Contacto, Resumen, LineaItem });
})();
// =============================================================
//  DATOS DEL NEGOCIO
//  Es el único archivo que hay que tocar para cambiar los datos
//  de contacto. Todo lo marcado como PENDIENTE se reemplaza
//  cuando el cliente los pase.
// =============================================================

export const NEGOCIO = {
  nombre: "GEA Insumos",
  descripcion:
    "Insumos de manicuría: esmaltes, geles, herramientas y equipos. Consultá por WhatsApp.",

  // Número con código de país, sin +, sin espacios ni guiones.
  // Argentina: 54 + 9 + característica sin 0 + número sin 15.
  whatsapp: "5490000000000",
  whatsappPendiente: true,

  instagram: "https://instagram.com/",
  instagramUsuario: "@geainsumos",
  instagramPendiente: true,

  ciudad: null,          // ej: "Rosario, Santa Fe"
  direccion: null,       // null = no hay local físico
  horarios: null,        // ej: "Lunes a viernes de 9 a 18"

  // Lista vacía = todavía sin confirmar.
  formasDePago: [],      // ej: ["Transferencia", "Efectivo", "Mercado Pago"]
  envios: null,          // ej: "Envíos a todo el país por correo"

  saludo: "Hola GEA, quería consultar por",

  // Dominio final. Se usa para el mapa del sitio y los enlaces
  // que se ven al compartir en WhatsApp o Instagram.
  sitio: "https://geainsumos.com.ar",
};

// Arma el enlace de WhatsApp con el mensaje ya escrito.
export function enlaceWhatsapp(producto) {
  const texto = producto
    ? `${NEGOCIO.saludo} ${producto.nombre} (${precio(producto.precio)}).`
    : `${NEGOCIO.saludo} los productos del catálogo.`;
  return `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function precio(n) {
  return "$ " + n.toLocaleString("es-AR");
}

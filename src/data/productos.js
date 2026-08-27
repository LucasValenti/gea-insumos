// =============================================================
//  CATÁLOGO
//
//  ⚠ DATOS DE EJEMPLO. Reemplazar por los productos reales.
//     Cuando estén cargados, poner EJEMPLO = false para que
//     desaparezca el aviso naranja de la parte de arriba.
//
//  Campos de cada producto:
//    id         dirección web del producto. Sin acentos ni espacios.
//    cat        id de una categoría de categorias.js
//    nombre     como lo ve el visitante
//    precio     número, sin puntos ni símbolo
//    color      opcional. Solo si el producto ES un color.
//    foto       opcional. Nombre del archivo en /public/productos/
//    contenido / rinde / uso / desc   opcionales
// =============================================================

export const EJEMPLO = true;

export const PRODUCTOS = [
  // ---------- ESMALTES ----------
  {
    id: "semipermanente-rojo-clasico",
    cat: "esmaltes",
    nombre: "Semipermanente Rojo Clásico",
    precio: 12400,
    color: "#B4142B",
    contenido: "15 ml",
    rinde: "3 a 4 semanas",
    uso: "Dos capas finas, 90 segundos en cabina LED.",
    desc: "Rojo pleno de un solo paso, con buena cobertura desde la primera capa. Acabado brillante que no se opaca con el lavado.",
  },
  {
    id: "semipermanente-nude-rosado",
    cat: "esmaltes",
    nombre: "Semipermanente Nude Rosado",
    precio: 12400,
    color: "#E2C2B9",
    contenido: "15 ml",
    rinde: "3 a 4 semanas",
    uso: "Dos capas finas, 90 segundos en cabina LED.",
    desc: "El nude que más se pide para trabajos de todos los días. Favorece cualquier tono de piel y disimula el crecimiento.",
  },
  {
    id: "semipermanente-negro-intenso",
    cat: "esmaltes",
    nombre: "Semipermanente Negro Intenso",
    precio: 12400,
    color: "#141414",
    contenido: "15 ml",
    rinde: "3 a 4 semanas",
    uso: "Dos capas finas, 90 segundos en cabina LED.",
    desc: "Negro profundo sin transparencias. Base ideal para decoración y diseños de contraste.",
  },
  {
    id: "top-coat-brillo-espejo",
    cat: "esmaltes",
    nombre: "Top Coat Brillo Espejo",
    precio: 11800,
    color: "#F0EDEA",
    contenido: "15 ml",
    rinde: "25 a 30 aplicaciones",
    uso: "Una capa generosa, 60 segundos en cabina.",
    desc: "Sellador de acabado espejo sin capa pegajosa. Mantiene el brillo hasta el retiro.",
  },
  {
    id: "base-rubber-nivelante",
    cat: "esmaltes",
    nombre: "Base Rubber Nivelante",
    precio: 13200,
    color: "#F6E3DC",
    contenido: "15 ml",
    rinde: "20 a 25 aplicaciones",
    uso: "Una capa fina de anclaje más una de nivelación.",
    desc: "Base de consistencia espesa que corrige irregularidades y aporta resistencia en uñas finas.",
  },
  {
    id: "esmalte-tradicional-pasteles",
    cat: "esmaltes",
    nombre: "Esmalte Tradicional x6 Pasteles",
    precio: 9600,
    color: "#D9CFE8",
    contenido: "6 frascos de 11 ml",
    rinde: "Secado al aire",
    uso: "Dos capas, sin cabina.",
    desc: "Set de seis tonos pastel para clientas que prefieren el esmalte tradicional.",
  },

  // ---------- CONSTRUCCIÓN ----------
  {
    id: "gel-constructor-transparente",
    cat: "construccion",
    nombre: "Gel Constructor Transparente",
    precio: 18900,
    contenido: "30 g",
    rinde: "18 a 22 manos",
    uso: "Curado de 60 segundos por capa.",
    desc: "Gel de media densidad para esculpir y reforzar. Autonivelante, no chorrea sobre el molde.",
  },
  {
    id: "polygel-nude-cover",
    cat: "construccion",
    nombre: "Polygel Nude Cover",
    precio: 21500,
    color: "#E8CDC4",
    contenido: "30 g",
    rinde: "20 manos aproximadamente",
    uso: "Modelar con pincel y alcohol, curar 90 segundos.",
    desc: "Combina la resistencia del acrílico con la comodidad del gel. No tiene olor y no fragua solo.",
  },
  {
    id: "acrilico-polimero-clear",
    cat: "construccion",
    nombre: "Acrílico Polímero Clear",
    precio: 24800,
    contenido: "100 g",
    rinde: "30 manos aproximadamente",
    uso: "Relación 1 a 1 con monómero.",
    desc: "Polímero de grano fino y fraguado medio. Da tiempo a trabajar sin perder dureza final.",
  },
  {
    id: "monomero-sin-olor",
    cat: "construccion",
    nombre: "Monómero Sin Olor",
    precio: 19700,
    contenido: "100 ml",
    rinde: "Según técnica",
    uso: "Usar en ambiente ventilado.",
    desc: "Monómero de olor reducido, pensado para gabinetes chicos o trabajo a domicilio.",
  },
  {
    id: "gel-fibra-de-vidrio",
    cat: "construccion",
    nombre: "Gel de Fibra de Vidrio",
    precio: 16400,
    contenido: "15 g",
    rinde: "15 manos aproximadamente",
    uso: "Aplicar en capa fina sobre la uña natural.",
    desc: "Refuerzo con hebras de fibra para uñas que se quiebran. Queda casi invisible.",
  },

  // ---------- HERRAMIENTAS ----------
  {
    id: "set-5-pinceles-gel",
    cat: "herramientas",
    nombre: "Set 5 Pinceles para Gel",
    precio: 8900,
    contenido: "5 unidades",
    rinde: "Uso profesional",
    uso: "Limpiar con limpiador de pinceles, nunca con acetona.",
    desc: "Cinco formas de pincel: plano, redondo, detalle, biselado y liner. Pelo sintético que no suelta.",
  },
  {
    id: "lima-recta-100-180",
    cat: "herramientas",
    nombre: "Lima Recta 100/180 x10",
    precio: 4200,
    contenido: "10 unidades",
    rinde: "Reutilizable",
    uso: "Lado 100 para acrílico, lado 180 para terminación.",
    desc: "Lima de doble grano, base resistente que no se dobla al limar el borde libre.",
  },
  {
    id: "alicate-cuticula-acero",
    cat: "herramientas",
    nombre: "Alicate Cutícula Acero Inoxidable",
    precio: 14600,
    contenido: "1 unidad",
    rinde: "Afilable",
    uso: "Esterilizar entre clientas.",
    desc: "Corte preciso de 4 milímetros con resorte doble. Acero inoxidable apto para autoclave.",
  },
  {
    id: "empujador-doble-punta",
    cat: "herramientas",
    nombre: "Empujador Doble Punta",
    precio: 3800,
    contenido: "1 unidad",
    rinde: "Reutilizable",
    uso: "Esterilizar entre clientas.",
    desc: "Una punta plana para empujar cutícula y otra curva para limpiar el surco.",
  },
  {
    id: "pinza-curva-encapsulado",
    cat: "herramientas",
    nombre: "Pinza Curva para Encapsulado",
    precio: 7400,
    contenido: "1 unidad",
    rinde: "Reutilizable",
    uso: "Presionar los laterales durante el curado.",
    desc: "Define la curva C sin marcar el material. Punta de silicona intercambiable.",
  },
  {
    id: "bloque-pulidor-4-caras",
    cat: "herramientas",
    nombre: "Bloque Pulidor 4 Caras x5",
    precio: 3100,
    contenido: "5 unidades",
    rinde: "Descartable por clienta",
    uso: "Seguir el orden numerado de las caras.",
    desc: "Cuatro granos progresivos para dejar la uña natural con brillo sin esmalte.",
  },
  {
    id: "cepillo-limpiador-unas",
    cat: "herramientas",
    nombre: "Cepillo Limpiador de Uñas",
    precio: 2600,
    contenido: "1 unidad",
    rinde: "Reutilizable",
    uso: "Lavar con agua y jabón.",
    desc: "Cerda firme para retirar polvillo de limado antes de aplicar el producto.",
  },

  // ---------- EQUIPOS ----------
  {
    id: "cabina-led-uv-48w",
    cat: "equipos",
    nombre: "Cabina LED/UV 48W Doble Mano",
    precio: 58900,
    contenido: "1 unidad",
    rinde: "Vida útil 50.000 horas",
    uso: "Temporizador de 10, 30, 60 y 99 segundos.",
    desc: "Cabina de 48 watts con sensor automático y fondo espejado. Entra la mano completa o los dos pies.",
  },
  {
    id: "torno-portatil-35000",
    cat: "equipos",
    nombre: "Torno Portátil 35.000 rpm",
    precio: 47500,
    contenido: "1 unidad",
    rinde: "Batería de 6 horas",
    uso: "Empezar siempre en la velocidad más baja.",
    desc: "Torno inalámbrico con giro reversible y control de velocidad. Bajo nivel de vibración para jornadas largas.",
  },
  {
    id: "set-10-fresas-tungsteno",
    cat: "equipos",
    nombre: "Set 10 Fresas de Tungsteno",
    precio: 22300,
    contenido: "10 unidades",
    rinde: "Esterilizable",
    uso: "Cada forma tiene su uso indicado en el estuche.",
    desc: "Diez fresas de tungsteno y cerámica para retiro, cutícula y terminación, con estuche organizador.",
  },
  {
    id: "lampara-escritorio-lupa",
    cat: "equipos",
    nombre: "Lámpara de Escritorio con Lupa",
    precio: 39000,
    contenido: "1 unidad",
    rinde: "Luz LED regulable",
    uso: "Brazo articulado con morsa.",
    desc: "Lupa de 5 aumentos con aro de luz fría regulable. Reduce el cansancio de la vista en trabajos de detalle.",
  },

  // ---------- PREPARACIÓN ----------
  {
    id: "primer-acido",
    cat: "preparacion",
    nombre: "Primer Ácido",
    precio: 7900,
    contenido: "15 ml",
    rinde: "60 aplicaciones",
    uso: "Una gota por uña, no tocar la piel.",
    desc: "Mejora la adherencia en uñas grasas o con tendencia al desprendimiento.",
  },
  {
    id: "deshidratador-de-una",
    cat: "preparacion",
    nombre: "Deshidratador de Uña",
    precio: 7400,
    contenido: "15 ml",
    rinde: "70 aplicaciones",
    uso: "Aplicar y esperar 30 segundos antes del primer.",
    desc: "Elimina la humedad natural de la lámina, paso previo obligatorio para que el semipermanente dure.",
  },
  {
    id: "removedor-semipermanente",
    cat: "preparacion",
    nombre: "Removedor de Semipermanente",
    precio: 9800,
    contenido: "500 ml",
    rinde: "40 retiros",
    uso: "Envolver 10 minutos con papel aluminio.",
    desc: "Remoción sin limado agresivo. Fórmula con aceite que no reseca la cutícula.",
  },
  {
    id: "papel-aluminio-precortado",
    cat: "preparacion",
    nombre: "Papel Aluminio Precortado x100",
    precio: 5600,
    contenido: "100 unidades",
    rinde: "10 retiros completos",
    uso: "Un cuadrado por uña.",
    desc: "Cuadrados precortados con almohadilla de algodón incorporada. Ahorra tiempo en el retiro.",
  },

  // ---------- DECORACIÓN ----------
  {
    id: "glitter-holografico-x12",
    cat: "decoracion",
    nombre: "Glitter Holográfico x12 Potes",
    precio: 11200,
    color: "#C9A5D6",
    contenido: "12 potes",
    rinde: "Uso profesional",
    uso: "Aplicar sobre gel sin curar.",
    desc: "Doce colores holográficos de grano fino que no raspan al sellar.",
  },
  {
    id: "piedras-surtidas-x1000",
    cat: "decoracion",
    nombre: "Piedras Surtidas x1000",
    precio: 8700,
    contenido: "1000 unidades",
    rinde: "Uso profesional",
    uso: "Fijar con gel adhesivo y curar.",
    desc: "Mil piedras de cristal en cinco tamaños y colores surtidos, con estuche separador.",
  },
  {
    id: "stickers-adhesivos-x20",
    cat: "decoracion",
    nombre: "Stickers Adhesivos x20 Planchas",
    precio: 6300,
    contenido: "20 planchas",
    rinde: "Uso profesional",
    uso: "Aplicar entre la capa de color y el top.",
    desc: "Veinte planchas de diseños variados: líneas, flores, letras y figuras geométricas.",
  },
  {
    id: "cinta-decorativa-metalizada",
    cat: "decoracion",
    nombre: "Cinta Decorativa Metalizada x10",
    precio: 4900,
    color: "#C8A24B",
    contenido: "10 rollos",
    rinde: "Uso profesional",
    uso: "Cortar con tijera fina y sellar con top.",
    desc: "Diez rollos de cinta metalizada en dorado, plateado y colores, para líneas y marcos.",
  },
];

export function porCategoria(catId) {
  return PRODUCTOS.filter((p) => p.cat === catId);
}

export function buscarPorId(id) {
  return PRODUCTOS.find((p) => p.id === id);
}

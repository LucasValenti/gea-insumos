// Las categorías del catálogo. El `id` es lo que aparece en la
// dirección web: /catalogo/esmaltes
export const CATEGORIAS = [
  {
    id: "esmaltes",
    nombre: "Esmaltes",
    descripcion: "Semipermanentes, tradicionales, bases y top coats.",
  },
  {
    id: "construccion",
    nombre: "Construcción",
    descripcion: "Geles, polygel, acrílico y monómero para esculpir.",
  },
  {
    id: "herramientas",
    nombre: "Herramientas",
    descripcion: "Pinceles, limas, alicates y todo lo de mano.",
  },
  {
    id: "equipos",
    nombre: "Equipos",
    descripcion: "Cabinas, tornos, fresas e iluminación.",
  },
  {
    id: "preparacion",
    nombre: "Preparación",
    descripcion: "Primers, deshidratadores y removedores.",
  },
  {
    id: "decoracion",
    nombre: "Decoración",
    descripcion: "Glitters, piedras, stickers y cintas.",
  },
];

export function nombreCategoria(id) {
  const c = CATEGORIAS.find((x) => x.id === id);
  return c ? c.nombre : "";
}

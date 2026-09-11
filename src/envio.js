/* Zona de envío sin cargo, y precio por distancia para lo que queda afuera.
 *
 * Hasta acá el envío se elegía de una lista de zonas con nombre ("Rosario",
 * "Resto del país"), y tres de las cuatro decían "a cotizar". El que compra no
 * sabía cuánto iba a pagar hasta escribir por WhatsApp.
 *
 * Ahora, cuando hay una zona cargada, el que compra pone un pin en el mapa y ve
 * el costo en el momento: adentro del polígono no paga envío, afuera paga según
 * a qué distancia queda. Sin zona cargada no cambia nada y sigue la lista de
 * siempre, así que esto se puede publicar antes de tener los datos.
 *
 * Por qué un pin y no la dirección escrita: convertir "Pellegrini 1234" en
 * coordenadas pide un servicio de geocodificación, que es otro tercero, cuesta,
 * y con las calles y numeraciones de acá se equivoca seguido. El pin lo pone la
 * persona, que sabe dónde vive mejor que cualquier servicio. La dirección
 * escrita se sigue pidiendo igual, para el reparto.
 *
 * Por qué el precio se calcula acá y no en el navegador: para medir la
 * distancia hace falta el punto de origen, que es la casa de la clienta. Si
 * viajara al navegador, cualquiera lo leería del JSON —y su dirección está
 * fuera del sitio a propósito, hasta se sacó la fila "Local" de Contacto—. Así
 * que al navegador va solo el polígono, que es información pública de todos
 * modos, y el origen no sale nunca de acá.
 *
 * La distancia es en línea recta, no por calles: medir por calles pide un
 * servicio de ruteo, otro tercero más. Los tramos hay que cargarlos sabiendo
 * eso —un tramo "hasta 5 km" cubre bastante más que 5 km de recorrido real—.
 */

/* Las tres claves de config que definen todo esto. Con la zona ausente o mal
   escrita, devuelve null y el sitio se comporta como antes: eso es lo que deja
   publicar la función antes de que existan los datos. */
export function leerMapaEnvio(conf) {
  const zona = json(conf.envioZonaGratis);
  if (!Array.isArray(zona) || zona.length < 3) return null;
  if (!zona.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) return null;

  const tramos = (json(conf.envioTramos) || [])
    .filter((t) => t && Number.isFinite(t.hasta) && Number.isFinite(t.costo))
    .sort((a, b) => a.hasta - b.hasta);

  return { zona, origen: coord(conf.envioOrigen), tramos };
}

const json = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };

const coord = (s) => {
  const [lat, lng] = String(s || "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

/* Un punto está adentro si una semirrecta hacia un costado cruza el borde un
   número impar de veces. Los vértices vienen [lat, lng], así que acá lng hace
   de x y lat de y. */
export function dentroDeZona(punto, zona) {
  let dentro = false;
  for (let i = 0, j = zona.length - 1; i < zona.length; j = i++) {
    const [yi, xi] = zona[i];
    const [yj, xj] = zona[j];
    const cruza = (yi > punto.lat) !== (yj > punto.lat)
      && punto.lng < ((xj - xi) * (punto.lat - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

/* Haversine. En distancias de ciudad la diferencia con una fórmula plana es
   despreciable, pero esto no se rompe si algún día hay que enviar más lejos. */
export function distanciaKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* El costo de un punto del mapa.
 *
 * Devuelve el número, 0 si no corresponde cobrar, o null si hay que cotizar
 * —la misma convención que ya usaba costoEnvio(), donde null y 0 no son lo
 * mismo y el pedido queda marcado "a cotizar" en vez de gratis—. */
export function costoPorMapa(mapa, punto, subtotal, gratisDesde) {
  if (!mapa || !punto) return null;
  if (dentroDeZona(punto, mapa.zona)) return 0;
  /* El umbral por monto sigue valiendo afuera de la zona: quien compra mucho no
     paga envío aunque viva lejos. */
  if (subtotal >= gratisDesde) return 0;
  if (!mapa.origen || !mapa.tramos.length) return null;

  const km = distanciaKm(mapa.origen, punto);
  const tramo = mapa.tramos.find((t) => km <= t.hasta);
  return tramo ? tramo.costo : null;
}

/* Lo que se le puede contar al navegador sin entregar la dirección de origen:
   el polígono para dibujarlo, y hasta dónde llega el último tramo para poder
   avisar "más lejos de esto lo cotizamos por chat". */
export function mapaPublico(mapa) {
  if (!mapa) return null;
  return {
    zona: mapa.zona,
    conPrecios: mapa.tramos.length > 0 && !!mapa.origen,
  };
}

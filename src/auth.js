/* Acceso al panel. Un solo administrador y una sola contraseña: no hay cuentas
 * de usuario ni registro, así que todo esto es a propósito lo más chico posible.
 *
 * Cómo funciona: se entra con la contraseña (secreto ADMIN_PASSWORD), y el
 * servidor devuelve una cookie de sesión firmada con otro secreto
 * (SESION_SECRETO). La cookie no guarda la contraseña, solo hasta cuándo vale;
 * la firma es lo que impide fabricarla a mano. Va HttpOnly para que ningún
 * script de la página pueda leerla, y Secure + SameSite=Strict para que no
 * viaje por HTTP ni desde otro sitio.
 */

const COOKIE = "gea_sesion";
const DURACION_MS = 8 * 60 * 60 * 1000;   // 8 horas
const MAX_INTENTOS = 8;                    // por IP
const VENTANA_MIN = 15;

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const deB64url = (s) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const clave = async (secreto) =>
  crypto.subtle.importKey("raw", new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

/* Comparación de tiempo constante: comparar con === corta en el primer byte
   distinto, y ese tiempo distinto le va diciendo al que prueba si va bien. */
const igual = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
};

/* La época va firmada adentro del token. Salir la cambia, y con eso todo token
   emitido antes deja de valer.
   Sin esto, salir solo borraba la cookie del navegador: el token en sí seguía
   firmado y con fecha válida hasta ocho horas después, así que una copia
   tomada antes de salir seguía abriendo el panel. */
export async function epocaSesion(db) {
  const r = await db.prepare("SELECT valor FROM config WHERE clave = 'sesion_epoca'").first();
  return String((r && r.valor) || "0");
}

export async function cambiarEpoca(db) {
  await db.prepare(
    `INSERT INTO config (clave, valor) VALUES ('sesion_epoca', ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`).bind(String(Date.now())).run();
}

export async function firmarSesion(secreto, epoca = "0", ms = DURACION_MS) {
  const cuerpo = b64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + ms, ep: String(epoca) })));
  const firma = await crypto.subtle.sign("HMAC", await clave(secreto), new TextEncoder().encode(cuerpo));
  return cuerpo + "." + b64url(firma);
}

export async function sesionValida(token, secreto, epoca = null) {
  if (!token || typeof token !== "string") return false;
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return false;
  try {
    const esperada = await crypto.subtle.sign("HMAC", await clave(secreto), new TextEncoder().encode(cuerpo));
    if (!igual(new Uint8Array(esperada), deB64url(firma))) return false;
    const { exp, ep } = JSON.parse(new TextDecoder().decode(deB64url(cuerpo)));
    if (typeof exp !== "number" || Date.now() >= exp) return false;
    /* epoca null = no se pidió comprobarla (no hay base a mano). */
    return epoca === null || String(ep ?? "0") === String(epoca);
  } catch { return false; }
}

export const leerCookie = (request, nombre = COOKIE) => {
  const crudo = request.headers.get("cookie") || "";
  for (const parte of crudo.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return v.join("=");
  }
  return null;
};

export const cookieSesion = (token, url) => {
  const seguro = url.protocol === "https:" ? " Secure;" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly;${seguro} SameSite=Strict; Max-Age=${DURACION_MS / 1000}`;
};

export const cookieBorrada = (url) => {
  const seguro = url.protocol === "https:" ? " Secure;" : "";
  return `${COOKIE}=; Path=/; HttpOnly;${seguro} SameSite=Strict; Max-Age=0`;
};

/* Contraseñas de distinto largo se distinguen por el tiempo de comparación.
   Comparar los hashes en vez del texto deja siempre el mismo largo. */
export async function contrasenaCorrecta(intento, real) {
  if (typeof intento !== "string" || !real) return false;
  const h = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return igual(await h(intento), await h(real));
}

/* Freno a la fuerza bruta. Se apoya en la base porque un contador en memoria
   no serviría: cada pedido puede caer en otra instancia del Worker. */
export async function frenado(db, ip) {
  const desde = Date.now() - VENTANA_MIN * 60 * 1000;
  const r = await db.prepare("SELECT COUNT(*) AS n FROM intentos_login WHERE ip = ? AND cuando > ?")
    .bind(ip, desde).first();
  return (r?.n || 0) >= MAX_INTENTOS;
}

export async function registrarFallo(db, ip) {
  await db.prepare("INSERT INTO intentos_login (ip, cuando) VALUES (?, ?)").bind(ip, Date.now()).run();
  /* Limpieza oportunista: sin esto la tabla crece para siempre. */
  await db.prepare("DELETE FROM intentos_login WHERE cuando < ?")
    .bind(Date.now() - 24 * 60 * 60 * 1000).run();
}

export async function limpiarIntentos(db, ip) {
  await db.prepare("DELETE FROM intentos_login WHERE ip = ?").bind(ip).run();
}

export const MINUTOS_BLOQUEO = VENTANA_MIN;

-- Catálogo de GEA Insumos. Lo que hasta ahora vivía escrito a mano en
-- public/tienda/datos.js.
--
-- Dos reglas que el código ya aplicaba y que acá se sostienen igual, calculadas
-- al servir y no guardadas:
--   * el stock de un producto con tonos es la suma del stock de sus tonos;
--   * el "precio antes" de un kit sale de sumar sus componentes, y solo si
--     comprarlo suelto sale más caro.
-- Por eso productos.stock se ignora cuando el producto tiene tonos, y
-- productos.precio_antes no se usa en kits.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS categorias (
  id     TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  img    TEXT,
  orden  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subcategorias (
  id           TEXT NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  orden        INTEGER NOT NULL,
  PRIMARY KEY (categoria_id, id)
);

CREATE TABLE IF NOT EXISTS familias (
  id     TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  hex    TEXT NOT NULL,
  orden  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
  id           TEXT PRIMARY KEY,
  categoria_id TEXT REFERENCES categorias(id),
  sub_id       TEXT,
  marca        TEXT,
  nombre       TEXT NOT NULL,
  precio       INTEGER NOT NULL,
  precio_antes INTEGER,
  stock        INTEGER NOT NULL DEFAULT 0,
  envio        TEXT,
  contenido    TEXT,
  rinde        TEXT,
  uso          TEXT,
  descripcion  TEXT,
  img          TEXT,
  img_kit      TEXT,
  color        TEXT,
  -- NULL = no está en la lista. El número guarda la posición, porque el orden
  -- de los destacados y del pedido habitual es una decisión, no un detalle.
  destacado    INTEGER,
  habitual     INTEGER,
  orden        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tonos (
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  hex         TEXT NOT NULL,
  familia_id  TEXT REFERENCES familias(id),
  stock       INTEGER NOT NULL DEFAULT 0,
  orden       INTEGER NOT NULL,
  PRIMARY KEY (producto_id, nombre)
);

-- cantidad porque un kit puede llevar varias unidades del mismo producto: el
-- kit de semi básico lleva tres frascos, y el precio suelto suma los tres.
CREATE TABLE IF NOT EXISTS kit_componentes (
  kit_id      TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  cantidad    INTEGER NOT NULL DEFAULT 1,
  orden       INTEGER NOT NULL,
  PRIMARY KEY (kit_id, producto_id)
);

-- El texto que se le muestra al cliente. No siempre es uno por componente:
-- puede nombrar cosas que no son productos sueltos del catálogo.
CREATE TABLE IF NOT EXISTS kit_incluye (
  kit_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  texto  TEXT NOT NULL,
  orden  INTEGER NOT NULL,
  PRIMARY KEY (kit_id, orden)
);

-- costo NULL significa "se cotiza por chat", que no es lo mismo que 0.
CREATE TABLE IF NOT EXISTS zonas_envio (
  id     TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  costo  INTEGER,
  plazo  TEXT,
  orden  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_tonos_producto      ON tonos(producto_id);

-- Intentos fallidos de entrar al panel, para frenar la fuerza bruta. Va en la
-- base y no en memoria porque cada pedido puede caer en otra instancia del
-- Worker, y un contador local no vería los intentos de las demás.
CREATE TABLE IF NOT EXISTS intentos_login (
  ip     TEXT NOT NULL,
  cuando INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_intentos_ip ON intentos_login(ip, cuando);

-- Pedidos. Hasta la fase 4 el pedido no lo veía ningún servidor: el navegador
-- inventaba un número al azar y abría WhatsApp. Ahora queda registrado antes
-- de abrir el chat, con número correlativo de verdad.
CREATE TABLE IF NOT EXISTS pedidos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  creado   INTEGER NOT NULL,
  -- nuevo -> confirmado (descuenta stock) | cancelado (no descuenta)
  estado   TEXT NOT NULL DEFAULT 'nuevo',
  cerrado  INTEGER,
  nombre      TEXT,
  telefono    TEXT,
  gabinete    TEXT,
  envio_modo  TEXT,
  envio_zona  TEXT,
  direccion   TEXT,
  cp          TEXT,
  transporte  TEXT,
  pago        TEXT,
  nota        TEXT,
  subtotal    INTEGER NOT NULL,
  -- Dónde puso el pin quien compró, cuando el envío se calculó por mapa.
  -- Sirve para dos cosas: saber a dónde llevarlo, y poder revisar después por
  -- qué se cobró lo que se cobró. NULL cuando se eligió zona de la lista.
  envio_lat   REAL,
  envio_lng   REAL,
  -- NULL significa "a cotizar", que no es lo mismo que 0 (sin cargo).
  envio_costo INTEGER,
  total       INTEGER NOT NULL
);

-- El nombre y el precio quedan congelados: el producto puede cambiar de precio
-- o de nombre después, y el pedido tiene que seguir diciendo lo que se pidió.
CREATE TABLE IF NOT EXISTS pedido_items (
  pedido_id   INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL,
  tono        TEXT,
  cantidad    INTEGER NOT NULL,
  precio      INTEGER NOT NULL,
  nombre      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado, creado);
CREATE INDEX IF NOT EXISTS idx_items_pedido   ON pedido_items(pedido_id);

-- Freno para el alta de pedidos: es una ruta pública que escribe.
CREATE TABLE IF NOT EXISTS pedidos_ritmo (
  ip     TEXT NOT NULL,
  cuando INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ritmo_ip ON pedidos_ritmo(ip, cuando);

-- Las fotos que sube la clienta desde el panel.
--
-- Viven acá y no en public/ porque public/ es el repositorio: para cambiar una
-- foto habría que editar el código y volver a publicar, que es justo lo que el
-- panel viene a evitar. Cloudflare R2 sería el lugar natural, pero la cuenta no
-- lo tiene habilitado y activarlo pide tarjeta; para un catálogo de este tamaño
-- —decenas de fotos de ~80 KB— D1 alcanza de sobra y no suma otro servicio.
--
-- La clave es el hash del contenido, así que dos fotos iguales ocupan una sola
-- fila y la dirección de cada una puede cachearse para siempre: si la foto
-- cambia, cambia la clave, y no hay caché vieja que invalidar.
--
-- El ancho y el alto se guardan para poder declararlos en el <img>. Sin eso el
-- navegador no sabe cuánto lugar reservar y la página salta cuando entra la
-- foto, que es el mismo motivo por el que existe medidas.js para las estáticas.
CREATE TABLE IF NOT EXISTS imagenes (
  clave  TEXT PRIMARY KEY,
  tipo   TEXT NOT NULL,
  ancho  INTEGER,
  alto   INTEGER,
  bytes  BLOB NOT NULL,
  creada TEXT NOT NULL DEFAULT (datetime('now'))
);

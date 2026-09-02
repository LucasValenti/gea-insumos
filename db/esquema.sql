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

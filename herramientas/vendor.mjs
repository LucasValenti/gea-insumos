/* Copia las librerías de node_modules a public/vendor/.
   ────────────────────────────────────────────────────────────────────────
   Antes venían de unpkg y cdnjs. Si esos dominios no respondían —una red
   corporativa que los filtra, un corte del CDN— la tienda quedaba en
   blanco: sin React no se dibuja nada, ni siquiera un mensaje. Ahora salen
   del mismo dominio que el resto del sitio.

   Las versiones están fijas en package.json. Para actualizarlas:
       npm install react@X react-dom@X @babel/standalone@X
       node herramientas/vendor.mjs
   Los archivos de public/vendor/ se commitean: el sitio no tiene build y
   node_modules no se publica.                                            */

import fs from 'fs/promises';
import path from 'path';

const COPIAS = [
  ['react/umd/react.production.min.js',          'react.production.min.js'],
  ['react-dom/umd/react-dom.production.min.js',  'react-dom.production.min.js'],
  ['@babel/standalone/babel.min.js',             'babel.min.js'],
  ['animate.css/animate.min.css',                'animate.min.css'],
];

const DESTINO = path.resolve('public/vendor');
await fs.mkdir(DESTINO, { recursive: true });

let total = 0;
for (const [origen, nombre] of COPIAS) {
  const desde = path.resolve('node_modules', origen);
  try {
    await fs.copyFile(desde, path.join(DESTINO, nombre));
    const { size } = await fs.stat(path.join(DESTINO, nombre));
    total += size;
    console.log(`  ${nombre.padEnd(32)} ${(size / 1024).toFixed(1).padStart(8)} KB`);
  } catch {
    console.error(`  ✗ falta ${origen} — corré npm install primero`);
    process.exitCode = 1;
  }
}
console.log(`  ${''.padEnd(32)} ${'────────'.padStart(8)}`);
console.log(`  ${'total'.padEnd(32)} ${(total / 1024).toFixed(1).padStart(8)} KB`);

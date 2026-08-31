/* Servidor estático mínimo para las pruebas de navegador. Sirve public/ tal
   cual, sin el runtime de Cloudflare: más liviano y no se cuelga. */
import http from 'http';
import fs from 'fs/promises';
import path from 'path';

const RAIZ = path.resolve('public');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jsx': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp' };

http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!f.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  try {
    const cuerpo = await fs.readFile(f);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
    res.end(cuerpo);
  } catch {
    /* Es una sola página: cualquier ruta desconocida devuelve la app. */
    res.writeHead(200, { 'content-type': TIPOS['.html'] }).end(await fs.readFile(path.join(RAIZ, 'index.html')));
  }
}).listen(8788, () => console.log('sirviendo public/ en http://127.0.0.1:8788'));

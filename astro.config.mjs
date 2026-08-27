import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { NEGOCIO } from "./src/data/config.js";

// https://astro.build/config
export default defineConfig({
  // El dominio final. Hace falta para que el mapa del sitio y los
  // enlaces de compartir salgan con la dirección correcta.
  site: NEGOCIO.sitio,

  // Sitio estático: se generan archivos HTML sueltos, que andan
  // en cualquier alojamiento (Hostinger, Cloudflare, Netlify).
  output: "static",

  integrations: [sitemap()],

  build: {
    // Genera /catalogo/esmaltes.html en vez de /catalogo/esmaltes/index.html.
    // Más cómodo si al final subimos por FTP a un hosting común.
    format: "file",
  },
});

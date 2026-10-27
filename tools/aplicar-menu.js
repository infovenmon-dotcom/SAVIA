#!/usr/bin/env node
/* Copia el menu principal (tools/menu.js) en las paginas estaticas que no
   genera generar-fichas.js: index, tienda, legales, guia... Idempotente:
   se puede volver a lanzar cada vez que cambie el menu.
       node tools/aplicar-menu.js                                        */
const fs = require('fs');
const path = require('path');
const { menuHTML } = require('./menu');
const RAIZ = path.join(__dirname, '..', 'docs');
const V = '20261027-2';

const estaticas = fs.readdirSync(RAIZ).filter(f => f.endsWith('.html') && f !== 'admin.html');
let n = 0;
for (const f of estaticas) {
  const ruta = path.join(RAIZ, f);
  let h = fs.readFileSync(ruta, 'utf8');
  const m = h.match(/([ \t]*)<nav class="nav-tienda[^"]*"[^>]*>[\s\S]*?<\/nav>/);
  if (!m) continue;
  // el menu trae <ul>/<div>: buscar el cierre del nav propio, no uno interior
  const ini = m.index + m[1].length;
  const finNav = h.indexOf('</nav>', h.indexOf('</ul>', ini) > 0 && h.slice(ini, ini + 40).includes('menu-nec') ? h.indexOf('</ul>', ini) : ini) + 6;
  h = h.slice(0, ini) + menuHTML(m[1]) + h.slice(finNav);
  if (!h.includes('/assets/js/menu.js')) h = h.replace('</body>', `  <script src="/assets/js/menu.js?v=${V}"></script>\n</body>`);
  h = h.replace(/\?v=20\d{6}-\d+/g, '?v=' + V);
  if (h.includes('>Guía Ritual de Calma</a>') && !h.includes('href="/rituales/"'))
    h = h.replace(/(\s*)(<a href="[^"]*ritual-de-calma"[^>]*>Guía Ritual de Calma<\/a>)/,
      '$1<a href="/rituales/">Rituales de 4 productos</a>$1<a href="/encuentra-tu-ritual/">Encuentra tu ritual</a>$1$2');
  fs.writeFileSync(ruta, h);
  n++;
}
console.log(`menu aplicado en ${n} paginas estaticas`);

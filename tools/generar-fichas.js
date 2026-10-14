#!/usr/bin/env node
/* Genera una pagina estatica por producto a partir de products.js.
   El precio y los datos viven SOLO en products.js: estas paginas se
   regeneran, no se editan a mano.
       node tools/generar-fichas.js                                     */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'docs');
const SITIO = 'https://saviadealma.com';

/* --- cargar el catalogo sin navegador --- */
const src = fs.readFileSync(path.join(RAIZ, 'assets/js/products.js'), 'utf8');
const window = {};
new Function('window', src)(window);
const DATA = window.SAVIA_DATA;
const PRODUCTOS = DATA.products;

/* Resenas reales de compradores de Amazon.es. Se muestran citando la
   fuente; NO se marcan con schema Review: el marcado de resenas propias
   en Product esta restringido por Google y aqui no aportaria nada. */
const win2 = {};
new Function('window', fs.readFileSync(path.join(RAIZ, 'assets/js/reviews.js'), 'utf8'))(win2);
const RESENAS = win2.SAVIA_RESENAS || {};

/* Un cosmetico no puede atribuirse el tratamiento o la curacion de una
   enfermedad (Reg. 1223/2009 y Reg. 655/2013). Una resena es del cliente,
   pero al destacarla en la ficha el claim pasa a ser de la marca. Por eso
   las que nombran patologias o curacion no se publican aqui. */
const CLAIM_MEDICO = /psoriasis|dermatitis|ecce?ma|eczema|alopecia|fungic|infecci|cur(a|o|ado)\b|milagro|brote|medicament/i;
function resenasPublicables(handle) {
  return (RESENAS[handle] || []).filter(rv => !CLAIM_MEDICO.test(rv.t));
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const abs = u => u && u.startsWith('http') ? u : SITIO + '/' + String(u || '').replace(/^\//, '');

const CABECERA = `  <div class="barra-fija">
    <header class="cabecera">
      <div class="cabecera-inner">
        <a class="logo" href="/index.html"><img class="logo-img" src="/assets/img/logo-negro.png" alt="Savia de Alma"></a>
        <nav class="nav-tienda">
          <a href="/index.html">Inicio</a>
          <a href="/tienda.html">Tienda</a>
          <a href="/index.html#contacto">Contacto</a>
        </nav>
        <button class="boton-carrito" onclick="abrirCarrito()">
          🛒 <span class="carrito-contador oculto" data-carrito-contador>0</span>
        </button>
      </div>
    </header>
  </div>`;

const PIE = `  <footer class="pie">
    <div class="contenedor pie-inner">
      <div class="pie-marca">
        <img class="pie-logo" src="/assets/img/logo-blanco.png" alt="Savia de Alma">
        <p>Cosmética sólida natural · Hecha a mano en España</p>
      </div>
      <nav class="pie-col">
        <h4>Mapa del sitio</h4>
        <a href="/index.html">Inicio</a>
        <a href="/tienda.html">Tienda</a>
        <a href="/index.html#contacto">Contacto</a>
      </nav>
      <nav class="pie-col">
        <h4>Legales</h4>
        <a href="/aviso-legal.html">Aviso legal</a>
        <a href="/condiciones-venta.html">Condiciones de venta</a>
        <a href="/privacidad.html">Privacidad y cookies</a>
        <a href="/envios.html">Envíos</a>
        <a href="/devoluciones.html">Devoluciones y desistimiento</a>
        <a href="/accesibilidad.html">Accesibilidad</a>
      </nav>
    </div>
    <small>© Savia de Alma</small>
  </footer>
  <div class="kit-digital">
    <img src="/assets/img/kit-digital.png" alt="Programa Kit Digital, financiado por los fondos Next Generation EU - Plan de Recuperación, Transformación y Resiliencia, Gobierno de España, red.es">
  </div>
  <div class="overlay" id="overlay" onclick="cerrarCarrito()"></div>
  <aside class="panel-carrito" id="panel-carrito" aria-label="Carrito">
    <div class="panel-cab">
      <h3>Tu carrito</h3>
      <button class="cerrar" onclick="cerrarCarrito()" aria-label="Cerrar">×</button>
    </div>
    <div class="panel-items" id="carrito-items"></div>
    <div class="panel-resumen" id="carrito-resumen"></div>
  </aside>
  <script src="/assets/js/products.js"></script>
  <script>
    /* products.js guarda las imagenes con ruta relativa ("assets/img/..").
       Desde /producto/<handle>/ eso apunta dentro de esta carpeta y el
       carrito pintaria miniaturas rotas. Se pasan a ruta absoluta antes
       de que cart.js lea el catalogo. */
    (function () {
      var d = window.SAVIA_DATA;
      if (!d || !d.products) return;
      var abs = function (u) {
        return (u && u[0] !== '/' && !/^https?:/.test(u)) ? '/' + u : u;
      };
      d.products.forEach(function (p) {
        p.image = abs(p.image);
        if (Array.isArray(p.images)) p.images = p.images.map(abs);
      });
    })();
  </script>
  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/cart.js"></script>
  <script src="/assets/js/checkout.js"></script>
  <script>
    /* La ficha no carga app.js (espera la rejilla de la tienda), asi que
       anade al carrito con la API de Carrito directamente. */
    function anadirDesdeFicha(handle) {
      if (!window.Carrito) { location.href = '/tienda.html?producto=' + handle; return; }
      Carrito.fijar(handle, (Carrito.items[handle] || 0) + 1);
      if (typeof abrirCarrito === 'function') abrirCarrito();
    }
  </script>
  <script src="/assets/js/accesibilidad.js"></script>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "55b5e0bbafb34a94bc832c5a8500b78d"}'></script>`;

function ficha(p) {
  const url = `${SITIO}/producto/${p.handle}/`;
  const sp = p.specs || {};
  const imgs = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
  const desc = (p.descripcion || p.short || '').trim();
  const metaDesc = (p.short || desc).slice(0, 155);

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    image: imgs.map(abs),
    brand: { '@type': 'Brand', name: 'Savia de Alma' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: Number(p.price).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Savia de Alma' },
    },
  };
  if (desc) jsonld.description = desc;
  if (p.sku) jsonld.sku = p.sku;
  if (p.collectionName || p.type) jsonld.category = p.collectionName || p.type;
  if (sp.peso) jsonld.weight = { '@type': 'QuantitativeValue', name: sp.peso };

  const migas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Tienda', item: SITIO + '/tienda.html' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url },
    ],
  };

  const li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('\n          ');
  const fila = (k, v) => v ? `<div class="ficha-dato"><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(p.title)} · Savia de Alma</title>
  <meta name="description" content="${esc(metaDesc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${esc(p.title)} · Savia de Alma">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(abs(imgs[0]))}">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <link rel="stylesheet" href="/assets/css/ficha.css">
  <link rel="icon" href="/assets/img/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <script type="application/ld+json">${JSON.stringify(migas)}</script>
</head>
<body>
${CABECERA}

  <main class="contenedor ficha">
    <nav class="ficha-migas" aria-label="Migas de pan">
      <a href="/index.html">Inicio</a> › <a href="/tienda.html">Tienda</a> › <span>${esc(p.title)}</span>
    </nav>

    <div class="ficha-grid">
      <div class="ficha-galeria">
        <img class="ficha-img-grande" src="/${esc(imgs[0])}" alt="${esc(p.title)}" width="800" height="800">
        ${imgs.slice(1).map(i => `<img class="ficha-img-mini" src="/${esc(i)}" alt="${esc(p.title)}" loading="lazy" width="200" height="200">`).join('\n        ')}
      </div>

      <div class="ficha-info">
        <p class="ficha-coleccion">${esc(p.collectionName || p.type || '')}</p>
        <h1>${esc(p.title)}</h1>
        ${p.lema ? `<p class="ficha-lema">${esc(p.lema)}</p>` : ''}
        <p class="ficha-precio">${Number(p.price).toFixed(2).replace('.', ',')} €</p>
        <p class="ficha-corta">${esc(p.short || '')}</p>
        <button class="btn btn-primario btn-bloque" onclick="anadirDesdeFicha('${p.handle}')">Añadir al carrito</button>
        <a class="btn btn-secundario btn-bloque" href="/tienda.html?producto=${encodeURIComponent(p.handle)}">Ver en la tienda</a>
        ${p.exclusiveWeb ? '<p class="ficha-nota">🌿 Exclusivo de la web</p>' : ''}
        ${(p.features && p.features.length) ? `<ul class="ficha-features">
          ${li(p.features)}
        </ul>` : ''}
      </div>
    </div>

    ${desc ? `<section class="ficha-bloque"><h2>Descripción</h2><p>${esc(desc)}</p></section>` : ''}

    ${(p.bullets && p.bullets.length) ? `<section class="ficha-bloque">
      <h2>Por qué te va a gustar</h2>
      <ul>
          ${li(p.bullets)}
      </ul>
    </section>` : ''}

    ${sp.indicado ? `<section class="ficha-bloque"><h2>Indicado para</h2><p>${esc(sp.indicado)}</p></section>` : ''}
    ${sp.modoUso ? `<section class="ficha-bloque"><h2>Modo de uso</h2><p>${esc(sp.modoUso)}</p></section>` : ''}

    <section class="ficha-bloque">
      <h2>Ficha técnica</h2>
      <dl class="ficha-datos">
        ${fila('Referencia', p.sku)}
        ${fila('Peso', sp.peso)}
        ${fila('Elaboración', sp.fabricacion)}
        ${fila('Registro CPNP', sp.cpnp)}
      </dl>
      ${sp.inci ? `<p class="ficha-inci"><strong>Ingredients:</strong> ${esc(sp.inci)}</p>` : ''}
    </section>

    ${resenasPublicables(p.handle).length ? `<section class="ficha-bloque ficha-resenas">
      <h2>⭐ Opiniones de clientes</h2>
      ${resenasPublicables(p.handle).map(rv => `<div class="fr-item">
        <div class="resena-estrellas">${'★'.repeat(rv.r || 5)}${'☆'.repeat(5 - (rv.r || 5))}</div>
        <p>“${esc(rv.t)}”</p>
        <cite>— ${esc(rv.n)}</cite>
      </div>`).join('\n      ')}
    </section>` : ''}

    <p class="ficha-volver"><a href="/tienda.html">← Ver todos los productos</a></p>
  </main>

${PIE}
</body>
</html>
`;
}

/* --- escribir fichas --- */
let n = 0;
for (const p of PRODUCTOS) {
  const dir = path.join(RAIZ, 'producto', p.handle);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), ficha(p));
  n++;
}

/* --- sitemap: paginas fijas + una por producto --- */
const FIJAS = ['/', '/tienda.html', '/envios.html', '/devoluciones.html',
  '/condiciones-venta.html', '/aviso-legal.html', '/privacidad.html', '/accesibilidad.html'];
const hoy = new Date().toISOString().slice(0, 10);
const urls = [
  ...FIJAS.map(u => ({ loc: SITIO + u, pri: u === '/' ? '1.0' : '0.6' })),
  ...PRODUCTOS.map(p => ({ loc: `${SITIO}/producto/${p.handle}/`, pri: '0.8' })),
];
fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${hoy}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n')
  + `\n</urlset>\n`);

/* --- llms.txt: resumen legible por asistentes de IA --- */
const noVeg = PRODUCTOS.filter(p => p.vegano === false).map(p => p.title);
fs.writeFileSync(path.join(RAIZ, 'llms.txt'),
`# Savia de Alma

> Cosmetica solida natural y artesanal, hecha a mano en Espana.
> Cruelty free, sin plastico y zero waste.

Tienda oficial: ${SITIO}/tienda.html

## Sobre la marca
- ${PRODUCTOS.length} productos: jabones, champus solidos, acondicionadores,
  desodorantes, exfoliantes, limpiadores faciales, depilacion y afeitado.
- Elaboracion artesanal en Espana, saponificacion en frio.
- Cruelty free. ${PRODUCTOS.length - noVeg.length} de ${PRODUCTOS.length} productos son veganos.
- NO son veganos: ${noVeg.join('; ')}.
- Envio a peninsula desde la web. Venta en Amazon.es para el resto de Europa.

## Productos
${PRODUCTOS.map(p => `- [${p.title}](${SITIO}/producto/${p.handle}/): ${p.short || ''} ${Number(p.price).toFixed(2)} EUR`).join('\n')}
`);

console.log(`${n} fichas generadas`);
console.log(`sitemap.xml con ${urls.length} URLs`);
console.log(`llms.txt escrito (${PRODUCTOS.length - noVeg.length}/${PRODUCTOS.length} veganos)`);

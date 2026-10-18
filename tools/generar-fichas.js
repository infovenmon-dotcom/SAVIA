#!/usr/bin/env node
/* Genera una pagina estatica por producto a partir de products.js.
   El precio y los datos viven SOLO en products.js: estas paginas se
   regeneran, no se editan a mano.
       node tools/generar-fichas.js                                     */
const fs = require('fs');
const path = require('path');
const { seoDe } = require('./seo-fichas');

const RAIZ = path.join(__dirname, '..', 'docs');
const SITIO = 'https://saviadealma.com';

/* Sello de version de los assets: al cambiar un .js o .css hay que
   subirlo, o los navegadores siguen sirviendo la copia en cache. */
const V = '20261016-25';

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

/* Paginas por familia (textos en tools/familias.js). */
const FAMILIAS = require('./familias.js')
  .filter(f => PRODUCTOS.some(p => p.collection === f.coleccion));
const FAMILIA_DE = Object.fromEntries(FAMILIAS.map(f => [f.coleccion, f]));

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
        <a href="/ritual-de-calma">Guía Ritual de Calma</a>
      </nav>
      <nav class="pie-col">
        <h4>Productos</h4>
        ${FAMILIAS.map(f => `<a href="/${f.ruta}/">${esc(f.h1)}</a>`).join('\n        ')}
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
  <script src="/assets/js/products.js?v=${V}"></script>
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
  <script src="/assets/js/precios.js?v=${V}"></script>
  <script src="/assets/js/cart.js?v=${V}"></script>
  <script src="/assets/js/checkout.js?v=${V}"></script>
  <script>
    /* La ficha no carga app.js (espera la rejilla de la tienda), asi que
       anade al carrito con la API de Carrito directamente. */
    function anadirDesdeFicha(handle) {
      if (!window.Carrito) { location.href = '/tienda.html?producto=' + handle; return; }
      Carrito.fijar(handle, (Carrito.items[handle] || 0) + 1);
      if (typeof abrirCarrito === 'function') abrirCarrito();
    }
  </script>
  <script src="/assets/js/ficha.js?v=${V}"></script>
  <script src="/assets/js/accesibilidad.js"></script>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "55b5e0bbafb34a94bc832c5a8500b78d"}'></script>`;

/* Envio y devoluciones para Google (Fichas de comerciantes). Reflejan
   envios.html, devoluciones.html y las tarifas del Worker (stripe/worker.js:
   ENVIO_GRATIS_DESDE / ENVIO_PENINSULA / ENVIO_BALEARES). Si cambian alli,
   cambiarlas aqui tambien. La tarifa es la de comprar solo ese producto. */
const ENVIO = { gratisDesde: 20, peninsula: 3.95, baleares: 6 };
function envioSchema(precio) {
  const tarifa = (coste) => ({ '@type': 'MonetaryAmount', value: (precio >= ENVIO.gratisDesde ? 0 : coste).toFixed(2), currency: 'EUR' });
  const plazo = (min, max) => ({
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitCode: 'DAY' },
  });
  return [
    { '@type': 'OfferShippingDetails', shippingRate: tarifa(ENVIO.peninsula),
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'ES' }, deliveryTime: plazo(1, 2) },
    { '@type': 'OfferShippingDetails', shippingRate: tarifa(ENVIO.baleares),
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'ES', addressRegion: 'IB' }, deliveryTime: plazo(2, 3) },
  ];
}
const DEVOLUCION_SCHEMA = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'ES',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
  merchantReturnLink: SITIO + '/devoluciones.html',
};

function ficha(p) {
  const url = `${SITIO}/producto/${p.handle}/`;
  const sp = p.specs || {};
  const imgs = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
  const desc = (p.descripcion || p.short || '').trim();
  const seo = seoDe(p);
  const metaDesc = seo ? seo.desc : (p.short || desc).slice(0, 155);
  const tituloSeo = seo ? seo.titulo : p.title;

  // Los "Proximamente" se anuncian sin precio: una Offer sin price es un dato
  // invalido para Google, asi que en esos casos no se emite oferta ninguna.
  const conPrecio = typeof p.price === 'number' && isFinite(p.price) && p.price > 0;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    image: imgs.map(abs),
    brand: { '@type': 'Brand', name: 'Savia de Alma' },
  };
  if (conPrecio) {
    jsonld.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: Number(p.price).toFixed(2),
      availability: p.proximamente
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Savia de Alma' },
      shippingDetails: envioSchema(Number(p.price)),
      hasMerchantReturnPolicy: DEVOLUCION_SCHEMA,
    };
  }
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
      ...(FAMILIA_DE[p.collection]
        ? [{ '@type': 'ListItem', position: 3, name: FAMILIA_DE[p.collection].h1, item: `${SITIO}/${FAMILIA_DE[p.collection].ruta}/` },
           { '@type': 'ListItem', position: 4, name: p.title, item: url }]
        : [{ '@type': 'ListItem', position: 3, name: p.title, item: url }]),
    ],
  };

  const li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('\n          ');
  const fila = (k, v) => v ? `<div class="ficha-dato"><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(tituloSeo)} | Savia de Alma</title>
  <meta name="description" content="${esc(metaDesc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${esc(tituloSeo)} | Savia de Alma">
  <meta property="og:description" content="${esc(metaDesc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(abs(imgs[0]))}">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/ficha.css?v=${V}">
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
      <a href="/index.html">Inicio</a> › <a href="/tienda.html">Tienda</a> ›${FAMILIA_DE[p.collection] ? ` <a href="/${FAMILIA_DE[p.collection].ruta}/">${esc(FAMILIA_DE[p.collection].h1)}</a> ›` : ''} <span>${esc(p.title)}</span>
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
        ${p.destacado ? `<p class="ficha-destacado">${esc(p.destacado)}</p>` : ''}
        ${p.guia ? `<p class="ficha-guia"><a href="${esc(p.guia.url)}">${esc(p.guia.texto)}</a></p>` : ''}
        ${conPrecio
          ? `<p class="ficha-precio" id="ficha-precio" data-handle="${p.handle}">${Number(p.price).toFixed(2).replace('.', ',')} €</p>`
          : `<p class="ficha-precio ficha-sin-precio" id="ficha-precio" data-handle="${p.handle}">Precio por confirmar</p>`}
        <p class="ficha-corta">${esc(p.short || '')}</p>
        ${(p.colores && p.colores.length > 1) ? `<div class="ficha-colores">
          <span class="fc-eti">Color</span>
          <div class="fc-opciones">
            ${p.colores.map(c => {
              const otro = PRODUCTOS.find(x => x.handle === c.handle);
              const img = otro ? '/' + otro.image : '';
              return c.handle === p.handle
                ? `<span class="fc-op fc-activa" aria-current="true">
                     <img src="${esc(img)}" alt="${esc(c.nombre)}" width="56" height="56">
                     <small>${esc(c.nombre)}</small></span>`
                : `<a class="fc-op" href="/producto/${esc(c.handle)}/">
                     <img src="${esc(img)}" alt="${esc(c.nombre)}" width="56" height="56" loading="lazy">
                     <small>${esc(c.nombre)}</small></a>`;
            }).join('\n            ')}
          </div>
        </div>` : ''}
        ${p.proximamente
          ? `<button class="btn btn-secundario btn-bloque" disabled>Próximamente</button>
        <p class="ficha-nota">Estamos preparando este producto. Apúntate a la newsletter y te avisamos.</p>`
          : `<button class="btn btn-primario btn-bloque" id="ficha-comprar" onclick="anadirDesdeFicha('${p.handle}')">Añadir al carrito</button>
        <a class="btn btn-secundario btn-bloque" href="/tienda.html?producto=${encodeURIComponent(p.handle)}">Ver en la tienda</a>`}
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

    ${(p.indicado || sp.indicado) ? `<section class="ficha-bloque"><h2>Indicado para</h2><p>${esc(p.indicado || sp.indicado)}</p></section>` : ''}
    ${(p.modoUso || sp.modoUso) ? `<section class="ficha-bloque"><h2>Modo de uso</h2><p>${esc(p.modoUso || sp.modoUso)}</p></section>` : ''}
    ${p.precauciones ? `<section class="ficha-bloque ficha-precauciones"><h2>Precauciones</h2><p>${esc(p.precauciones)}</p></section>` : ''}

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

    <section class="ficha-bloque ficha-resenas" id="opiniones-web" data-handle="${p.handle}" hidden></section>

    <p class="ficha-volver"><a href="/tienda.html">← Ver todos los productos</a></p>
  </main>

${PIE}
</body>
</html>
`;
}

/* --- paginas por familia --- */
function paginaFamilia(f) {
  const url = `${SITIO}/${f.ruta}/`;
  const prods = PRODUCTOS.filter(p => p.collection === f.coleccion);
  const vendibles = prods.filter(p => !p.proximamente);
  const orden = [...vendibles, ...prods.filter(p => p.proximamente)];
  const conPrecio = p => typeof p.price === 'number' && isFinite(p.price) && p.price > 0;
  const lista = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: f.h1,
    description: f.meta,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: orden.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}/producto/${p.handle}/`, name: p.title })),
    },
  };
  const migas = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Tienda', item: SITIO + '/tienda.html' },
      { '@type': 'ListItem', position: 3, name: f.h1, item: url },
    ],
  };
  const tarjeta = p => `
        <article class="familia-card">
          <a class="familia-img" href="/producto/${p.handle}/"><img src="/${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" width="400" height="400"></a>
          <h3><a href="/producto/${p.handle}/">${esc(p.title)}</a></h3>
          ${(p.lema && !CLAIM_MEDICO.test(p.lema)) ? `<p class="familia-lema">${esc(p.lema)}</p>` : ''}
          ${conPrecio(p)
            ? `<p class="familia-precio" data-precio-handle="${p.handle}">${Number(p.price).toFixed(2).replace('.', ',')} €</p>`
            : '<p class="familia-precio">Precio por confirmar</p>'}
          ${p.proximamente
            ? '<button class="btn btn-secundario btn-sm btn-bloque" disabled>Próximamente</button>'
            : `<button class="btn btn-primario btn-sm btn-bloque" data-comprar-handle="${p.handle}" onclick="anadirDesdeFicha('${p.handle}')">Añadir al carrito</button>`}
        </article>`;
  const otras = FAMILIAS.filter(x => x !== f);
  /* "Combina con": familias o productos complementarios (campo relacionadas
     de familias.js). 'producto:<handle>' enlaza a una ficha suelta, para las
     familias de un solo producto (sales de Epsom, cera). */
  const combina = (f.relacionadas || []).map(r => {
    if (r.startsWith('producto:')) {
      const p = PRODUCTOS.find(x => x.handle === r.slice(9));
      return p ? `<a href="/producto/${p.handle}/">${esc(p.title)}</a>` : '';
    }
    const o = FAMILIAS.find(x => x.coleccion === r);
    return o ? `<a href="/${o.ruta}/">${esc(o.h1)}</a>` : '';
  }).filter(Boolean);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(f.titulo)} · Savia de Alma</title>
  <meta name="description" content="${esc(f.meta)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(f.titulo)} · Savia de Alma">
  <meta property="og:description" content="${esc(f.meta)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(abs(orden[0].image))}">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${V}">
  <link rel="stylesheet" href="/assets/css/ficha.css?v=${V}">
  <link rel="icon" href="/assets/img/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <script type="application/ld+json">${JSON.stringify(lista)}</script>
  <script type="application/ld+json">${JSON.stringify(migas)}</script>
</head>
<body>
${CABECERA}

  <main class="contenedor ficha familia">
    <nav class="ficha-migas" aria-label="Migas de pan">
      <a href="/index.html">Inicio</a> › <a href="/tienda.html">Tienda</a> › <span>${esc(f.h1)}</span>
    </nav>

    <header class="familia-cab">
      <h1>${esc(f.h1)}</h1>
      ${f.intro.map(t => `<p>${esc(t)}</p>`).join('\n      ')}
    </header>

    <section class="familia-grid" aria-label="${esc(f.h1)}">${orden.map(tarjeta).join('')}
    </section>

    ${(f.elegir && f.elegir.length) ? `<section class="ficha-bloque">
      <h2>Cómo elegir</h2>
      <ul>
        ${f.elegir.map(t => `<li>${esc(t)}</li>`).join('\n        ')}
      </ul>
    </section>` : ''}

    ${f.uso ? `<section class="ficha-bloque"><h2>Cómo se usa</h2><p>${esc(f.uso)}</p></section>` : ''}

    ${(f.preguntas && f.preguntas.length) ? `<section class="ficha-bloque familia-faq">
      <h2>Preguntas frecuentes</h2>
      ${f.preguntas.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </section>` : ''}

    ${combina.length ? `<section class="ficha-bloque">
      <h2>Combina con</h2>
      <p class="familia-otras">${combina.join(' · ')}</p>
    </section>` : ''}

    <section class="ficha-bloque">
      <h2>Más cosmética sólida</h2>
      <p class="familia-otras">${otras.map(o => `<a href="/${o.ruta}/">${esc(o.h1)}</a>`).join(' · ')}</p>
    </section>

    <p class="ficha-volver"><a href="/tienda.html">← Ver toda la tienda</a></p>
  </main>

${PIE}
</body>
</html>
`;
}
for (const f of FAMILIAS) {
  const dir = path.join(RAIZ, f.ruta);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), paginaFamilia(f));
}

/* --- escribir fichas --- */
let n = 0;
for (const p of PRODUCTOS) {
  const dir = path.join(RAIZ, 'producto', p.handle);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), ficha(p));
  n++;
}

/* --- indice estatico de productos dentro de tienda.html ---
   La rejilla de la tienda la pinta app.js en el navegador. Este indice va
   ya escrito en el HTML (dentro de #catalogo, que app.js sustituye al
   cargar), para que Google y cualquier navegador sin JavaScript encuentren
   un enlace normal a la ficha de cada producto. */
{
  const ruta = path.join(RAIZ, 'tienda.html');
  const html = fs.readFileSync(ruta, 'utf8');
  const INI = '<!-- INDICE-PRODUCTOS:INICIO -->', FIN = '<!-- INDICE-PRODUCTOS:FIN -->';
  const a = html.indexOf(INI), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('tienda.html: faltan los marcadores del indice de productos');
  const cols = (DATA.collections || []).map(col => {
    const items = PRODUCTOS.filter(p => p.collection === col.slug);
    if (!items.length) return '';
    const fam = FAMILIA_DE[col.slug];
    const h2 = fam ? `<a href="/${fam.ruta}/">${esc(col.name)}</a>` : esc(col.name);
    return `\n    <section class="seccion contenedor indice-coleccion">\n      <h2>${h2}</h2>\n      <ul>\n`
      + items.map(p => `        <li><a href="/producto/${p.handle}/">${esc(p.title)}</a></li>`).join('\n')
      + `\n      </ul>\n    </section>`;
  }).join('');
  const rutas = `\n    <script>window.SAVIA_FAMILIAS = ${JSON.stringify(Object.fromEntries(FAMILIAS.map(f => [f.coleccion, { ruta: '/' + f.ruta + '/', nombre: f.h1 }])))};</script>`;
  fs.writeFileSync(ruta, html.slice(0, a + INI.length) + rutas + cols + '\n  ' + html.slice(b));
}

/* --- sitemap: paginas fijas + una por producto --- */
const FIJAS = ['/', '/tienda.html', '/envios.html', '/devoluciones.html',
  '/condiciones-venta.html', '/aviso-legal.html', '/privacidad.html', '/accesibilidad.html',
  '/ritual-de-calma'];
const hoy = new Date().toISOString().slice(0, 10);
const urls = [
  ...FIJAS.map(u => ({ loc: SITIO + u, pri: u === '/' ? '1.0' : '0.6' })),
  ...FAMILIAS.map(f => ({ loc: `${SITIO}/${f.ruta}/`, pri: '0.9' })),
  ...PRODUCTOS.map(p => ({ loc: `${SITIO}/producto/${p.handle}/`, pri: '0.8' })),
];
fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${hoy}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n')
  + `\n</urlset>\n`);

/* --- llms.txt: resumen legible por asistentes de IA --- */
/* Solo los cosmeticos: en un cepillo o una jabonera la pregunta vegano/no
   vegano no aplica, y afirmarlo sin saberlo seria inventarselo. */
const COSMETICOS = PRODUCTOS.filter(p => p.collection !== 'accesorios');
const noVeg = COSMETICOS.filter(p => p.vegano === false).map(p => p.title);
fs.writeFileSync(path.join(RAIZ, 'llms.txt'),
`# Savia de Alma

> Cosmetica solida natural y artesanal, hecha a mano en Espana.
> Cruelty free, sin plastico y zero waste.

Tienda oficial: ${SITIO}/tienda.html

## Sobre la marca
- ${PRODUCTOS.length} productos: jabones, champus solidos, acondicionadores,
  desodorantes, exfoliantes, limpiadores faciales, depilacion y afeitado.
- Elaboracion artesanal en Espana, saponificacion en frio.
- Cruelty free. ${COSMETICOS.length - noVeg.length} de ${COSMETICOS.length} cosmeticos son veganos.
- NO son veganos: ${noVeg.join('; ')}.
- Envio a peninsula desde la web. Venta en Amazon.es para el resto de Europa.

## Productos
${PRODUCTOS.map(p => {
  const precio = (typeof p.price === 'number' && isFinite(p.price) && p.price > 0)
    ? ` ${Number(p.price).toFixed(2)} EUR`
    : ' Proximamente, precio sin confirmar.';
  return `- [${p.title}](${SITIO}/producto/${p.handle}/): ${p.short || ''}${precio}`;
}).join('\n')}
`);

console.log(`${n} fichas generadas`);
console.log(`${FAMILIAS.length} paginas de familia`);
console.log(`sitemap.xml con ${urls.length} URLs`);
console.log(`llms.txt escrito (${PRODUCTOS.length - noVeg.length}/${PRODUCTOS.length} veganos)`);

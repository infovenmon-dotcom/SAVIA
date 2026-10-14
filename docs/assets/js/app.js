/* ===========================================================================
   SAVIA DE ALMA — Renderizado de catalogo (tienda + landing) + ficha producto
   =========================================================================== */

const DATA = window.SAVIA_DATA;

/* Corrige ñ y tildes SOLO en texto visible de producto (los datos vienen en
   ASCII). No se aplica a handles, clases ni claves: únicamente a lo que se
   muestra. */
const _ACC = {
  espana:'españa',espanol:'español',espanola:'española',espanoles:'españoles',
  manana:'mañana',nino:'niño',ninos:'niños',nina:'niña',ninas:'niñas',
  pequeno:'pequeño',pequena:'pequeña',pequenos:'pequeños',pequenas:'pequeñas',
  diseno:'diseño',disenos:'diseños',bano:'baño',banos:'baños',ano:'año',anos:'años',
  compania:'compañía',senal:'señal',senales:'señales',tamano:'tamaño',otono:'otoño',
  montana:'montaña',anadir:'añadir',anade:'añade',acompana:'acompaña',
  cosmetica:'cosmética',cosmeticas:'cosméticas',cosmetico:'cosmético',cosmeticos:'cosméticos',
  solida:'sólida',solidas:'sólidas',solido:'sólido',solidos:'sólidos',
  champu:'champú',champus:'champús',jabon:'jabón',limon:'limón',algodon:'algodón',
  carbon:'carbón',karite:'karité',argan:'argán',cafeina:'cafeína',indigo:'índigo',
  betaina:'betaína',monoi:'monoï',bambu:'bambú',arbol:'árbol',arboles:'árboles',
  mas:'más',dia:'día',dias:'días',tambien:'también',ademas:'además',aqui:'aquí',asi:'así',
  segun:'según',facil:'fácil',rapido:'rápido',rapida:'rápida',ultimo:'último',ultima:'última',
  unico:'único',unica:'única',numero:'número',linea:'línea',formula:'fórmula',formulas:'fórmulas',
  ecologico:'ecológico',ecologica:'ecológica',ecologicos:'ecológicos',organico:'orgánico',
  organica:'orgánica',quimica:'química',quimico:'químico',quimicos:'químicos',
  toxico:'tóxico',toxicos:'tóxicos',energia:'energía',garantia:'garantía',minimo:'mínimo',
  maximo:'máximo',practico:'práctico',practica:'práctica',basico:'básico',aromatico:'aromático',
  alergenos:'alérgenos'
};
const _ACC_PAIRS = [];
function _cap(w){ return w.charAt(0).toUpperCase() + w.slice(1); }
Object.keys(_ACC).sort((a, b) => b.length - a.length).forEach(function (a) {
  var b = _ACC[a];
  _ACC_PAIRS.push([new RegExp('\\b' + a + '\\b', 'g'), b]);
  _ACC_PAIRS.push([new RegExp('\\b' + _cap(a) + '\\b', 'g'), _cap(b)]);
  _ACC_PAIRS.push([new RegExp('\\b' + a.toUpperCase() + '\\b', 'g'), b.toUpperCase()]);
});
function acc(s) {
  if (!s || typeof s !== 'string') return s;
  for (var i = 0; i < _ACC_PAIRS.length; i++) s = s.replace(_ACC_PAIRS[i][0], _ACC_PAIRS[i][1]);
  s = s.replace(/([A-Za-zÁÉÍÓÚáéíóúñ])cion\b/g, '$1ción').replace(/([A-Za-zÁÉÍÓÚáéíóúñ])CION\b/g, '$1CIÓN');
  s = s.replace(/([A-Za-zÁÉÍÓÚáéíóúñ])sion\b/g, '$1sión');
  s = s.replace(/Arbol de Te\b/g, 'Árbol de Té').replace(/\bde Te\b/g, 'de Té')
       .replace(/\bTe Verde\b/g, 'Té Verde').replace(/\bTe Matcha\b/g, 'Té Matcha');
  return s;
}

/* ---------- Disponibilidad / stock / modo vacaciones (config.js) ---------- */
function _cfg() { return window.SAVIA_CONFIG || {}; }
function enVacaciones() { return !!_cfg().modoVacaciones; }
/* Unidades en stock segun config: numero si esta definido, null si no se controla. */
function stockDe(handle) {
  const s = _cfg().stock || {};
  return Object.prototype.hasOwnProperty.call(s, handle) ? Number(s[handle]) : null;
}
function estaAgotado(p) {
  if (p.proximamente) return true; // "Próximamente": no vendible aún
  if (enVacaciones()) return true;
  if ((_cfg().agotados || []).indexOf(p.handle) !== -1) return true;
  const n = stockDe(p.handle);
  return n !== null && !(n > 0); // stock 0 (o negativo/invalido) => agotado
}

/* ---------- Precio efectivo y ofertas (config.js / panel) ----------
   precioDe(p)       -> precio actual (override en config.precios si existe).
   precioAntesDe(p)  -> precio anterior tachado SOLO si hay oferta valida
                        (config.ofertas[handle] mayor que el precio actual),
                        en caso contrario null.
   El servidor de pago (Stripe) recalcula el cobro con estos mismos precios,
   por lo que el navegador nunca decide el importe final. */
/* % de descuento por familia (config.descuentosCategoria), 0 si no hay. */
function _dtoCategoria(p) {
  const dc = _cfg().descuentosCategoria || {};
  const pct = Number(dc[p.collection]);
  return (isFinite(pct) && pct > 0 && pct < 100) ? pct : 0;
}
/* Precio base (antes del descuento por categoría): respeta el override de precios. */
function _precioBase(p) {
  const o = _cfg().precios || {};
  const v = Object.prototype.hasOwnProperty.call(o, p.handle) ? Number(o[p.handle]) : p.price;
  return (isFinite(v) && v >= 0) ? v : p.price;
}
function precioDe(p) {
  const base = _precioBase(p);
  const pct = _dtoCategoria(p);
  return pct ? Math.round(base * (1 - pct / 100) * 100) / 100 : base;
}
function precioAntesDe(p) {
  const ahora = precioDe(p);
  // 1) Oferta explícita por producto (config.ofertas) tiene prioridad.
  const o = _cfg().ofertas || {};
  if (Object.prototype.hasOwnProperty.call(o, p.handle)) {
    const antes = Number(o[p.handle]);
    if (isFinite(antes) && antes > ahora) return antes;
  }
  // 2) Descuento por categoría: el "antes" es el precio base sin descuento.
  if (_dtoCategoria(p)) {
    const base = _precioBase(p);
    if (base > ahora) return base;
  }
  return null;
}
function dtoPorcentaje(antes, ahora) {
  return Math.max(1, Math.round((1 - ahora / antes) * 100));
}
/* Los productos anunciados como "Proximamente" todavia no tienen precio:
   se publican sin cifra hasta que se decide, y nunca se pueden comprar. */
function tienePrecio(p) {
  const v = precioDe(p);
  return typeof v === 'number' && isFinite(v) && v > 0;
}

/* Bloque de precio reutilizable: con oferta muestra precio anterior tachado,
   precio actual y % de descuento; sin oferta, solo el precio.
   Sin precio todavia, un texto neutro en su lugar. */
function bloquePrecio(p, { grande = false } = {}) {
  const style0 = grande ? ' style="font-size:1.1rem"' : '';
  if (!tienePrecio(p)) {
    return `<div class="card-precio sin-precio"${style0}>Precio por confirmar</div>`;
  }
  const ahora = precioDe(p);
  const antes = precioAntesDe(p);
  const style = grande ? ' style="font-size:1.4rem"' : '';
  if (antes !== null) {
    return `<div class="card-precio tiene-oferta"${style}>`
      + `<span class="precio-antes">${eur(antes)}</span> `
      + `<span class="precio-ahora">${eur(ahora)}</span> `
      + `<span class="precio-dto">-${dtoPorcentaje(antes, ahora)}%</span> `
      + `<small>IVA incl.</small></div>`;
  }
  return `<div class="card-precio"${style}>${eur(ahora)} <small>IVA incl.</small></div>`;
}

/* Tarjeta de producto. Web-exclusivos => solo "Anadir al carrito".
   Resto (en Amazon) => "Anadir al carrito" + "Ver en Amazon". */
function cardProducto(p, { compacta = false } = {}) {
  const agotado = estaAgotado(p);
  const _antes = precioAntesDe(p);
  const enOferta = !agotado && _antes !== null;
  const etiqueta = p.proximamente
    ? '<span class="etiqueta dorada">Próximamente</span>'
    : (agotado && !enVacaciones())
    ? '<span class="etiqueta agotado">Agotado</span>'
    : (enOferta
        ? `<span class="etiqueta oferta">-${dtoPorcentaje(_antes, precioDe(p))}%</span>`
        : (p.exclusiveWeb
            ? '<span class="etiqueta dorada">Exclusivo web</span>'
            : (p.bestSeller ? '<span class="etiqueta">Más vendido</span>' : '')));

  // Amazon SOLO en modo vacaciones: queremos que la compra normal se haga en la web.
  const amazonVer = (enVacaciones() && !p.exclusiveWeb) ?
    `<a class="btn btn-amazon btn-sm btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>` : '';

  const desc = compacta ? '' : `<p class="card-desc">${acc(p.indicado || p.short)}</p>`;

  let acciones;
  if (agotado) {
    acciones = ((enVacaciones() && !p.exclusiveWeb)
      ? `<a class="btn btn-amazon btn-sm btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Comprar en Amazon</a>`
      : `<button class="btn btn-secundario btn-sm btn-bloque" disabled>${p.proximamente ? 'Próximamente' : (enVacaciones() ? 'Volvemos pronto' : 'Agotado')}</button>`)
      + `<button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>`;
  } else {
    acciones = `<button class="btn btn-primario btn-sm btn-bloque" onclick="addToCart('${p.handle}')">Añadir al carrito</button>
          <button class="btn btn-secundario btn-sm btn-bloque" onclick="abrirFicha('${p.handle}')">Ver detalles</button>
          ${amazonVer}`;
  }

  return `
    <article class="card${agotado ? ' es-agotado' : ''}" data-handle="${p.handle}" data-collection="${p.collection}">
      <button class="card-img" onclick="abrirFicha('${p.handle}')" aria-label="Ver detalles de ${acc(p.title)}">
        ${etiqueta}
        <img src="${p.image}" alt="${acc(p.title)}" loading="lazy">
      </button>
      <div class="card-cuerpo">
        <h3>${acc(p.title)}</h3>
        ${desc}
        ${bloquePrecio(p)}
        <div class="card-acciones">
          ${acciones}
        </div>
      </div>
    </article>`;
}

/* Anade al carrito SIN salir de la pagina (estilo comercial): avisa con un
   toast y deja seguir comprando. La cesta se abre con el boton del carrito. */
function addToCart(handle) {
  const _p = DATA.products.find(x => x.handle === handle);
  if (_p && estaAgotado(_p)) {
    if (typeof mostrarAvisoFlotante === 'function') {
      const msg = _p.proximamente ? 'Muy pronto disponible'
        : (enVacaciones() && !_p.exclusiveWeb ? 'Estamos de vacaciones · cómpralo en Amazon'
        : 'Producto agotado temporalmente');
      mostrarAvisoFlotante(msg);
    }
    return;
  }
  Carrito.añadir(handle, 1);
  if (typeof mostrarAvisoFlotante === 'function') {
    mostrarAvisoFlotante('🛒 Añadido a la cesta · sigue comprando');
  }
  // Pequeno latido en el contador del carrito como feedback visual.
  // Si Motion esta disponible, usa un muelle; si no, la animacion CSS.
  document.querySelectorAll('[data-carrito-contador]').forEach(c => {
    if (typeof window.__motionPop === 'function') {
      window.__motionPop(c);
    } else {
      c.classList.remove('pulso');
      void c.offsetWidth; // reinicia la animacion
      c.classList.add('pulso');
    }
  });
}

/* ---------- Sonido opcional del video del hero ----------
   El video arranca en mudo (obligatorio para autoplay). Este boton permite
   al usuario activar/silenciar el sonido tras su primer gesto. */
function toggleHeroSound() {
  const v = document.querySelector('.hero-video');
  const b = document.getElementById('hero-sound');
  if (!v) return;
  v.muted = !v.muted;
  if (!v.muted) {
    v.volume = 1;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
    if (b) { b.textContent = '🔊'; b.setAttribute('aria-label', 'Silenciar'); b.classList.add('activo'); }
  } else if (b) {
    b.textContent = '🔇';
    b.setAttribute('aria-label', 'Activar sonido');
    b.classList.remove('activo');
  }
}

/* ---------- Newsletter ----------
   Envía el email al Worker (/subscribe), que guarda el lead y manda el correo
   de bienvenida. Si no hay endpoint o falla la red, igualmente confirmamos al
   usuario (no le hacemos esperar ni ver errores). */
function suscribirNewsletter(e) {
  e.preventDefault();
  const f = e.target;
  const ok = document.getElementById('newsletter-ok');
  const email = ((f && f.email && f.email.value) || '').trim();
  const ep = ((window.SAVIA_CONFIG || {}).checkoutEndpoint || '').trim().replace(/\/+$/, '');
  if (f) f.style.display = 'none';
  if (ok) ok.hidden = false;
  if (ep && email) {
    fetch(ep + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => { /* sin conexión: no molestamos al usuario */ });
  }
  return false;
}

/* Formulario de contacto. Sin backend muestra confirmacion; para recibir los
   mensajes de verdad, conecta el form a Formspree/Brevo (action + method POST). */
function enviarContacto(e) {
  e.preventDefault();
  const f = e.target;
  const ok = document.getElementById('contacto-ok');
  if (f) f.style.display = 'none';
  if (ok) ok.hidden = false;
  return false;
}

/* ---------- Ficha de producto (modal con beneficios + modo de uso) ---------- */
/* "Combina con": productos que COMPLEMENTAN de verdad al que miras (no relleno).
   Champú → acondicionador + jabonera pequeña; jabón → jabonera + bolsa de sisal;
   depilación → bolsa de sisal (evita vello enquistado); accesorio → jabones estrella. */
const COMBINA_COL = {
  champus:          ['acondicionador-coco', 'jabonera-pequena'],
  acondicionadores: ['champu-cafeina-canela', 'jabonera-pequena'],
  jabones:          ['jabonera-bambu', 'esponja-exfoliante'],
  exfoliantes:      ['jabonera-bambu', 'esponja-exfoliante'],
  depilacion:       ['esponja-exfoliante', 'jabonera-bambu'],
  desodorantes:     ['jabon-naranja-canela', 'esponja-exfoliante'],
  faciales:         ['jabonera-pequena', 'jabon-arbol-te'],
  afeitado:         ['jabonera-bambu', 'esponja-exfoliante'],
  ceras:            ['champu-cafeina-canela', 'jabonera-pequena'],
  accesorios:       ['jabon-lavanda', 'jabon-karite'],
};
/* La leche de cabra y la de burra son los dos unicos jabones no veganos del
   catalogo. Se venden igual, pero no se recomiendan: quien llega buscando
   cosmetica vegana no debe encontrarselos sugeridos. */
function recomendable(p) {
  return !!p && p.vegano !== false;
}

/* ---------- Venta cruzada por categoria ----------
   Al abrir una pestana de la tienda, debajo de sus productos aparece
   "Completa tu rutina con...": piezas de OTRAS categorias que de verdad
   acompanan a lo que esta mirando. A diferencia de COMBINA_COL (ficha de
   producto), aqui SI entran los "Proximamente": sirven para anunciarlos.
   Regla: nada de la propia categoria, y lo agotado no se ensena. */
const CROSS_COL = {
  champus:          ['acondicionador-coco', 'cepillo-pelo-madera', 'jabonera-pequena'],
  acondicionadores: ['champu-cafeina-canela', 'cepillo-pelo-madera', 'jabonera-pequena'],
  jabones:          ['jabonera-metalica', 'jabonera-bambu', 'esponja-exfoliante'],
  exfoliantes:      ['esponja-konjac', 'esponja-exfoliante', 'jabonera-bambu'],
  depilacion:       ['esponja-exfoliante', 'sales-epsom-500', 'jabonera-bambu'],
  desodorantes:     ['jabon-naranja-canela', 'neceser-blanco', 'esponja-exfoliante'],
  faciales:         ['esponja-konjac', 'cepillo-facial', 'set-contorno-facial', 'jabonera-pequena'],
  afeitado:         ['kit-afeitado-completo', 'kit-afeitado', 'jabonera-metalica', 'esponja-exfoliante'],
  ceras:            ['champu-cafeina-canela', 'cepillo-pelo-madera', 'jabonera-pequena'],
  accesorios:       ['jabon-lavanda', 'champu-cafeina-canela', 'espuma-afeitar-avellana'],
  'sales-epsom':    ['jabon-lavanda', 'esponja-exfoliante', 'jabonera-metalica'],
};
function crossDeColeccion(slug) {
  const out = [];
  for (const h of (CROSS_COL[slug] || [])) {
    const x = DATA.products.find(y => y.handle === h);
    if (!x || x.collection === slug || out.includes(x)) continue;
    if (!recomendable(x)) continue;
    // Agotado de verdad, no; "proximamente" si, que para eso se anuncia.
    if (estaAgotado(x) && !x.proximamente) continue;
    out.push(x);
  }
  return out.slice(0, 4);
}
/* Bloque que se cuelga al final de cada seccion de la tienda. */
function bloqueCross(slug) {
  const items = crossDeColeccion(slug);
  if (!items.length) return '';
  return `
          <div class="cross-rutina">
            <h3 class="cross-titulo">🌿 Completa tu rutina con&hellip;</h3>
            <div class="grid-productos">
              ${items.map(x => cardProducto(x, { compacta: true })).join('')}
            </div>
          </div>`;
}

/* Excepciones por producto: cuando el argumento de venta de una pieza SON
   otros productos concretos, mandan estos y no los de su categoria.
   La jabonera de acero tiene hueco para tres pastillas: el que la mira tiene
   que ver cuales tres. */
/* La jabonera no vende un trio cerrado: vende tener tres jabones a mano.
   Por eso se propone un momento (calma / despertar / limpieza a fondo) y
   dentro de cada uno va rotando el jabon sugerido, para que no parezca un
   lote fijo. Rota por dia, no al azar, para que no baile en cada recarga. */
const TRIO_JABONERA = [
  ['jabon-lavanda', 'jabon-karite', 'jabon-cbd'],
  ['jabon-pepita-uva', 'jabon-naranja-canela'],
  ['jabon-arbol-te', 'jabon-carbon-activo'],
];
function trioJabonera() {
  const dia = Math.floor(Date.now() / 86400000);
  return TRIO_JABONERA.map((grupo, i) => grupo[(dia + i) % grupo.length]);
}
const COMBINA_PROD = {
  // Los tres jabones del dia, y debajo la base de bambu que recoge el agua:
  // es la pareja que sale en las fotos del producto.
  'jabonera-metalica': () => trioJabonera().concat('jabonera-bambu'),
};
function relacionadosDe(p) {
  const def = COMBINA_PROD[p.handle];
  const handles = (typeof def === 'function' ? def() : def) || COMBINA_COL[p.collection] || [];
  const out = [];
  for (const h of handles) {
    if (h === p.handle) continue;
    const x = DATA.products.find(y => y.handle === h);
    if (x && recomendable(x) && !estaAgotado(x) && !x.proximamente && !out.includes(x)) out.push(x);
  }
  return out.slice(0, 4);
}
function _precioTxt(p) { return tienePrecio(p) ? precioDe(p).toFixed(2).replace('.', ',') + ' €' : ''; }

function abrirFicha(handle) {
  const p = DATA.products.find(x => x.handle === handle);
  if (!p) return;
  const cont = document.getElementById('ficha-contenido');
  if (!cont) return;

  const _antesFicha = precioAntesDe(p);
  const etiqueta = p.proximamente
    ? '<span class="etiqueta dorada" style="position:static;display:inline-block">Próximamente</span>'
    : _antesFicha !== null
    ? `<span class="etiqueta oferta" style="position:static;display:inline-block">-${dtoPorcentaje(_antesFicha, precioDe(p))}%</span>`
    : (p.exclusiveWeb
        ? '<span class="etiqueta dorada" style="position:static;display:inline-block">Exclusivo web</span>'
        : (p.bestSeller ? '<span class="etiqueta" style="position:static;display:inline-block">Más vendido</span>' : ''));

  // Amazon SOLO en modo vacaciones.
  const amazon = (enVacaciones() && !p.exclusiveWeb) ?
    `<a class="btn btn-amazon btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Ver en Amazon</a>` : '';

  const features = (p.features || []).map(f => `<li>${acc(f)}</li>`).join('');

  // Galeria de imagenes (principal + miniaturas)
  const imgs = (p.images && p.images.length) ? p.images : [p.image];
  const thumbs = imgs.length > 1
    ? `<div class="ficha-thumbs">${imgs.map((src, i) =>
        `<button class="ficha-thumb${i === 0 ? ' activo' : ''}" onclick="selFichaImg(this,'${src}')" aria-label="Imagen ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join('')}</div>`
    : '';
  const galeria = `<div class="ficha-galeria">
      <div class="ficha-img"><img id="ficha-main-img" src="${imgs[0]}" alt="${p.title}"></div>
      ${thumbs}
    </div>`;

  // Bullets tipo Amazon (puntos clave)
  const bullets = (p.bullets || []).map(b => `<li>${acc(b)}</li>`).join('');
  const bulletsBlock = bullets
    ? `<ul class="ficha-bullets">${bullets}</ul>`
    : '';

  const s = p.specs || {};
  const specsRows = [
    s.peso ? `<div class="ficha-spec"><span>Formato</span><span>${acc(s.peso)}</span></div>` : '',
    s.natural ? `<div class="ficha-spec"><span>Naturalidad</span><span>${acc(s.natural)}</span></div>` : '',
    s.cpnp ? `<div class="ficha-spec"><span>Registro CPNP</span><span>${s.cpnp}</span></div>` : '',
    s.fabricacion ? `<div class="ficha-spec"><span>Fabricación</span><span>${acc(s.fabricacion)}</span></div>` : '',
  ].join('');
  const specsBlock = (specsRows || s.inci) ? `
      <div class="ficha-bloque">
        <h4>📋 Especificaciones</h4>
        ${specsRows}
        ${s.inci ? `<div class="ficha-inci"><strong>Ingredientes (INCI):</strong> ${s.inci}</div>` : ''}
        ${s.inci ? `<div class="ficha-transparencia">🌿 <strong>Transparencia total:</strong> declaramos el 100% de los ingredientes, incluidos los alérgenos del perfume aunque la ley no obligue a listarlos en concentraciones tan bajas. Nada que esconder.</div>` : ''}
      </div>` : '';

  // Reseñas del producto
  const reviews = (window.SAVIA_RESENAS && window.SAVIA_RESENAS[p.handle]) || [];
  const reviewsBlock = reviews.length ? `
      <div class="ficha-resenas">
        <h4>⭐ Opiniones de clientes</h4>
        ${reviews.map(rv => `<div class="fr-item">
          <div class="resena-estrellas">${'★'.repeat(rv.r || 5)}${'☆'.repeat(5 - (rv.r || 5))}</div>
          <p>"${acc(rv.t)}"</p>
          <cite>— ${acc(rv.n)}</cite>
        </div>`).join('')}
      </div>` : '';

  // "Combina con" — cross-sell coherente
  const rel = relacionadosDe(p);
  const combinaBlock = rel.length ? `
      <div class="ficha-bloque">
        <h4>🌿 Combina con</h4>
        <div class="ficha-combina">
          ${rel.map(x => `
            <div class="combina-item">
              <button class="combina-img" onclick="abrirFicha('${x.handle}')" aria-label="Ver ${acc(x.title)}"><img src="${(x.images && x.images[0]) || x.image}" alt="" loading="lazy"></button>
              <button class="combina-nom" onclick="abrirFicha('${x.handle}')">${acc(x.title)}</button>
              <div class="combina-precio">${_precioTxt(x)}</div>
              <button class="btn btn-secundario btn-sm" onclick="addToCart('${x.handle}')">Añadir</button>
            </div>`).join('')}
        </div>
      </div>` : '';

  const _agotado = estaAgotado(p);
  const acciones = `
      <div class="ficha-acciones">
        ${_agotado
          ? ((enVacaciones() && !p.exclusiveWeb)
              ? `<a class="btn btn-amazon btn-bloque" href="${DATA.amazonStore}" target="_blank" rel="noopener">Comprar en Amazon</a>`
              : `<button class="btn btn-secundario btn-bloque" disabled>${p.proximamente ? 'Próximamente' : (enVacaciones() ? 'Volvemos pronto' : 'No disponible temporalmente')}</button>`)
          : `<button class="btn btn-primario btn-bloque" onclick="addToCart('${p.handle}'); cerrarFicha();">Añadir al carrito</button>
        ${amazon}`}
      </div>`;

  /* Estos sellos hablan de NUESTRA cosmetica: artesanal, hecha en Espana y
     sin envase. En una rejilla de acero o un cepillo comprados fuera serian
     falsos, asi que ahi no se ensenan. Lo mismo con "vegano": en un accesorio
     no sabemos de que son las cerdas, y afirmarlo seria inventarselo. */
  const esCosmetico = p.collection !== 'accesorios' && p.collection !== 'sales-epsom';
  const sellos = esCosmetico ? [
    ['🤲', 'Artesanal'],
    ['🇪🇸', 'Hecho en España'],
    ['🌿', 'Origen natural'],
    ['♻️', 'Sin envase'],
    ['🐰', 'Cruelty free'],
  ] : [];
  if (esCosmetico && p.vegano !== false) sellos.push(['🌱', 'Vegano']);
  const sellosBlock = sellos.length ? `<div class="ficha-sellos">${sellos.map(([e, t]) =>
    `<span class="sello"><span class="sello-ico">${e}</span>${t}</span>`).join('')}</div>` : '';

  cont.innerHTML = `
    ${galeria}
    <div class="ficha-info">
      <div class="ficha-cabecera">
        <span class="ficha-coleccion">${acc(p.collectionName)}</span>
        ${etiqueta}
      </div>
      <h2>${acc(p.title)}</h2>
      ${bloquePrecio(p, { grande: true })}
      ${(!_agotado && !p.proximamente) ? '<p class="ficha-envio">🚚 Envío en 24/48&nbsp;h · Gratis desde 20&nbsp;€</p>' : ''}
      <p class="ficha-desc">${acc(p.descripcion || p.short)}</p>
      ${sellosBlock}
      ${bulletsBlock}
      ${acciones}

      ${p.indicado ? `<div class="ficha-bloque"><h4>✨ Para qué es bueno</h4><p>${acc(p.indicado)}</p></div>` : ''}
      ${p.modoUso ? `<div class="ficha-bloque"><h4>💧 Modo de uso</h4><p>${acc(p.modoUso)}</p></div>` : ''}
      ${features ? `<div class="ficha-bloque"><h4>🌿 Características</h4><ul class="ficha-features">${features}</ul></div>` : ''}
      ${specsBlock}
      ${reviewsBlock}
      ${combinaBlock}

      ${p.lema ? `<p class="ficha-lema">${acc(p.lema)}</p>` : ''}
    </div>`;

  document.getElementById('ficha-overlay')?.classList.add('abierto');
  document.getElementById('panel-ficha')?.classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

/* Cambia la imagen principal de la ficha al pulsar una miniatura. */
function selFichaImg(btn, src) {
  const main = document.getElementById('ficha-main-img');
  if (main) main.src = src;
  const cont = btn.parentNode;
  cont.querySelectorAll('.ficha-thumb').forEach(t => t.classList.remove('activo'));
  btn.classList.add('activo');
}

function cerrarFicha() {
  document.getElementById('ficha-overlay')?.classList.remove('abierto');
  document.getElementById('panel-ficha')?.classList.remove('abierto');
  document.body.style.overflow = '';
}

/* ---------- Tienda completa ---------- */
function renderTienda() {
  const cont = document.getElementById('catalogo');
  if (!cont) return;

  cont.innerHTML = DATA.collections.map(col => {
    const items = DATA.products.filter(p => p.collection === col.slug);
    const badge = col.exclusiveWeb ? ' <span class="etiqueta dorada" style="position:static;display:inline-block;vertical-align:middle">Exclusivo web</span>' : '';
    return `
      <section class="seccion" id="col-${col.slug}">
        <div class="contenedor">
          <h2 class="seccion-titulo">${acc(col.name)}${badge}</h2>
          <p class="seccion-sub">${col.count} producto(s)</p>
          <div class="grid-productos">
            ${items.map(p => cardProducto(p)).join('')}
          </div>
${bloqueCross(col.slug)}
        </div>
      </section>`;
  }).join('');

  // Chips de filtro
  const chips = document.getElementById('chips-categorias');
  if (chips) {
    chips.innerHTML =
      `<button class="chip activo" data-filtro="all">Todo</button>` +
      DATA.collections.map(c => `<button class="chip" data-filtro="${c.slug}">${acc(c.name)}</button>`).join('');
    chips.addEventListener('click', e => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      chips.querySelectorAll('.chip').forEach(c => c.classList.remove('activo'));
      btn.classList.add('activo');
      const f = btn.dataset.filtro;
      document.querySelectorAll('[id^="col-"]').forEach(sec => {
        sec.classList.toggle('oculto', f !== 'all' && sec.id !== 'col-' + f);
      });
      // Llevar la vista a los productos de esa categoría (si no, parece vacío).
      const destino = (f !== 'all')
        ? document.getElementById('col-' + f)
        : (document.getElementById('catalogo') || document.querySelector('[id^="col-"]'));
      if (destino) {
        const barra = document.querySelector('.barra-fija');
        const off = (barra ? barra.offsetHeight : 0) + 10;
        const y = destino.getBoundingClientRect().top + window.scrollY - off;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    });
  }
}

/* Vuelve arriba, a los chips de categorías, para elegir otra sección rápido
   (lo usa el enlace "Productos" del menú de la tienda). */
function irACategorias() {
  const destino = document.getElementById('chips-categorias') || document.getElementById('catalogo');
  if (!destino) return;
  const barra = document.querySelector('.barra-fija');
  const off = (barra ? barra.offsetHeight : 0) + 10;
  const y = destino.getBoundingClientRect().top + window.scrollY - off;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}
window.irACategorias = irACategorias;

/* Lleva a la seccion de newsletter (regalo de bienvenida) dejandola POR DEBAJO
   de la barra fija. Su altura cambia segun el mensaje del banner rotativo, asi
   que se mide en el momento, igual que en irACategorias(). Desde la tienda
   (que no tiene esa seccion) salta a la landing. */
function irAlRegalo() {
  const destino = document.getElementById('newsletter');
  if (!destino) { window.location.href = 'index.html#newsletter'; return; }
  const barra = document.querySelector('.barra-fija');
  const off = (barra ? barra.offsetHeight : 0) + 10;
  const y = destino.getBoundingClientRect().top + window.scrollY - off;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}
window.irAlRegalo = irAlRegalo;

/* ---------- Landing: 6 mas vendidos ---------- */
function renderLandingBestSellers() {
  const cont = document.getElementById('best-sellers');
  if (!cont) return;
  const best = DATA.products.filter(p => p.bestSeller);
  cont.innerHTML = best.map(p => cardProducto(p, { compacta: true })).join('');
}

/* ---------- Landing: botones de categoria ---------- */
function renderLandingCategorias() {
  const cont = document.getElementById('landing-categorias');
  if (!cont) return;
  cont.innerHTML = DATA.collections.map(c =>
    `<a class="cat-boton" href="tienda.html#col-${c.slug}">
       <span>${acc(c.name)}</span>
       <span class="flecha">${c.count} →</span>
     </a>`).join('');
}

/* ---------- Scroll-reveal: aparicion sutil al entrar en pantalla ----------
   Revela bloques de seccion y tarjetas con un leve desplazamiento (ease-out)
   y un pequeno escalonado. Respeta prefers-reduced-motion: si el usuario pide
   menos movimiento, no observamos nada y el contenido queda visible. */
function initReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const selector = [
    '.landing-seccion', '.regalo-bienvenida', '.savia-final', '.cta-final',
    '.historia', '.seccion', '.card', '.beneficio',
    '.impacto', '.newsletter'
  ].join(',');

  const elementos = Array.from(document.querySelectorAll(selector))
    // Evita marcar como reveal un contenedor y, dentro, sus propias tarjetas
    // dos veces: las tarjetas se animan solas con su escalonado.
    .filter(el => !el.closest('.panel-ficha'));

  elementos.forEach(el => el.classList.add('reveal'));

  // Sin IntersectionObserver (navegador muy antiguo): mostrar todo.
  if (!('IntersectionObserver' in window)) {
    elementos.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver((entradas, observer) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      // Escalonado para grupos de tarjetas dentro de una misma rejilla
      const grid = el.closest('.grid-productos, .grid-beneficios');
      if (grid && (el.classList.contains('card') || el.classList.contains('beneficio'))) {
        const hermanos = Array.from(grid.children);
        const i = hermanos.indexOf(el);
        el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
      }
      el.classList.add('is-visible');
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  elementos.forEach(el => obs.observe(el));

  // Se exponen para que la capa Motion (motion-enhance.js) pueda tomar el
  // relevo con animaciones de muelle si la libreria llega a cargar.
  window.__revealObserver = obs;
  window.__revealItems = elementos;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarFicha(); });

/* Aviso de modo vacaciones (banda arriba del todo) */
function mostrarAvisoVacaciones() {
  if (!enVacaciones() || document.querySelector('.vacaciones-aviso')) return;
  const av = document.createElement('div');
  av.className = 'vacaciones-aviso';
  av.innerHTML = '🌴 Estamos de vacaciones. Mientras tanto, puedes comprar nuestros productos en '
    + `<a href="${DATA.amazonStore}" target="_blank" rel="noopener">nuestra tienda de Amazon</a>.`;
  document.body.insertBefore(av, document.body.firstChild);
}

/* Carga la config EN VIVO desde el panel (Cloudflare Worker) y la fusiona sobre
   la de config.js. Así, lo que cambies en /admin (precio, stock, ofertas,
   vacaciones) sale al instante. Si no hay endpoint o falla la red, se usa la
   config local de config.js (la web nunca se queda en blanco). */
async function cargarConfigRemota() {
  const ep = (_cfg().checkoutEndpoint || '').trim();
  if (!ep) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(ep.replace(/\/+$/, '') + '/config', { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return;
    const remoto = await r.json();
    if (remoto && typeof remoto === 'object') {
      // checkoutEndpoint y demás ajustes locales se conservan.
      window.SAVIA_CONFIG = Object.assign({}, window.SAVIA_CONFIG, remoto);
    }
  } catch (e) { /* sin conexión: seguimos con la config local de config.js */ }
}

/* Al volver del pago de Stripe, la URL trae ?pago=ok o ?pago=cancelado.
   - ok        -> damos las gracias y vaciamos la cesta (el pedido ya está hecho).
   - cancelado -> avisamos sin vaciar (la cesta se conserva).
   Después limpiamos el parámetro para que no se repita al recargar. */
function gestionarRetornoPago() {
  const params = new URLSearchParams(window.location.search);
  const pago = params.get('pago');
  if (!pago) return;
  params.delete('pago');
  const limpia = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
  history.replaceState({}, '', limpia);

  if (pago === 'ok') {
    if (window.Carrito) { Carrito.items = {}; Carrito.guardar(); Carrito.render(); }
    if (typeof cerrarCarrito === 'function') cerrarCarrito();
    mostrarModalGracias();
  } else if (pago === 'cancelado') {
    if (typeof mostrarAvisoFlotante === 'function') mostrarAvisoFlotante('Has cancelado el pago · tu cesta sigue guardada 🛒');
  }
}

function mostrarModalGracias() {
  if (document.querySelector('.gracias-overlay')) return;
  const ov = document.createElement('div');
  ov.className = 'gracias-overlay';
  ov.innerHTML = `
    <div class="gracias-modal" role="dialog" aria-modal="true" aria-label="Compra realizada">
      <img class="gracias-img" src="assets/img/savia-arbol.jpg" alt="Árbol con una gota de savia">
      <div class="gracias-cuerpo">
        <h2>¡Gracias por tu compra!</h2>
        <p class="gracias-lema">Gracias por dejarnos cuidar de ti y del planeta. 🌍💚</p>
        <p>Hemos recibido tu pedido. Te enviaremos la confirmación y el seguimiento a tu correo electrónico.</p>
        <button class="btn btn-primario btn-bloque" onclick="cerrarGracias()">Seguir comprando</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
}
function cerrarGracias() {
  document.querySelector('.gracias-overlay')?.remove();
  document.body.style.overflow = '';
}

/* Banner superior rotativo: alterna el mensaje 4x3/envío con el gancho de
   captación (10% en la 1ª compra + regalo). Cada 5 s, con fundido suave. */
function iniciarBannerRotativo() {
  const b = document.querySelector('.banner-promo');
  if (!b) return;
  const slides = [
    b.innerHTML.trim(),
    '👋 ¿Aún no nos conoces? Te lo ponemos fácil: <strong>10&nbsp;% en tu 1.ª compra</strong> <span class="banner-envio">+ jabonera y bolsa de sisal de regalo 🎁</span>',
  ];
  if (slides.length < 2) return;
  let i = 0;
  b.style.transition = 'opacity .4s ease';
  setInterval(() => {
    if (document.hidden) return; // no rotar con la pestaña en segundo plano
    b.style.opacity = '0';
    setTimeout(() => { i = (i + 1) % slides.length; b.innerHTML = slides[i]; b.style.opacity = '1'; }, 400);
  }, 5000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarConfigRemota();
  mostrarAvisoVacaciones();
  renderTienda();
  renderLandingBestSellers();
  renderLandingCategorias();
  initReveal();
  iniciarBannerRotativo();
  // Re-render del carrito con la config ya fusionada (precios/ofertas).
  if (window.Carrito && typeof Carrito.render === 'function') Carrito.render();
  // Mensaje de gracias / cancelación al volver de Stripe.
  gestionarRetornoPago();
  // Si se llega desde la tienda con #newsletter, recolocar bajo la barra fija.
  if (location.hash === '#newsletter') setTimeout(irAlRegalo, 350);
  // Si se llega desde una ficha de producto (/producto/<handle>/) con
  // ?producto=<handle>, abrir ese producto directamente.
  abrirProductoDeLaURL();
});

/* Las fichas estaticas enlazan a tienda.html?producto=<handle>.
   Al llegar, abrimos ese producto y limpiamos el parametro. */
function abrirProductoDeLaURL() {
  const handle = new URLSearchParams(location.search).get('producto');
  if (!handle) return;
  const existe = DATA && DATA.products && DATA.products.some(p => p.handle === handle);
  if (!existe || typeof abrirFicha !== 'function') return;
  setTimeout(() => {
    abrirFicha(handle);
    const u = new URL(location.href);
    u.searchParams.delete('producto');
    history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
  }, 300);
}

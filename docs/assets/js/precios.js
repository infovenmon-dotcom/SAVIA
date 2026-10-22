/* ===========================================================================
   SAVIA DE ALMA — Disponibilidad y precios (compartido)
   Lo usan la tienda (app.js) y las fichas /producto/<handle>/, para que el
   precio, las ofertas y los agotados sean los mismos en todas partes y los
   mismos que cobra el servidor de pago. Se carga ANTES de cart.js/app.js.
   =========================================================================== */

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
/* ---------- Campaña temporal (Black Friday) ----------
   Descuento en el CARRITO (no cambia el precio de la ficha, para no romper la
   paridad con Amazon). Mismas fechas y % que stripe/worker.js (CAMPANA): el
   servidor recalcula el cobro, así que el navegador nunca decide el importe.
   Durante la campaña: no se aceptan otros códigos y no hay regalo de bienvenida.
   El Worker puede mandar otra en /config (campana) o desactivarla (activa:false). */
const CAMPANA_DEF = {
  id: 'BLACKFRIDAY2026', nombre: 'Black Friday', pct: 20,
  desde: '2026-11-20T00:00:00+01:00', hasta: '2026-12-01T00:00:00+01:00',
};
function campanaActiva(ahora) {
  const c = _cfg().campana || CAMPANA_DEF;
  if (!c || c.activa === false) return null;
  let t = ahora || Date.now();
  // Solo en local, para revisar la campaña antes de tiempo: ?campana=prueba
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]campana=prueba/.test(location.search)) return c;
  } catch (e) { /* sin location */ }
  return (t >= Date.parse(c.desde) && t < Date.parse(c.hasta)) ? c : null;
}
/* Precio por unidad DENTRO del carrito: el de la ficha con la campaña aplicada.
   No se acumula con el descuento por familia: se usa el mayor de los dos. */
function precioCarritoDe(p) {
  const c = campanaActiva();
  if (!c) return precioDe(p);
  const base = _precioBase(p);
  const pct = Math.max(_dtoCategoria(p), Number(c.pct) || 0);
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}
/* Durante la campaña: cambia la barra promo y oculta el botón de regalo. */
document.addEventListener('DOMContentLoaded', function () {
  const c = campanaActiva();
  if (!c) return;
  document.documentElement.classList.add('en-campana');
  document.querySelectorAll('.banner-promo').forEach(function (b) {
    b.innerHTML = '<strong>🖤 ' + c.nombre.toUpperCase() + ' · −' + c.pct + ' % EN TODO + 4×3</strong><span class="bp-extra"> · hasta −40 %</span> ' +
      '<span class="banner-envio">🚚 ENVÍO GRATIS desde 20&nbsp;€</span><span class="bp-extra"> · Hasta el 30 de noviembre</span>';
  });
  document.querySelectorAll('.btn-regalo').forEach(function (b) { b.style.display = 'none'; });
  // Portada: franjas diagonales del Black Friday sobre el vídeo.
  const hero = document.querySelector('.hero-con-video .hero-inner');
  if (hero && !document.querySelector('.bf-franjas')) {
    const f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';
    document.head.appendChild(f);
    const rep = new Array(8).fill('<span>BLACK FRIDAY</span><i>✦</i>').join('');
    const bloque = document.createElement('div');
    bloque.className = 'bf-franjas';
    bloque.innerHTML =
      '<div class="bf-cinta bf-tras" aria-hidden="true"><div class="bf-marquee">' + rep + rep + '</div></div>' +
      '<div class="bf-cinta bf-delante">' +
        '<p class="bf-titulo">BLACK FRIDAY</p>' +
        '<p class="bf-grande"><small>HASTA</small> −40%</p>' +
        '<p class="bf-hasta"><b>−' + c.pct + '% EN TODO + 4×3</b> · DEL 20 AL 30 DE NOVIEMBRE</p>' +
      '</div>';
    const logo = hero.querySelector('.hero-logo');
    if (logo && logo.nextSibling) hero.insertBefore(bloque, logo.nextSibling); else hero.prepend(bloque);
    const cta = hero.querySelector('.btn-primario');
    if (cta) { cta.textContent = 'Aprovecha el Black Friday'; cta.classList.add('bf-cta'); }
  }
});

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

/* Trae del servidor la config en vivo del panel (precios, ofertas, agotados,
   vacaciones) y la mezcla con la local de config.js. */
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

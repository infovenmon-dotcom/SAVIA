/* ===========================================================================
   SAVIA DE ALMA — Carrito + promociones
   Reglas (espejo de la configuracion de Shopify):
     - 4x3 · POR CADA 4 PRODUCTOS, 1 GRATIS: el de menor precio del pedido.
       Escalable: 4 art. = 1 gratis, 8 = 2 gratis, 12 = 3 gratis...
     - Envio: Peninsula 3,95 EUR y Baleares 6 EUR. Gratis desde 20 EUR (ambas zonas).
     - Los precios YA incluyen IVA 21% (no se anaden impuestos).
   =========================================================================== */

const ENVIO_GRATIS_DESDE = 20;
const ENVIO_TOLERANCIA = 0.10; // se queda corto por <=0,10 € tras el 4x3 -> asumimos la diferencia y damos envío gratis
const ENVIO_PENINSULA = 3.95;
const ENVIO_BALEARES = 6;
const GRUPO_GRATIS = 4; // 4x3: por cada 4 unidades, la mas barata es gratis
const STORAGE_KEY = 'savia_carrito';
const CP_KEY = 'savia_cp';
const COD_KEY = 'savia_codigo';

/* Código postal del cliente para calcular el envío por zona. */
let CP = '';
try { CP = localStorage.getItem(CP_KEY) || ''; } catch { CP = ''; }
function zonaPorCP(cp) {
  cp = String(cp || '').trim();
  if (!/^\d{5}$/.test(cp)) return null;
  const p = cp.slice(0, 2);
  if (p === '07') return 'baleares';
  if (p === '35' || p === '38' || p === '51' || p === '52') return 'no';
  return 'peninsula';
}
function fijarCP(v) {
  CP = String(v || '').replace(/\D/g, '').slice(0, 5);
  try { localStorage.setItem(CP_KEY, CP); } catch { /* */ }
  // Solo re-dibujamos cuando el CP está completo (5) o se ha vaciado, para NO
  // perder el foco de la casilla mientras se teclea dígito a dígito.
  if (window.Carrito && (CP.length === 5 || CP.length === 0)) Carrito.render();
}
window.fijarCP = fijarCP;
window.savia_getCP = function () { return CP; };

/* Precio efectivo de una unidad: usa precioDe() (ofertas/override de app.js)
   si esta disponible; si no, el precio base del producto. */
function _precioCarrito(p) {
  return (typeof precioDe === 'function') ? precioDe(p) : p.price;
}

/* ---------- Medición del recorrido de compra (embudo) ----------
   Cuenta pasos (visita, añadir al carrito, abrir el carrito, pulsar pagar,
   errores del pago, compra hecha) para saber dónde se quedan los clientes.
   Es anónimo: no usa cookies, ni identificadores, ni datos personales; solo
   envía el nombre del paso, si es móvil u ordenador y la página. Los
   contadores se ven en el panel /admin, pestaña "Embudo". */
/* ---------- De dónde viene el visitante (para saber qué canal vende) ----------
   Se guarda en este navegador 30 días: la etiqueta utm_source de los enlaces
   (correos de Brevo, newsletter, influencers...) o, si no hay, la web desde la
   que llegó (Google, Instagram...). Una nueva etiqueta utm sustituye a la
   anterior. No identifica a nadie: solo el nombre del canal. */
function _saviaRefCanal(host) {
  if (!host) return '';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/instagram\./.test(host)) return 'instagram';
  if (/(facebook|fb)\./.test(host)) return 'facebook';
  if (/tiktok\./.test(host)) return 'tiktok';
  if (/bing\./.test(host)) return 'bing';
  if (/amazon\./.test(host)) return 'amazon';
  if (/(mail|outlook|gmail)\./.test(host)) return 'email';
  return host.slice(0, 30);
}
function saviaCanal() {
  const limpio = v => String(v || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
  try {
    const q = new URLSearchParams(location.search);
    let o = null;
    try { o = JSON.parse(localStorage.getItem('savia_canal') || 'null'); } catch (e) { o = null; }
    if (o && (Date.now() - (o.t || 0)) > 30 * 86400000) o = null;
    const utm = limpio(q.get('utm_source'));
    if (utm || !o) {
      let host = '';
      try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { host = ''; }
      if (/saviadealma\.(com|es)$/.test(host)) host = '';
      o = { s: utm || limpio(_saviaRefCanal(host)) || 'directo', c: limpio(q.get('utm_campaign')), t: Date.now() };
      try { localStorage.setItem('savia_canal', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ }
    }
    return o;
  } catch (err) { return { s: 'directo', c: '' }; }
}
window.saviaCanal = saviaCanal;

function saviaEvento(e, extra) {
  try {
    const ep = (window.SAVIA_CONFIG && (window.SAVIA_CONFIG.checkoutEndpoint || '').trim()) || '';
    if (!ep) return;
    const movil = !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
    const body = JSON.stringify(Object.assign({ e: e, m: movil ? 1 : 0, p: location.pathname, o: saviaCanal().s }, extra || {}));
    const url = ep.replace(/\/+$/, '') + '/evento';
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    else fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
  } catch (err) { /* medir nunca debe romper la tienda */ }
}
window.saviaEvento = saviaEvento;

/* Una "visita" por sesión del navegador (no por página vista). */
(function () {
  try {
    if (sessionStorage.getItem('savia_visita')) return;
    sessionStorage.setItem('savia_visita', '1');
  } catch (err) { /* sin sessionStorage: contamos igualmente */ }
  saviaEvento('visita');
})();

const Carrito = {
  items: {}, // handle -> qty
  codigo: null, // { code, pct, amountOff } — código de descuento validado

  cargar() {
    try { this.items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { this.items = {}; }
    try { this.codigo = JSON.parse(localStorage.getItem(COD_KEY)) || null; }
    catch { this.codigo = null; }
  },
  guardar() {
    // Con el almacenamiento bloqueado (Safari con cookies bloqueadas, algunos
    // navegadores dentro de apps) setItem lanza un error y antes eso impedía
    // añadir al carrito. La cesta sigue funcionando en esta página igualmente.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); }
    catch (err) { /* almacenamiento no disponible */ }
  },
  guardarCodigo() {
    try {
      if (this.codigo) localStorage.setItem(COD_KEY, JSON.stringify(this.codigo));
      else localStorage.removeItem(COD_KEY);
    } catch { /* almacenamiento no disponible */ }
  },
  producto(handle) {
    return window.SAVIA_DATA.products.find(p => p.handle === handle);
  },
  /* Lo que el carrito no acepta: sin precio no se puede cobrar, y un
     "proximamente" tiene precio pero todavia no esta a la venta. Antes
     bastaba con mirar el precio porque los proximamente no lo tenian;
     al ponerselo, ese filtro dejo de proteger nada. */
  vendible(handle) {
    const p = this.producto(handle);
    if (!p || p.proximamente) return false;
    if (typeof estaAgotado === 'function' && estaAgotado(p)) return false;
    const v = _precioCarrito(p);
    return typeof v === 'number' && isFinite(v) && v > 0;
  },
  añadir(handle, n = 1) {
    if (n > 0 && !this.vendible(handle)) return;
    if (n > 0) saviaEvento('carrito_anadir');
    this.items[handle] = (this.items[handle] || 0) + n;
    if (this.items[handle] <= 0) delete this.items[handle];
    this.guardar();
    this.render();
  },
  fijar(handle, n) {
    if (n > 0 && !this.vendible(handle)) return;
    if (n > (this.items[handle] || 0)) saviaEvento('carrito_anadir');
    if (n <= 0) delete this.items[handle];
    else this.items[handle] = n;
    this.guardar();
    this.render();
  },
  quitar(handle) {
    delete this.items[handle];
    this.guardar();
    this.render();
  },
  totalUnidades() {
    return Object.values(this.items).reduce((a, b) => a + b, 0);
  },

  /* Calcula subtotal, unidades gratis (1 por cada 4) y totales. */
  calcular() {
    // Lista plana de precios, una entrada por unidad.
    const precios = [];
    const lineas = [];
    for (const [handle, qty] of Object.entries(this.items)) {
      const p = this.producto(handle);
      if (!p) continue;
      lineas.push({ p, qty });
      for (let i = 0; i < qty; i++) precios.push(_precioCarrito(p));
    }
    const unidades = precios.length;
    const subtotal = precios.reduce((a, b) => a + b, 0);

    // Por cada 4 productos, 1 gratis (el mas barato del pedido).
    const gratisCount = Math.floor(unidades / GRUPO_GRATIS);
    const ordenados = [...precios].sort((a, b) => a - b);
    let ahorroPromo = 0;
    for (let i = 0; i < gratisCount; i++) ahorroPromo += ordenados[i];

    // Marca que unidades son el regalo: las mas baratas del pedido.
    const unidadesOrden = [];
    for (const { p, qty } of lineas) for (let i = 0; i < qty; i++) unidadesOrden.push(p.handle);
    unidadesOrden.sort((a, b) => _precioCarrito(this.producto(a)) - _precioCarrito(this.producto(b)));
    const freeByHandle = {};
    for (let i = 0; i < gratisCount; i++) {
      const h = unidadesOrden[i];
      freeByHandle[h] = (freeByHandle[h] || 0) + 1;
    }

    const subtotalConPromo = subtotal - ahorroPromo;

    const zona = zonaPorCP(CP);
    let envio = 0, envioGratis = false, envioZona = 'peninsula', zonaNoDisponible = false;
    if (unidades === 0) {
      envio = 0;
    } else if (zona === 'no') {
      zonaNoDisponible = true;
    } else if (zona === 'baleares') {
      envioZona = 'baleares';
      // Gratis desde 20 € también en Baleares (con tolerancia de 0,10 € tras el 4x3).
      if (subtotalConPromo >= ENVIO_GRATIS_DESDE - ENVIO_TOLERANCIA) { envio = 0; envioGratis = true; }
      else envio = ENVIO_BALEARES;
    } else {
      // Península, o sin CP todavía (se muestra la estimación peninsular).
      // Tolerancia: si tras el 4x3 se queda corto por <=0,10 €, envío gratis igual.
      if (subtotalConPromo >= ENVIO_GRATIS_DESDE - ENVIO_TOLERANCIA) { envio = 0; envioGratis = true; }
      else envio = ENVIO_PENINSULA;
    }

    // Código de descuento: SOLO sobre los productos (subtotal con 4x3), nunca
    // sobre el envío. El envío gratis ya se decidió arriba, antes del código.
    let descuentoCodigo = 0;
    if (this.codigo && unidades > 0) {
      if (this.codigo.pct) descuentoCodigo = subtotalConPromo * (this.codigo.pct / 100);
      else if (this.codigo.amountOff) descuentoCodigo = Math.min(this.codigo.amountOff, subtotalConPromo);
      descuentoCodigo = Math.round(descuentoCodigo * 100) / 100;
    }

    const total = subtotalConPromo - descuentoCodigo + envio;
    const faltaParaEnvio = Math.max(0, ENVIO_GRATIS_DESDE - subtotalConPromo);
    const faltaParaProximoGratis = unidades === 0 ? GRUPO_GRATIS : (GRUPO_GRATIS - (unidades % GRUPO_GRATIS)) % GRUPO_GRATIS;
    // progreso dentro del grupo de 3 en curso (0..3) para la barra/cuenta atras
    const progresoGrupo = faltaParaProximoGratis === 0 ? GRUPO_GRATIS : GRUPO_GRATIS - faltaParaProximoGratis;

    return {
      lineas, unidades, subtotal, gratisCount, ahorroPromo, freeByHandle,
      subtotalConPromo, envio, envioGratis, total,
      codigo: this.codigo, descuentoCodigo,
      faltaParaEnvio, faltaParaProximoGratis, progresoGrupo, grupoGratis: GRUPO_GRATIS,
      cp: CP, zona, envioZona, zonaNoDisponible,
    };
  },

  render() {
    const c = this.calcular();
    // Contador en el header
    document.querySelectorAll('[data-carrito-contador]').forEach(el => {
      el.textContent = c.unidades;
      el.classList.toggle('oculto', c.unidades === 0);
    });
    // Avisos tipo Temu al cruzar un umbral (solo tras una interaccion, no al cargar)
    if (this._prev) {
      if (c.gratisCount > this._prev.gratisCount) {
        mostrarAvisoFlotante('🎁 ¡4×3 conseguido! El producto de menor precio te sale GRATIS');
        abrirCarrito();
      }
      if (c.envioGratis && !this._prev.envioGratis) {
        mostrarAvisoFlotante('🚚 ¡Acabas de conseguir el ENVÍO GRATIS!');
      }
    }
    this._prev = { gratisCount: c.gratisCount, envioGratis: c.envioGratis };
    actualizarBarraPromo(c);
    if (typeof renderPanelCarrito === 'function') renderPanelCarrito(c);
  },
};

// Exponer el carrito en window para que checkout.js y app.js (que lo consultan
// como window.Carrito) lo encuentren. Una variable `const` NO se cuelga sola de
// window, por eso hay que asignarla explícitamente.
window.Carrito = Carrito;

/* Barra de estado de promociones en la propia pagina de compra (mientras
   navegas), con el progreso hacia el regalo (1 por cada 4) y al envio gratis. */
function actualizarBarraPromo(c) {
  const bar = document.getElementById('barra-promo');
  if (!bar) return;
  if (c.unidades === 0) { bar.classList.add('oculto'); bar.innerHTML = ''; return; }
  bar.classList.remove('oculto');
  const falta = c.faltaParaProximoGratis;
  const regalo = falta === 0
    ? `🎁 ¡Llevas <strong>${c.gratisCount} de regalo</strong>!`
    : (falta === 1
        ? `🎁 <strong>1 producto más</strong> y el de menor precio te sale gratis`
        : `🎁 Añade <strong>${falta}</strong> y llévate 1 de regalo`);
  const envio = c.envioGratis
    ? `🚚 <strong>¡Envío GRATIS!</strong>`
    : `🚚 Te faltan <strong>${eur(c.faltaParaEnvio)}</strong> para el envío gratis`;
  bar.innerHTML = `<span>${regalo}</span><span class="barra-promo-sep">·</span><span>${envio}</span>`;
}

/* Aviso flotante (toast) estilo Temu: salta cuando se desbloquea algo. */
let _avisoTimer = null;
/* Un solo aviso a la vez: el nuevo sustituye al anterior en vez de apilarse.
   Anadiendo tres productos seguidos salian cuatro mensajes amontonados (uno
   por producto mas el de envio gratis) que tapaban el carrito entero en un
   movil pequeno. Al reemplazarlo se repite ademas la animacion de entrada,
   asi que el mensaje nuevo se nota igual. */
function mostrarAvisoFlotante(msg) {
  let cont = document.getElementById('avisos-flotantes');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'avisos-flotantes';
    document.body.appendChild(cont);
  }
  cont.textContent = '';
  clearTimeout(_avisoTimer);
  const t = document.createElement('div');
  t.className = 'toast-promo';
  t.innerHTML = msg;
  cont.appendChild(t);
  _avisoTimer = setTimeout(() => t.remove(), 4000);
}

function eur(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

/* ---------- Panel lateral del carrito ---------- */
function renderPanelCarrito(c) {
  const cont = document.getElementById('carrito-items');
  const resumen = document.getElementById('carrito-resumen');
  if (!cont || !resumen) return;

  if (c.unidades === 0) {
    cont.innerHTML = '<div class="carrito-vacio">Tu carrito está vacío.<br>Descubre nuestra cosmética sólida natural.</div>';
    resumen.innerHTML = '';
    return;
  }

  cont.innerHTML = c.lineas.map(({ p, qty }) => `
    <div class="linea-item">
      <div class="mini-img"><img src="${p.image}" alt="${typeof acc==='function'?acc(p.title):p.title}"></div>
      <div>
        <div class="titulo">${typeof acc==='function'?acc(p.title):p.title}</div>
        ${c.freeByHandle && c.freeByHandle[p.handle] ? `<div class="gratis">🎁 ${c.freeByHandle[p.handle]} de regalo (−${eur(c.freeByHandle[p.handle] * _precioCarrito(p))})</div>` : ''}
        <div class="card-precio" style="font-size:.9rem;margin:2px 0 0">${eur(_precioCarrito(p))}</div>
        <div class="cantidad">
          <button aria-label="Quitar uno" onclick="Carrito.añadir('${p.handle}', -1)">−</button>
          <span>${qty}</span>
          <button aria-label="Añadir uno" onclick="Carrito.añadir('${p.handle}', 1)">+</button>
          <button class="quitar" onclick="Carrito.quitar('${p.handle}')">eliminar</button>
        </div>
      </div>
      <div></div>
    </div>
  `).join('');

  // --- Incentivo "producto gratis" con cuenta atras y barra de progreso ---
  const falta = c.faltaParaProximoGratis;
  const pgRegalo = Math.round((c.progresoGrupo / c.grupoGratis) * 100);
  let regalo;
  if (falta === 0) {
    regalo = `<div class="aviso-regalo conseguido">🎉 ¡Llevas <strong>${c.gratisCount} producto${c.gratisCount > 1 ? 's' : ''} de regalo</strong>! Añade <strong>${c.grupoGratis}</strong> más y consigue otro.
      <div class="barra-regalo"><span style="width:100%"></span></div></div>`;
  } else if (falta === 1) {
    regalo = `<div class="aviso-regalo cerca">🎁 ¡Solo <strong>1 producto más</strong> y tienes <strong>1 de regalo</strong>!
      <div class="barra-regalo"><span style="width:${pgRegalo}%"></span></div></div>`;
  } else {
    regalo = `<div class="aviso-regalo">🎁 Añade <strong>${falta} productos</strong> y consigue <strong>1 de regalo</strong> (4×3: llévate 4, paga 3).
      <div class="barra-regalo"><span style="width:${pgRegalo}%"></span></div></div>`;
  }

  const pct = Math.min(100, (c.subtotalConPromo / ENVIO_GRATIS_DESDE) * 100);
  let envioAviso;
  if (c.envioGratis) {
    envioAviso = '<div class="aviso-regalo conseguido">🚚 ¡Tienes <strong>ENVÍO GRATIS</strong>!</div>';
  } else {
    envioAviso = `<div class="aviso-envio">🚚 Te faltan <strong>${eur(c.faltaParaEnvio)}</strong> para el <strong>envío gratis</strong>.</div>`;
  }

  resumen.innerHTML = `
    ${regalo}
    ${envioAviso}
    <div class="barra-envio"><span style="width:${pct}%"></span></div>
    <div class="fila-cp" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0">
      <label style="font-size:.82rem;font-weight:600">Código postal <span style="color:#C0392B">*</span>
        <input type="text" inputmode="numeric" maxlength="5" value="${c.cp || ''}" oninput="fijarCP(this.value)" placeholder="Ej. 28320" style="width:90px;margin-left:6px;padding:6px 8px;border:1px solid #cfcfcf;border-radius:8px">
      </label>
      <span style="font-size:.74rem;color:var(--texto-suave)">${c.zonaNoDisponible ? '<span style="color:#C0392B">No enviamos a tu zona</span>' : (!c.cp ? 'para calcular el envío' : (c.envioZona === 'baleares' ? 'Baleares' : 'Península'))}</span>
    </div>
    <div class="fila-resumen"><span>Subtotal (${c.unidades} art.)</span><span>${eur(c.subtotal)}</span></div>
    ${c.ahorroPromo > 0 ? `<div class="fila-resumen"><span class="ahorro">Regalo · ${c.gratisCount} gratis</span><span class="ahorro">−${eur(c.ahorroPromo)}</span></div>` : ''}
    ${c.descuentoCodigo > 0 ? `<div class="fila-resumen"><span class="ahorro">Código ${c.codigo.code}${c.codigo.pct ? ' · ' + c.codigo.pct + '%' : ''}</span><span class="ahorro">−${eur(c.descuentoCodigo)}</span></div>` : ''}
    <div class="fila-resumen"><span>Envío${c.envioZona === 'baleares' ? ' (Baleares)' : ''}</span><span>${c.zonaNoDisponible ? '—' : (c.envioGratis ? 'GRATIS' : eur(c.envio))}</span></div>
    <p style="font-size:.7rem;color:var(--texto-suave);text-align:center;margin:6px 0 6px">4×3: llévate 4, paga 3 (el de menor precio, gratis) · IVA incluido.</p>
    ${c.codigo
      ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#eef5f0;border:1px solid #cfe3d7;border-radius:8px;padding:7px 10px;margin:0 0 10px">
           <span style="font-size:.8rem;color:var(--verde-oscuro)">🏷️ Código <strong>${c.codigo.code}</strong> aplicado${c.codigo.pct ? ' (−' + c.codigo.pct + '%)' : ''}</span>
           <button onclick="quitarCodigo()" style="background:none;border:none;color:#C0392B;font-size:.78rem;cursor:pointer;text-decoration:underline">quitar</button>
         </div>`
      : `<div style="margin:0 0 10px">
           <div style="display:flex;gap:6px">
             <input type="text" id="cod-input" placeholder="Código de descuento" autocomplete="off" style="flex:1;padding:8px 10px;border:1px solid #cfcfcf;border-radius:8px;text-transform:uppercase;font:inherit"
                    onkeydown="if(event.key==='Enter'){aplicarCodigo();return false;}">
             <button class="btn btn-secundario btn-sm" onclick="aplicarCodigo()">Aplicar</button>
           </div>
           <p id="cod-msg" style="font-size:.74rem;margin:5px 2px 0;min-height:1em"></p>
         </div>`}
    ${badgesPago()}
    ${_cajaGuardarCarrito()}
    <button class="btn btn-secundario btn-bloque" style="margin-top:8px" onclick="cerrarCarrito()">← Seguir comprando</button>
    <div class="panel-cierre">
      <div class="fila-resumen total"><span>Total</span><span>${c.zonaNoDisponible ? '—' : eur(c.total)}</span></div>
      ${c.zonaNoDisponible
        ? '<button class="btn btn-secundario btn-bloque" disabled>No realizamos envíos a tu zona</button>'
        : '<a class="btn btn-primario btn-bloque" id="btn-finalizar" href="#" onclick="finalizarCompra();return false;">Finalizar compra</a>'}
    </div>
  `;
}

/* Aplica un código de descuento: lo valida contra el Worker (que lo comprueba
   en Stripe) y, si es válido, lo guarda en el carrito y recalcula. */
// Valida un código contra el Worker (que lo comprueba en Stripe) y, si es válido,
// lo guarda y recalcula. Devuelve 'ok' | 'invalido' | 'error'.
async function aplicarCodigoTexto(code) {
  code = (code || '').trim();
  if (!code) return 'invalido';
  const ep = (window.SAVIA_CONFIG && (window.SAVIA_CONFIG.checkoutEndpoint || '').trim()) || '';
  if (!ep) return 'error';
  let base; try { base = new URL(ep).origin; } catch { base = ep.replace(/\/(checkout)?\/*$/, ''); }
  try {
    const r = await fetch(base + '/validar-codigo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: code }),
    });
    const d = await r.json();
    if (d && d.valido) {
      let pct = Number(d.pct) || 0;
      const amountOff = Number(d.amountOff) || 0;
      // Vista previa robusta: si el servidor no consigue leer el % del cupón,
      // lo deducimos del número del propio código (convención: RAKEL10 = 10%).
      // Es SOLO para mostrar el descuento en el carrito; el descuento real lo
      // aplica Stripe al pagar (con el promotion_code), así que el cobro es exacto.
      if (!pct && !amountOff) {
        const m = String(d.codigo || code).match(/(\d{1,2})\s*$/);
        if (m) { const n = parseInt(m[1], 10); if (n >= 1 && n <= 90) pct = n; }
      }
      Carrito.codigo = { code: d.codigo || code, pct, amountOff };
      Carrito.guardarCodigo();
      Carrito.render();
      mostrarAvisoFlotante('🏷️ ¡Código aplicado!' + (pct ? ' −' + pct + '%' : ''));
      return 'ok';
    }
    return 'invalido';
  } catch { return 'error'; }
}

async function aplicarCodigo() {
  const inp = document.getElementById('cod-input');
  const msg = document.getElementById('cod-msg');
  const code = (inp && inp.value || '').trim();
  if (!code) { if (msg) { msg.textContent = 'Escribe un código.'; msg.style.color = '#C0392B'; } return; }
  if (msg) { msg.textContent = 'Comprobando…'; msg.style.color = 'var(--texto-suave)'; }
  const res = await aplicarCodigoTexto(code);
  if (res === 'invalido' && msg) { msg.textContent = 'Código no válido o caducado.'; msg.style.color = '#C0392B'; }
  else if (res === 'error' && msg) { msg.textContent = 'No se pudo comprobar. Inténtalo de nuevo.'; msg.style.color = '#C0392B'; }
}
function quitarCodigo() {
  Carrito.codigo = null;
  Carrito.guardarCodigo();
  Carrito.render();
}

// Auto-aplica el código si viene en la URL (?codigo=RAKEL10), para enlaces de
// influencer: el seguidor entra y ya ve el 10% aplicado, sin teclear nada.
async function autoAplicarCodigoURL() {
  try {
    const p = new URLSearchParams(window.location.search);
    const code = (p.get('codigo') || p.get('code') || p.get('cupon') || p.get('descuento') || '').trim();
    if (code) {
      if (!(Carrito.codigo && Carrito.codigo.code && Carrito.codigo.code.toUpperCase() === code.toUpperCase())) {
        await aplicarCodigoTexto(code);
      }
      return;
    }
    // Sin código en la URL: si hay uno guardado, lo re-validamos para refrescar
    // el % (por si se guardó con datos incompletos en una versión anterior).
    if (Carrito.codigo && Carrito.codigo.code) {
      await aplicarCodigoTexto(Carrito.codigo.code);
    }
  } catch { /* si falla, el cliente siempre puede escribirlo a mano */ }
}
document.addEventListener('DOMContentLoaded', () => { setTimeout(autoAplicarCodigoURL, 300); });

window.aplicarCodigo = aplicarCodigo;
window.quitarCodigo = quitarCodigo;

/* Tira de "pago seguro" con los métodos que ofrece Stripe. Solo informativo:
   los métodos reales que se muestran los decide Stripe según lo activado en el
   panel de Stripe y la elegibilidad (Apple Pay en Safari, Bizum en España…). */
function badgesPago() {
  const r = '<rect width="48" height="30" rx="4" fill="#fff" stroke="#e6e6e0"/>';
  const logos = {
    visa: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Visa">${r}<text x="24" y="20" font-family="Arial,Helvetica,sans-serif" font-size="13" font-style="italic" font-weight="700" fill="#1A1F71" text-anchor="middle">VISA</text></svg>`,
    mastercard: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Mastercard">${r}<circle cx="20" cy="15" r="7.5" fill="#EB001B"/><circle cx="28" cy="15" r="7.5" fill="#FF9F00" fill-opacity=".85"/></svg>`,
    apple: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Apple Pay"><rect width="48" height="30" rx="4" fill="#000"/><path transform="translate(8,6) scale(0.85)" fill="#fff" d="M13.62 5.16c.44-.53.74-1.27.66-2.01-.63.03-1.4.42-1.85.95-.4.47-.76 1.22-.66 1.94.71.05 1.42-.36 1.85-.88zm.64 1.02c-1.02-.06-1.89.58-2.38.58-.49 0-1.24-.55-2.05-.54-1.05.02-2.03.61-2.57 1.56-1.1 1.9-.28 4.71.79 6.26.52.76 1.14 1.61 1.96 1.58.78-.03 1.08-.5 2.03-.5.95 0 1.21.5 2.05.49.85-.02 1.38-.77 1.9-1.53.6-.88.85-1.73.86-1.77-.02-.01-1.65-.63-1.66-2.51-.02-1.57 1.28-2.32 1.34-2.36-.73-1.08-1.87-1.2-2.27-1.23z"/><text x="32" y="20" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="#fff" text-anchor="middle">Pay</text></svg>`,
    google: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Google Pay">${r}<text x="16" y="20" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#4285F4" text-anchor="middle">G</text><text x="31" y="20" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="#5F6368" text-anchor="middle">Pay</text></svg>`,
    link: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Link"><rect width="48" height="30" rx="4" fill="#00D66F"/><circle cx="14" cy="15" r="6" fill="#011E0F"/><path d="M12.2 12l3 3-3 3" fill="none" stroke="#00D66F" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="32" y="20" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#011E0F" text-anchor="middle">link</text></svg>`,
    klarna: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Klarna"><rect width="48" height="30" rx="4" fill="#FFB3C7"/><text x="24" y="20" font-family="Arial,sans-serif" font-size="11.5" font-weight="700" fill="#0A0B09" text-anchor="middle">Klarna</text></svg>`,
    bizum: `<svg viewBox="0 0 48 30" class="pago-logo" role="img" aria-label="Bizum">${r}<text x="24" y="20" font-family="Arial,sans-serif" font-size="11.5" font-weight="700" fill="#00B0C7" text-anchor="middle">bizum</text></svg>`,
  };
  const orden = ['visa', 'mastercard', 'apple', 'google', 'link', 'klarna', 'bizum'];
  return `<div class="pago-seguro">
    <span class="pago-seguro-txt">🔒 Pago 100% seguro</span>
    <div class="pago-badges">${orden.map(k => logos[k]).join('')}</div>
  </div>`;
}

/* ---------- Apertura / cierre ---------- */
function abrirCarrito() {
  const panel = document.getElementById('panel-carrito');
  if (panel && !panel.classList.contains('abierto')) saviaEvento('carrito_abrir');
  document.getElementById('panel-carrito')?.classList.add('abierto');
  document.getElementById('overlay')?.classList.add('abierto');
}
function cerrarCarrito() {
  document.getElementById('panel-carrito')?.classList.remove('abierto');
  document.getElementById('overlay')?.classList.remove('abierto');
}

/* ---------- "Te guardamos el carrito" ----------
   El cliente puede dejar su email para recibir un enlace que recupera su
   carrito en cualquier dispositivo. Solo se usa para eso (no le suscribe a la
   newsletter). En el panel y en el resumen semanal salen los carritos
   guardados que no han acabado en pedido. */
function _cajaGuardarCarrito() {
  let guardado = '';
  try { guardado = localStorage.getItem('savia_carrito_email') || ''; } catch (e) { guardado = ''; }
  if (guardado) return `<p style="font-size:.74rem;color:var(--texto-suave);text-align:center;margin:8px 0 0">💾 Carrito guardado · te hemos enviado el enlace a ${guardado.replace(/[<>&"]/g, '')}</p>`;
  return `<details style="margin:8px 0 0;font-size:.8rem"><summary style="cursor:pointer;color:var(--verde-oscuro)">💾 ¿Lo terminas luego? Te guardamos el carrito</summary>
      <div style="display:flex;gap:6px;margin-top:6px">
        <input type="email" id="guardar-email" placeholder="Tu email" autocomplete="email" style="flex:1;min-width:0;padding:8px 10px;border:1px solid #cfcfcf;border-radius:8px;font:inherit">
        <button class="btn btn-secundario btn-sm" onclick="guardarCarritoEmail()">Guardar</button>
      </div>
      <p id="guardar-msg" style="font-size:.72rem;color:var(--texto-suave);margin:5px 2px 0">Te mandamos un enlace para recuperarlo. Solo para eso, sin publicidad.</p>
    </details>`;
}
async function guardarCarritoEmail() {
  const inp = document.getElementById('guardar-email');
  const msg = document.getElementById('guardar-msg');
  const email = (inp && inp.value || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { if (msg) msg.textContent = 'Revisa el email.'; return; }
  const ep = (window.SAVIA_CONFIG && (window.SAVIA_CONFIG.checkoutEndpoint || '').trim()) || '';
  if (!ep || !Carrito.totalUnidades()) return;
  if (msg) msg.textContent = 'Guardando…';
  try {
    const r = await fetch(ep.replace(/\/+$/, '') + '/carrito-guardar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, items: Carrito.items, origen: saviaCanal() }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    try { localStorage.setItem('savia_carrito_email', email); } catch (e) { /* */ }
    Carrito.render();
  } catch (err) { if (msg) msg.textContent = 'No se ha podido guardar. Inténtalo de nuevo.'; }
}
window.guardarCarritoEmail = guardarCarritoEmail;

/* Enlace de recuperación: ?carrito=handle:2,otro:1 rellena el carrito. */
function _recuperarCarritoURL() {
  try {
    const v = new URLSearchParams(location.search).get('carrito');
    if (!v) return;
    let n = 0;
    v.split(',').forEach(par => {
      const [h, c] = par.split(':');
      const cant = Math.min(20, Math.max(0, parseInt(c, 10) || 0));
      if (h && /^[a-z0-9-]{1,80}$/.test(h) && cant > 0 && Carrito.vendible(h)) { Carrito.items[h] = cant; n++; }
    });
    if (!n) return;
    Carrito.guardar();
    Carrito.render();
    if (typeof abrirCarrito === 'function') setTimeout(abrirCarrito, 400);
  } catch (err) { /* enlace mal formado: no hacemos nada */ }
}

Carrito.cargar();
document.addEventListener('DOMContentLoaded', () => { Carrito.render(); setTimeout(_recuperarCarritoURL, 350); });

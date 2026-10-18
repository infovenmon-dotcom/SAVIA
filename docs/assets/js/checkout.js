/* ===========================================================================
   SAVIA DE ALMA — Finalizar compra (Stripe)
   ---------------------------------------------------------------------------
   Flujo:
     1. Carrito vacío            -> no hace nada.
     2. Modo vacaciones          -> manda a la tienda de Amazon.
     3. Sin checkoutEndpoint     -> manda a Amazon (modo escaparate).
     4. Normal (endpoint puesto) -> pide a la función de Stripe una sesión de
        pago segura y redirige al checkout de Stripe.
     5. Si el pago no se puede abrir -> mensaje claro junto al botón (ya no se
        manda a Amazon) y se registra el error en el embudo del panel.
   La promo (4×3: por cada 4, el de menor precio gratis) y el envío los RECALCULA el servidor a partir
   de los precios reales: el navegador nunca decide cuánto se cobra.
   =========================================================================== */

function _amazonURL() {
  return (window.SAVIA_DATA && window.SAVIA_DATA.amazonStore) || 'https://www.amazon.es';
}
function _checkoutEndpoint() {
  return (window.SAVIA_CONFIG && (window.SAVIA_CONFIG.checkoutEndpoint || '').trim()) || '';
}

function _toast(msg) {
  if (typeof mostrarAvisoFlotante === 'function') mostrarAvisoFlotante(msg);
}

function _irAAmazon(msg) {
  if (msg) _toast(msg);
  // Pequeña pausa para que se vea el aviso antes de abrir Amazon.
  setTimeout(() => window.open(_amazonURL(), '_blank', 'noopener'), msg ? 600 : 0);
}

async function finalizarCompra() {
  // Carrito vacío: nada que cobrar.
  if (!window.Carrito || Carrito.totalUnidades() === 0) {
    _toast('Tu carrito está vacío.');
    return;
  }

  // Modo vacaciones: toda compra va a Amazon.
  if (typeof enVacaciones === 'function' && enVacaciones()) {
    _irAAmazon('🌴 Estamos de vacaciones · te llevamos a Amazon para completar la compra');
    return;
  }

  const endpoint = _checkoutEndpoint();

  // Sin pasarela configurada: modo escaparate -> Amazon.
  if (!endpoint) {
    _irAAmazon('Te llevamos a nuestra tienda de Amazon para completar la compra');
    return;
  }

  // Estado "cargando" en el botón.
  const btn = document.getElementById('btn-finalizar');
  const textoOriginal = btn ? btn.textContent : '';
  if (btn) { btn.textContent = 'Conectando con el pago seguro…'; btn.style.pointerEvents = 'none'; btn.style.opacity = '.7'; }

  if (typeof saviaEvento === 'function') saviaEvento('pago_iniciar');
  _ocultarErrorPago();

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: Carrito.items,                 // { handle: cantidad }
        cp: (typeof window.savia_getCP === 'function' ? window.savia_getCP() : ''),
        codigo: (Carrito.codigo && Carrito.codigo.code) || '',  // código de descuento aplicado
        returnUrl: _urlRetorno(),
      }),
    });

    let data = null;
    try { data = await resp.json(); } catch { /* respuesta sin JSON */ }
    if (!resp.ok || !data || !data.url) {
      const codigo = (data && data.error) || ('HTTP ' + resp.status);
      const err = new Error(codigo);
      err.codigo = codigo;
      err.detalle = data && data.detalle;
      throw err;
    }

    // Vamos al checkout seguro de Stripe.
    if (typeof saviaEvento === 'function') saviaEvento('pago_redirigir');
    window.location.href = data.url;
  } catch (err) {
    console.error('[SAVIA] Error al iniciar el pago:', err);
    if (btn) { btn.textContent = textoOriginal; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
    const codigo = err.codigo || 'sin_conexion';
    if (typeof saviaEvento === 'function') {
      saviaEvento('pago_error', { c: String(codigo).slice(0, 40), d: String(err.detalle || '').slice(0, 160) });
    }
    // Antes, cualquier fallo mandaba al cliente a Amazon (y en el móvil esa
    // ventana se bloqueaba, así que no pasaba nada). Ahora le decimos qué ha
    // pasado, junto al botón, y puede volver a intentarlo.
    _mostrarErrorPago(_mensajeErrorPago(codigo));
  }
}

/* La ficha /producto/<handle>/ no sabe dar las gracias ni vaciar la cesta al
   volver de Stripe (eso vive en app.js). Si la página actual no lo tiene,
   volvemos a la tienda, que sí lo hace. */
function _urlRetorno() {
  if (typeof gestionarRetornoPago === 'function') return window.location.origin + window.location.pathname;
  return window.location.origin + '/tienda.html';
}

function _mensajeErrorPago(codigo) {
  switch (codigo) {
    case 'zona_no_disponible':
      return 'Todavía no enviamos a Canarias, Ceuta ni Melilla. Revisa el código postal del carrito.';
    case 'modo_vacaciones':
      return 'Estamos de vacaciones unos días y no podemos preparar pedidos. ¡Vuelve pronto!';
    case 'Carrito vacío':
      return 'Los productos de tu cesta ya no están disponibles. Revisa la cesta y vuelve a intentarlo.';
    case 'sin_conexion':
      return 'No hemos podido conectar con el pago seguro. Revisa tu conexión y pulsa otra vez «Finalizar compra».';
    default:
      return 'No hemos podido abrir el pago seguro. Pulsa otra vez «Finalizar compra». Si vuelve a pasar, escríbenos a info@saviadealma.com y te ayudamos.';
  }
}

function _mostrarErrorPago(texto) {
  const btn = document.getElementById('btn-finalizar');
  if (!btn || !btn.parentNode) return;
  let caja = document.getElementById('pago-error');
  if (!caja) {
    caja = document.createElement('p');
    caja.id = 'pago-error';
    caja.setAttribute('role', 'alert');
    caja.style.cssText = 'margin:8px 0 0;padding:8px 10px;border-radius:8px;background:#fdecea;border:1px solid #f5c6c0;color:#8a2a1f;font-size:.8rem;line-height:1.35';
    btn.parentNode.insertBefore(caja, btn.nextSibling);
  }
  caja.textContent = texto;
}

function _ocultarErrorPago() {
  document.getElementById('pago-error')?.remove();
}

window.finalizarCompra = finalizarCompra;

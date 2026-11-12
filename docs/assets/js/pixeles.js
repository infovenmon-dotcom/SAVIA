/* ===========================================================================
   SAVIA DE ALMA — Píxeles de publicidad (Meta y TikTok) con consentimiento
   ---------------------------------------------------------------------------
   - Solo se cargan si hay un ID en config.js (metaPixelId / tiktokPixelId)
     y si el visitante ACEPTA las cookies de publicidad (RGPD / LSSI).
   - Eventos que se envían (además de la visita):
       ficha de producto      → ViewContent
       añadir al carrito      → AddToCart
       pulsar "Finalizar"     → InitiateCheckout
       compra hecha           → Purchase (con importe)
       alta en la newsletter  → Lead / CompleteRegistration
   - Si el visitante rechaza, no se carga nada y la tienda funciona igual.
   =========================================================================== */
(function () {
  'use strict';
  var CFG = window.SAVIA_CONFIG || {};
  var META = String(CFG.metaPixelId || '').trim();
  var TT = String(CFG.tiktokPixelId || '').trim();
  if (!META && !TT) return;                       // sin IDs: no hacemos nada

  var CLAVE = 'savia_cookies';                    // 'si' | 'no'
  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento */ } }

  var activo = false, cola = [];

  function cargarMeta() {
    if (!META || window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META);
    window.fbq('track', 'PageView');
  }

  function cargarTikTok() {
    if (!TT || window.ttq) return;
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      ttq.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (id) { var e = ttq._i[id] || []; for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (e, n) {
        var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var s = d.createElement('script'); s.type = 'text/javascript'; s.async = !0; s.src = r + '?sdkid=' + e + '&lib=' + t;
        var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(s, a);
      };
      ttq.load(TT); ttq.page();
    }(window, document, 'ttq');
  }

  /* Envía un evento a los píxeles (o lo guarda hasta que haya consentimiento). */
  function enviar(nombre, datos) {
    if (!activo) { cola.push([nombre, datos]); if (cola.length > 20) cola.shift(); return; }
    datos = datos || {};
    try {
      if (window.fbq) {
        var mapaMeta = { ver: 'ViewContent', carrito: 'AddToCart', pago: 'InitiateCheckout', compra: 'Purchase', alta: 'Lead' };
        if (mapaMeta[nombre]) window.fbq('track', mapaMeta[nombre], datos);
        if (nombre === 'alta') window.fbq('track', 'CompleteRegistration', datos);
      }
      if (window.ttq) {
        var mapaTT = { ver: 'ViewContent', carrito: 'AddToCart', pago: 'InitiateCheckout', compra: 'CompletePayment', alta: 'SubmitForm' };
        if (mapaTT[nombre]) window.ttq.track(mapaTT[nombre], datos);
        if (nombre === 'alta') window.ttq.track('CompleteRegistration', datos);
      }
    } catch (e) { /* los píxeles nunca deben romper la tienda */ }
  }

  function activar() {
    if (activo) return;
    activo = true;
    cargarMeta(); cargarTikTok();
    var c = cola; cola = [];
    c.forEach(function (x) { enviar(x[0], x[1]); });
  }

  /* Importe del carrito en este momento (para el valor de la compra). */
  function totalCarrito() {
    try { return window.Carrito ? Math.round(Carrito.calcular().total * 100) / 100 : 0; } catch (e) { return 0; }
  }

  /* Enganchamos los eventos que ya mide la tienda (saviaEvento, en cart.js). */
  function engancharEventos() {
    var original = window.saviaEvento;
    if (typeof original !== 'function' || original._pix) return;
    var envuelto = function (e, extra) {
      try {
        if (e === 'carrito_anadir') enviar('carrito', { currency: 'EUR', value: totalCarrito() });
        else if (e === 'pago_iniciar') {
          var t = totalCarrito();
          try { sessionStorage.setItem('savia_pix_total', String(t)); } catch (x) { /* nada */ }
          enviar('pago', { currency: 'EUR', value: t });
        } else if (e === 'pago_ok') {
          var v = 0; try { v = parseFloat(sessionStorage.getItem('savia_pix_total') || '0') || 0; sessionStorage.removeItem('savia_pix_total'); } catch (x) { v = 0; }
          enviar('compra', { currency: 'EUR', value: v });
        }
      } catch (err) { /* nada */ }
      return original.apply(this, arguments);
    };
    envuelto._pix = true;
    window.saviaEvento = envuelto;
    try { saviaEvento = envuelto; } catch (e) { /* ámbito global */ }
  }

  /* Altas en la newsletter: cualquier envío a /subscribe que responda bien. */
  function engancharAltas() {
    if (!window.fetch || window.fetch._pix) return;
    var f = window.fetch;
    var envuelto = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var p = f.apply(this, arguments);
      if (/\/subscribe(\?|$)/.test(url) && init && String(init.method || '').toUpperCase() === 'POST') {
        p.then(function (r) { if (r && r.ok) enviar('alta', {}); }).catch(function () {});
      }
      return p;
    };
    envuelto._pix = true;
    window.fetch = envuelto;
  }

  /* Ficha de producto → ViewContent con su precio. */
  function verFicha() {
    var el = document.getElementById('ficha-precio');
    if (!el || !el.dataset.handle) return;
    var v = 0;
    try {
      var p = (window.SAVIA_DATA && SAVIA_DATA.products || []).find(function (x) { return x.handle === el.dataset.handle; });
      if (p && typeof precioDe === 'function') v = precioDe(p);
    } catch (e) { v = 0; }
    enviar('ver', { content_type: 'product', content_ids: [el.dataset.handle], currency: 'EUR', value: v });
  }

  /* ---------- Aviso de cookies ---------- */
  function aviso() {
    if (document.getElementById('sv-cookies')) return;
    var d = document.createElement('div');
    d.id = 'sv-cookies';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Aviso de cookies');
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9998;max-width:560px;margin:0 auto;background:#fffdf8;color:#2b2b2b;border:1px solid #e7ded2;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:14px 16px;font:14px/1.45 -apple-system,Segoe UI,Roboto,Arial,sans-serif';
    d.innerHTML =
      '<p style="margin:0 0 10px">🍪 Usamos cookies de <strong>Meta (Instagram/Facebook) y TikTok</strong> para medir nuestros anuncios y mostrarte ofertas que te interesen. ' +
      'Puedes aceptarlas o rechazarlas: la tienda funciona igual. <a href="/privacidad.html" style="color:#1D6B50">Más información</a>.</p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">' +
      '<button type="button" data-c="no" style="padding:9px 16px;border-radius:999px;border:1px solid #1D6B50;background:#fff;color:#1D6B50;font-weight:700;cursor:pointer">Rechazar</button>' +
      '<button type="button" data-c="si" style="padding:9px 16px;border-radius:999px;border:0;background:#1D6B50;color:#fff;font-weight:700;cursor:pointer">Aceptar</button>' +
      '</div>';
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-c]'); if (!b) return;
      guardar(b.dataset.c); d.remove();
      if (b.dataset.c === 'si') activar(); else cola = [];
    });
    document.body.appendChild(d);
  }

  /* Para poder cambiar de opinión desde un enlace: <a href="#" onclick="saviaCookies()">Cookies</a> */
  window.saviaCookies = function () { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } aviso(); };

  function iniciar() {
    engancharEventos();
    engancharAltas();
    verFicha();
    var dec = leer();
    if (dec === 'si') activar();
    else if (dec !== 'no') aviso();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

/* ---------- Ventana de regalo de bienvenida (newsletter + 10 %) ----------
   Aparece a los 5 s (o al instante si se llega desde un anuncio: ?regalo,
   utm_source=tiktok/instagram/facebook). Pide el email, lo envía al Worker
   (/subscribe → correo de bienvenida + Brevo) y aplica REGALATE10 en el carrito.
   No vuelve a salir a quien se apuntó, ni durante 7 días a quien la cerró. */
(function () {
  var KEY = 'savia_regalo_popup';
  var CODIGO = 'REGALATE10';
  function estado() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var st = estado();
  var noMostrar = !!(st && (st.suscrito || (st.cerrado && Date.now() - st.cerrado < 7 * 864e5)));

  var css = '' +
    '.rg-fondo{position:fixed;inset:0;background:rgba(20,30,25,.55);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999;opacity:0;transition:opacity .25s}' +
    '.rg-fondo.rg-on{opacity:1}' +
    '.rg-caja{position:relative;background:#F7F2EC;border-radius:20px;max-width:380px;width:100%;padding:26px 22px 20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:"DM Sans",-apple-system,Segoe UI,Roboto,sans-serif;color:#2b2b2b;transform:translateY(14px);transition:transform .25s}' +
    '.rg-on .rg-caja{transform:none}' +
    '.rg-x{position:absolute;top:8px;right:10px;border:0;background:none;font-size:28px;line-height:1;color:#777;cursor:pointer;padding:6px}' +
    '.rg-tag{display:inline-block;background:#1D6B50;color:#fff;font-weight:700;font-size:13px;letter-spacing:.06em;padding:5px 12px;border-radius:99px}' +
    '.rg-tit{font-family:"Playfair Display",Georgia,serif;font-size:27px;line-height:1.15;margin:12px 0 6px;color:#1D6B50}' +
    '.rg-sub{font-size:15px;line-height:1.4;margin:0 0 12px}' +
    '.rg-imgs{display:flex;gap:10px;justify-content:center;margin:4px 0 12px}' +
    '.rg-imgs img{width:96px;height:96px;object-fit:cover;border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.12)}' +
    '.rg-plus{font-size:20px;align-self:center;color:#B8860B;font-weight:700}' +
    '.rg-diez{font-size:15px;margin:0 0 14px}.rg-diez b{color:#B8860B;font-size:18px}' +
    '.rg-form{display:flex;flex-direction:column;gap:9px}' +
    '.rg-form input{font:inherit;font-size:16px;padding:13px 14px;border:1.5px solid #cfc6ba;border-radius:12px;background:#fff;width:100%;box-sizing:border-box}' +
    '.rg-form button,.rg-btn{font:inherit;font-weight:700;font-size:16px;padding:14px;border:0;border-radius:12px;background:#1D6B50;color:#fff;cursor:pointer;text-decoration:none;display:block}' +
    '.rg-legal{font-size:11.5px;color:#777;margin:10px 0 0}.rg-legal a{color:#777}' +
    '.rg-ok{display:none}.rg-hecho .rg-ok{display:block}.rg-hecho .rg-pedir{display:none}';

  function crear() {
    if (document.querySelector('.rg-fondo')) return;
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var tienda = /tienda\.html/.test(location.pathname);
    var d = document.createElement('div');
    d.className = 'rg-fondo'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Regalo de bienvenida');
    d.innerHTML =
      '<div class="rg-caja">' +
        '<button class="rg-x" type="button" aria-label="Cerrar">×</button>' +
        '<div class="rg-pedir">' +
          '<span class="rg-tag">🎁 REGALO DE BIENVENIDA</span>' +
          '<h2 class="rg-tit">¿Todavía no has pedido tu regalo?</h2>' +
          '<p class="rg-sub">En tu <strong>primer pedido</strong> te regalamos:</p>' +
          '<div class="rg-imgs"><img src="assets/img/products/jabonera-bambu.jpg" alt="Jabonera de bambú"><span class="rg-plus">+</span><img src="assets/img/products/esponja-exfoliante.jpg" alt="Bolsa de sisal"></div>' +
          '<p class="rg-diez"><b>4×3</b> siempre en todos los productos<br>y <b>−10 %</b> en tu primer pedido</p>' +
          '<form class="rg-form"><input type="email" name="email" required placeholder="Tu email" autocomplete="email" inputmode="email"><button type="submit">Quiero mi regalo</button></form>' +
          '<p class="rg-legal">Un correo a la semana, sin spam. Te das de baja cuando quieras. <a href="privacidad.html">Privacidad</a></p>' +
        '</div>' +
        '<div class="rg-ok">' +
          '<span class="rg-tag">✓ ¡HECHO!</span>' +
          '<h2 class="rg-tit">Tu regalo está reservado</h2>' +
          '<p class="rg-sub">Te hemos enviado un email. Tu <strong>10 % ya está aplicado</strong> en el carrito y la jabonera + bolsa de sisal irán en tu primer pedido.</p>' +
          (tienda ? '<button class="rg-btn rg-seguir" type="button">Seguir comprando</button>' : '<a class="rg-btn" href="tienda.html">Ir a la tienda</a>') +
        '</div>' +
      '</div>';
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('rg-on'); });
    function cerrar() { if (!(estado() || {}).suscrito) guardar({ cerrado: Date.now() }); d.classList.remove('rg-on'); setTimeout(function () { d.remove(); }, 250); }
    d.querySelector('.rg-x').onclick = cerrar;
    d.addEventListener('click', function (e) { if (e.target === d) cerrar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    var seg = d.querySelector('.rg-seguir'); if (seg) seg.onclick = cerrar;
    d.querySelector('.rg-form').onsubmit = function (e) {
      e.preventDefault();
      var email = (this.email.value || '').trim(); if (!email) return false;
      var ep = ((window.SAVIA_CONFIG || {}).checkoutEndpoint || '').trim().replace(/\/+$/, '');
      if (ep) fetch(ep + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, origen: 'Ventana · ' + origen() }) }).catch(function () {});
      guardar({ suscrito: Date.now() });
      if (typeof aplicarCodigoTexto === 'function') aplicarCodigoTexto(CODIGO);
      else try { localStorage.setItem('savia_codigo', JSON.stringify({ code: CODIGO, pct: 10, amountOff: 0 })); } catch (er) {}
      d.querySelector('.rg-caja').classList.add('rg-hecho');
      return false;
    };
  }

  var q = new URLSearchParams(location.search);
  // Origen de la visita (primer toque de la sesión): utm_source o web de procedencia.
  function calcOrigen() {
    var u = (q.get('utm_source') || '').toLowerCase();
    if (!u && q.has('regalo')) u = 'anuncio';
    if (!u) { try { var h = new URL(document.referrer).hostname; if (h && h.indexOf('saviadealma') < 0) u = h.replace(/^www\./, ''); } catch (e) {} }
    if (/tiktok/.test(u)) u = 'TikTok'; else if (/instagram|^ig$/.test(u)) u = 'Instagram'; else if (/facebook|^fb$/.test(u)) u = 'Facebook'; else if (/google/.test(u)) u = 'Google';
    return u || 'directo';
  }
  try { if (!sessionStorage.getItem('savia_origen')) sessionStorage.setItem('savia_origen', calcOrigen()); } catch (e) {}
  function origen() { try { return sessionStorage.getItem('savia_origen') || calcOrigen(); } catch (e) { return calcOrigen(); } }
  window.saviaOrigen = origen;
  var desdeAnuncio = q.has('regalo') || /tiktok|instagram|facebook|ig|fb/i.test(q.get('utm_source') || '');
  function iniciar() { if (noMostrar || /admin\.html/.test(location.pathname)) return; setTimeout(crear, desdeAnuncio ? 900 : 5000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.abrirRegalo = crear;
})();

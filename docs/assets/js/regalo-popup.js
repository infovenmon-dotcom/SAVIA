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
  // Durante la campaña (Black Friday) no hay regalo de bienvenida.
  if (typeof campanaActiva === 'function' && campanaActiva()) noMostrar = true;

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
    '.rg-negro{background:#0b0b0b;color:#eee;border:1.5px solid #C9A227}' +
    '.rg-negro .rg-x{color:#bbb}' +
    '.rg-bf{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:46px;line-height:.98;letter-spacing:.05em;color:#E0B83A;margin:4px 0 2px;text-transform:uppercase}' +
    '.rg-bf-s{font-size:12px;font-weight:800;letter-spacing:.32em;color:#fff;margin:0}' +
    '.rg-negro .rg-tit{color:#fff;font-size:23px;margin:10px 0 6px}' +
    '.rg-negro .rg-sub strong{color:#E0B83A}' +
    '.rg-sep{border:0;border-top:1px solid #333;margin:12px 0}' +
    '.rg-negro .rg-imgs img{width:78px;height:78px}' +
    '.rg-negro .rg-diez b{color:#E0B83A}' +
    '.rg-negro .rg-form input{border-color:#444}' +
    '.rg-negro .rg-form button,.rg-negro .rg-btn{background:#E0B83A;color:#0b0b0b}' +
    '.rg-negro .rg-tag{background:#E0B83A!important;color:#0b0b0b}' +
    '.rg-negro .rg-legal,.rg-negro .rg-legal a{color:#999}' +
    '.rg-ok{display:none}.rg-hecho .rg-ok{display:block}.rg-hecho .rg-pedir{display:none}' +
    /* Cinta de la esquina: la oferta se queda "aparcada" tras cerrar la ventana */
    '.rg-cinta{position:fixed;left:0;bottom:0;width:150px;height:150px;overflow:hidden;z-index:110;pointer-events:none}' +
    '.rg-cinta-b{position:absolute;left:-62px;bottom:38px;width:240px;transform:rotate(45deg);background:#0b0b0b;color:#fff;border:0;font:800 13px/1.2 "DM Sans",-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.04em;text-align:center;padding:10px 0;box-shadow:0 4px 14px rgba(0,0,0,.28);cursor:pointer;pointer-events:auto}' +
    '.rg-cinta-b b{color:#E8C76A}' +
    '.rg-cinta-x{position:absolute;left:84px;bottom:84px;width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:#143228;color:#fff;font:700 15px/1 sans-serif;display:grid;place-items:center;cursor:pointer;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    'body.con-cinta .a11y-btn{bottom:150px}body.con-cinta .a11y-panel{bottom:210px}' +
    '@media (prefers-reduced-motion:no-preference){.rg-cinta-b{animation:rgCinta .5s ease-out}}' +
    '@keyframes rgCinta{from{transform:rotate(45deg) translateY(40px);opacity:0}to{transform:rotate(45deg);opacity:1}}';

  function ponerCss() {
    if (document.getElementById('rg-css')) return;
    var s = document.createElement('style'); s.id = 'rg-css'; s.textContent = css; document.head.appendChild(s);
  }
  /* Cinta "−10 % + regalo" en la esquina inferior izquierda. Sale cuando el
     cliente ha cerrado la ventana sin apuntarse; al tocarla se vuelve a abrir.
     Con su ✕ se quita durante esta visita. No sale a quien ya se apuntó, ni
     durante la campaña (Black Friday), ni en el panel. */
  function cintaPermitida() {
    var e = estado() || {};
    if (e.suscrito || /admin\.html/.test(location.pathname)) return false;
    if (typeof campanaActiva === 'function' && campanaActiva()) return false;
    try { if (sessionStorage.getItem('savia_cinta_off')) return false; } catch (er) {}
    return true;
  }
  function quitarCinta() {
    var c = document.querySelector('.rg-cinta'); if (c) c.remove();
    document.body.classList.remove('con-cinta');
  }
  function ponerCinta() {
    if (!cintaPermitida() || document.querySelector('.rg-cinta, .rg-fondo')) return;
    ponerCss();
    var c = document.createElement('div');
    c.className = 'rg-cinta';
    c.innerHTML = '<button class="rg-cinta-b" type="button" aria-label="Apúntate: acceso anticipado al Black Friday, 10 % y regalo en tu primer pedido">🖤 <b>BLACK FRIDAY</b> · ENTÉRATE</button>' +
      '<button class="rg-cinta-x" type="button" aria-label="Ocultar la oferta">×</button>';
    document.body.appendChild(c);
    document.body.classList.add('con-cinta');
    c.querySelector('.rg-cinta-b').onclick = function () { quitarCinta(); crear(); };
    c.querySelector('.rg-cinta-x').onclick = function () {
      try { sessionStorage.setItem('savia_cinta_off', '1'); } catch (er) {}
      quitarCinta();
    };
  }
  window.saviaCinta = ponerCinta;

  function crear() {
    if (document.querySelector('.rg-fondo')) return;
    quitarCinta();
    ponerCss();
    var tienda = /tienda\.html/.test(location.pathname);
    var d = document.createElement('div');
    d.className = 'rg-fondo'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Regalo de bienvenida');
    d.innerHTML =
      '<div class="rg-caja rg-negro">' +
        '<button class="rg-x" type="button" aria-label="Cerrar">×</button>' +
        '<div class="rg-pedir">' +
          '<p class="rg-bf-s">🖤 SE ACERCA</p>' +
          '<div class="rg-bf">Black<br>Friday</div>' +
          '<h2 class="rg-tit">¿Quieres saber lo que hemos preparado?</h2>' +
          '<p class="rg-sub">Apúntate y <strong>entérate antes que nadie</strong>: los suscriptores entran con <strong>acceso anticipado</strong>.</p>' +
          '<hr class="rg-sep">' +
          '<p class="rg-sub" style="margin-top:4px">Y si quieres probarnos ya, en tu <strong>primer pedido</strong> te regalamos:</p>' +
          '<div class="rg-imgs"><img src="assets/img/products/jabonera-bambu.jpg" alt="Jabonera de bambú"><span class="rg-plus">+</span><img src="assets/img/products/esponja-exfoliante.jpg" alt="Bolsa de sisal"></div>' +
          '<p class="rg-diez"><b>4×3</b> siempre en todos los productos<br>y <b>−10 %</b> en tu primer pedido</p>' +
          '<form class="rg-form"><input type="email" name="email" required placeholder="Tu email" autocomplete="email" inputmode="email"><button type="submit">Apuntarme</button></form>' +
          '<p class="rg-legal">Un correo a la semana, sin spam. Te das de baja cuando quieras. <a href="privacidad.html">Privacidad</a></p>' +
        '</div>' +
        '<div class="rg-ok">' +
          '<span class="rg-tag">✓ ¡HECHO!</span>' +
          '<div class="rg-bf" style="font-size:40px;margin-top:10px">Black Friday</div>' +
          '<h2 class="rg-tit">¡Ya estás dentro!</h2>' +
          '<p class="rg-sub">Te avisaremos del <strong>Black Friday antes que a nadie</strong>. Y si quieres probarnos ya, tu <strong>10 % está aplicado</strong> en el carrito y la jabonera + bolsa de sisal irán en tu primer pedido.</p>' +
          (tienda ? '<button class="rg-btn rg-seguir" type="button">Seguir comprando</button>' : '<a class="rg-btn" href="tienda.html">Ir a la tienda</a>') +
        '</div>' +
      '</div>';
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('rg-on'); });
    function cerrar() { if (!(estado() || {}).suscrito) guardar({ cerrado: Date.now() }); d.classList.remove('rg-on'); setTimeout(function () { d.remove(); ponerCinta(); }, 250); }
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
  /* No interrumpir. La ventana salta a los 5 s pase lo que pase, y si para
     entonces el cliente tiene abierto el carrito o una ficha se le planta
     encima: ocupa la pantalla entera con z-index 9999, muy por encima del
     carrito (131) y de la ficha (4000). Justo encima del boton de pagar.
     Ahora espera a que no haya nada abierto; cuando cierra, sale. */
  function hayAlgoAbierto() {
    return !!document.querySelector('#panel-carrito.abierto, #panel-ficha.abierto, .rg-fondo');
  }
  function intentar() {
    if (noMostrar || /admin\.html/.test(location.pathname)) return;
    if (hayAlgoAbierto()) { setTimeout(intentar, 1500); return; }
    crear();
  }
  function iniciar() {
    // Quien ya cerró la ventana (y no se apuntó) ve la cinta desde el principio.
    if (noMostrar) { setTimeout(ponerCinta, 1200); return; }
    if (/admin\.html/.test(location.pathname)) return;
    setTimeout(intentar, desdeAnuncio ? 900 : 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.abrirRegalo = crear;
})();

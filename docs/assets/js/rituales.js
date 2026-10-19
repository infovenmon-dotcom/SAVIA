/* Rituales de 4 productos y selector "Encuentra tu ritual".
   Datos de recomendacion: que producto encaja con cada necesidad. Sale de
   lo que ya dice cada ficha (tipo de cabello/piel, aroma); no anade
   promesas nuevas. Si un producto se agota o deja de venderse, el selector
   y los rituales lo saltan solos (Carrito.vendible).
   Lo usan /rituales/ y /encuentra-tu-ritual/; necesita products.js,
   precios.js y cart.js cargados antes. */
(function () {
  var NECESIDADES = {
    cabello: {
      titulo: 'Cabello',
      pregunta: '¿Cómo es tu cabello?',
      opciones: {
        graso: { txt: 'Se engrasa pronto', p: ['champu-te-matcha', 'champu-betaina-sal', 'champu-cebolla-arcilla'] },
        seco: { txt: 'Seco o castigado', p: ['champu-cacao', 'champu-avena-almendra', 'acondicionador-coco'] },
        fino: { txt: 'Fino o sin cuerpo', p: ['champu-cafeina-canela', 'champu-romero-quina', 'champu-cebolla-arcilla'] },
        caida: { txt: 'Busco un champú anticaída', p: ['champu-cafeina-canela', 'champu-romero-quina', 'champu-cebolla-arcilla'] },
        canas: { txt: 'Con canas o rubio', p: ['champu-indigo-lavanda', 'acondicionador-coco'] },
        sensible: { txt: 'Cuero cabelludo sensible', p: ['champu-avena-almendra', 'champu-indigo-lavanda', 'champu-cade-enebro'] },
        rizado: { txt: 'Rizado u ondulado', p: ['champu-avena-almendra', 'acondicionador-almendra', 'cera-peinado'] },
      },
    },
    rostro: {
      titulo: 'Rostro',
      pregunta: '¿Cómo es tu piel?',
      opciones: {
        sensible: { txt: 'Sensible', p: ['limpiador-facial-rosa-mosqueta', 'jabon-aceite-arroz', 'jabon-leche-cabra'] },
        grasa: { txt: 'Mixta o grasa', p: ['limpiador-facial-aloe-pepino', 'jabon-arbol-te', 'jabon-carbon-activo'] },
        madura: { txt: 'Madura o apagada', p: ['limpiador-facial-rosa-mosqueta', 'jabon-rosa-mosqueta', 'jabon-aceite-arroz'] },
      },
    },
    cuerpo: {
      titulo: 'Cuerpo',
      pregunta: '¿Qué necesita tu piel?',
      opciones: {
        seca: { txt: 'Está seca', p: ['jabon-karite', 'jabon-aguacate', 'jabon-leche-cabra', 'jabon-monoi', 'exfoliante-cafe-coco'] },
        sensible: { txt: 'Es sensible', p: ['jabon-cbd', 'jabon-leche-cabra', 'jabon-karite', 'desodorante-algodon'] },
        grasa: { txt: 'Grasa o con imperfecciones', p: ['jabon-arbol-te', 'jabon-carbon-activo', 'jabon-azufre', 'jabon-pepita-uva'] },
        madura: { txt: 'Madura', p: ['jabon-rosa-mosqueta', 'jabon-argan', 'jabon-borraja', 'jabon-leche-burra-aloe'] },
        relax: { txt: 'Un momento para relajarme', p: ['jabon-lavanda', 'sales-epsom-500', 'exfoliante-zanahoria-lino', 'jabon-monoi'] },
      },
    },
    barba: {
      titulo: 'Barba y afeitado',
      pregunta: '¿Qué buscas?',
      opciones: {
        afeitado: { txt: 'Un afeitado sin bote de espuma', p: ['espuma-afeitar-avellana', 'kit-afeitado-completo'] },
        barba: { txt: 'Cuidar la barba', p: ['champu-barba-carbon', 'jabon-carbon-activo'] },
        todo: { txt: 'Un poco de todo', p: ['espuma-afeitar-avellana', 'champu-barba-carbon', 'desodorante-madera'] },
      },
    },
  };

  /* Familia de aroma de cada producto (segun su ficha). */
  var AROMA = {
    floral: ['jabon-lavanda', 'jabon-monoi', 'jabon-rosa-mosqueta', 'champu-indigo-lavanda', 'limpiador-facial-rosa-mosqueta', 'jabon-borraja'],
    citrico: ['jabon-naranja-canela', 'desodorante-pomelo', 'champu-betaina-sal', 'champu-te-matcha'],
    fresco: ['jabon-arbol-te', 'champu-te-matcha', 'champu-romero-quina', 'desodorante-te-verde', 'limpiador-facial-aloe-pepino', 'espuma-depilacion-aloe', 'jabon-pepita-uva'],
    dulce: ['champu-cacao', 'champu-cafeina-canela', 'champu-avena-almendra', 'exfoliante-cafe-coco', 'jabon-naranja-canela', 'acondicionador-coco', 'acondicionador-almendra', 'exfoliante-zanahoria-lino'],
    suave: ['jabon-karite', 'jabon-leche-cabra', 'jabon-leche-burra-aloe', 'desodorante-algodon', 'jabon-aceite-arroz', 'jabon-cbd', 'jabon-aguacate', 'jabon-argan', 'sales-epsom-500', 'jabon-carbon-activo', 'jabon-azufre'],
    madera: ['champu-cade-enebro', 'desodorante-madera', 'espuma-afeitar-avellana', 'champu-barba-carbon', 'champu-cebolla-arcilla'],
  };
  var AROMAS = [
    ['floral', 'Florales', 'lavanda, rosa, monoï'],
    ['citrico', 'Cítricos', 'naranja, pomelo'],
    ['fresco', 'Frescos', 'té, romero, aloe'],
    ['dulce', 'Dulces', 'cacao, café, coco'],
    ['madera', 'Amaderados', 'enebro, madera'],
    ['suave', 'Suaves', 'apenas perfumados'],
    ['', 'Me da igual', ''],
  ];

  /* Para completar el 4×3: que sumar segun la zona elegida. */
  var COMPLEMENTO = {
    cabello: ['acondicionador-coco', 'acondicionador-almendra', 'jabon-lavanda', 'exfoliante-cafe-coco'],
    rostro: ['jabon-aceite-arroz', 'exfoliante-zanahoria-lino', 'jabon-karite', 'champu-avena-almendra'],
    cuerpo: ['exfoliante-cafe-coco', 'desodorante-algodon', 'champu-avena-almendra', 'limpiador-facial-aloe-pepino'],
    barba: ['desodorante-madera', 'jabon-carbon-activo', 'champu-cafeina-canela', 'exfoliante-cafe-coco'],
  };

  /* Rituales listos de 4. Cada hueco se puede cambiar por otro de su familia. */
  var RITUALES = [
    {
      id: 'calma', nombre: 'Calma al final del día',
      txt: 'Para cuando por fin llegas a casa: un baño templado, aroma a lavanda y nada de prisa.',
      p: ['jabon-lavanda', 'champu-indigo-lavanda', 'limpiador-facial-rosa-mosqueta', 'sales-epsom-500'],
    },
    {
      id: 'energia', nombre: 'Mañanas con energía',
      txt: 'Cítricos y canela para despertar en la ducha y salir de casa con buen pie.',
      p: ['champu-cafeina-canela', 'jabon-naranja-canela', 'desodorante-pomelo', 'limpiador-facial-aloe-pepino'],
    },
    {
      id: 'piel', nombre: 'Un momento para ti',
      txt: 'Exfolia, limpia y mima tu piel de la cara a los pies, una vez por semana o cuando lo pidas.',
      p: ['exfoliante-cafe-coco', 'jabon-karite', 'limpiador-facial-rosa-mosqueta', 'jabon-aceite-arroz'],
    },
    {
      id: 'capilar', nombre: 'Ritual capilar',
      txt: 'Dos champús para alternar, acondicionador y cera: tu cabello, entero sin plástico.',
      p: ['champu-avena-almendra', 'champu-cacao', 'acondicionador-almendra', 'cera-peinado'],
    },
    {
      id: 'afeitado', nombre: 'Ritual de afeitado',
      txt: 'Espuma sólida, champú de barba, jabón de carbón y desodorante de madera.',
      p: ['espuma-afeitar-avellana', 'champu-barba-carbon', 'jabon-carbon-activo', 'desodorante-madera'],
    },
  ];

  var D = function () { return (window.SAVIA_DATA && window.SAVIA_DATA.products) || []; };
  var prod = function (h) { return D().find(function (p) { return p.handle === h; }); };
  var vende = function (h) { return window.Carrito ? Carrito.vendible(h) : !!prod(h); };
  var precio = function (p) { return (typeof precioDe === 'function') ? precioDe(p) : p.price; };
  var eur = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var img = function (p) { var u = p.image || ''; return (u && u[0] !== '/' && !/^https?:/.test(u)) ? '/' + u : u; };

  /* 4×3: por cada 4 unidades, la de menor precio gratis. */
  function totales(handles) {
    var ps = handles.map(prod).filter(Boolean).map(precio).sort(function (a, b) { return a - b; });
    var total = ps.reduce(function (a, b) { return a + b; }, 0);
    var gratis = 0;
    for (var i = 0; i < Math.floor(ps.length / 4); i++) gratis += ps[i];
    return { total: total, gratis: gratis, pagas: total - gratis };
  }

  function anadirVarios(handles) {
    if (!window.Carrito) { location.href = '/tienda.html'; return; }
    handles.forEach(function (h) { if (vende(h)) Carrito.añadir(h, 1); });
    if (typeof saviaEvento === 'function') saviaEvento('ritual_anadir', { n: handles.length });
    if (typeof abrirCarrito === 'function') abrirCarrito();
  }
  window.saviaAnadirVarios = anadirVarios;

  /* ---------- Pagina /rituales/ ---------- */
  function pintarRituales(cont) {
    var html = RITUALES.map(function (r) {
      var huecos = r.p.filter(vende);
      if (huecos.length < 4) return '';
      return '<article class="ritual-card" data-ritual="' + r.id + '">' +
        '<div class="ritual-cab"><h2>' + esc(r.nombre) + '</h2><p>' + esc(r.txt) + '</p></div>' +
        '<ol class="ritual-items">' + huecos.map(function (h, i) { return hueco(r.id, i, h); }).join('') + '</ol>' +
        '<div class="ritual-pie"><p class="ritual-precio" aria-live="polite"></p>' +
        '<button class="btn btn-primario" type="button" data-anadir-ritual="' + r.id + '">Añadir los 4 al carrito</button></div>' +
        '</article>';
    }).join('');
    cont.innerHTML = html;
    RITUALES.forEach(function (r) { actualizarRitual(cont, r.id); });
    cont.addEventListener('change', function (e) {
      var s = e.target.closest('select[data-hueco]');
      if (!s) return;
      var li = s.closest('li');
      var p = prod(s.value);
      if (p && li) {
        var im = li.querySelector('img'); if (im) { im.src = img(p); im.alt = p.title; }
        var a = li.querySelector('.ritual-nom'); if (a) { a.href = '/producto/' + p.handle + '/'; a.textContent = p.title; }
        var pr = li.querySelector('.ritual-pu'); if (pr) pr.textContent = eur(precio(p));
      }
      actualizarRitual(cont, s.closest('[data-ritual]').getAttribute('data-ritual'));
    });
    cont.addEventListener('click', function (e) {
      var b = e.target.closest('[data-anadir-ritual]');
      if (!b) return;
      anadirVarios(elegidos(cont, b.getAttribute('data-anadir-ritual')));
    });
  }
  function hueco(rid, i, h) {
    var p = prod(h);
    var alternativas = D().filter(function (x) { return x.collection === p.collection && vende(x.handle); });
    return '<li>' +
      '<img src="' + esc(img(p)) + '" alt="' + esc(p.title) + '" width="160" height="160" loading="lazy">' +
      '<div class="ritual-info"><a class="ritual-nom" href="/producto/' + p.handle + '/">' + esc(p.title) + '</a>' +
      '<span class="ritual-pu">' + eur(precio(p)) + '</span>' +
      (alternativas.length > 1
        ? '<label class="ritual-cambiar"><span>Cambiar por</span><select id="r-' + rid + '-' + i + '" data-hueco>' +
          alternativas.map(function (x) { return '<option value="' + x.handle + '"' + (x.handle === h ? ' selected' : '') + '>' + esc(x.title) + '</option>'; }).join('') +
          '</select></label>'
        : '') +
      '</div></li>';
  }
  function elegidos(cont, rid) {
    var card = cont.querySelector('[data-ritual="' + rid + '"]');
    return Array.prototype.map.call(card.querySelectorAll('li'), function (li) {
      var s = li.querySelector('select');
      if (s) return s.value;
      var a = li.querySelector('.ritual-nom');
      return a ? a.getAttribute('href').split('/')[2] : null;
    }).filter(Boolean);
  }
  function actualizarRitual(cont, rid) {
    var card = cont.querySelector('[data-ritual="' + rid + '"]');
    if (!card) return;
    var t = totales(elegidos(cont, rid));
    card.querySelector('.ritual-precio').innerHTML =
      '<s>' + eur(t.total) + '</s> <strong>' + eur(t.pagas) + '</strong>' +
      '<span>Con el 4×3, el de menor precio (' + eur(t.gratis) + ') te sale gratis</span>';
  }

  /* ---------- Pagina /encuentra-tu-ritual/ ---------- */
  function pintarSelector(cont) {
    var q = new URLSearchParams(location.search);
    var st = { zona: q.get('zona') || '', busca: q.get('busca') || '', aroma: q.has('aroma') ? q.get('aroma') : null };
    if (!NECESIDADES[st.zona]) st.zona = '';
    if (st.zona && !NECESIDADES[st.zona].opciones[st.busca]) st.busca = '';

    function paso(n, titulo, opciones, elegido, clave) {
      return '<fieldset class="sel-paso" data-paso="' + clave + '"><legend><span class="sel-num">' + n + '</span>' + esc(titulo) + '</legend>' +
        '<div class="sel-ops">' + opciones.map(function (o) {
          return '<button type="button" class="sel-op' + (o[0] === elegido ? ' activa' : '') + '" aria-pressed="' + (o[0] === elegido) + '" data-' + clave + '="' + o[0] + '">' +
            esc(o[1]) + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</button>';
        }).join('') + '</div></fieldset>';
    }
    function render() {
      var h = paso(1, '¿Qué quieres cuidar?', Object.keys(NECESIDADES).map(function (k) { return [k, NECESIDADES[k].titulo]; }), st.zona, 'zona');
      if (st.zona) {
        var N = NECESIDADES[st.zona];
        h += paso(2, N.pregunta, Object.keys(N.opciones).map(function (k) { return [k, N.opciones[k].txt]; }), st.busca, 'busca');
      }
      if (st.zona && st.busca) h += paso(3, '¿Qué aromas te gustan?', AROMAS, st.aroma, 'aroma');
      if (st.zona && st.busca && st.aroma !== null) h += resultado();
      cont.innerHTML = h;
    }
    function resultado() {
      var base = NECESIDADES[st.zona].opciones[st.busca].p.filter(vende);
      var orden = base.map(function (hd, i) {
        var bonus = (st.aroma && AROMA[st.aroma] && AROMA[st.aroma].indexOf(hd) >= 0) ? -10 : 0;
        return { h: hd, s: i + bonus };
      }).sort(function (a, b) { return a.s - b.s; }).map(function (x) { return x.h; });
      var recs = orden.slice(0, 3);
      if (!recs.length) return '<p class="sel-vacio">Ahora mismo no tenemos stock de lo que buscas. <a href="/tienda.html">Mira toda la tienda</a>.</p>';
      var extra = (COMPLEMENTO[st.zona] || []).filter(function (x) { return vende(x) && recs.indexOf(x) < 0; });
      if (st.aroma && AROMA[st.aroma]) extra.sort(function (a, b) { return (AROMA[st.aroma].indexOf(b) >= 0) - (AROMA[st.aroma].indexOf(a) >= 0); });
      var cuarto = recs.length === 3 ? extra[0] : null;
      var todos = recs.concat(cuarto ? [cuarto] : []);
      var t = totales(todos);
      var tarjeta = function (hd, sug) {
        var p = prod(hd);
        return '<article class="sel-rec' + (sug ? ' sel-sug' : '') + '">' +
          (sug ? '<span class="sel-etq">Para completar tu 4×3</span>' : '') +
          '<a href="/producto/' + p.handle + '/"><img src="' + esc(img(p)) + '" alt="' + esc(p.title) + '" width="200" height="200" loading="lazy"></a>' +
          '<h3><a href="/producto/' + p.handle + '/">' + esc(p.title) + '</a></h3>' +
          '<p class="sel-short">' + esc((p.short || '').split('·')[0]) + '</p>' +
          '<p class="sel-precio">' + eur(precio(p)) + '</p>' +
          '<button class="btn btn-secundario btn-sm btn-bloque" type="button" data-anadir-uno="' + p.handle + '">Añadir</button>' +
          '</article>';
      };
      return '<section class="sel-res" aria-live="polite"><h2>Tu ritual</h2>' +
        '<div class="sel-grid">' + recs.map(function (x) { return tarjeta(x, false); }).join('') + (cuarto ? tarjeta(cuarto, true) : '') + '</div>' +
        (todos.length === 4
          ? '<div class="sel-total"><p><s>' + eur(t.total) + '</s> <strong>' + eur(t.pagas) + '</strong> los 4 con el 4×3</p>' +
            '<button class="btn btn-primario" type="button" data-anadir-todos="' + todos.join(',') + '">Añadir los 4 al carrito</button></div>'
          : '<div class="sel-total"><button class="btn btn-primario" type="button" data-anadir-todos="' + todos.join(',') + '">Añadir al carrito</button></div>') +
        '<p class="sel-nota">Recomendaciones según el tipo de cabello o piel y el aroma de cada producto. ¿Dudas? Escríbenos y te ayudamos a elegir.</p>' +
        '</section>';
    }
    cont.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-zona')) { st.zona = b.getAttribute('data-zona'); st.busca = ''; st.aroma = null; }
      else if (b.hasAttribute('data-busca')) { st.busca = b.getAttribute('data-busca'); st.aroma = null; }
      else if (b.hasAttribute('data-aroma')) { st.aroma = b.getAttribute('data-aroma'); }
      else if (b.hasAttribute('data-anadir-uno')) { anadirVarios([b.getAttribute('data-anadir-uno')]); return; }
      else if (b.hasAttribute('data-anadir-todos')) { anadirVarios(b.getAttribute('data-anadir-todos').split(',')); return; }
      else return;
      if (typeof saviaEvento === 'function') saviaEvento('selector_paso');
      render();
      var sig = cont.querySelector('.sel-res') || cont.querySelector('.sel-paso:last-of-type');
      if (sig && sig.scrollIntoView) sig.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    render();
  }

  window.SAVIA_RITUALES = { NECESIDADES: NECESIDADES, RITUALES: RITUALES, totales: totales };
  function iniciar() {
    var r = document.getElementById('rituales-lista'); if (r) pintarRituales(r);
    var s = document.getElementById('selector-ritual'); if (s) pintarSelector(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

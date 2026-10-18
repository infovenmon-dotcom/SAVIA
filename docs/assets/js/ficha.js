/* ===========================================================================
   SAVIA DE ALMA — Fichas (/producto/<handle>/) y paginas de familia en vivo
   La ficha es HTML estático (la genera tools/generar-fichas.js con el precio
   de products.js). Al cargar, se trae la config del panel y se actualiza:
     - el precio (cambios de precio, ofertas y descuentos por familia),
     - si está agotado o la tienda está de vacaciones (botón desactivado),
     - el precio del bloque de datos para Google (schema Product),
     - el carrito, que pasa a calcular con los mismos precios.
   Así lo que se ve en la ficha es lo mismo que en la tienda y en el cobro.
   =========================================================================== */
(function () {
  function eurFicha(n) { return Number(n).toFixed(2).replace('.', ',') + ' €'; }

  /* Paginas por familia: precio y boton de cada tarjeta. */
  function pintarTarjetas() {
    if (!window.SAVIA_DATA || typeof precioDe !== 'function') return;
    document.querySelectorAll('[data-precio-handle]').forEach(el => {
      const p = SAVIA_DATA.products.find(x => x.handle === el.dataset.precioHandle);
      if (!p || !tienePrecio(p)) return;
      const ahora = precioDe(p), antes = precioAntesDe(p);
      el.innerHTML = antes !== null
        ? `<span class="precio-antes">${eurFicha(antes)}</span> <span class="precio-ahora">${eurFicha(ahora)}</span>`
        : eurFicha(ahora);
    });
    document.querySelectorAll('[data-comprar-handle]').forEach(btn => {
      const p = SAVIA_DATA.products.find(x => x.handle === btn.dataset.comprarHandle);
      if (!p || !estaAgotado(p)) return;
      btn.disabled = true;
      btn.removeAttribute('onclick');
      btn.className = 'btn btn-secundario btn-sm btn-bloque';
      btn.textContent = enVacaciones() ? 'Volvemos pronto' : 'Agotado';
    });
  }

  function pintarFicha() {
    pintarTarjetas();
    const el = document.getElementById('ficha-precio');
    if (!el || !window.SAVIA_DATA) { if (window.Carrito && typeof Carrito.render === 'function') Carrito.render(); return; }
    const p = SAVIA_DATA.products.find(x => x.handle === el.dataset.handle);
    if (!p) return;

    if (typeof tienePrecio === 'function' && tienePrecio(p)) {
      const ahora = precioDe(p);
      const antes = precioAntesDe(p);
      el.classList.remove('ficha-sin-precio');
      el.innerHTML = antes !== null
        ? `<span class="precio-antes">${eurFicha(antes)}</span> <span class="precio-ahora">${eurFicha(ahora)}</span> <span class="precio-dto">-${dtoPorcentaje(antes, ahora)}%</span>`
        : eurFicha(ahora);

      // Mismo precio en los datos estructurados que lee Google.
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const d = JSON.parse(s.textContent);
          if (d['@type'] === 'Product' && d.offers) {
            d.offers.price = ahora.toFixed(2);
            if (estaAgotado(p) && !p.proximamente) d.offers.availability = 'https://schema.org/OutOfStock';
            s.textContent = JSON.stringify(d);
          }
        } catch (e) { /* bloque ajeno: se deja como está */ }
      });
    }

    const btn = document.getElementById('ficha-comprar');
    if (btn && !p.proximamente && estaAgotado(p)) {
      btn.disabled = true;
      btn.removeAttribute('onclick');
      btn.className = 'btn btn-secundario btn-bloque';
      btn.textContent = enVacaciones() ? 'Volvemos pronto' : 'Agotado';
    }

    if (window.Carrito && typeof Carrito.render === 'function') Carrito.render();
  }

  /* Opiniones de compradores verificados de la web (aprobadas en el panel).
     Se pintan en la ficha y se añaden al bloque de datos para Google
     (aggregateRating + review): son opiniones recogidas aquí, de clientes
     reales, que es lo que Google admite. */
  async function pintarOpiniones() {
    const caja = document.getElementById('opiniones-web');
    const ep = ((window.SAVIA_CONFIG || {}).checkoutEndpoint || '').trim().replace(/\/+$/, '');
    if (!caja || !ep) return;
    let todas = {};
    try { todas = await (await fetch(ep + '/opiniones')).json(); } catch (e) { return; }
    // Las mejores primero (más estrellas y, a igualdad, la más reciente).
    const ops = ((todas && todas[caja.dataset.handle]) || []).slice().sort((x, y) => (y.r - x.r) || (y.ts - x.ts));
    if (!ops.length) return;
    const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const media = ops.reduce((a, o) => a + o.r, 0) / ops.length;
    const estrellas = r => '★'.repeat(r) + '☆'.repeat(5 - r);
    caja.innerHTML = `<h2>⭐ Opiniones de nuestros clientes</h2>
      <p class="op-media"><span class="resena-estrellas">${estrellas(Math.round(media))}</span> <strong>${media.toFixed(1).replace('.', ',')}</strong> de 5 · ${ops.length} ${ops.length > 1 ? 'opiniones' : 'opinión'} de compradores verificados</p>` +
      ops.map((o, i) => `<div class="fr-item"${i >= 3 ? ' hidden' : ''}><div class="resena-estrellas">${estrellas(o.r)}</div><p>“${esc(o.t)}”</p><cite>— ${esc(o.n)} · compra verificada</cite></div>`).join('') +
      (ops.length > 3 ? `<button type="button" class="btn btn-secundario btn-sm op-mas">Ver las ${ops.length} opiniones</button>` : '') +
      `<p class="op-nota">Solo pueden opinar quienes han comprado en esta web.</p>`;
    const mas = caja.querySelector('.op-mas');
    if (mas) mas.addEventListener('click', () => { caja.querySelectorAll('.fr-item[hidden]').forEach(x => { x.hidden = false; }); mas.remove(); });
    caja.hidden = false;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const d = JSON.parse(s.textContent);
        if (d['@type'] !== 'Product') return;
        d.aggregateRating = { '@type': 'AggregateRating', ratingValue: media.toFixed(1), reviewCount: ops.length, bestRating: 5, worstRating: 1 };
        d.review = ops.slice(0, 10).map(o => ({
          '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: o.r, bestRating: 5 },
          author: { '@type': 'Person', name: o.n }, reviewBody: o.t,
          datePublished: new Date(o.ts * 1000).toISOString().slice(0, 10),
        }));
        s.textContent = JSON.stringify(d);
      } catch (e) { /* */ }
    });
  }

  async function iniciar() {
    if (typeof cargarConfigRemota === 'function') await cargarConfigRemota();
    pintarFicha();
    pintarOpiniones();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

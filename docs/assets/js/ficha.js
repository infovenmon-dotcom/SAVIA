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

  async function iniciar() {
    if (typeof cargarConfigRemota === 'function') await cargarConfigRemota();
    pintarFicha();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

/* ===========================================================================
   SAVIA DE ALMA — Ficha de producto (/producto/<handle>/) en vivo
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

  function pintarFicha() {
    const el = document.getElementById('ficha-precio');
    if (!el || !window.SAVIA_DATA) return;
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

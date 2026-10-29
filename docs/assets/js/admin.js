/* ===========================================================================
   SAVIA DE ALMA — Panel de control (admin.html)
   Lee/escribe la config (precio, oferta, stock, agotado, vacaciones) en el
   Cloudflare Worker. La contraseña solo vive en memoria de esta página.
   =========================================================================== */

const PRODUCTOS = (window.SAVIA_DATA && window.SAVIA_DATA.products) || [];
let CFG = {}; // última config cargada (precios/stock/…), para consultas del panel
let ENDPOINT = ((window.SAVIA_CONFIG && window.SAVIA_CONFIG.checkoutEndpoint) || '').trim();
let PASS = '';

function _base() { return ENDPOINT.replace(/\/+$/, ''); }
function eur(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _msg(el, txt, cls) { el.textContent = txt; el.className = 'msg ' + (cls || ''); el.classList.remove('oculto'); }

document.addEventListener('DOMContentLoaded', () => {
  const ep = document.getElementById('endpoint');
  if (ep && ENDPOINT) ep.value = ENDPOINT;
  document.getElementById('pass').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
});

async function entrar() {
  const lm = document.getElementById('login-msg');
  ENDPOINT = (document.getElementById('endpoint').value || '').trim();
  PASS = document.getElementById('pass').value || '';
  if (!ENDPOINT) { _msg(lm, 'Falta la dirección del servidor (Worker).', 'err'); return; }
  if (!PASS) { _msg(lm, 'Escribe la contraseña.', 'err'); return; }
  lm.classList.add('oculto');
  // Validar la contraseña ANTES de abrir el panel.
  try {
    const chk = await fetch(_base() + '/admin/check', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    if (chk.status === 401) { _msg(lm, 'Contraseña incorrecta.', 'err'); return; }
    if (!chk.ok) { _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return; }
  } catch (e) {
    _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return;
  }
  await cargar(true);
}

/* Cambiar entre pestañas */
function mostrarTab(t) {
  ['prod', 'envios', 'cuentas', 'beneficio', 'facturas', 'embudo', 'mensajes', 'opiniones'].forEach(x => {
    document.getElementById('tab-' + x).classList.toggle('oculto', x !== t);
    document.getElementById('tb-' + x).classList.toggle('activo', x === t);
  });
  if (t === 'envios') { manInit(); if (!ENVIOS.length) cargarEnvios(); }
  if (t === 'embudo' && !document.getElementById('em-desde').value) rangoEmbudo(7);
  if (t === 'mensajes') cargarMensajes();
  if (t === 'opiniones') cargarOpiniones();
}

/* ---------- Facturas ---------- */
const EMPRESA = {
  nombre: 'VENMON NATURALMENTE SL',
  marca: 'Savia de Alma',
  cif: 'B19399609',
  dir: 'Calle Gabriel Celaya 15 posterior, 28320 Pinto (Madrid)',
  email: 'info@saviadealma.com',
  web: 'saviadealma.com',
};
let FACTURAS = [];

function rangoMesF() {
  const n = new Date();
  document.getElementById('fa-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('fa-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  cargarFacturas();
}

async function cargarFacturas() {
  const msg = document.getElementById('fa-msg');
  const desde = document.getElementById('fa-desde').value;
  const hasta = document.getElementById('fa-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  _msg(msg, 'Buscando…', '');
  try {
    const r = await fetch(_base() + '/admin/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    FACTURAS = d.facturas || [];
    const T = document.getElementById('fa-tabla');
    if (!FACTURAS.length) { T.innerHTML = '<p class="nota">No hay facturas en ese periodo. (Se generan con cada pedido pagado, a partir de ahora.)</p>'; _msg(msg, '', ''); return; }
    T.innerHTML = `<table>
      <thead><tr><th>Nº factura</th><th>Fecha</th><th>Cliente</th><th>Total</th><th></th></tr></thead>
      <tbody>${FACTURAS.map(f => `<tr>
        <td>${f.num}</td><td>${f.fechaIso}</td><td>${(f.cliente && f.cliente.nombre) || '—'}</td>
        <td class="num">${_fmtEur(f.totalConIva)}</td>
        <td><button class="btn btn-secundario btn-sm" onclick="verFactura('${f.num}')">Ver / Imprimir</button>
          <button class="btn btn-sm" style="background:#f8d7da;color:#a12a2a;border:none" onclick="borrarFactura('${_esc(f.num)}', ${Number(f.ts) || 0})" title="Borrar factura de prueba">🗑</button></td>
      </tr>`).join('')}</tbody></table>`;
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudieron cargar: ' + e.message, 'err');
  }
}

async function borrarFactura(num, ts) {
  const msg = document.getElementById('fa-msg');
  if (!confirm('¿Borrar la factura ' + num + '?\n\nPensado para facturas de PRUEBA. Recuerda que en facturas reales conviene NO borrar (numeración legal).')) return;
  _msg(msg, 'Borrando…', '');
  try {
    const r = await fetch(_base() + '/admin/factura/borrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ num, ts }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    _msg(msg, '✔ Factura borrada', 'ok');
    setTimeout(cargarFacturas, 700);
  } catch (e) {
    _msg(msg, 'Error: ' + e.message, 'err');
  }
}

function verFactura(num) {
  const f = FACTURAS.find(x => x.num === num);
  if (!f) return;
  const cli = f.cliente || {};
  const lineasHtml = (f.lineas || []).map(l => `<tr>
    <td>${l.desc}</td><td style="text-align:center">${l.cant}</td><td style="text-align:right">${_fmtEur(l.importe)}</td>
  </tr>`).join('');
  const dirCli = (cli.direccion || '').replace(/\n/g, '<br>');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${f.num}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#222;max-width:760px;margin:24px auto;padding:0 18px;font-size:14px}
      .cab{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1D6B50;padding-bottom:14px}
      .cab .marca{display:flex;align-items:center;gap:12px}
      .cab .marca img{height:74px}
      .cab .marca .m-nom{color:#1D6B50;font-weight:800;font-size:24px;line-height:1}
      .cab .marca .m-sub{color:#8a9b6a;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-top:5px}
      .emp{font-size:11px;line-height:1.55;text-align:right;color:#777;max-width:230px}
      .emp .lbl{font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:#b3b3b3}
      .emp strong{color:#555;font-weight:600}
      h1{color:#1D6B50;font-size:22px;margin:18px 0 2px}
      .meta{color:#555;margin-bottom:18px}
      .bloques{display:flex;justify-content:space-between;gap:20px;margin:18px 0}
      .bloque{font-size:13px;line-height:1.5}
      .bloque h3{font-size:12px;text-transform:uppercase;color:#1D6B50;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{padding:8px;border-bottom:1px solid #eee}
      th{background:#f3f8f5;text-align:left;font-size:12px;text-transform:uppercase}
      .tot{margin-top:14px;margin-left:auto;width:280px}
      .tot tr td{border:none;padding:4px 8px}
      .tot .grand{font-weight:bold;font-size:16px;border-top:2px solid #1D6B50}
      .pie{margin-top:26px;font-size:11px;color:#888;text-align:center}
      @media print{ .noprint{display:none} body{margin:0} }
    </style></head><body>
    <div class="noprint" style="text-align:right;margin-bottom:10px">
      <button onclick="window.print()" style="padding:8px 16px;background:#1D6B50;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Imprimir / Guardar PDF</button>
    </div>
    <div class="cab">
      <div class="marca">
        <img src="https://${EMPRESA.web}/assets/img/logo-negro.png" alt="${EMPRESA.marca}">
        <div><div class="m-nom">${EMPRESA.marca}</div><div class="m-sub">Cosmética sólida natural</div></div>
      </div>
      <div class="emp"><span class="lbl">Datos fiscales del emisor</span><br><strong>${EMPRESA.nombre}</strong><br>CIF: ${EMPRESA.cif}<br>${EMPRESA.dir}<br>${EMPRESA.email}</div>
    </div>
    <h1>Factura</h1>
    <div class="meta">Nº <strong>${f.num}</strong> · Fecha: ${f.fechaIso}</div>
    <div class="bloques">
      <div class="bloque"><h3>Cliente</h3>${cli.nombre || '—'}<br>${dirCli || ''}${cli.email ? '<br>' + cli.email : ''}</div>
    </div>
    <table>
      <thead><tr><th>Concepto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Importe (IVA inc.)</th></tr></thead>
      <tbody>${lineasHtml}${f.envio ? `<tr><td>Gastos de envío</td><td style="text-align:center">1</td><td style="text-align:right">${_fmtEur(f.envio)}</td></tr>` : ''}</tbody>
    </table>
    <table class="tot">
      <tr><td>Base imponible</td><td style="text-align:right">${_fmtEur(f.base)}</td></tr>
      <tr><td>IVA (21%)</td><td style="text-align:right">${_fmtEur(f.iva)}</td></tr>
      <tr class="grand"><td>TOTAL</td><td style="text-align:right">${_fmtEur(f.totalConIva)}</td></tr>
    </table>
    <p class="pie">${EMPRESA.marca} · ${EMPRESA.nombre} · ${EMPRESA.web} · Factura simplificada.</p>
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para ver la factura.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

/* ---------- Beneficio ---------- */
function rangoMesB() {
  const n = new Date();
  document.getElementById('b-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('b-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  calcularBeneficio();
}
function rangoTrimestreB() {
  const n = new Date();
  const q = Math.floor(n.getMonth() / 3) * 3;
  document.getElementById('b-desde').value = _isoFecha(new Date(n.getFullYear(), q, 1));
  document.getElementById('b-hasta').value = _isoFecha(new Date(n.getFullYear(), q + 3, 0));
  calcularBeneficio();
}
function rangoAnioB() {
  const n = new Date();
  document.getElementById('b-desde').value = _isoFecha(new Date(n.getFullYear(), 0, 1));
  document.getElementById('b-hasta').value = _isoFecha(new Date(n.getFullYear(), 11, 31));
  calcularBeneficio();
}

async function calcularBeneficio() {
  const msg = document.getElementById('b-msg');
  const desde = document.getElementById('b-desde').value;
  const hasta = document.getElementById('b-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  const ivaSoportado = parseFloat(document.getElementById('b-ivasop').value) || 0;
  const costeEnvioPorPedido = parseFloat(document.getElementById('b-envio').value) || 0;
  const fuelEl = document.getElementById('b-fuel');
  const recargoCombustible = (fuelEl && fuelEl.value !== '') ? (parseFloat(fuelEl.value) || 0) : 8;
  _msg(msg, 'Calculando…', '');
  try {
    const r = await fetch(_base() + '/admin/beneficio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta, ivaSoportado, costeEnvioPorPedido, recargoCombustible }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    pintarBeneficio(d);
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudo calcular: ' + e.message, 'err');
  }
}

function pintarBeneficio(d) {
  const margenColor = (d.margen || 0) >= 0 ? 'var(--verde-oscuro)' : '#C0392B';
  document.getElementById('b-resumen').innerHTML = `<div class="fila-top" style="gap:24px;align-items:flex-start">
    <div><div class="nota">Ventas (sin IVA)</div><strong style="font-size:1.15rem">${_fmtEur(d.base || 0)}</strong></div>
    <div><div class="nota">Coste de lo vendido</div><strong style="font-size:1.15rem">${_fmtEur(d.cogs || 0)}</strong></div>
    <div><div class="nota">Comisiones Stripe</div><strong style="font-size:1.15rem">${_fmtEur(d.comisiones || 0)}</strong></div>
    <div><div class="nota">Coste de envíos${d.envioEstimado ? ' (estimado)' : ' (fijo)'}${d.pedidos ? ' · ' + d.pedidos + ' ped.' : ''}</div><strong style="font-size:1.15rem">${_fmtEur(d.costeEnvios || 0)}</strong></div>
    ${d.costeEmbalaje ? `<div><div class="nota">Embalaje (caja+lazo)${(d.cajasPeq || d.cajasGrande) ? ' · ' + (d.cajasPeq || 0) + ' peq + ' + (d.cajasGrande || 0) + ' gr' : ''}</div><strong style="font-size:1.15rem">${_fmtEur(d.costeEmbalaje || 0)}</strong></div>` : ''}
    <div><div class="nota">MARGEN / BENEFICIO</div><strong style="font-size:1.3rem;color:${margenColor}">${_fmtEur(d.margen || 0)}</strong></div>
  </div>
  <div class="fila-top" style="gap:24px;margin-top:14px;align-items:flex-start">
    <div><div class="nota">IVA repercutido (cobrado en ventas)</div><strong>${_fmtEur(d.ivaRepercutido || 0)}</strong></div>
    <div><div class="nota">IVA soportado (de tus compras)</div><strong>${_fmtEur(d.ivaSoportado || 0)}</strong></div>
    <div style="background:#fbf1e6;border-radius:10px;padding:8px 12px"><div class="nota">IVA a ingresar a Hacienda ≈</div><strong style="font-size:1.25rem;color:#a6631b">${_fmtEur(d.ivaIngresar || 0)}</strong></div>
  </div>`;
  const pp = d.porProducto || [];
  const T = document.getElementById('b-tabla');
  if (!pp.length) {
    T.innerHTML = '<p class="nota" style="margin-top:14px">Sin pedidos registrados en ese periodo. (Solo cuentan los pedidos hechos a partir de ahora.)</p>';
    return;
  }
  const tot = pp.reduce((a, x) => {
    a.u += x.unidades || 0; a.ing += x.ingresoNeto || 0; a.cos += x.costeTotal || 0; a.ben += x.beneficio || 0; return a;
  }, { u: 0, ing: 0, cos: 0, ben: 0 });
  const totMargen = tot.ing > 0 ? Math.round((tot.ben / tot.ing) * 1000) / 10 : 0;
  const col = v => (v || 0) >= 0 ? 'var(--verde-oscuro)' : '#C0392B';
  T.innerHTML = `<table style="margin-top:16px">
    <thead><tr><th>Producto</th><th>Uds.</th><th>P. venta</th><th>Ingresos (s/IVA)</th><th>Coste</th><th>Beneficio</th><th>Margen</th></tr></thead>
    <tbody>${pp.map(x => `<tr>
      <td>${x.titulo || x.handle}</td>
      <td class="num">${x.unidades}</td>
      <td class="num">${_fmtEur(x.precioUnit || 0)}</td>
      <td class="num">${_fmtEur(x.ingresoNeto || 0)}</td>
      <td class="num">${_fmtEur(x.costeTotal || 0)}</td>
      <td class="num" style="color:${col(x.beneficio)};font-weight:600">${_fmtEur(x.beneficio || 0)}</td>
      <td class="num">${x.margenPct != null ? x.margenPct + '%' : '—'}</td>
    </tr>`).join('')}
    <tr style="border-top:2px solid #ddd;font-weight:700">
      <td>TOTAL</td><td class="num">${tot.u}</td><td class="num">—</td>
      <td class="num">${_fmtEur(tot.ing)}</td><td class="num">${_fmtEur(tot.cos)}</td>
      <td class="num" style="color:${col(tot.ben)}">${_fmtEur(tot.ben)}</td><td class="num">${totMargen}%</td>
    </tr></tbody></table>
    <p class="nota" style="margin-top:8px">Ingresos y beneficio por producto son <strong>orientativos</strong> (precio de venta actual, sin IVA, menos coste). No reparten las comisiones de Stripe ni gastos generales; el beneficio "oficial" del periodo es el <strong>MARGEN</strong> de arriba.</p>`;
}

/* Carga la config actual del servidor y pinta la tabla. */
async function cargar(esLogin) {
  const lm = document.getElementById('login-msg');
  let cfg = {};
  try {
    // Con contraseña, el panel pide la config COMPLETA (stock incluido), que
    // ya no viaja en el /config público. Sin ella, la pública (solo lectura).
    const r = PASS
      ? await fetch(_base() + '/admin/config-completa', { method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS }, cache: 'no-store' })
      : await fetch(_base() + '/config', { cache: 'no-store' });
    if (r.status === 401) throw new Error('Contraseña incorrecta');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    cfg = await r.json();
  } catch (e) {
    if (esLogin) { _msg(lm, 'No se pudo conectar con el servidor. Revisa la dirección.', 'err'); return; }
    _msg(document.getElementById('msg'), 'No se pudo cargar la config: ' + e.message, 'err');
    return;
  }
  // Los COSTES ya no viajan en el /config público (info sensible). Se piden
  // aparte con la contraseña, para pintar la columna "Coste" y el Beneficio.
  if (PASS) {
    try {
      const rc = await fetch(_base() + '/admin/costes', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
      });
      if (rc.ok) { const dc = await rc.json(); if (dc && dc.costes) cfg.costes = dc.costes; if (dc && dc.costeEmbalaje != null) cfg.costeEmbalaje = dc.costeEmbalaje; }
    } catch { /* si falla, la columna Coste sale vacía; no rompe nada */ }
  }
  CFG = cfg || {};
  document.getElementById('login').classList.add('oculto');
  document.getElementById('panel').classList.remove('oculto');
  pintar(cfg);
  rellenarSelectCompra();
}

/* Rellena el desplegable de "Registrar compra" con los productos. */
function rellenarSelectCompra() {
  const sel = document.getElementById('compra-prod');
  if (!sel || sel.options.length) return;
  sel.innerHTML = PRODUCTOS.map(p => `<option value="${p.handle}">${p.title}</option>`).join('');
}

/* Registra una compra: coste/ud = importe/cantidad, actualiza Coste y Stock. */
function registrarCompra() {
  const msg = document.getElementById('compra-msg');
  const h = document.getElementById('compra-prod').value;
  const cant = parseInt(document.getElementById('compra-cant').value, 10);
  const importe = parseFloat(document.getElementById('compra-importe').value);
  if (!h) { _msg(msg, 'Elige un producto.', 'err'); return; }
  if (!(cant > 0)) { _msg(msg, 'Cantidad no válida.', 'err'); return; }
  if (!(importe >= 0)) { _msg(msg, 'Importe no válido.', 'err'); return; }
  const costeCompra = importe / cant;

  const tr = document.querySelector(`#filas tr[data-handle="${h}"]`);
  if (!tr) { _msg(msg, 'Producto no encontrado en la tabla.', 'err'); return; }
  const costeEl = tr.querySelector('.f-coste');
  const stockEl = tr.querySelector('.f-stock');

  // Coste: media ponderada con el stock actual, o reemplazo directo.
  let nuevoCoste = costeCompra;
  const media = document.getElementById('compra-media').checked;
  const stockPrev = stockEl.value !== '' ? Number(stockEl.value) : null;
  const costePrev = costeEl.value !== '' ? Number(costeEl.value) : null;
  if (media && stockPrev !== null && stockPrev > 0 && costePrev !== null) {
    nuevoCoste = (stockPrev * costePrev + cant * costeCompra) / (stockPrev + cant);
  }
  costeEl.value = Math.round(nuevoCoste * 10000) / 10000;

  // Stock: sumar la cantidad recibida.
  if (document.getElementById('compra-stock').checked) {
    const base = stockEl.value !== '' && stockPrev !== null ? stockPrev : 0;
    stockEl.value = base + cant;
  }

  // Persistir (reutiliza el guardado de config) y avisar.
  _msg(msg, 'Guardando compra…', '');
  guardar().then(() => {
    _msg(msg, `✓ Compra registrada · coste/ud. ${_fmtEur(costeCompra)}${document.getElementById('compra-stock').checked ? ' · stock actualizado' : ''}`, 'ok');
    document.getElementById('compra-cant').value = '';
    document.getElementById('compra-importe').value = '';
  });
}

function pintar(cfg) {
  document.getElementById('vacaciones').checked = !!cfg.modoVacaciones;
  const rb = document.getElementById('regalo-bienvenida');
  if (rb) rb.checked = cfg.regaloBienvenida !== false;
  const cp = document.getElementById('coste-caja-peq');
  if (cp) cp.value = (cfg.costeCajaPeq != null && cfg.costeCajaPeq !== 0) ? cfg.costeCajaPeq : '';
  const cg = document.getElementById('coste-caja-grande');
  if (cg) cg.value = (cfg.costeCajaGrande != null && cfg.costeCajaGrande !== 0) ? cfg.costeCajaGrande : '';
  const uc = document.getElementById('umbral-caja-peq');
  if (uc) uc.value = (cfg.umbralCajaPeq != null && cfg.umbralCajaPeq !== 5) ? cfg.umbralCajaPeq : '';
  poblarNlProd();
  const precios = cfg.precios || {};
  const ofertas = cfg.ofertas || {};
  const stock = cfg.stock || {};
  const costes = cfg.costes || {};
  const agotados = cfg.agotados || [];

  const tbody = document.getElementById('filas');
  tbody.innerHTML = PRODUCTOS.map(p => {
    const precio = Object.prototype.hasOwnProperty.call(precios, p.handle) ? precios[p.handle] : p.price;
    const antes = Object.prototype.hasOwnProperty.call(ofertas, p.handle) ? ofertas[p.handle] : '';
    const stk = Object.prototype.hasOwnProperty.call(stock, p.handle) ? stock[p.handle] : '';
    const coste = Object.prototype.hasOwnProperty.call(costes, p.handle) ? costes[p.handle] : '';
    const ago = agotados.indexOf(p.handle) !== -1;
    return `<tr data-handle="${p.handle}" data-nombre="${(p.title || '').toLowerCase()}" data-collection="${p.collection || ''}">
      <td><div class="prod-nombre">${p.title}</div><div class="prod-handle">${p.handle}${p.exclusiveWeb ? ' · exclusivo web' : ''}</div></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-precio" value="${precio == null ? '' : precio}" data-base="${p.price == null ? '' : p.price}" placeholder="sin precio"></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-antes" value="${antes}" placeholder="—"></td>
      <td class="num"><input type="number" step="0.01" min="0" class="f-coste" value="${coste}" placeholder="—"></td>
      <td class="num f-margen" title="Margen sobre el precio sin IVA, ya con el descuento de la categoría">—</td>
      <td class="num"><input type="number" step="1" min="0" class="f-stock" value="${stk}" placeholder="∞"></td>
      <td><input type="checkbox" class="f-agotado" ${ago ? 'checked' : ''}></td>
    </tr>`;
  }).join('');
  poblarCategorias();
  pintarOfertasCategoria(cfg);
  recalcularMargenes();
  // Un solo oyente en cada contenedor: las filas se repintan y los oyentes
  // por casilla se perderian en cada recarga.
  const _t = document.getElementById('filas');
  if (_t && !_t.dataset.oyenteMargen) {
    _t.addEventListener('input', e => {
      if (e.target.closest('.f-precio, .f-coste')) recalcularMargenes();
    });
    _t.dataset.oyenteMargen = '1';
  }
  const _o = document.getElementById('ofertas-categoria');
  if (_o && !_o.dataset.oyenteMargen) {
    _o.addEventListener('input', e => { if (e.target.closest('.f-desc-cat')) recalcularMargenes(); });
    _o.dataset.oyenteMargen = '1';
  }
  filtrar();
  _msg(document.getElementById('msg'), '', '');
}

/* Pinta un control por categoría para las ofertas (% de descuento por familia). */
function pintarOfertasCategoria(cfg) {
  const cont = document.getElementById('ofertas-categoria');
  if (!cont) return;
  const dc = (cfg && cfg.descuentosCategoria) || {};
  const vistas = new Map();
  PRODUCTOS.forEach(p => { if (p.collection && !vistas.has(p.collection)) vistas.set(p.collection, p.collectionName || p.collection); });
  cont.innerHTML = [...vistas.entries()].map(([c, n]) => {
    const v = Object.prototype.hasOwnProperty.call(dc, c) ? dc[c] : '';
    return `<label style="display:inline-flex;align-items:center;gap:6px;background:#f6f6f2;border:1px solid #e2e2d8;border-radius:9px;padding:6px 10px">
      <span style="min-width:120px">${n}</span>
      <input type="number" min="0" max="90" step="1" class="f-desc-cat" data-collection="${c}" value="${v}" placeholder="0" style="width:64px;text-align:right"> %
    </label>`;
  }).join('');
}

/* ---------- Margen en vivo ----------
   Margen = (precio sin IVA - coste) / precio sin IVA, sobre el precio que se
   va a cobrar de verdad: el de la casilla MENOS el descuento de la categoria,
   redondeado igual que en la tienda. El "antes" de oferta no entra: es el
   precio tachado, no lo que cobras.
   El coste se mete tal y como se paga. En los articulos de Temu va con el IVA
   incluido porque no lo facturan y no se recupera; en los de proveedor con
   factura, neto. Asi el margen sale bueno en los dos casos. */
function _dtoDeCategoria() {
  const d = {};
  document.querySelectorAll('.f-desc-cat').forEach(el => {
    const v = parseFloat(el.value);
    if (isFinite(v) && v > 0 && v <= 90) d[el.dataset.collection] = v;
  });
  return d;
}
function recalcularMargenes() {
  const dc = _dtoDeCategoria();
  let suma = 0, n = 0;
  document.querySelectorAll('#filas tr').forEach(tr => {
    const celda = tr.querySelector('.f-margen');
    if (!celda) return;
    const precio = parseFloat(tr.querySelector('.f-precio').value);
    const coste = parseFloat(tr.querySelector('.f-coste').value);
    if (!isFinite(precio) || precio <= 0 || !isFinite(coste)) {
      // Decir que falta, no una raya muda: la duda tipica es por que no sale.
      celda.innerHTML = `<span class="nota">falta ${!isFinite(coste) ? 'el coste' : 'el precio'}</span>`;
      celda.style.color = '#9a9a90';
      celda.title = 'Escribe el coste y el margen aparece al momento, antes de guardar';
      return;
    }
    const pct = dc[tr.dataset.collection] || 0;
    const efectivo = pct ? Math.round(precio * (1 - pct / 100) * 100) / 100 : precio;
    const sinIva = efectivo / 1.21;
    const eur = sinIva - coste;
    const margen = (eur / sinIva) * 100;
    celda.innerHTML = `<strong>${margen.toFixed(0)} %</strong><br><span class="nota">${eur.toFixed(2).replace('.', ',')} €${pct ? ' · −' + pct + '%' : ''}</span>`;
    // El verde es para el dinero que entra; el rojo, para el que se va.
    celda.style.color = eur < 0 ? '#b3261e' : margen >= 70 ? '#1d6b50' : margen >= 55 ? '#8a6d1f' : '#b3261e';
    celda.title = `Precio cobrado ${efectivo.toFixed(2)} € · sin IVA ${sinIva.toFixed(2)} € · coste ${coste.toFixed(2)} €`;
    suma += margen; n++;
  });
  const res = document.getElementById('margen-resumen');
  if (res) res.textContent = n ? `Margen medio de los ${n} productos con coste y precio: ${(suma / n).toFixed(1)} %` : '';
}

function filtrar() {
  const q = (document.getElementById('buscador').value || '').toLowerCase().trim();
  const catEl = document.getElementById('cat-filtro');
  const cat = catEl ? catEl.value : '';
  document.querySelectorAll('#filas tr').forEach(tr => {
    const okTexto = !q || tr.dataset.nombre.indexOf(q) !== -1;
    const okCat = !cat || tr.dataset.collection === cat;
    tr.classList.toggle('oculto', !(okTexto && okCat));
  });
}

/* Rellena el desplegable de categorías con las colecciones que tienen producto. */
function poblarCategorias() {
  const sel = document.getElementById('cat-filtro');
  if (!sel) return;
  const vistas = new Map();
  PRODUCTOS.forEach(p => {
    if (p.collection && !vistas.has(p.collection)) vistas.set(p.collection, p.collectionName || p.collection);
  });
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    [...vistas.entries()].map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
}

/* Reúne los valores de la tabla y los guarda en el servidor. */
async function guardar() {
  const msg = document.getElementById('msg');
  const _rb = document.getElementById('regalo-bienvenida');
  const _cp = document.getElementById('coste-caja-peq');
  const _cg = document.getElementById('coste-caja-grande');
  const _uc = document.getElementById('umbral-caja-peq');
  const cfg = { modoVacaciones: document.getElementById('vacaciones').checked, regaloBienvenida: _rb ? _rb.checked : true, costeCajaPeq: _cp ? (parseFloat(_cp.value) || 0) : 0, costeCajaGrande: _cg ? (parseFloat(_cg.value) || 0) : 0, umbralCajaPeq: _uc ? (parseInt(_uc.value, 10) || 5) : 5, agotados: [], stock: {}, precios: {}, ofertas: {}, costes: {}, descuentosCategoria: {} };

  document.querySelectorAll('.f-desc-cat').forEach(inp => {
    const c = inp.dataset.collection;
    const v = parseFloat(inp.value);
    if (c && isFinite(v) && v > 0 && v <= 90) cfg.descuentosCategoria[c] = Math.round(v);
  });

  document.querySelectorAll('#filas tr').forEach(tr => {
    const h = tr.dataset.handle;
    const precioEl = tr.querySelector('.f-precio');
    const antesEl = tr.querySelector('.f-antes');
    const costeEl = tr.querySelector('.f-coste');
    const stockEl = tr.querySelector('.f-stock');
    const agoEl = tr.querySelector('.f-agotado');

    const base = Number(precioEl.dataset.base);
    const precio = parseFloat(precioEl.value);
    if (isFinite(precio) && precio >= 0 && Math.abs(precio - base) > 0.0001) cfg.precios[h] = precio;

    const antes = parseFloat(antesEl.value);
    if (isFinite(antes) && antes > 0) cfg.ofertas[h] = antes;

    const coste = parseFloat(costeEl.value);
    if (isFinite(coste) && coste >= 0 && costeEl.value !== '') cfg.costes[h] = coste;

    if (stockEl.value !== '' && isFinite(Number(stockEl.value))) cfg.stock[h] = Math.max(0, Math.floor(Number(stockEl.value)));

    if (agoEl.checked) cfg.agotados.push(h);
  });

  _msg(msg, 'Guardando…', '');
  try {
    const r = await fetch(_base() + '/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify(cfg),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data && data.config) pintar(data.config);
    _msg(msg, '✓ Cambios guardados. La web se actualiza en unos segundos.', 'ok');
  } catch (e) {
    _msg(msg, 'No se pudo guardar: ' + e.message, 'err');
  }
}

/* ---------- Newsletter (correo semanal) ---------- */
function poblarNlProd() {
  const sel = document.getElementById('nl-prod');
  if (!sel || sel.options.length > 1) return;
  sel.insertAdjacentHTML('beforeend', PRODUCTOS.filter(p => !p.proximamente)
    .map(p => `<option value="${p.handle}">${p.title}</option>`).join(''));
}
async function _nlPost(payload, okMsg) {
  const msg = document.getElementById('nl-msg');
  _msg(msg, 'Enviando…', '');
  try {
    const r = await fetch(_base() + '/admin/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify(payload),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return null; }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
    _msg(msg, okMsg(data), 'ok');
    return data;
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); return null; }
}
function nlGuardar() {
  const h = document.getElementById('nl-prod').value;
  const override = h ? { tipo: 'producto', handle: h } : { tipo: 'auto' };
  _nlPost({ accion: 'guardar', override }, () => h
    ? '✓ Producto de la semana fijado para el próximo envío.'
    : '✓ Vuelta a la rotación automática.');
}
function nlTest() {
  const to = (document.getElementById('nl-test-email').value || '').trim();
  if (!to) { _msg(document.getElementById('nl-msg'), 'Escribe un correo para la prueba.', 'err'); return; }
  _nlPost({ accion: 'test', to }, (d) => d.enviados
    ? ('✓ Prueba enviada a ' + to)
    : ('No se pudo enviar: ' + (d.motivo || 'revisa el proveedor de email')));
}
function nlEnviarYa() {
  if (!confirm('¿Enviar el correo semanal AHORA a todos los suscriptores?')) return;
  _nlPost({ accion: 'enviar_ya' }, (d) => `✓ En cola para ${d.encolados || 0} suscriptores: sale por tandas en las próximas horas.`);
}
/* Estado de la cola de correos y envío manual por tandas (por si el
   temporizador de Cloudflare no estuviera activo). */
async function nlCola(enviar) {
  const msg = document.getElementById('nl-msg') || document.getElementById('nl-subs-msg');
  try {
    let d = await _postAdmin('/admin/newsletter', { accion: enviar ? 'procesar_cola' : 'cola' });
    const est = enviar ? d.estado : d;
    const t = (est.trabajos || []).map(j => `${j.tpl}: ${j.pos}/${j.total} (${j.enviados} enviados, ${j.fallos} fallos)`).join(' · ') || 'sin envíos en cola';
    const p = (est.programados || []).map(x => `${x.id} ${x.hecho ? '✔' : new Date(x.cuando).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`).join(' · ');
    if (msg) _msg(msg, `📬 Cola: ${t}. Programados: ${p}.`, 'ok');
    if (enviar && (est.trabajos || []).length && confirm('Tanda enviada. ¿Mandar la siguiente dentro de 1 minuto? (deja esta pestaña abierta)')) setTimeout(() => nlCola(true), 60000);
  } catch (e) { if (msg) _msg(msg, 'Error: ' + e.message, 'err'); }
}
window.nlCola = nlCola;

/* ---------- Sorteo Black Friday ---------- */
async function sorteoVer() {
  const m = document.getElementById('sorteo-msg');
  try {
    const d = await _postAdmin('/admin/sorteo', {});
    const g = document.getElementById('sorteo-ganador'); if (g && d.ganador && !g.value) g.value = d.ganador;
    _msg(m, `👥 ${d.personas} suscritos participan · ${d.participaciones} participaciones (Instagram: ${d.conIg} · TikTok: ${d.conTt} · por la página: ${d.viaPagina})${d.ganador ? ' · Ganador guardado: ' + d.ganador : ''}`, 'ok');
  } catch (e) { _msg(m, 'Error: ' + e.message, 'err'); }
}
function _descargar(nombre, texto) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
}
async function sorteoDescargar() {
  const m = document.getElementById('sorteo-msg');
  try {
    const d = await _postAdmin('/admin/sorteo', { accion: 'csv' });
    if (!d.personas) { _msg(m, 'Aún no hay participantes.', 'err'); return; }
    _descargar('sorteo-para-lanzo.txt', d.lanzo);
    _descargar('sorteo-clave-PRIVADO.csv', 'alias, email, instagram, tiktok\n' + d.clave);
    _msg(m, `✓ Descargados 2 archivos: «sorteo-para-lanzo.txt» (pégalo en Lanzo → Importación manual; sin emails) y «sorteo-clave-PRIVADO.csv» (para saber quién es el ganador; no lo compartas). ${d.participaciones} participaciones de ${d.personas} personas.`, 'ok');
  } catch (e) { _msg(m, 'Error: ' + e.message, 'err'); }
}
async function sorteoGanador() {
  const m = document.getElementById('sorteo-msg');
  const v = (document.getElementById('sorteo-ganador').value || '').trim();
  if (v && !confirm(`¿Guardar «${v}» como ganador? Saldrá en el correo de acceso anticipado.`)) return;
  try {
    const d = await _postAdmin('/admin/sorteo', { accion: 'ganador', ganador: v });
    _msg(m, d.ganador ? `✓ Ganador guardado: ${d.ganador}. Saldrá en el correo del 10/11.` : '✓ Ganador borrado: el correo dirá que se anuncia en redes.', 'ok');
  } catch (e) { _msg(m, 'Error: ' + e.message, 'err'); }
}
window.sorteoVer = sorteoVer; window.sorteoDescargar = sorteoDescargar; window.sorteoGanador = sorteoGanador;

async function verSuscriptores() {
  const msg = document.getElementById('nl-subs-msg');
  const cont = document.getElementById('nl-subs');
  _msg(msg, 'Cargando…', '');
  try {
    const r = await fetch(_base() + '/admin/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ accion: 'suscriptores' }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    const subs = d.suscriptores || [];
    _msg(msg, subs.length + ' suscriptor(es)', 'ok');
    if (!subs.length) { cont.innerHTML = '<p class="nota">Aún no hay suscriptores a la newsletter.</p>'; return; }
    const fecha = ts => ts ? new Date(Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts)).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
    cont.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:.86rem">' +
      '<tr><th style="text-align:left;padding:4px 0;border-bottom:1px solid #ddd">Email</th>' +
      '<th style="text-align:left;padding:4px 0;border-bottom:1px solid #ddd">Origen</th>' +
      '<th style="text-align:right;padding:4px 0;border-bottom:1px solid #ddd">Alta</th></tr>' +
      subs.map(s => `<tr><td style="padding:4px 0;border-bottom:1px solid #f0f0f0">${_esc(s.email)}</td>` +
        `<td style="padding:4px 6px;border-bottom:1px solid #f0f0f0" class="nota">${_esc(s.origen || 'Formulario de la portada')}</td>` +
        `<td style="padding:4px 0;text-align:right;border-bottom:1px solid #f0f0f0" class="nota">${fecha(s.ts)}</td></tr>`).join('') +
      '</table>';
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); }
}
async function resetCliente() {
  const msg = document.getElementById('reset-msg');
  const email = (document.getElementById('reset-email').value || '').trim();
  if (!email) { _msg(msg, 'Escribe un email.', 'err'); return; }
  if (!confirm('¿Resetear el regalo de bienvenida para ' + email + '? (solo para pruebas)')) return;
  _msg(msg, 'Reseteando…', '');
  try {
    const r = await fetch(_base() + '/admin/reset-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ email }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) throw new Error(data.error || ('HTTP ' + r.status));
    _msg(msg, '✓ Reseteado. Ese email volverá a recibir el regalo en su próximo pedido.', 'ok');
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); }
}

/* ---------- Centro de cuentas ---------- */
let MOVIMIENTOS = [];
function _fmtEur(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function _isoFecha(d) { return d.toISOString().slice(0, 10); }

function rangoMes() {
  const n = new Date();
  document.getElementById('c-desde').value = _isoFecha(new Date(n.getFullYear(), n.getMonth(), 1));
  document.getElementById('c-hasta').value = _isoFecha(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  calcularCuentas();
}
function rangoTrim() {
  const n = new Date();
  const q = Math.floor(n.getMonth() / 3);
  document.getElementById('c-desde').value = _isoFecha(new Date(n.getFullYear(), q * 3, 1));
  document.getElementById('c-hasta').value = _isoFecha(new Date(n.getFullYear(), q * 3 + 3, 0));
  calcularCuentas();
}

async function calcularCuentas() {
  const msg = document.getElementById('c-msg');
  const desde = document.getElementById('c-desde').value;
  const hasta = document.getElementById('c-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  _msg(msg, 'Calculando…', '');
  try {
    const r = await fetch(_base() + '/admin/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    MOVIMIENTOS = d.movimientos || [];
    pintarCuentas(d.resumen || {}, MOVIMIENTOS);
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudo calcular: ' + e.message, 'err');
  }
}

function pintarCuentas(res, movs) {
  const R = document.getElementById('c-resumen');
  R.innerHTML = `<div class="fila-top" style="gap:24px;align-items:flex-start">
    <div><div class="nota">Pedidos</div><strong style="font-size:1.15rem">${res.pedidos || 0}</strong></div>
    <div><div class="nota">Ventas (IVA incl.)</div><strong style="font-size:1.15rem">${_fmtEur(res.ventasBrutas || 0)}</strong></div>
    <div><div class="nota">Base imponible</div><strong style="font-size:1.15rem">${_fmtEur(res.base || 0)}</strong></div>
    <div><div class="nota">IVA (21%)</div><strong style="font-size:1.15rem">${_fmtEur(res.iva || 0)}</strong></div>
    <div><div class="nota">Comisiones Stripe</div><strong style="font-size:1.15rem">${_fmtEur(res.comisiones || 0)}</strong></div>
    <div><div class="nota">Neto recibido</div><strong style="font-size:1.15rem;color:var(--verde-oscuro)">${_fmtEur(res.neto || 0)}</strong></div>
  </div>`;
  const T = document.getElementById('c-tabla');
  if (!movs.length) {
    T.innerHTML = '<p class="nota" style="margin-top:14px">Sin movimientos en ese periodo.</p>';
    document.getElementById('c-export').classList.add('oculto');
    return;
  }
  T.innerHTML = `<table style="margin-top:16px">
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Bruto</th><th>Comisión</th><th>Neto</th></tr></thead>
    <tbody>${movs.map(m => `<tr>
      <td>${m.fecha}</td><td>${m.tipo}</td><td>${m.descripcion || ''}</td>
      <td class="num">${_fmtEur(m.bruto)}</td><td class="num">${_fmtEur(m.comision)}</td><td class="num">${_fmtEur(m.neto)}</td>
    </tr>`).join('')}</tbody></table>`;
  document.getElementById('c-export').classList.remove('oculto');
}

function exportarCSV() {
  if (!MOVIMIENTOS.length) return;
  const cab = ['Fecha', 'Tipo', 'Descripcion', 'Bruto', 'Comision', 'Neto'];
  const rows = MOVIMIENTOS.map(m => [
    m.fecha, m.tipo, '"' + String(m.descripcion || '').replace(/"/g, '""') + '"',
    Number(m.bruto).toFixed(2), Number(m.comision).toFixed(2), Number(m.neto).toFixed(2),
  ].join(';'));
  const csv = [cab.join(';'), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cuentas-saviadealma.csv';
  a.click();
}

window.entrar = entrar;
window.cargar = cargar;
window.guardar = guardar;
window.filtrar = filtrar;
window.calcularCuentas = calcularCuentas;
window.rangoMes = rangoMes;
window.rangoTrim = rangoTrim;
window.exportarCSV = exportarCSV;
window.mostrarTab = mostrarTab;
window.calcularBeneficio = calcularBeneficio;
window.rangoMesB = rangoMesB;
window.registrarCompra = registrarCompra;
window.cargarFacturas = cargarFacturas;
window.rangoMesF = rangoMesF;
window.verFactura = verFactura;

/* ---------- Envíos (CTT) ---------- */
let ENVIOS = [];
let CTT_OK = false;
let CTT_ENTORNO = '';

function _fechaCorta(ts) {
  if (!ts) return '—';
  const n = Number(ts);
  const d = new Date(n > 1e12 ? n : n * 1000);   // los envíos manuales guardan milisegundos
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function _dirTexto(e) {
  return [e.line1, e.line2, [e.cp, e.ciudad].filter(Boolean).join(' '), e.provincia]
    .filter(Boolean).join(', ');
}
function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

async function cargarEnvios() {
  const msg = document.getElementById('env-msg');
  const soloPendientes = document.getElementById('env-pend').checked;
  _msg(msg, 'Cargando…', '');
  try {
    const r = await fetch(_base() + '/admin/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ soloPendientes }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    ENVIOS = d.pedidos || [];
    CTT_OK = !!d.ctt;
    CTT_ENTORNO = d.cttEntorno || '';
    pintarEnvios();
    _msg(msg, ENVIOS.length ? ENVIOS.length + ' pedido(s)' : '', 'ok');
  } catch (e) {
    _msg(msg, 'No se pudieron cargar: ' + e.message, 'err');
  }
}

function pintarEnvios() {
  const T = document.getElementById('env-tabla');
  // Si CTT no apunta a produccion, las etiquetas salen igual pero el envio NO
  // existe de verdad: se declara en el simulador y no aparece en su panel.
  const avisoCtt = (CTT_ENTORNO && CTT_ENTORNO !== 'produccion')
    ? '<div class="admin-caja" style="background:#fdecea;border:1px solid #c0392b;margin-bottom:12px">'
      + '<strong style="color:#c0392b">⚠️ CTT en modo ' + CTT_ENTORNO + '</strong>'
      + '<div class="nota">Las etiquetas se generan, pero los envíos NO llegan al panel de CTT ni se recogen. '
      + 'Revisa la variable <code>CTT_BASE_URL</code> en Cloudflare (debe ser https://api.cttexpress.com).</div></div>'
    : '';
  if (!ENVIOS.length) {
    T.innerHTML = avisoCtt + '<p class="nota">No hay pedidos ' + (document.getElementById('env-pend').checked ? 'pendientes' : '') + '. (Aparecerán aquí en cuanto entre una venta pagada.)</p>';
    return;
  }
  T.innerHTML = avisoCtt + ENVIOS.map((p, i) => {
    const e = p.envio || {};
    const prods = (p.lineas || []).map(l => l.cantidad + '× ' + _esc(l.titulo)).join('<br>');
    const dir = _esc(_dirTexto(e));
    const tel = _esc(e.telefono || '');
    const badge = p.enviado
      ? '<span class="pill" style="background:#e6f4ea;color:#1D6B50">✔ Enviado</span>'
      : '<span class="pill">Pendiente</span>';
    return `<div class="admin-caja" style="margin-bottom:12px">
      <div class="fila-top" style="justify-content:space-between">
        <div><strong>${_esc(e.nombre || '—')}</strong> · ${_fechaCorta(p.fecha)} ${badge}</div>
        <div class="nota">${p.total != null ? _fmtEur(p.total) : ''}</div>
      </div>
      ${(p.origen || p.codigo || p.primerPedido != null) ? `<div class="nota" style="margin-top:4px">📍 Llegó por: <strong>${_esc(p.origen || 'sin dato')}</strong>${p.campana ? ' (' + _esc(p.campana) + ')' : ''} · 🏷️ Código: <strong>${_esc(p.codigo || 'ninguno')}</strong>${p.primerPedido === true ? ' · 🆕 primer pedido' : (p.primerPedido === false ? ' · 🔁 repite' : '')}</div>` : ''}
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:6px;font-size:.86rem">
        <div style="min-width:240px">
          <div>${dir || '—'}</div>
          <div>${tel ? '📞 ' + tel : '<span class="nota">sin teléfono</span>'}</div>
          <div class="nota">${_esc(e.email || '')}</div>
        </div>
        <div style="min-width:160px">${prods}</div>
      </div>
      <div class="fila-top" style="margin-top:10px">
        ${CTT_OK ? `<button class="btn btn-primario btn-sm" onclick="crearEtiquetaCTT(${i})">${p.tracking ? '🖨️ Reimprimir etiqueta' : '🏷️ Crear etiqueta CTT'}</button>` : ''}
        <button class="btn btn-secundario btn-sm" onclick="copiarEnvio(${i})">📋 Copiar datos</button>
        <input type="text" id="trk-${i}" placeholder="Nº seguimiento CTT" value="${_esc(p.tracking || '')}" style="max-width:200px">
        <label style="font-size:.8rem"><input type="checkbox" id="avi-${i}" checked> Avisar al cliente</label>
        <button class="btn btn-secundario btn-sm" onclick="guardarTracking(${i})">${p.enviado ? 'Actualizar' : 'Marcar enviado'}</button>
        <button class="btn btn-sm" style="background:#f8d7da;color:#a12a2a;border:none" onclick="borrarPedido(${i})" title="Borrar pedido de prueba y devolver stock">🗑 Borrar</button>
        <span class="msg" id="env-r-${i}"></span>
      </div>
    </div>`;
  }).join('');
}

async function borrarPedido(i) {
  const p = ENVIOS[i]; if (!p) return;
  const e = p.envio || {};
  if (!confirm('¿Borrar este pedido de ' + (e.nombre || '—') + (p.total != null ? ' (' + _fmtEur(p.total) + ')' : '') + '?\n\nSe DEVOLVERÁ el stock de sus productos y dejará de contar en el beneficio. Pensado para pedidos de PRUEBA.')) return;
  const r = document.getElementById('env-r-' + i);
  _msg(r, 'Borrando…', '');
  try {
    const resp = await fetch(_base() + '/admin/pedido/borrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ clave: p.clave, restaurarStock: true }),
    });
    if (resp.status === 401) { _msg(r, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    _msg(r, '✔ Pedido borrado' + (d.stockRestaurado ? ' · stock devuelto' : ''), 'ok');
    setTimeout(cargarEnvios, 700);
  } catch (err) {
    _msg(r, 'Error: ' + err.message, 'err');
  }
}

function copiarEnvio(i) {
  const p = ENVIOS[i]; if (!p) return;
  const e = p.envio || {};
  const txt = [
    'Nombre: ' + (e.nombre || ''),
    'Dirección: ' + (e.line1 || '') + (e.line2 ? ', ' + e.line2 : ''),
    'CP: ' + (e.cp || ''),
    'Población: ' + (e.ciudad || ''),
    'Provincia: ' + (e.provincia || ''),
    'País: ' + (e.pais || 'ES'),
    'Teléfono: ' + (e.telefono || ''),
    'Email: ' + (e.email || ''),
    'Bultos: 1',
    'Contenido: ' + (p.lineas || []).map(l => l.cantidad + 'x ' + l.titulo).join(', '),
  ].join('\n');
  const done = () => _msg(document.getElementById('env-r-' + i), '¡Copiado!', 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
  else { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }
}

async function guardarTracking(i) {
  const p = ENVIOS[i]; if (!p) return;
  const r = document.getElementById('env-r-' + i);
  const tracking = (document.getElementById('trk-' + i).value || '').trim();
  const avisar = document.getElementById('avi-' + i).checked;
  _msg(r, 'Guardando…', '');
  try {
    const resp = await fetch(_base() + '/admin/envio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ clave: p.clave, tracking, avisar }),
    });
    if (resp.status === 401) { _msg(r, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const d = await resp.json();
    p.tracking = tracking; p.enviado = true;
    _msg(r, d.avisado ? '✔ Enviado y cliente avisado' : '✔ Marcado como enviado', 'ok');
    if (document.getElementById('env-pend').checked) setTimeout(cargarEnvios, 900);
  } catch (e) {
    _msg(r, 'Error: ' + e.message, 'err');
  }
}

function exportarEnviosCSV() {
  if (!ENVIOS.length) { _msg(document.getElementById('env-msg'), 'Carga los pedidos primero.', 'err'); return; }
  const cab = ['Nombre', 'Direccion', 'CP', 'Poblacion', 'Provincia', 'Pais', 'Telefono', 'Email', 'Bultos', 'Peso_kg', 'Referencia', 'Contenido'];
  const filas = ENVIOS.map(p => {
    const e = p.envio || {};
    const ref = (p.id || '').slice(-10);
    const cont = (p.lineas || []).map(l => l.cantidad + 'x ' + l.titulo).join(' | ');
    return [e.nombre, (e.line1 || '') + (e.line2 ? ' ' + e.line2 : ''), e.cp, e.ciudad, e.provincia, e.pais || 'ES', e.telefono, e.email, 1, 0.5, ref, cont]
      .map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';');
  });
  const csv = '﻿' + cab.join(';') + '\n' + filas.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'envios-ctt-' + _isoFecha(new Date()) + '.csv';
  a.click();
}

/* Crea el envío en CTT (etiqueta térmica + tracking) con la API. */
async function crearEtiquetaCTT(i) {
  const p = ENVIOS[i]; if (!p) return;
  const r = document.getElementById('env-r-' + i);
  const avisar = document.getElementById('avi-' + i).checked;
  if (p.tracking && !confirm('Este pedido ya tiene envío en CTT (' + p.tracking + ').\n\nAceptar = volver a imprimir la MISMA etiqueta (no crea otro envío).')) return;
  const btn = (typeof event !== 'undefined' && event && event.target && event.target.closest) ? event.target.closest('button') : null;
  if (p._creando) return;
  p._creando = true; if (btn) { btn.disabled = true; btn.textContent = '⏳ Creando…'; }
  _msg(r, p.tracking ? 'Recuperando la etiqueta…' : 'Creando envío en CTT… (no pulses otra vez)', '');
  try {
    const resp = await fetch(_base() + '/admin/envio/etiqueta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ clave: p.clave, avisar }),
    });
    const d = await resp.json().catch(() => ({}));
    if (resp.status === 401) { _msg(r, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) { _msg(r, 'CTT: ' + (d.detalle || d.error || ('HTTP ' + resp.status)), 'err'); return; }
    p.tracking = d.tracking || ''; p.enviado = true;
    const trk = document.getElementById('trk-' + i); if (trk) trk.value = p.tracking;
    // Abrir la etiqueta PDF para imprimir en la térmica.
    if (d.pdfBase64) abrirPdfBase64(d.pdfBase64, 'etiqueta-' + p.tracking + '.pdf');
    else if (d.thermal && d.thermal.length) descargarTexto(d.thermal.join('\n'), 'etiqueta-' + p.tracking + '.zpl');
    _msg(r, (d.yaExistia ? '✔ Etiqueta reimpresa del envío ' : '✔ Envío ') + p.tracking + (d.avisado ? ' · cliente avisado' : ''), 'ok');
  } catch (e) {
    _msg(r, 'Error: ' + e.message, 'err');
  } finally {
    p._creando = false; if (btn) { btn.disabled = false; btn.textContent = p.tracking ? '🖨️ Reimprimir etiqueta' : '🏷️ Crear etiqueta CTT'; }
  }
}

function abrirPdfBase64(b64, nombre) {
  try {
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { const a = document.createElement('a'); a.href = url; a.download = nombre || 'etiqueta.pdf'; a.click(); }
  } catch (e) { /* nada */ }
}
function descargarTexto(txt, nombre) {
  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
}

async function probarEmail() {
  const msg = document.getElementById('env-msg');
  _msg(msg, 'Enviando email de prueba…', '');
  try {
    const r = await fetch(_base() + '/admin/test-email', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    const prov = d.proveedor ? d.proveedor.toUpperCase() : '';
    let cta = '';
    if (d.cuenta && d.cuenta.email) cta = ' · Cuenta: ' + d.cuenta.email;
    else if (d.cuenta && d.cuenta.dominios) cta = ' · Dominios: ' + (d.cuenta.dominios.join(', ') || 'ninguno verificado');
    if (d.ok) { _msg(msg, '✔ ' + prov + ' aceptó el email → ' + d.to + ' (revisa spam)' + cta, 'ok'); }
    else { _msg(msg, '✖ ' + (prov || 'Email') + ' ' + (d.status || '') + ': ' + (d.respuesta || d.motivo || d.error || 'error') + cta, 'err'); }
    console.log('Test email:', d);
  } catch (e) {
    _msg(msg, 'Error: ' + e.message, 'err');
  }
}

async function probarChat() {
  const msg = document.getElementById('env-msg');
  _msg(msg, 'Probando el asistente…', '');
  try {
    const r = await fetch(_base() + '/admin/test-chat', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (d.ok) { _msg(msg, '✔ Asistente OK (modelo ' + (d.model || '') + ')', 'ok'); }
    else { _msg(msg, '✖ Asistente ' + (d.status || '') + ' [' + (d.model || '') + ']: ' + (d.respuesta || d.motivo || d.error || 'error'), 'err'); }
    console.log('Test chat:', d);
  } catch (e) {
    _msg(msg, 'Error: ' + e.message, 'err');
  }
}

/* ---------- Envío manual / muestra (sin venta) ---------- */
let MAN_LINEAS = [];
function manInit() {
  const s = document.getElementById('man-prod');
  if (s && !s.options.length) {
    s.innerHTML = PRODUCTOS.filter(p => !p.proximamente)
      .map(p => `<option value="${p.handle}">${_esc(p.title)}</option>`).join('');
  }
  manRenderLineas();
}
function manAddProducto() {
  const sel = document.getElementById('man-prod');
  const h = sel && sel.value;
  const c = Math.max(1, parseInt(document.getElementById('man-cant').value, 10) || 1);
  if (!h) return;
  const ex = MAN_LINEAS.find(l => l.handle === h);
  if (ex) ex.cant += c; else MAN_LINEAS.push({ handle: h, cant: c });
  manRenderLineas();
}
function manQuitar(i) { MAN_LINEAS.splice(i, 1); manRenderLineas(); }
function manRenderLineas() {
  const cont = document.getElementById('man-lineas');
  if (!cont) return;
  if (!MAN_LINEAS.length) { cont.innerHTML = '<p class="nota">Sin productos añadidos.</p>'; return; }
  cont.innerHTML = MAN_LINEAS.map((l, i) => {
    const p = PRODUCTOS.find(x => x.handle === l.handle) || {};
    const stock = (CFG.stock && CFG.stock[l.handle] != null) ? CFG.stock[l.handle] : null;
    const aviso = (stock != null && l.cant > stock) ? ' <span style="color:#a12a2a">¡supera el stock!</span>' : '';
    return `<div class="fila-top" style="justify-content:space-between;border-bottom:1px solid #eee;padding:4px 0">
      <span>${l.cant}× ${_esc(p.title || l.handle)}${stock != null ? ` <span class="nota">(stock: ${stock})</span>` : ''}${aviso}</span>
      <button class="btn btn-sm" style="background:#f8d7da;color:#a12a2a;border:none" onclick="manQuitar(${i})">✕</button>
    </div>`;
  }).join('');
}
async function crearEnvioManual() {
  const msg = document.getElementById('man-msg');
  const g = id => (document.getElementById(id).value || '').trim();
  const envio = {
    nombre: g('man-nombre'), telefono: g('man-tel'), email: g('man-email'),
    line1: g('man-line1'), line2: g('man-line2'), cp: g('man-cp'),
    ciudad: g('man-ciudad'), pais: (g('man-pais') || 'ES').toUpperCase(),
  };
  if (!envio.nombre || !envio.line1 || !envio.cp) { _msg(msg, 'Faltan nombre, dirección o código postal.', 'err'); return; }
  const items = {};
  MAN_LINEAS.forEach(l => { items[l.handle] = (items[l.handle] || 0) + l.cant; });
  const tipo = document.getElementById('man-tipo').value;
  const descontarStock = document.getElementById('man-descontar').checked;
  const conEtiqueta = document.getElementById('man-etiqueta').checked;
  const nota = g('man-nota');
  _msg(msg, 'Creando envío…', '');
  try {
    const resp = await fetch(_base() + '/admin/envio-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ envio, items, tipo, descontarStock, nota }),
    });
    const d = await resp.json().catch(() => ({}));
    if (resp.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!resp.ok) { _msg(msg, 'Error: ' + (d.detalle || d.error || ('HTTP ' + resp.status)), 'err'); return; }
    const extra = d.stockDescontado ? ' · stock descontado' : '';
    if (conEtiqueta) {
      _msg(msg, 'Envío creado. Generando etiqueta CTT…', '');
      const avisar = document.getElementById('man-avisar').checked && !!envio.email;
      const re = await fetch(_base() + '/admin/envio/etiqueta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
        body: JSON.stringify({ clave: d.clave, avisar }),
      });
      const de = await re.json().catch(() => ({}));
      if (re.ok && de.tracking) {
        if (de.pdfBase64) abrirPdfBase64(de.pdfBase64, 'etiqueta-' + de.tracking + '.pdf');
        else if (de.thermal && de.thermal.length) descargarTexto(de.thermal.join('\n'), 'etiqueta-' + de.tracking + '.zpl');
        _msg(msg, '✔ Envío creado + etiqueta ' + de.tracking + extra, 'ok');
      } else {
        _msg(msg, '✔ Envío creado' + extra + '. ⚠️ Etiqueta CTT: ' + (de.detalle || de.error || 'no disponible') + ' — créala en la lista de abajo.', 'err');
      }
    } else {
      _msg(msg, '✔ Envío creado' + extra + '. Créale la etiqueta en la lista de abajo.', 'ok');
    }
    MAN_LINEAS = []; manRenderLineas();
    ['man-nombre', 'man-tel', 'man-email', 'man-line1', 'man-line2', 'man-cp', 'man-ciudad', 'man-nota'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    setTimeout(cargarEnvios, 800);
  } catch (e) {
    _msg(msg, 'Error: ' + e.message, 'err');
  }
}
window.manAddProducto = manAddProducto;
window.manQuitar = manQuitar;
window.crearEnvioManual = crearEnvioManual;

window.probarEmail = probarEmail;
window.probarChat = probarChat;
window.cargarEnvios = cargarEnvios;
window.copiarEnvio = copiarEnvio;
window.guardarTracking = guardarTracking;
window.exportarEnviosCSV = exportarEnviosCSV;
window.crearEtiquetaCTT = crearEtiquetaCTT;


/* ---------- Embudo de compra ---------- */
const NOMBRES_EMBUDO = {
  visita: 'Visitas (1 por sesión)',
  carrito_anadir: 'Añaden algo al carrito',
  carrito_abrir: 'Abren el carrito',
  pago_iniciar: 'Pulsan «Finalizar compra»',
  pago_redirigir: 'Llegan al pago de Stripe',
  pago_error: 'Error al abrir el pago',
  pago_cancelado: 'Vuelven sin pagar (cancelan en Stripe)',
  pago_ok: 'Compra completada',
};
function _fechaISO(d) { return d.toISOString().slice(0, 10); }
function rangoEmbudo(dias) {
  const hoy = new Date();
  const ini = new Date(hoy.getTime() - (dias - 1) * 86400000);
  document.getElementById('em-desde').value = _fechaISO(ini);
  document.getElementById('em-hasta').value = _fechaISO(hoy);
  cargarEmbudo();
}
function _escEm(t) {
  return String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
async function cargarEmbudo() {
  const msg = document.getElementById('em-msg');
  const desde = document.getElementById('em-desde').value;
  const hasta = document.getElementById('em-hasta').value;
  if (!desde || !hasta) { _msg(msg, 'Elige las dos fechas.', 'err'); return; }
  _msg(msg, 'Cargando…', '');
  try {
    const r = await fetch(_base() + '/admin/embudo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS },
      body: JSON.stringify({ desde, hasta }),
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    pintarEmbudo(await r.json());
    _msg(msg, '', '');
  } catch (e) {
    _msg(msg, 'No se pudo cargar: ' + e.message, 'err');
  }
}
function pintarEmbudo(d) {
  const t = d.totales || {};
  const base = (t.visita ? (t.visita.movil || 0) + (t.visita.pc || 0) : 0);
  const filas = (d.pasos || Object.keys(NOMBRES_EMBUDO)).map(p => {
    const m = (t[p] && t[p].movil) || 0, o = (t[p] && t[p].pc) || 0, tot = m + o;
    const pct = base ? Math.round(tot * 1000 / base) / 10 + ' %' : '—';
    const alerta = p === 'pago_error' && tot > 0 ? ' style="background:#fdecea"' : '';
    return `<tr${alerta}><td>${_escEm(NOMBRES_EMBUDO[p] || p)}</td><td style="text-align:right">${m}</td><td style="text-align:right">${o}</td><td style="text-align:right"><strong>${tot}</strong></td><td style="text-align:right">${pct}</td></tr>`;
  }).join('');
  document.getElementById('em-tabla').innerHTML = `
    <table class="tabla-admin" style="width:100%;border-collapse:collapse">
      <thead><tr><th style="text-align:left">Paso</th><th style="text-align:right">📱 Móvil</th><th style="text-align:right">💻 Ordenador</th><th style="text-align:right">Total</th><th style="text-align:right">% de visitas</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
  const po = d.porOrigen || {};
  const canales = Object.entries(po).map(([c, x]) => ({ c, v: x.visita || 0, a: x.carrito_abrir || 0, i: x.pago_iniciar || 0, o: x.pago_ok || 0 })).sort((a, b) => b.v - a.v);
  document.getElementById('em-tabla').innerHTML += canales.length
    ? `<h3 style="font-size:1rem;margin:16px 0 6px">Por canal de llegada</h3>
       <table class="tabla-admin" style="width:100%;border-collapse:collapse">
         <thead><tr><th style="text-align:left">Canal</th><th style="text-align:right">Visitas</th><th style="text-align:right">Abren carrito</th><th style="text-align:right">Van a pagar</th><th style="text-align:right">Compran</th></tr></thead>
         <tbody>${canales.map(x => `<tr><td>${_escEm(x.c)}</td><td style="text-align:right">${x.v}</td><td style="text-align:right">${x.a}</td><td style="text-align:right">${x.i}</td><td style="text-align:right"><strong>${x.o}</strong></td></tr>`).join('')}</tbody>
       </table>`
    : '<p class="nota" style="margin-top:12px">Por canal: empieza a contar desde que se publica el seguimiento de ventas.</p>';
  const errs = d.errores || [];
  document.getElementById('em-errores').innerHTML = errs.length
    ? `<h3 style="font-size:1rem;margin:0 0 6px">Errores al abrir el pago (últimos ${errs.length})</h3>
       <table class="tabla-admin" style="width:100%;border-collapse:collapse;font-size:.85rem">
         <thead><tr><th style="text-align:left">Día</th><th>Hora (UTC)</th><th>Dispositivo</th><th style="text-align:left">Motivo</th><th style="text-align:left">Página</th></tr></thead>
         <tbody>${errs.map(e => `<tr><td>${_escEm(e.dia)}</td><td>${_escEm(e.h)}</td><td>${e.m === 'movil' ? '📱' : '💻'}</td><td>${_escEm(e.c)}${e.d ? ' · ' + _escEm(e.d) : ''}</td><td>${_escEm(e.p)}</td></tr>`).join('')}</tbody>
       </table>`
    : '<p class="nota">Sin errores al abrir el pago en estas fechas.</p>';
}


/* ---------- Resumen semanal (el mismo que llega por correo) ---------- */
async function verResumen(enviar) {
  const msg = document.getElementById('res-msg');
  const caja = document.getElementById('res-caja');
  _msg(msg, enviar ? 'Enviando…' : 'Calculando…', '');
  try {
    const d = await _postAdmin('/admin/resumen', { accion: enviar ? 'enviar' : 'ver', dias: 7 });
    if (enviar) { _msg(msg, d.ok ? '✔ Enviado a info@saviadealma.com' : 'No se pudo enviar', d.ok ? 'ok' : 'err'); return; }
    caja.innerHTML = d.html || '';
    _msg(msg, '', '');
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); }
}
window.verResumen = verResumen;

/* ---------- Mensajes del formulario de contacto ---------- */
async function cargarMensajes() {
  const msg = document.getElementById('msj-msg');
  const caja = document.getElementById('msj-lista');
  _msg(msg, 'Cargando…', '');
  try {
    const r = await fetch(_base() + '/admin/contactos', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + PASS },
    });
    if (r.status === 401) { _msg(msg, 'Contraseña incorrecta.', 'err'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const { mensajes = [] } = await r.json();
    _msg(msg, mensajes.length ? mensajes.length + ' mensaje(s)' : '', 'ok');
    const esc = t => String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    caja.innerHTML = mensajes.length ? mensajes.map(m => `
      <div style="border:1px solid #e5e0d5;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#fff">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:.85rem">
          <strong>${esc(m.nombre)}</strong>
          <span style="color:#888">${new Date((m.ts || 0) * 1000).toLocaleString('es-ES')}</span>
        </div>
        <a href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: tu consulta a Savia de Alma')}" style="font-size:.85rem">${esc(m.email)}</a>
        <p style="white-space:pre-wrap;margin:8px 0 0">${esc(m.mensaje)}</p>
      </div>`).join('') : '<p class="nota">Todavía no hay mensajes.</p>';
  } catch (e) {
    _msg(msg, 'No se han podido cargar: ' + e.message, 'err');
  }
}


/* ---------- Opiniones de clientes + seguimiento post-compra ---------- */
function _escA(t) { return String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
async function _postAdmin(ruta, body) {
  const r = await fetch(_base() + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PASS }, body: JSON.stringify(body || {}) });
  if (r.status === 401) throw new Error('Contraseña incorrecta');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function _tarjetaOp(o, handle, pendiente) {
  const h = handle || o.handle;
  return `<div style="border:1px solid #e5e0d5;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#fff">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:.85rem">
      <span><span style="color:#e8b53d">${'★'.repeat(o.r)}${'☆'.repeat(5 - o.r)}</span> <strong>${_escA(o.n)}</strong> · ${_escA(h)}${o.v === 'regalo' ? ' · <em>regalo/sorteo</em>' : ''}</span>
      <span style="color:#888">${new Date(o.ts * 1000).toLocaleDateString('es-ES')}</span></div>
    <p style="white-space:pre-wrap;margin:8px 0">${_escA(o.t)}</p>
    ${pendiente ? `<button class="btn btn-primario btn-sm" onclick="accionOpinion('aprobar','${o.id}')">Aprobar y publicar</button> ` : ''}
    <button class="btn btn-secundario btn-sm" onclick="accionOpinion('borrar','${o.id}')">Borrar</button></div>`;
}
function _pintarOpiniones(d) {
  const p = d.pendientes || [];
  document.getElementById('op-pend').innerHTML = p.length ? p.map(o => _tarjetaOp(o, null, true)).join('') : '<p class="nota">No hay opiniones pendientes.</p>';
  const ap = d.aprobadas || {}; const filas = [];
  Object.keys(ap).forEach(h => ap[h].forEach(o => filas.push(_tarjetaOp(o, h, false))));
  document.getElementById('op-ap').innerHTML = filas.length ? filas.join('') : '<p class="nota">Todavía no hay opiniones publicadas.</p>';
}
async function cargarOpiniones() {
  const msg = document.getElementById('op-msg'); _msg(msg, 'Cargando…', '');
  try { _pintarOpiniones(await _postAdmin('/admin/opiniones')); _msg(msg, '', ''); } catch (e) { _msg(msg, e.message, 'err'); }
}
async function accionOpinion(accion, id) {
  if (accion === 'borrar' && !confirm('¿Borrar esta opinión?')) return;
  const msg = document.getElementById('op-msg');
  try { _pintarOpiniones(await _postAdmin('/admin/opiniones', { accion, id })); _msg(msg, accion === 'aprobar' ? 'Publicada ✓' : 'Borrada', 'ok'); } catch (e) { _msg(msg, e.message, 'err'); }
}
async function pruebaSeguimiento() {
  const msg = document.getElementById('op-msg'); _msg(msg, 'Enviando…', '');
  try { const r = await _postAdmin('/admin/seguimiento', { accion: 'prueba' }); _msg(msg, r.enviados ? 'Enviado a info@saviadealma.com ✓' : 'No se ha enviado (' + (r.motivo || 'sin pedidos') + ')', r.enviados ? 'ok' : 'err'); }
  catch (e) { _msg(msg, e.message, 'err'); }
}
const _SEG_ESTADOS = {
  domingo: ['Sale este domingo', '#2f6b4f'],
  pronto: ['Recibido hace poco (saldrá cuando cumpla 10 días)', '#8a6d1f'],
  antiguo: ['Fuera de plazo (más de 30 días): solo si lo envías tú', '#8a6d1f'],
  enviado: ['Ya enviado', '#666'],
  omitido: ['No se le enviará', '#a33'],
  baja: ['Se dio de baja de los correos', '#a33']
};
async function verSeguimiento() {
  const caja = document.getElementById('op-seg');
  try {
    const r = await _postAdmin('/admin/seguimiento', {});
    const c = r.candidatos || [];
    if (!c.length) { caja.innerHTML = '<p class="nota">Todavía no hay compras ni envíos con email.</p>'; return; }
    const orden = ['domingo', 'pronto', 'antiguo', 'omitido', 'enviado', 'baja'];
    c.sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado) || a.dias - b.dias);
    const n = c.filter(x => x.estado === 'domingo').length;
    caja.innerHTML = `<p class="nota">Todas las compras y envíos con email (${c.length}). Este domingo saldrá automáticamente a <b>${n}</b>. Al resto puedes enviárselo tú cuando quieras con "Enviar ahora".</p>` +
      '<ul style="list-style:none;padding:0">' + c.map(x => {
        const [txt, col] = _SEG_ESTADOS[x.estado] || [x.estado, '#666'];
        const pend = ['domingo', 'pronto', 'antiguo'].includes(x.estado);
        const btns = [];
        if (x.clave && pend) btns.push(`<button class="btn btn-secundario btn-sm" onclick="apuntarProductosSeg('${_escA(x.clave)}')">${x.productos.length ? 'Cambiar productos' : 'Apuntar productos'}</button>`);
        if (pend) btns.push(`<button class="btn btn-sm" onclick="enviarSeguimientoYa('${_escA(x.id)}','${_escA(x.nombre || x.email)}')">Enviar ahora</button>`);
        if (pend) btns.push(`<button class="btn btn-secundario btn-sm" onclick="omitirSeguimiento('${_escA(x.id)}')">No enviarle</button>`);
        if (x.estado === 'omitido') btns.push(`<button class="btn btn-secundario btn-sm" onclick="incluirSeguimiento('${_escA(x.id)}')">Volver a incluir</button>`);
        return `<li style="padding:10px 0;border-bottom:1px solid #eee">
          <b>${_escA(x.nombre || x.email)}</b>${x.tipo && x.tipo !== 'compra' ? ' (' + _escA(x.tipo) + ')' : ''} · <span style="color:#777">recibido hace ${x.dias} días</span>
          <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:10px;font-size:.8em;color:#fff;background:${col}">${txt}${x.estado === 'enviado' && x.enviadoTs ? ' el ' + _fechaCorta(x.enviadoTs) : ''}</span>
          <div style="color:#555;margin:4px 0">${_escA(x.productos.join(', ') || 'sin productos apuntados')}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${btns.join('')}</div></li>`;
      }).join('') + '</ul>';
  } catch (e) { caja.innerHTML = '<p class="nota">' + _escA(e.message) + '</p>'; }
}

async function enviarSeguimientoYa(id, nombre) {
  if (!confirm('¿Enviar ahora el correo de seguimiento a ' + nombre + '?')) return;
  try { await _postAdmin('/admin/seguimiento', { accion: 'enviar', id }); verSeguimiento(); } catch (e) { alert(e.message); }
}

async function incluirSeguimiento(id) {
  try { await _postAdmin('/admin/seguimiento', { accion: 'incluir', id }); verSeguimiento(); } catch (e) { alert(e.message); }
}

async function omitirSeguimiento(id) {
  if (!confirm('¿No enviar el correo de seguimiento a esta persona?')) return;
  try { await _postAdmin('/admin/seguimiento', { accion: 'omitir', id }); verSeguimiento(); } catch (e) { alert(e.message); }
}

function apuntarProductosSeg(clave) {
  const lista = PRODUCTOS.filter(p => !p.proximamente);
  const caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  caja.innerHTML = `<div style="background:#fff;border-radius:12px;max-width:480px;width:100%;max-height:85vh;display:flex;flex-direction:column;padding:16px">
    <h3 style="margin:0 0 8px">¿Qué productos se le enviaron?</h3>
    <input type="search" placeholder="Buscar…" style="padding:8px;margin-bottom:8px;border:1px solid #ccc;border-radius:8px">
    <div class="ap-lista" style="overflow:auto;flex:1">${lista.map(p => `<label style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #eee"><input type="checkbox" value="${p.handle}"> ${_escA(p.title)}</label>`).join('')}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn btn-secundario ap-cancelar">Cancelar</button><button class="btn ap-guardar">Guardar</button></div></div>`;
  document.body.appendChild(caja);
  caja.querySelector('input[type=search]').oninput = e => {
    const q = e.target.value.toLowerCase();
    caja.querySelectorAll('.ap-lista label').forEach(l => { l.style.display = l.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  };
  caja.querySelector('.ap-cancelar').onclick = () => caja.remove();
  caja.querySelector('.ap-guardar').onclick = async () => {
    const items = {};
    caja.querySelectorAll('.ap-lista input:checked').forEach(c => { items[c.value] = 1; });
    if (!Object.keys(items).length) { alert('Marca al menos un producto'); return; }
    try { await _postAdmin('/admin/seguimiento', { accion: 'productos', clave, items }); caja.remove(); verSeguimiento(); } catch (e) { alert(e.message); }
  };
}


/* ---------- Contactos de Brevo → newsletter (bienvenida con código) ---------- */
function _ibLista() { return parseInt(document.getElementById('ib-lista').value, 10) || 6; }
async function brevoContar() {
  const msg = document.getElementById('ib-msg');
  _msg(msg, 'Consultando Brevo…', '');
  try {
    const d = await _postAdmin('/admin/importar-brevo', { accion: 'contar', lista: _ibLista() });
    if (d.error) throw new Error(d.error);
    _msg(msg, `Lista ${d.lista}: ${d.total} contactos · ${d.pendientes} recibirán la bienvenida` +
      ` · ${d.yaEnviados} ya la recibieron · ${d.bajaBrevo} de baja en Brevo · ${d.bajaWeb} de baja en la web` +
      (d.internos ? ` · ${d.internos} internos` : '') + (d.yaSuscritos ? ` · (${d.yaSuscritos} ya estaban en la newsletter)` : ''), 'ok');
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); }
}
async function brevoPrueba() {
  const msg = document.getElementById('ib-msg');
  const to = (document.getElementById('ib-prueba').value || '').trim();
  if (!to) { _msg(msg, 'Escribe tu correo para la prueba.', 'err'); return; }
  _msg(msg, 'Enviando prueba…', '');
  try {
    const d = await _postAdmin('/admin/importar-brevo', { accion: 'prueba', to });
    _msg(msg, d.ok ? '✓ Prueba enviada a ' + to + ' (con un código de ejemplo que no funciona).' : 'No se pudo enviar: ' + (d.detalle || d.error || ''), d.ok ? 'ok' : 'err');
  } catch (e) { _msg(msg, 'Error: ' + e.message, 'err'); }
}
async function brevoImportar() {
  const msg = document.getElementById('ib-msg');
  if (!confirm('¿Meter los contactos de Brevo en la newsletter y enviarles AHORA el correo de bienvenida con su código?')) return;
  let total = 0, fallos = 0;
  try {
    for (let vuelta = 0; vuelta < 60; vuelta++) {
      _msg(msg, `Enviando… ${total} enviados`, '');
      const d = await _postAdmin('/admin/importar-brevo', { accion: 'importar', lista: _ibLista() });
      if (d.error) throw new Error(d.error);
      total += d.enviados || 0; fallos += d.fallos || 0;
      if (!d.pendientes || (!d.enviados && d.fallos)) {
        _msg(msg, `✓ Terminado: ${total} enviados` + (fallos ? ` · ${fallos} fallos (quedan ${d.pendientes} pendientes; vuelve a pulsar más tarde)` : ''), fallos ? 'err' : 'ok');
        return;
      }
    }
  } catch (e) { _msg(msg, `Error tras ${total} enviados: ` + e.message, 'err'); }
}

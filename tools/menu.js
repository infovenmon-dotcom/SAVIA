/* Menu principal por necesidades. Una sola fuente: lo usa
   tools/generar-fichas.js (fichas, familias, rituales) y
   tools/aplicar-menu.js lo copia en las paginas estaticas (index,
   tienda, legales...). Rutas absolutas: valen en .es y en .com.

   Los enlaces "segun tu cabello/piel" abren el selector con la respuesta
   ya marcada; las necesidades y los productos de cada una estan en
   docs/assets/js/rituales.js (NECESIDADES). */
const G = (titulo, cols) => ({ titulo, cols });
const C = (tit, links) => ({ tit, links });
const L = (txt, href) => ({ txt, href });
const SEL = (zona, busca) => `/encuentra-tu-ritual/?zona=${zona}&busca=${busca}`;

const GRUPOS = [
  G('Cabello', [
    C('Productos', [
      L('Champús sólidos', '/champu-solido/'),
      L('Acondicionadores', '/acondicionador-solido/'),
      L('Cera de peinado', '/producto/cera-peinado/'),
    ]),
    C('Según tu cabello', [
      L('Graso', SEL('cabello', 'graso')),
      L('Seco o castigado', SEL('cabello', 'seco')),
      L('Fino o sin cuerpo', SEL('cabello', 'fino')),
      L('Anticaída', SEL('cabello', 'caida')),
      L('Canas o rubio', SEL('cabello', 'canas')),
      L('Cuero cabelludo sensible', SEL('cabello', 'sensible')),
      L('Rizado', SEL('cabello', 'rizado')),
    ]),
  ]),
  G('Rostro', [
    C('Productos', [
      L('Limpiadores faciales', '/limpiador-facial-solido/'),
      L('Esponja de konjac', '/producto/esponja-konjac/'),
      L('Cepillo facial', '/producto/cepillo-facial/'),
      L('Set de contorno facial', '/producto/set-contorno-facial/'),
    ]),
    C('Según tu piel', [
      L('Sensible', SEL('rostro', 'sensible')),
      L('Mixta o grasa', SEL('rostro', 'grasa')),
      L('Madura o apagada', SEL('rostro', 'madura')),
    ]),
  ]),
  G('Cuerpo', [
    C('Productos', [
      L('Jabones artesanales', '/jabon-artesanal/'),
      L('Exfoliantes', '/exfoliante-corporal-solido/'),
      L('Desodorantes', '/desodorante-solido/'),
      L('Depilación', '/espuma-depilacion-solida/'),
      L('Sales de Epsom', '/producto/sales-epsom-500/'),
    ]),
    C('Según tu piel', [
      L('Seca', SEL('cuerpo', 'seca')),
      L('Sensible', SEL('cuerpo', 'sensible')),
      L('Grasa o con imperfecciones', SEL('cuerpo', 'grasa')),
      L('Madura', SEL('cuerpo', 'madura')),
      L('Para relajarte', SEL('cuerpo', 'relax')),
    ]),
  ]),
  G('Afeitado', [
    C('Productos', [
      L('Afeitado y barba', '/afeitado-y-barba/'),
      L('Champú para barba', '/producto/champu-barba-carbon/'),
      L('Ritual de afeitado completo', '/producto/kit-afeitado-completo/'),
    ]),
  ]),
  G('Rituales y regalos', [
    C('Rituales', [
      L('Rituales de 4 productos', '/rituales/'),
      L('Encuentra tu ritual', '/encuentra-tu-ritual/'),
      L('Guía Ritual de Calma', '/ritual-de-calma'),
    ]),
    C('Para regalar', [
      L('Accesorios', '/accesorios-zero-waste/'),
      L('Neceseres', '/producto/neceser-rosa/'),
    ]),
  ]),
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function menuHTML(sangria = '        ') {
  const s = sangria;
  const grupo = (g, i) => {
    const id = 'mn-g' + i;
    return `${s}  <li class="mn-g">
${s}    <button class="mn-top" type="button" aria-expanded="false" aria-controls="${id}">${esc(g.titulo)}</button>
${s}    <div class="mn-sub" id="${id}">
${g.cols.map(c => `${s}      <div class="mn-col">
${s}        <span class="mn-tit">${esc(c.tit)}</span>
${c.links.map(l => `${s}        <a href="${esc(l.href)}">${esc(l.txt)}</a>`).join('\n')}
${s}      </div>`).join('\n')}
${s}    </div>
${s}  </li>`;
  };
  return `<nav class="nav-tienda menu-nec" aria-label="Menú principal">
${s}  <button class="mn-abrir" type="button" aria-expanded="false" aria-controls="mn-panel"><span class="mn-hamb" aria-hidden="true"></span>Menú</button>
${s}  <ul class="mn-lista" id="mn-panel">
${s}  <li><a class="mn-top" href="/tienda.html">Tienda</a></li>
${GRUPOS.map(grupo).join('\n')}
${s}  </ul>
${s}</nav>`;
}

module.exports = { GRUPOS, menuHTML };

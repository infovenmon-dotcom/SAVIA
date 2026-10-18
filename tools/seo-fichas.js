/* SEO de las fichas de producto: título de Google (<title>) y descripción.
   Estilo: lo que se busca + para quién + formato, como hacen los que salen
   primeros en "champú sólido". Sin promesas médicas nuevas: tipo de piel o
   cabello, aroma y formato. La descripción cierra con el 4×3 y el envío.
   Si un producto no está aquí, el generador usa su título y su "short". */
const CIERRE = 'Vegano, hecho a mano en España. 4×3 y envío gratis desde 20 €.';
const CIERRE_NOV = 'Hecho a mano en España. 4×3 y envío gratis desde 20 €.';
const CIERRE_ACC = 'Envío gratis desde 20 €.';

const SEO = {
  // ---------- Champús ----------
  'champu-cafeina-canela': ['Champú sólido de cafeína y canela · Cabello fino · 65 g', 'Champú sólido de cafeína y canela para cabello fino o sin vida. Sin sulfatos, aroma especiado. 65 g ≈ 60 lavados.'],
  'champu-indigo-lavanda': ['Champú sólido de índigo y lavanda · Canas y cabello sensible · 65 g', 'Champú sólido de índigo y lavanda para canas, rubios y cuero cabelludo sensible. Sin sulfatos, aroma lavanda. 65 g.'],
  'champu-cacao': ['Champú sólido de cacao · Cabello seco y castigado · 65 g', 'Champú sólido de cacao para cabello seco o castigado por el sol, planchas y secador. Nutre y da brillo. Aroma chocolate. 65 g.'],
  'champu-betaina-sal': ['Champú sólido de betaína y sal marina · Cabello graso · 65 g', 'Champú sólido de betaína y sal marina para cabello graso o con poco volumen. Limpieza suave para uso frecuente. 65 g.'],
  'champu-te-matcha': ['Champú sólido de té matcha · Uso diario y cuero cabelludo graso · 65 g', 'Champú sólido de té matcha para uso diario, todo tipo de cabello y cuero cabelludo graso. Antioxidante y purificante. 65 g.'],
  'champu-cebolla-arcilla': ['Champú sólido de cebolla roja y arcilla · Densidad y exceso de sebo · 65 g', 'Champú sólido de cebolla roja y arcilla para dar densidad y equilibrar el cuero cabelludo con exceso de sebo. 65 g.'],
  'champu-avena-almendra': ['Champú sólido de avena y almendra · Cabello rizado o seco · 65 g', 'Champú sólido de avena y almendra para cabello rizado, ondulado o seco y cuero cabelludo sensible. Sin sulfatos. 65 g.'],
  'champu-romero-quina': ['Champú sólido de romero y quina · Cabello fino y quebradizo · 65 g', 'Champú sólido de romero y quina para cabello fino o quebradizo. Fórmula vegetal con romero. 65 g ≈ 60 lavados.'],
  'champu-cade-enebro': ['Champú sólido de cade de enebro · Cuero cabelludo sensible y caspa · 65 g', 'Champú sólido de cade de enebro para cuero cabelludo sensible o con caspa. Fórmula vegetal, aroma ahumado. 65 g.'],
  'champu-barba-carbon': ['Champú sólido para barba de carbón activo · 65 g', 'Champú sólido para barba con carbón activo: limpia en profundidad y neutraliza olores. Sin sulfatos. 65 g.'],
  // ---------- Jabones ----------
  'jabon-cbd': ['Jabón artesanal de CBD · Piel sensible o reactiva · 100 g', 'Jabón artesanal de CBD para piel sensible, reactiva o con tendencia a irritarse. 100 g.'],
  'jabon-naranja-canela': ['Jabón artesanal de naranja y canela · Aroma cítrico · 100 g', 'Jabón artesanal de naranja y canela para una ducha energizante y piel normal. Aroma cítrico y especiado. 100 g.'],
  'jabon-borraja': ['Jabón artesanal de borraja · Piel madura o seca · 100 g', 'Jabón artesanal de borraja para piel madura, seca o con descamación. 100 g.'],
  'jabon-karite': ['Jabón artesanal de karité · Piel seca y sensible · 100 g', 'Jabón artesanal de manteca de karité para piel seca o sensible que necesita un extra de hidratación. 100 g.'],
  'jabon-arbol-te': ['Jabón artesanal de árbol de té · Piel grasa o mixta · 100 g', 'Jabón artesanal de árbol de té para piel mixta o grasa. Limpieza purificante y aroma fresco. 100 g.'],
  'jabon-rosa-mosqueta': ['Jabón artesanal de rosa mosqueta · Piel madura y manchas · 100 g', 'Jabón artesanal de rosa mosqueta para piel madura o con manchas que busca luminosidad y firmeza. 100 g.'],
  'jabon-argan': ['Jabón artesanal de argán · Piel tras el sol o con signos de edad · 100 g', 'Jabón artesanal de aceite de argán para piel tras el sol, en invierno o con signos de edad. 100 g.'],
  'jabon-monoi': ['Jabón artesanal de monoï · Aroma floral · 100 g', 'Jabón artesanal de monoï que hidrata y perfuma la piel con un aroma floral exótico. 100 g.'],
  'jabon-pepita-uva': ['Jabón artesanal de pepita de uva · Piel grasa o apagada · 100 g', 'Jabón artesanal de pepita de uva para revitalizar piel apagada, grasa o expuesta al sol. Antioxidante. 100 g.'],
  'jabon-carbon-activo': ['Jabón artesanal de carbón activo · Piel grasa y poros · 100 g', 'Jabón artesanal de carbón activo para piel mixta o grasa con poros visibles. Limpieza detox. 100 g.'],
  'jabon-azufre': ['Jabón artesanal de azufre · Piel grasa o con imperfecciones · 100 g', 'Jabón artesanal de azufre para piel grasa, seborreica o con imperfecciones. 100 g.'],
  'jabon-lavanda': ['Jabón artesanal de lavanda · Relajante · 100 g', 'Jabón artesanal de lavanda para la ducha de la noche y piel sensible. Aroma relajante. 100 g.'],
  'jabon-aguacate': ['Jabón artesanal de aguacate · Piel seca o madura · 100 g', 'Jabón artesanal de aguacate para piel seca o madura que necesita nutrición intensa. 100 g.'],
  'jabon-leche-cabra': ['Jabón artesanal de leche de cabra · Piel sensible y seca · 100 g', 'Jabón artesanal de leche de cabra para piel sensible, seca o delicada. Hidratante y nutritivo. 100 g.', 'nov'],
  'jabon-leche-burra-aloe': ['Jabón de leche de burra y aloe vera · Piel madura o sensible · 100 g', 'Jabón artesanal de leche de burra y aloe vera para piel madura, seca o sensible. Nutre y calma. 100 g.', 'nov'],
  'jabon-aceite-arroz': ['Jabón artesanal de arroz · Ritual K-Beauty · 100 g', 'Jabón artesanal de arroz, el ritual coreano de la piel luminosa. Limpieza suave para todo tipo de piel. 100 g.'],
  // ---------- Desodorantes ----------
  'desodorante-te-verde': ['Desodorante sólido de té verde sin aluminio · 50 g', 'Desodorante sólido natural de té verde, sin aluminio ni alcohol. Fragancia ligera para piel sensible. 50 g.'],
  'desodorante-pomelo': ['Desodorante sólido de pomelo sin aluminio · 50 g', 'Desodorante sólido natural de pomelo, sin aluminio. Frescura cítrica para empezar el día. 50 g.'],
  'desodorante-algodon': ['Desodorante sólido de algodón sin aluminio · Piel sensible · 50 g', 'Desodorante sólido natural con aroma a algodón, sin aluminio. Discreto y apto tras la depilación. 50 g.'],
  'desodorante-madera': ['Desodorante sólido de madera sin aluminio · Unisex · 50 g', 'Desodorante sólido natural con aroma amaderado unisex, sin aluminio. Protección natural con carácter. 50 g.'],
  // ---------- Acondicionadores ----------
  'acondicionador-coco': ['Acondicionador sólido de coco · Cabello seco o encrespado · 55 g', 'Acondicionador sólido de coco sin siliconas para cabello seco o encrespado. Suavidad y brillo. 55 g.'],
  'acondicionador-almendra': ['Acondicionador sólido de almendra · Cabello rizado · 55 g', 'Acondicionador sólido de aceite de almendra sin siliconas para cabello rizado u ondulado. Define y controla el frizz. 55 g.'],
  // ---------- Faciales ----------
  'limpiador-facial-rosa-mosqueta': ['Limpiador facial sólido de rosa mosqueta · Piel sensible · 65 g', 'Limpiador facial sólido de rosa mosqueta para piel sensible que busca luminosidad. Limpia sin resecar. 65 g.'],
  'limpiador-facial-aloe-pepino': ['Limpiador facial sólido de aloe vera y pepino · Piel mixta · 65 g', 'Limpiador facial sólido de aloe vera y pepino para piel mixta o normal. Refrescante, mañana y noche. 65 g.'],
  // ---------- Afeitado y depilación ----------
  'espuma-afeitar-avellana': ['Espuma de afeitar sólida de aceite de avellana · 90 g', 'Espuma de afeitar sólida con aceite de avellana: espuma cremosa para un afeitado cómodo, también en piel sensible. 90 g.'],
  'espuma-depilacion-uva': ['Espuma sólida de depilación de pepita de uva · 90 g', 'Espuma sólida para depilación con pepita de uva: calma e hidrata la piel después. 90 g.'],
  'espuma-depilacion-aloe': ['Espuma sólida de depilación de aloe vera · Piel sensible · 90 g', 'Espuma sólida para depilación con aloe vera, calmante para piel sensible. 90 g.'],
  // ---------- Exfoliantes y ceras ----------
  'exfoliante-cafe-coco': ['Exfoliante corporal sólido de café y coco · 75 g', 'Exfoliante corporal sólido de café y coco para codos, talones y rodillas: exfolia y nutre. 75 g.'],
  'exfoliante-zanahoria-lino': ['Exfoliante corporal sólido de zanahoria y lino · Piel sensible · 75 g', 'Exfoliante corporal sólido de zanahoria y lino: exfoliación suave apta para piel sensible. 75 g.'],
  'cera-peinado': ['Cera de peinado sólida natural · 55 g', 'Cera de peinado sólida natural para moldear, definir rizos o texturizar el pelo corto y medio. Sin plástico. 55 g.'],
  // ---------- Accesorios y sales ----------
  'jabonera-bambu': ['Jabonera de bambú para jabón sólido', 'Jabonera de bambú natural que mantiene seco tu jabón sólido para que dure más. Para jabones y pastillas grandes.', 'acc'],
  'jabonera-pequena': ['Jabonera pequeña de bambú para champú sólido', 'Jabonera pequeña de bambú para champús sólidos y pastillas pequeñas: las mantiene secas y duran más.', 'acc'],
  'esponja-exfoliante': ['Bolsa de sisal natural para jabón sólido', 'Bolsa de sisal natural: portajabón y exfoliante a la vez para aprovechar tu jabón sólido hasta el final.', 'acc'],
  'cepillo-dientes-bambu': ['Cepillo de dientes de bambú', 'Cepillo de dientes con mango de bambú natural: el gesto de cada día con mucho menos plástico.', 'acc'],
  'esponja-konjac': ['Esponja facial de konjac con nuez', 'Esponja facial de konjac 100 % vegetal y biodegradable con nuez molida: limpia a diario sin resecar.', 'acc'],
  'set-contorno-facial': ['Set de contorno facial · Cepillo, gua sha y varilla', 'Set de masaje facial con cepillo, gua sha y varilla de ojos: el masaje de siempre, sin aparatos.', 'acc'],
  'jabonera-metalica': ['Jabonera trío de acero y bambú para 3 jabones', 'Jabonera de acero sobre base de bambú para tres jabones: elige cada día según cómo te sientes.', 'acc'],
  'cepillo-facial': ['Cepillo linfático facial', 'Cepillo facial para el masaje linfático y la limpieza diaria del rostro, solo o con tu limpiador sólido.', 'acc'],
  'cepillo-pelo-madera': ['Cepillo de pelo de madera', 'Cepillo de pelo de madera natural de cuerpo a púas: desenreda sin tirones y sin plástico.', 'acc'],
  'espejo-led': ['Espejo de bolsillo con luz LED recargable', 'Espejo de bolsillo con luz LED recargable por USB: luz perfecta en el bolso o de viaje.', 'acc'],
  'kit-afeitado': ['Kit de afeitado · Brocha, bol y soporte', 'Kit de afeitado con brocha, bol y soporte para tu espuma de afeitar sólida. Adiós al aerosol.', 'acc'],
  'kit-afeitado-completo': ['Kit de afeitado completo con espuma sólida', 'Kit de afeitado completo: soporte, bol, brocha y espuma de afeitar sólida de aceite de avellana. Ideal para regalar.', 'acc'],
  'sales-epsom-500': ['Sales de Epsom puras · 500 g', 'Sales de Epsom 100 % puras (sulfato de magnesio) sin perfume ni aditivos, para baños de pies y de relax. 500 g.', 'acc'],
  'neceser-blanco': ['Neceser crema para cosmética sólida', 'Neceser para tu rutina sólida: sin botes ni derrames. Para viajar, el gimnasio o el baño.', 'acc'],
  'neceser-rosa': ['Neceser rosa para cosmética sólida', 'Neceser para tu rutina sólida: sin botes ni derrames. Para viajar, el gimnasio o el baño.', 'acc'],
  'neceser-organizador-espejo': ['Neceser organizador con espejo · Rosa', 'Neceser organizador con espejo en la tapa para llevar tu rutina sólida de viaje sin botes.', 'acc'],
};

function seoDe(p) {
  const e = SEO[p.handle];
  if (!e) return null;
  const [titulo, desc, tipo] = e;
  return { titulo, desc: desc + ' ' + (tipo === 'acc' ? CIERRE_ACC : tipo === 'nov' ? CIERRE_NOV : CIERRE) };
}

module.exports = { SEO, seoDe };

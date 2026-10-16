/* Paginas por familia (SEO). Las genera tools/generar-fichas.js en
   docs/<ruta>/index.html, con la rejilla de productos de esa familia.
   Textos de marca: SIN promesas medicas (Reg. 1223/2009 y 655/2013): se
   habla de limpiar, cuidar, aroma, textura y formato, nunca de curar o tratar.
   Solo familias con 2 o mas productos; las de 1 ya tienen su ficha. */
module.exports = [
  {
    coleccion: 'champus',
    ruta: 'champu-solido',
    titulo: 'Champú sólido natural hecho a mano',
    h1: 'Champús sólidos naturales',
    meta: 'Champús sólidos artesanales hechos a mano en España: sin plástico, sin SLS, veganos y con más de 60 lavados por pastilla. Elige el tuyo según tu cabello.',
    intro: [
      'Un champú sólido es lo mismo que el de bote, pero sin el agua ni el envase de plástico. Cada pastilla de 65 g da para más de 60 lavados, cabe en la palma de la mano y no se derrama en la maleta.',
      'Los nuestros se elaboran a mano, uno a uno, en España, sin SLS y sin siliconas, con extractos como el romero, el cacao, el té matcha o el índigo. Todos son veganos y cruelty free.',
    ],
    elegir: [
      'Si tu cabello es fino o le falta cuerpo, busca fórmulas ligeras con arcilla o romero.',
      'Si lo tienes seco o con encrespamiento, mejor las que llevan avena, almendra o cacao.',
      'Si se engrasa pronto, prueba las de té matcha, betaína o sal marina.',
      'Combínalo con un acondicionador sólido para desenredar sin plástico.',
    ],
    uso: 'Moja el cabello, frota la pastilla entre las manos o directamente sobre el pelo hasta que haga espuma, masajea y aclara. Después, déjala secar en una jabonera con drenaje para que dure más.',
    preguntas: [
      ['¿Cuánto dura un champú sólido?', 'Una pastilla de 65 g da para más de 60 lavados si la dejas secar bien entre usos, en una jabonera que no acumule agua.'],
      ['¿Hace espuma como un champú normal?', 'Sí. Al frotarla con el cabello mojado hace espuma enseguida. Los primeros días puede notarse distinto si vienes de un champú con siliconas.'],
      ['¿Cómo lo llevo de viaje?', 'Bien seco, en una bolsa de sisal o en un neceser. Al ser sólido no cuenta como líquido en el equipaje de mano.'],
    ],
  },
  {
    coleccion: 'jabones',
    ruta: 'jabon-artesanal',
    titulo: 'Jabón artesanal natural hecho a mano',
    h1: 'Jabones artesanales naturales',
    meta: 'Jabones artesanales hechos a mano en España por saponificación en frío: rosa mosqueta, lavanda, karité, argán, carbón activo y más. Sin plástico.',
    intro: [
      'Nuestros jabones se hacen a mano por saponificación en frío, un proceso lento que conserva la glicerina natural del jabón y deja la piel limpia y suave, sin sensación de tirantez.',
      'Hay uno para cada rutina: de rosa mosqueta, lavanda, karité, argán, aguacate, árbol de té, carbón activo, arroz… Cada pastilla viene sin plástico y la mayoría son veganos (los de leche de cabra y leche de burra, no).',
    ],
    elegir: [
      'Para un baño relajante, los de aroma suave como lavanda o monoi.',
      'Para pieles que piden extra de nutrición, karité, argán, aguacate o leche de cabra.',
      'Para una limpieza más profunda, carbón activo, arcilla o árbol de té.',
      'Para la cara, los más delicados como arroz o rosa mosqueta.',
    ],
    uso: 'Humedece la pastilla y la piel, haz espuma entre las manos y aplícala con un masaje suave. Aclara con agua templada. Guárdala fuera del chorro de la ducha y sobre una jabonera que drene.',
    preguntas: [
      ['¿Qué es la saponificación en frío?', 'Es la forma tradicional de hacer jabón sin calentar la mezcla. Tarda semanas en curar, pero conserva la glicerina y las propiedades de los aceites.'],
      ['¿Sirven para cara y cuerpo?', 'Sí, aunque para la cara recomendamos los más suaves, como el de arroz o el de rosa mosqueta.'],
      ['¿Cómo consigo que dure más?', 'Déjalo secar entre usos en una jabonera con drenaje. Un jabón que se queda en agua se ablanda y se gasta mucho antes.'],
    ],
  },
  {
    coleccion: 'desodorantes',
    ruta: 'desodorante-solido',
    titulo: 'Desodorante sólido natural sin aluminio',
    h1: 'Desodorantes sólidos naturales',
    meta: 'Desodorantes sólidos sin sales de aluminio, con base de aceite de coco. Veganos, sin plástico y hechos a mano en España. Té verde, pomelo, algodón y madera.',
    intro: [
      'Un desodorante sólido neutraliza el olor sin bloquear el sudor: no lleva sales de aluminio, ni parabenos, ni alcohol. Su base de aceite de coco cuida la piel de la axila mientras lo usas.',
      'Tenemos cuatro aromas (té verde, pomelo, algodón y madera), todos veganos, sin plástico y hechos a mano en España. Cada pastilla de 50 g da para más de 60 usos.',
    ],
    elegir: [
      'Té verde o pomelo si te gustan los aromas frescos y cítricos.',
      'Algodón si prefieres un olor suave y limpio.',
      'Madera si buscas un aroma más cálido.',
    ],
    uso: 'Aplícalo sobre la piel limpia y seca con dos o tres pasadas. Si está muy firme, sujétalo unos segundos en la mano para que se temple.',
    preguntas: [
      ['¿Es un antitranspirante?', 'No. No tapona el sudor: neutraliza el olor. Por eso no lleva sales de aluminio.'],
      ['¿Mancha la ropa?', 'No deja las marcas blancas de los desodorantes con aluminio. Deja que se absorba un momento antes de vestirte.'],
      ['¿Cuánto dura?', 'Unos 50 g dan para más de 60 aplicaciones.'],
    ],
  },
  {
    coleccion: 'faciales',
    ruta: 'limpiador-facial-solido',
    titulo: 'Limpiador facial sólido natural',
    h1: 'Limpiadores faciales sólidos',
    meta: 'Limpiadores faciales sólidos de rosa mosqueta y de aloe vera y pepino. Limpian con suavidad, sin plástico y hechos a mano en España.',
    intro: [
      'El limpiador facial sólido es una pastilla pensada para la piel de la cara: limpia sin resecar y se aclara fácilmente. Sustituye al gel en bote y no genera residuos.',
      'Tenemos dos: uno de rosa mosqueta, para una limpieza nutritiva, y otro de aloe vera y pepino, con sensación fresca. Se hacen a mano en España y vienen sin plástico.',
    ],
    elegir: [
      'Rosa mosqueta si buscas una limpieza más nutritiva.',
      'Aloe vera y pepino si prefieres una sensación fresca y ligera.',
    ],
    uso: 'Humedece la pastilla, haz espuma entre las manos y aplícala en la cara con un masaje suave, evitando el contorno de los ojos. Aclara con agua templada.',
    preguntas: [
      ['¿Puedo usarlo cada día?', 'Sí, mañana y noche.'],
      ['¿Cómo lo guardo?', 'Fuera del chorro de agua, en una jabonera con drenaje, para que se seque entre usos.'],
    ],
  },
  {
    coleccion: 'afeitado',
    ruta: 'afeitado-y-barba',
    titulo: 'Afeitado y barba natural: espuma sólida y champú',
    h1: 'Afeitado y cuidado de la barba',
    meta: 'Espuma de afeitar sólida de aceite de avellana y champú sólido para barba de carbón activo. Afeitado clásico sin plástico, hecho a mano en España.',
    intro: [
      'Recupera el afeitado clásico con brocha y sin aerosoles. Nuestra espuma de afeitar sólida, con aceite de avellana, hace una espuma cremosa que ayuda a que la cuchilla deslice.',
      'Para el día a día de la barba, el champú sólido de carbón activo la limpia sin plástico. Todo se elabora a mano en España.',
    ],
    elegir: [
      'Si te afeitas con brocha, la espuma sólida de avellana.',
      'Si llevas barba, el champú sólido de carbón activo para lavarla.',
      'Para empezar con el afeitado clásico, mira el Ritual de Afeitado con brocha, bol y soporte en accesorios.',
    ],
    uso: 'Humedece la brocha con agua caliente, gírala sobre la pastilla hasta cargarla y monta la espuma en el bol o directamente sobre la piel.',
    preguntas: [
      ['¿Necesito brocha?', 'Es lo más cómodo para montar la espuma, aunque también puedes hacerla con las manos mojadas.'],
      ['¿Cuánto dura una pastilla?', 'Depende de la frecuencia, pero al no llevar agua cunde mucho más que un bote de espuma.'],
    ],
  },
  {
    coleccion: 'depilacion',
    ruta: 'espuma-depilacion-solida',
    titulo: 'Espuma de depilación sólida natural',
    h1: 'Espumas sólidas para depilación',
    meta: 'Espumas sólidas para depilarte con cuchilla: de aloe vera y de pepita de uva. Sin aerosol y sin plástico, hechas a mano en España.',
    intro: [
      'Para depilarte con cuchilla sin espuma en aerosol. Estas pastillas hacen una espuma cremosa que ayuda a que la cuchilla deslice por la piel.',
      'Hay dos versiones, de aloe vera y de pepita de uva. Se hacen a mano en España y vienen sin plástico.',
    ],
    elegir: [
      'Aloe vera si buscas una sensación fresca.',
      'Pepita de uva si prefieres una textura más nutritiva.',
    ],
    uso: 'Moja la piel y la pastilla, frótala directamente sobre la zona hasta hacer espuma y pasa la cuchilla. Aclara al terminar.',
    preguntas: [
      ['¿Sirve para piernas y axilas?', 'Sí, para cualquier zona en la que uses cuchilla.'],
      ['¿Y para afeitar la barba?', 'Para la barba tenemos la espuma de afeitar sólida de aceite de avellana.'],
    ],
  },
  {
    coleccion: 'acondicionadores',
    ruta: 'acondicionador-solido',
    titulo: 'Acondicionador sólido natural',
    h1: 'Acondicionadores sólidos',
    meta: 'Acondicionadores sólidos de coco y de aceite de almendra: desenredan y suavizan sin plástico. Hechos a mano en España.',
    intro: [
      'El acondicionador sólido desenreda y deja el cabello suave, como el de bote, pero en una pastilla sin plástico que dura muchos usos.',
      'Tenemos dos: de coco y de aceite de almendra. Son el complemento ideal de nuestros champús sólidos.',
    ],
    elegir: [
      'Coco si te gusta un aroma suave y dulce.',
      'Aceite de almendra si tienes rizos u ondas y quieres definirlos.',
    ],
    uso: 'Después del champú, desliza la pastilla de medios a puntas con el cabello mojado, deja actuar un minuto y aclara.',
    preguntas: [
      ['¿Lo aplico en la raíz?', 'Mejor solo de medios a puntas, que es donde más se nota.'],
      ['¿Se puede usar con cualquier champú?', 'Sí, aunque con un champú sólido tendrás toda la rutina sin plástico.'],
    ],
  },
  {
    coleccion: 'exfoliantes',
    ruta: 'exfoliante-corporal-solido',
    titulo: 'Exfoliante corporal sólido natural',
    h1: 'Exfoliantes corporales sólidos',
    meta: 'Exfoliantes corporales sólidos de café y coco y de zanahoria y lino. Piel suave sin plástico, hechos a mano en España.',
    intro: [
      'Un exfoliante sólido es una pastilla con partículas naturales que arrastran las células muertas mientras te lavas. La piel queda suave y lista para hidratar.',
      'Tenemos dos: de café y coco y de zanahoria y lino, ambos con un 98,5 % de ingredientes naturales. Se hacen a mano en España y vienen sin plástico.',
    ],
    elegir: [
      'Café y coco si te gusta un aroma intenso, como el de un buen café.',
      'Zanahoria y lino si prefieres un aroma más suave.',
    ],
    uso: 'Una o dos veces por semana, frota la pastilla sobre la piel mojada con movimientos circulares y aclara. Evita la cara y las zonas irritadas.',
    preguntas: [
      ['¿Cada cuánto lo uso?', 'Una o dos veces por semana es suficiente.'],
      ['¿Sirve para la cara?', 'No, está pensado para el cuerpo. Para la cara tenemos limpiadores faciales sólidos.'],
    ],
  },
  {
    coleccion: 'accesorios',
    ruta: 'accesorios-zero-waste',
    titulo: 'Accesorios zero waste para baño y viaje',
    h1: 'Accesorios zero waste',
    meta: 'Jaboneras de bambú, bolsas de sisal, neceseres, cepillos de bambú y madera y más accesorios para una rutina sin plástico.',
    intro: [
      'Los accesorios ayudan a que tu cosmética sólida dure más y a que la lleves contigo. Una buena jabonera con drenaje evita que la pastilla se ablande; una bolsa de sisal o un neceser la protegen en el viaje.',
      'Elegimos materiales naturales y duraderos siempre que se puede: bambú, sisal, madera y acero inoxidable.',
    ],
    elegir: [
      'Para la ducha, una jabonera de bambú o la jabonera trío si usas varias pastillas.',
      'Para viajar, la bolsa de sisal o un neceser.',
      'Para el baño diario, el cepillo de dientes de bambú y el cepillo de pelo de madera.',
    ],
    uso: 'Deja que la jabonera se seque entre usos y límpiala de vez en cuando con agua. Las piezas de bambú y madera duran más si no se quedan en agua.',
    preguntas: [
      ['¿Por qué una jabonera con drenaje?', 'Porque un jabón o un champú sólido que se queda en agua se ablanda y se gasta mucho antes.'],
      ['¿El bambú se estropea con el agua?', 'Aguanta bien la humedad, pero dura más si se seca entre usos.'],
    ],
  },
];

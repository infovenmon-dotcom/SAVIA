/* ===========================================================================
   SAVIA DE ALMA — Capa de animacion "Motion" (motion.dev)
   Es el mismo motor que Framer Motion, en JavaScript puro (sin React).
   Se carga desde CDN mediante import() dinamico; si falla (sin red, navegador
   antiguo o reduced-motion), la web sigue funcionando con el reveal CSS /
   IntersectionObserver de app.js. Nunca es un requisito, solo una mejora.
   =========================================================================== */
(function () {
  var root = document.documentElement;

  // Accesibilidad: si el usuario pide menos movimiento, no animamos nada.
  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('js-anim'); // por si acaso, asegura hero visible
    return;
  }

  // import() dinamico: en navegadores que no lo soporten, no rompe (catch).
  import('https://cdn.jsdelivr.net/npm/motion@14.1.1/+esm')
    .then(function (Motion) {
      var animate = Motion.animate;
      var inView  = Motion.inView;
      var stagger = Motion.stagger;
      if (typeof animate !== 'function' || typeof inView !== 'function') return;

      // Muelle suave (sin rebote exagerado) — el "tacto" de Framer Motion.
      var muelle = { type: 'spring', stiffness: 120, damping: 20, mass: 0.9 };

      root.classList.add('motion-ready');

      /* 1) RELEVO DEL SCROLL-REVEAL ----------------------------------------
         Paramos el IntersectionObserver de app.js para no animar dos veces y
         reanimamos con muelle lo que aun no se haya mostrado. */
      var obs = window.__revealObserver;
      if (obs && typeof obs.disconnect === 'function') obs.disconnect();

      var items = window.__revealItems || [];
      items.filter(function (el) {
        return !el.classList.contains('is-visible');
      }).forEach(function (el) {
        inView(el, function () {
          el.classList.add('is-visible');
          animate(el, { opacity: [0, 1], y: [24, 0] }, muelle);
        }, { amount: 0.12, margin: '0px 0px -8% 0px' });
      });

      /* 2) ENTRADA DEL HERO (landing) con escalonado -----------------------
         Solo si el hero sigue oculto por .js-anim (evita parpadeos si Motion
         llegara muy tarde, tras el failsafe del <head>). */
      if (root.classList.contains('js-anim')) {
        var heroKids = document.querySelectorAll('.hero-inner > *');
        if (heroKids.length) {
          animate(
            heroKids,
            { opacity: [0, 1], y: [18, 0] },
            Object.assign({ delay: stagger ? stagger(0.09) : 0 }, muelle)
          );
        }
        root.classList.remove('js-anim');
      }

      /* 3) Latido con muelle en el contador del carrito al anadir producto. */
      window.__motionPop = function (el) {
        animate(el, { scale: [1, 1.4, 1] }, { duration: 0.45, ease: 'easeOut' });
      };
    })
    .catch(function () {
      // Sin Motion: aseguramos que el hero quede visible y dejamos el
      // reveal CSS/IntersectionObserver de app.js a cargo de todo.
      root.classList.remove('js-anim');
    });
})();

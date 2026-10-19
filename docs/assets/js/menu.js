/* Menu principal por necesidades (marcado en tools/menu.js).
   - Movil: el boton "Menu" abre el panel y cada grupo se despliega al tocarlo.
   - Ordenador: los grupos se abren al pasar el raton (CSS) y tambien al
     pulsar, para teclado y pantallas tactiles grandes.
   Sin este script los enlaces siguen en la pagina (buscadores, sin JS). */
(function () {
  var nav = document.querySelector('.menu-nec');
  if (!nav) return;
  var abrir = nav.querySelector('.mn-abrir');
  var grupos = Array.prototype.slice.call(nav.querySelectorAll('.mn-g'));
  nav.classList.add('mn-js');

  function cerrarGrupos(excepto) {
    grupos.forEach(function (g) {
      if (g === excepto) return;
      g.classList.remove('abierto');
      var b = g.querySelector('.mn-top');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function cerrarTodo() {
    cerrarGrupos(null);
    nav.classList.remove('abierto');
    if (abrir) abrir.setAttribute('aria-expanded', 'false');
  }

  if (abrir) abrir.addEventListener('click', function () {
    var si = !nav.classList.contains('abierto');
    nav.classList.toggle('abierto', si);
    abrir.setAttribute('aria-expanded', si ? 'true' : 'false');
    if (!si) cerrarGrupos(null);
  });

  grupos.forEach(function (g) {
    var b = g.querySelector('.mn-top');
    if (!b) return;
    b.addEventListener('click', function () {
      var si = !g.classList.contains('abierto');
      cerrarGrupos(g);
      g.classList.toggle('abierto', si);
      b.setAttribute('aria-expanded', si ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) cerrarTodo();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarTodo();
  });
})();

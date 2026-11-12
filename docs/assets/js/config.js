/* ===========================================================================
   SAVIA DE ALMA — Ajustes editables de la tienda
   Edita SOLO este archivo (no hace falta tocar nada más) y vuelve a publicar.
   =========================================================================== */
window.SAVIA_CONFIG = {

  /* MODO VACACIONES
     true  = toda la web deriva la compra a Amazon (se oculta "Añadir al carrito"
             y aparece un aviso arriba).
     false = funcionamiento normal. */
  modoVacaciones: false,

  /* PASARELA DE PAGO (Stripe)
     Pega aquí la URL de tu función de Stripe (el Cloudflare Worker / función
     serverless que crea el pago). Mira STRIPE_SETUP.md para desplegarla.
       - Con URL puesta  -> "Finalizar compra" abre el pago real de Stripe.
       - Vacío ("")      -> el carrito deriva la compra a Amazon (modo escaparate).
     Ejemplo:
        checkoutEndpoint: "https://savia-pago.tu-usuario.workers.dev", */
  checkoutEndpoint: "https://savia-pago.info-venmon.workers.dev",

  /* PÍXELES DE PUBLICIDAD (solo se cargan si el visitante acepta las cookies)
     metaPixelId:   número del píxel de Meta (Administrador de eventos → Orígenes de datos)
     tiktokPixelId: ID del píxel de TikTok (TikTok Ads → Herramientas → Eventos)
     Vacío ("") = no se carga nada. */
  metaPixelId: "",
  tiktokPixelId: "",

  /* PRODUCTOS AGOTADOS (sin stock) — lista rápida
     Pon aquí los "handle" de los productos sin stock. Esos mostrarán la etiqueta
     "Agotado" y el botón "Comprar en Amazon" en vez de "Añadir al carrito".
     Ejemplo:
        agotados: ["jabon-azufre", "champu-cacao"],  */
  agotados: [
  ],

  /* STOCK POR REFERENCIA (opcional, control fino)
     Indica unidades disponibles por "handle". Cuando una referencia llega a 0
     se trata como AGOTADA (etiqueta "Agotado" + botón "Comprar en Amazon"),
     igual que si estuviera en la lista de arriba.
       - No hace falta listar todos los productos: lo que no aparezca aquí se
         considera disponible (salvo que esté en "agotados").
       - Es un control MANUAL (la web es estática): tú bajas el número al vender.
     Ejemplo:
        stock: {
          "jabon-azufre": 0,      // agotado -> va a Amazon
          "champu-cacao": 5,      // 5 unidades disponibles
        },  */
  stock: {
  },

  /* PRECIOS (opcional) — cambia el precio actual de una referencia
     Si pones un precio aquí, sustituye al del catálogo para ese "handle".
     Útil para subir/bajar un precio sin regenerar el catálogo.
       - Lo que no aparezca aquí mantiene su precio normal.
     Ejemplo:
        precios: {
          "jabon-azufre": 8.99,
        },  */
  precios: {
  },

  /* OFERTAS (opcional) — precio anterior tachado + % de descuento
     Pon aquí el PRECIO ANTERIOR de la referencia (debe ser MAYOR que el precio
     actual). La web mostrará ese precio tachado, el precio actual y la etiqueta
     "-XX%" calculada automáticamente.
       - Para que se vea oferta, el "precio anterior" debe ser mayor que el
         precio actual (ya sea el del catálogo o el de "precios" de arriba).
       - Quita la línea para terminar la oferta.
     Ejemplo (precio actual 8,99 € y antes 10,99 €):
        precios: { "jabon-azufre": 8.99 },
        ofertas: { "jabon-azufre": 10.99 },  */
  ofertas: {
  }

};

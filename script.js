/* Tu número de WhatsApp con lada de país, sin + ni espacios. Ej: 5219510000000 */
var WHATSAPP_NUMBER = '52XXXXXXXXXX';

/* Tamaños, del más grande al más chico. Los vasos son los mismos para todos los sabores, en el mismo orden */
var SIZES = ['Grande', 'Mediano', 'Chico', 'Baby'];
var CUPS = ['img/vasos/grande.png', 'img/vasos/mediano.png', 'img/vasos/chico.png', 'img/vasos/baby.png'];

/* Forma de la imagen de cada pestaña: 'aspect-[4/3]' es ancha, 'aspect-[3/4]' es alta */
var TAB_RATIO = 'aspect-[4/3]';

/* Sabores. tab = texto de la pestaña, tabImg = imagen de la pestaña,
   fruit = la fruta que cae en el vaso: img (recorte PNG con fondo transparente) y shape ('berry' = media fresa, 'grape' = redonda).
   Si la imagen de la uva no existe, se dibuja una uva verde de relleno. */
var FLAVORS = [
  {
    tab: 'Fresas',
    tabImg: 'img/tabs/fresas.jpeg',
    name: 'Fresa con crema',
    desc: 'Fresas frescas en rebanadas con crema batida y una galleta de barquillo.',
    fruit: { img: 'img/tabs/fresa-prep.png', shape: 'berry' }
  },
  {
    tab: 'Uvas',
    tabImg: 'img/tabs/uvas.jpg',
    name: 'Uva con crema',
    desc: 'Uvas verdes y moradas con crema, servidas bien frías.',
    fruit: { img: 'img/tabs/uva-prep.png', shape: 'grape' }
  },
  {
    tab: 'Especialidades',
    tabImg: 'img/tabs/especialidades.jpeg',
    name: 'Especialidad de la casa',
    desc: 'Fresas con chocolate, crema y barquillo. Cambia cada temporada.',
    fruit: { img: 'img/tabs/fresa-prep.png', shape: 'berry' }
  }
];

/* Toppings: la mitad (hacia abajo) va en la fila de arriba y el resto en la de abajo.
   Cómo cae cada uno en el vaso:
   liquid: '#color'              cae como chorro desde arriba y deja manchas escurriendo (cajeta, jarabes)
   candy: { colors, d, n }       caen n piezas de colores de tamaño d (fracción del vaso), como M&M o chispas
   piece: 'img/...png'           (opcional) recorte PNG transparente de una pieza; si no existe se usa un círculo de la foto
   Si no tiene ninguno, caen 3 piezas recortadas en círculo de la foto. */
var TOPPINGS = [
  { name: 'Almendra', img: 'img/toppings/almendra.jpg' },
  { name: 'Cajeta', img: 'img/toppings/cajeta.jpg', liquid: '#b8742a' },
  { name: 'Cheese Cake', img: 'img/toppings/cheeseCake.jpg' },
  { name: 'Chispas Blancas', img: 'img/toppings/chispaschocolatebnc.jpg', candy: { colors: ['#fffdf5', '#f3ead8'], d: 0.045, n: 14 } },
  { name: 'Chispas', img: 'img/toppings/chispasChocolateN.jpg', candy: { colors: ['#4a2a18', '#35190d'], d: 0.045, n: 14 } },
  { name: 'Chocoretas', img: 'img/toppings/chocoretas.jpg' },
  { name: 'Galleta Chokis', img: 'img/toppings/chokis.jpg' },
  { name: 'Granola', img: 'img/toppings/granola.jfif' },
  { name: 'Jarabe de Chocolate', img: 'img/toppings/jarabechocolate.webp', liquid: '#3b1f14' },
  { name: 'Jarabe de Fresa', img: 'img/toppings/jarabeFresaHershey.jpg', liquid: '#d6283f' },
  { name: 'Kinder Delice', img: 'img/toppings/kinderDelice.jpg' },
  { name: 'Galleta Lotus', img: 'img/toppings/Lotus.jpg' },
  { name: 'M&M', img: 'img/toppings/m&m.jpg', candy: { colors: ['#e11d48', '#facc15', '#2563eb', '#16a34a', '#f97316', '#7c3f1d'], d: 0.075, n: 9 } },
  { name: 'Mazapán', img: 'img/toppings/mazapan.jpg' },
  { name: 'Nutella B-Ready', img: 'img/toppings/nutelaB-Ready.jpg' },
  { name: 'Nutella', img: 'img/toppings/nutella.jpg', liquid: '#6b3a1e', thick: 0.07 },
  { name: 'Galleta Oreo', img: 'img/toppings/oreo.jpg' }
];

/* PRECIOS. Los números de abajo son de EJEMPLO: cámbialos por los reales.
   size: precio de cada tamaño, en el mismo orden que SIZES (Grande, Mediano, Chico, Baby)
   flavorExtra: lo que se suma según el sabor (Fresas, Uvas, Especialidades)
   topping: precio normal de un topping       toppingBy: precios distintos para toppings en particular */
var PRICES = {
  size: [95, 80, 65, 45],
  flavorExtra: [0, 0, 15],
  topping: 0,
  toppingBy: { 'Nutella B-Ready': 15, 'Kinder Delice': 15 }
};
/* Máximo de toppings por tamaño, en el mismo orden que SIZES (Grande, Mediano, Chico, Baby) */
var MAX_TOPPINGS = [4, 3, 2, 1];
function maxTop() { return MAX_TOPPINGS[state.size]; }
/* Los toppings con precio son extras: no cuentan para el máximo del tamaño */
function isExtra(name) { return toppingPrice(name) > 0; }
function regularCount() { return state.picked.filter(function (t) { return !isExtra(t); }).length; }
function money(n) { return n ? '$' + n : 'Gratis'; }
function tmoney(n) { return n ? '+$' + n : 'Incluido'; }
function sizePrice(i) { return PRICES.size[i] + (PRICES.flavorExtra[state.flavor] || 0); }
function toppingPrice(name) { return PRICES.toppingBy[name] != null ? PRICES.toppingBy[name] : PRICES.topping; }
function total() {
  return state.picked.reduce(function (sum, t) { return sum + toppingPrice(t); }, sizePrice(state.size));
}

var state = { flavor: 0, size: 3, picked: [], mode: 'a' }; /* size 3 = Baby, el más chico, es con el que empieza */
var waUrl = '#';
var el = function (id) { return document.getElementById(id); };
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Evita que caracteres como & rompan el HTML generado */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

/* Si una imagen todavía no existe, se queda un recuadro rosa en su lugar */
var ONERR = "this.removeAttribute('src');this.classList.add('bg-rose-200')";

var TAB_BASE = 'relative flex min-w-0 flex-col items-center gap-1.5 px-1.5 pb-3 pt-3 transition-colors motion-reduce:transition-none ';

/* Letra de las pestañas: cada texto se ajusta al ancho de su cuadro.
   TAB_FONT_MAX es el tope (fracción del ancho del cuadro). Bájalo, por ejemplo a 0.13, para que todas se vean más parejas. */
var TAB_FONT_MAX = 0.2;
function fitTabLabels() {
  [].forEach.call(el('tabs').querySelectorAll('[data-fit]'), function (s) {
    var tile = s.parentNode.clientWidth;
    if (!tile) return;
    s.style.fontSize = '100px';
    var w = s.offsetWidth;
    s.style.fontSize = Math.min((tile * 0.88) / w * 100, tile * TAB_FONT_MAX) + 'px';
  });
}
var TAB_OFF = 'rounded-t-2xl hover:bg-rose-100/60';
var TAB_ON = 'rounded-t-3xl bg-rose-100 ';
var FLARE_L = "before:absolute before:bottom-0 before:right-full before:h-4 before:w-4 before:rounded-br-2xl before:shadow-[0.5rem_0.5rem_0_0.5rem_#ffe4e6] before:content-[''] ";
var FLARE_R = "after:absolute after:bottom-0 after:left-full after:h-4 after:w-4 after:rounded-bl-2xl after:shadow-[-0.5rem_0.5rem_0_0.5rem_#ffe4e6] after:content-[''] ";
var PANEL = 'flex flex-col gap-5 rounded-b-3xl bg-rose-100 p-5 ';

/* ---------- pedido ---------- */
function renderTabs() {
  el('tabs').innerHTML = FLAVORS.map(function (f, i) {
    var on = i === state.flavor;
    var cls = TAB_BASE + (on ? TAB_ON + (i > 0 ? FLARE_L : '') + (i < FLAVORS.length - 1 ? FLARE_R : '') : TAB_OFF);
    /* Estilo Disney+: la imagen es el fondo del cuadro y el texto va encima */
    return '<button class="' + cls + '" role="tab" type="button" data-i="' + i + '" aria-selected="' + on + '">' +
      '<span class="relative block w-full overflow-hidden rounded-2xl transition-transform duration-300 ' + TAB_RATIO + ' ' + (on ? '' : 'scale-95') + '">' +
        '<img src="' + esc(f.tabImg) + '" alt="" onerror="' + ONERR + '" class="absolute inset-0 h-full w-full bg-rose-200 object-cover">' +
        '<span class="absolute inset-0 transition-colors duration-300 ' + (on ? 'bg-gradient-to-t from-black/60 to-black/15' : 'bg-black/55') + '"></span>' +
        '<span class="absolute inset-0 flex items-center justify-center"><span data-fit style="font-size:14px" class="whitespace-nowrap font-extrabold leading-none tracking-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">' + esc(f.tab) + '</span></span>' +
      '</span></button>';
  }).join('');
  el('panel').className = PANEL + (state.flavor === 0 ? 'rounded-tl-none ' : 'rounded-tl-3xl ') + (state.flavor === FLAVORS.length - 1 ? 'rounded-tr-none' : 'rounded-tr-3xl');
  fitTabLabels();
}
/* El carrusel es infinito: después de Grande viene Baby y al revés.
   Flecha derecha = vaso más grande, flecha izquierda = vaso más chico. */
function sizeAt(i) { return SIZES[(i + SIZES.length) % SIZES.length]; }
function renderSize() {
  var name = SIZES[state.size];
  var lbl = function (i) {
    i = (i + SIZES.length) % SIZES.length;
    return SIZES[i] + '<span class="block text-xs font-medium text-rose-900/70">' + money(sizePrice(i)) + '</span>';
  };
  el('sizeName').innerHTML = esc(name) + ' <span class="text-rose-600">· ' + money(sizePrice(state.size)) + '</span>';
  el('bSize').textContent = name;
  el('bPrice').textContent = money(sizePrice(state.size));
  el('prevLabel').innerHTML = lbl(state.size + 1); /* izquierda: el siguiente más chico */
  el('nextLabel').innerHTML = lbl(state.size - 1); /* derecha: el siguiente más grande */
}
function goSize(delta) { /* +1 = más chico, -1 = más grande */
  state.size = (state.size + delta + SIZES.length) % SIZES.length;
  while (regularCount() > maxTop()) { /* en un vaso más chico caben menos: se quitan los últimos normales */
    for (var k = state.picked.length - 1; k >= 0; k--) if (!isExtra(state.picked[k])) { state.picked.splice(k, 1); break; }
  }
  syncGrid(); renderProduct();
  renderSize(); renderSummary(); syncCup(delta);
}
/* Le avisa al vaso lo que se eligió; él decide si gira, si cae fruta o si cae un topping */
function syncCup(dir) { Cup.set({ size: state.size, flavor: state.flavor, picked: state.picked }, dir); }
function renderProduct() {
  var f = FLAVORS[state.flavor];
  el('pName').textContent = f.name;
  el('bName').textContent = f.name;
  el('pDesc').textContent = f.desc;
  var pk = el('pPicked');
  pk.hidden = state.picked.length === 0;
  pk.textContent = state.picked.length ? 'Con ' + state.picked.join(', ').toLowerCase() : '';
}
function renderSummary() {
  el('sumToppings').innerHTML = state.picked.length
    ? state.picked.map(function (t) {
        return '<button type="button" data-rm="' + esc(t) + '" class="rounded-full border-[1.5px] border-rose-600 bg-white px-3 py-1.5 text-sm font-medium text-rose-950">' + esc(t) + ' <span class="text-rose-900/60">' + (toppingPrice(t) ? money(toppingPrice(t)) : '') + '</span> <span aria-hidden="true">×</span><span class="sr-only">Quitar</span></button>';
      }).join('')
    : '<span class="text-[0.9375rem] text-rose-900/70">Ninguno todavía. Elígelos arriba.</span>';
  el('total').textContent = money(total());
  var msg = 'Hola, quiero ordenar:\n• ' + FLAVORS[state.flavor].name +
            '\n• Tamaño: ' + SIZES[state.size] + ' (' + money(sizePrice(state.size)) + ')' +
            '\n• Toppings: ' + (state.picked.length
              ? state.picked.map(function (t) { return t + (toppingPrice(t) ? ' (' + money(toppingPrice(t)) + ')' : ''); }).join(', ')
              : 'sin toppings') +
            '\n*Total: ' + money(total()) + '*';
  waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  if (state.mode === 'b') el('mainBtn').href = waUrl;
}
function reveal(i) {
  if (reduce || !el('panel').animate) return;
  var c = ((i + 0.5) / FLAVORS.length) * 100, w = 100 / FLAVORS.length / 2;
  el('panel').animate(
    [{ clipPath: 'inset(0 ' + (100 - c - w) + '% 0 ' + (c - w) + '%)' }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }
  );
}

/* ---------- toppings ---------- */
/* Borde oscuro con sombra interior y un filo claro abajo: se ve como un hueco recortado en el panel */
function toppingBtn(t) {
  return '<button type="button" data-t="' + esc(t.name) + '" aria-pressed="false" class="group flex w-[72px] flex-col items-center gap-1 border-0 bg-transparent p-0">' +
    '<span class="relative block h-[72px] w-[72px]">' +
      '<span class="glow-ring pointer-events-none absolute -inset-2 rounded-full" aria-hidden="true"></span>' +
      '<span class="relative block h-full w-full overflow-hidden rounded-full transition-colors group-aria-pressed:border-rose-600">' +
        '<img src="' + esc(t.img) + '" alt="" onerror="' + ONERR + '" draggable="false" class="h-full w-full bg-rose-200 object-cover">' +
        '<span class="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.25)]"></span>' +
      '</span>' +
      '<span class="absolute -right-0.5 -top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[0.7rem] font-bold text-white group-aria-pressed:flex" aria-hidden="true">✓</span>' +
    '</span>' +
    '<span class="relative text-center text-[0.6875rem] font-semibold leading-tight">' + esc(t.name) + '<span class="block font-medium text-rose-900/70">' + tmoney(toppingPrice(t.name)) + '</span></span></button>';
}
function renderGrid() {
  /* los extras con precio van hasta el final del carrusel */
  var list = TOPPINGS.filter(function (t) { return !isExtra(t.name); }).concat(TOPPINGS.filter(function (t) { return isExtra(t.name); }));
  var half = Math.floor(list.length / 2);
  var top = list.slice(0, half).map(toppingBtn).join('');
  var bottom = list.slice(half).map(toppingBtn).join('');
  /* la fila de arriba (una menos) va corrida media celda para quedar entre las de abajo */
  el('topRows').innerHTML =
    '<div class="flex gap-3 pl-[42px]">' + top + '</div>' +
    '<div class="flex gap-3">' + bottom + '</div>';
}
/* Pone el estado de cada botón del carrusel y el contador; al llenarse el vaso los demás se apagan */
function syncGrid() {
  var full = regularCount() >= maxTop();
  [].forEach.call(el('topRows').querySelectorAll('[data-t]'), function (b) {
    var on = state.picked.indexOf(b.getAttribute('data-t')) > -1;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('opacity-40', full && !on && !isExtra(b.getAttribute('data-t')));
  });
  el('topHint').textContent = 'Elige hasta ' + maxTop() + ' (' + regularCount() + '/' + maxTop() + '). Los extras con precio no cuentan. Desliza para ver todos.';
}
function setPicked(name, on) {
  var i = state.picked.indexOf(name);
  if (on && i === -1 && !isExtra(name) && regularCount() >= maxTop()) { /* vaso lleno */
    el('topHint').animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
    return;
  }
  if (on && i === -1) state.picked.push(name);
  if (!on && i > -1) state.picked.splice(i, 1);
  syncGrid();
  renderSummary(); renderProduct(); syncCup();
}
/* el rosa se extiende como aceite y los toppings aparecen encima */
function playOil() {
  if (reduce || !el('oil').animate) return;
  el('oil').animate(
    [{ clipPath: 'circle(0% at 0% 35%)' }, { clipPath: 'circle(150% at 0% 35%)' }],
    { duration: 1100, delay: 300, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' }
  );
  /* cada topping entra rodando de derecha a izquierda hasta su lugar */
  var DX = 190, ROLL = -(DX / (72 * Math.PI)) * 360; /* una vuelta por cada circunferencia recorrida */
  [].forEach.call(el('topRows').querySelectorAll('[data-t]'), function (b, i) {
    var delay = 450 + Math.min(i, 12) * 60, opt = { duration: 800, delay: delay, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'backwards' };
    b.animate([{ opacity: 0, transform: 'translateX(' + DX + 'px)' }, { opacity: 1, offset: 0.15 }, { opacity: 1, transform: 'translateX(0)' }], opt);
    /* solo el círculo gira (la letra no): rueda como una moneda */
    b.firstElementChild.animate([{ transform: 'rotate(' + (-ROLL) + 'deg)' }, { transform: 'rotate(0deg)' }], opt);
  });
}

/* ---------- cambio de pantalla (solo hero <-> toppings) ---------- */
var anim = null, pendingOut = null;
function finish() {
  if (pendingOut) { pendingOut.classList.add('h-0', 'overflow-hidden'); pendingOut.inert = true; pendingOut = null; }
  if (anim) { var a = anim; anim = null; a.cancel(); }
}
function show(which) {
  var toT = which === 'toppings';
  var inc = el(toT ? 'toppingsScreen' : 'heroScreen');
  var out = el(toT ? 'heroScreen' : 'toppingsScreen');
  var vp = el('viewport');
  finish();
  var h0 = vp.offsetHeight;
  inc.classList.remove('h-0', 'overflow-hidden'); inc.inert = false;
  var h1 = inc.offsetHeight;
  el('track').classList.toggle('-translate-x-1/2', !toT);
  try { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) {}
  if (toT) playOil();
  if (reduce || !vp.animate) { pendingOut = out; finish(); return; }
  pendingOut = out;
  /* la altura de la zona se ajusta sin saltos mientras se desliza */
  anim = vp.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }],
    { duration: 500, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  anim.onfinish = finish;
}
function setMode(m) {
  state.mode = m;
  el('panel').setAttribute('data-mode', m);
  el('mainBtn').href = m === 'b' ? waUrl : '#pedido';
  show(m === 'b' ? 'toppings' : 'hero');
}

/* ---------- eventos ---------- */
el('tabs').addEventListener('click', function (e) {
  var b = e.target.closest('[data-i]'); if (!b) return;
  var i = +b.getAttribute('data-i');
  if (i === state.flavor) return;
  state.flavor = i;
  renderTabs(); renderSize(); renderProduct(); renderSummary(); reveal(i); syncCup();
});
el('prev').addEventListener('click', function () { goSize(1); });
el('next').addEventListener('click', function () { goSize(-1); });
el('mainBtn').addEventListener('click', function (e) {
  if (state.mode === 'a') { e.preventDefault(); setMode('b'); }
});
el('backBtn').addEventListener('click', function () { setMode('a'); });
el('topRows').addEventListener('click', function (e) {
  var b = e.target.closest('[data-t]'); if (!b) return;
  setPicked(b.getAttribute('data-t'), b.getAttribute('aria-pressed') !== 'true');
});
/* Carrusel de toppings: en celular se desliza con el dedo; en computadora se arrastra con el mouse o con la rueda */
(function () {
  var sc = el('topScroll'), down = false, moved = false, sx = 0, sl = 0;
  sc.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sl = sc.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    if (Math.abs(dx) > 5) moved = true;
    if (moved) sc.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', function () { down = false; });
  sc.addEventListener('click', function (e) { /* un arrastre no cuenta como toque */
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
  sc.addEventListener('wheel', function (e) { /* la rueda vertical mueve el carrusel de lado */
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    var max = sc.scrollWidth - sc.clientWidth, next = sc.scrollLeft + e.deltaY;
    if (next < 0 || next > max) return; /* en los extremos deja que la página siga */
    sc.scrollLeft = next; e.preventDefault();
  }, { passive: false });
})();

el('sumToppings').addEventListener('click', function (e) {
  var b = e.target.closest('[data-rm]'); if (!b) return;
  setPicked(b.getAttribute('data-rm'), false);
});

Cup.init({
  wrap: el('cupWrap'), img: el('cupImg'), canvas: el('fx'),
  cups: CUPS, names: SIZES, flavors: FLAVORS, toppings: TOPPINGS
});
renderTabs(); renderGrid(); syncGrid(); renderSize(); renderProduct(); renderSummary(); syncCup();

/* La fruta cae la primera vez que el pedido aparece en pantalla */
if ('IntersectionObserver' in window) {
  var seen = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { seen.disconnect(); Cup.start(); }
  }, { threshold: 0.3 });
  seen.observe(el('pedido'));
} else {
  Cup.start();
}

/* Reajusta la letra de las pestañas al girar el celular o cuando termina de cargar la fuente */
window.addEventListener('resize', fitTabLabels);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTabLabels);

el('year').textContent = new Date().getFullYear();
/* cup.js: el vaso. La fruta y los toppings caen con física 2D (Matter.js) y se quedan dentro.
   script.js solo llama a Cup.init(...), Cup.set(...) y Cup.start(). */
var Cup = (function () {
  var M = window.Matter;
  var DPR = Math.min(window.devicePixelRatio || 1, 2); /* tope 2 para cuidar celulares de gama baja */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Espacio extra del lienzo alrededor del vaso: por arriba nace la fruta, a los lados cabe el montón */
  var MARGIN = 30, HEAD = 170, FOOT = 12;

  /* Giro al cambiar de vaso (estilo Taz): turnsOut vueltas acelerando, se cambia el vaso de canto y
     turnsIn vueltas más frenando hasta el bamboleo final de moneda. Ajusta aquí la velocidad y la cantidad. */
  var SPIN = { turnsOut: 2, turnsIn: 1, outMs: 800, inMs: 1350, hop: 18 };

  /* Medidas de cada vaso, tomadas sobre su imagen (valores de 0 a 1), en el mismo orden que SIZES.
     w       ancho en pantalla (px)
     aspect  ancho / alto de la imagen
     rimY    altura del borde        floorY  altura del fondo
     topL/topR  paredes a la altura del borde      botL/botR  paredes en el fondo
     front   vaso opaco: la fruta se dibuja encima y se recorta con el labio delantero (lipY) */
  var GEOM = [
    { w: 140, aspect: 657 / 896, rimY: 0.22, floorY: 0.88, topL: 0.05, topR: 0.95, botL: 0.25, botR: 0.75 },
    { w: 124, aspect: 658 / 897, rimY: 0.22, floorY: 0.88, topL: 0.05, topR: 0.95, botL: 0.25, botR: 0.75 },
    { w: 112, aspect: 659 / 694, rimY: 0.20, floorY: 0.87, topL: 0.05, topR: 0.95, botL: 0.27, botR: 0.73 },
    { w: 96, aspect: 1289 / 1227, rimY: 0.20, floorY: 0.46, topL: 0.04, topR: 0.96, botL: 0.31, botR: 0.70, front: true, lipY: 0.505 }
  ];

  var cfg, wrap, img, cv, ctx;
  var dims = null, engine = null, bodies = [];
  var raf = 0, last = 0, acc = 0, lastChange = 0;
  var seq = 0, started = false;
  var cur = { size: null, flavor: null, picked: [] };
  var cache = {};
  var fruitH = 20;                          /* alto de una fruta, para saber hasta dónde sube la crema */
  var L = { cream: null, streams: [], until: 0 }; /* líquidos: crema de fondo, chorros que caen, hora en que termina todo */

  function rand(a, b) { return a + Math.random() * (b - a); }
  function X(n) { return MARGIN + n * dims.W; }
  function Y(n) { return HEAD + n * dims.H; }

  function loadImg(src) {
    if (!cache[src]) {
      cache[src] = new Promise(function (resolve) {
        var i = new Image();
        i.onload = function () { resolve(i); };
        i.onerror = function () { resolve(null); };
        i.src = src;
      });
    }
    return cache[src];
  }

  /* ---------- vaso y mundo físico ---------- */
  function applyCup(i) {
    var g = GEOM[i], W = g.w, H = W / g.aspect;
    dims = { g: g, W: W, H: H, cw: W + MARGIN * 2, ch: H + HEAD + FOOT };
    wrap.style.width = W + 'px';
    wrap.style.height = H + 'px';
    wrap.style.marginLeft = (-W / 2) + 'px';
    img.alt = cfg.names[i] ? 'Vaso ' + cfg.names[i].toLowerCase() : '';
    img.src = cfg.cups[i];
    img.style.zIndex = 1;
    cv.style.zIndex = g.front ? 2 : 0;
    cv.style.left = -MARGIN + 'px';
    cv.style.top = -HEAD + 'px';
    cv.style.width = dims.cw + 'px';
    cv.style.height = dims.ch + 'px';
    cv.width = Math.round(dims.cw * DPR);
    cv.height = Math.round(dims.ch * DPR);
    ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildWorld();
  }

  function wall(x1, y1, x2, y2, side) {
    var T = 40, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    var nx = -dy / len, ny = dx / len;
    if (nx * side < 0) { nx = -nx; ny = -ny; } /* la normal apunta hacia afuera del vaso */
    return M.Bodies.rectangle((x1 + x2) / 2 + nx * T / 2, (y1 + y2) / 2 + ny * T / 2, len + T, T,
      { isStatic: true, angle: Math.atan2(dy, dx), friction: 0.3, restitution: 0.1 });
  }

  function buildWorld() {
    if (!M) return;
    var g = dims.g;
    engine = M.Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.5;
    engine.positionIterations = 8;
    bodies = [];
    L = { cream: null, streams: [], until: 0 };
    var T = 40;
    M.Composite.add(engine.world, [
      wall(X(g.topL), Y(g.rimY), X(g.botL), Y(g.floorY), -1),                 /* pared izquierda */
      wall(X(g.topR), Y(g.rimY), X(g.botR), Y(g.floorY), 1),                  /* pared derecha */
      wall(X(g.topL), -300, X(g.topL), Y(g.rimY), -1),                        /* prolongación arriba del borde */
      wall(X(g.topR), -300, X(g.topR), Y(g.rimY), 1),
      M.Bodies.rectangle((X(g.botL) + X(g.botR)) / 2, Y(g.floorY) + T / 2, X(g.botR) - X(g.botL) + 2 * T, T,
        { isStatic: true, friction: 0.5, restitution: 0.05 })                   /* fondo */
    ]);
  }

  /* ---------- sprites ---------- */
  function grapeSprite(d) {
    var c = document.createElement('canvas');
    c.width = c.height = Math.round(d * DPR);
    var x = c.getContext('2d'), r = d / 2;
    x.scale(DPR, DPR);
    var gr = x.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
    gr.addColorStop(0, '#eef5a8'); gr.addColorStop(0.6, '#b7cc55'); gr.addColorStop(1, '#7f9a2c');
    x.fillStyle = gr; x.beginPath(); x.arc(r, r, r - 0.5, 0, 7); x.fill();
    x.strokeStyle = 'rgba(60,80,10,0.55)'; x.lineWidth = 1; x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.ellipse(r * 0.68, r * 0.55, r * 0.22, r * 0.12, -0.6, 0, 7); x.fill();
    return c;
  }

  function roundSprite(im, d) {
    var c = document.createElement('canvas');
    c.width = c.height = Math.round(d * DPR);
    var x = c.getContext('2d'), r = d / 2;
    x.scale(DPR, DPR);
    x.save(); x.beginPath(); x.arc(r, r, r - 0.5, 0, 7); x.clip();
    var s = Math.min(im.naturalWidth, im.naturalHeight);
    x.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, d, d);
    x.restore();
    return c;
  }

  /* contorno aproximado (convexo) de media fresa, relativo al centro del sprite */
  var BERRY = [[-0.47, -0.44], [0.47, -0.44], [0.50, -0.12], [0.36, 0.24], [0.12, 0.5], [-0.12, 0.5], [-0.36, 0.24], [-0.50, -0.12]];

  function fruitSprite(shape, im) {
    var W = dims.W;
    if (shape === 'berry' && im) {
      var w = 0.27 * W, h = w * im.naturalHeight / im.naturalWidth;
      var verts = BERRY.map(function (p) { return { x: p[0] * w, y: p[1] * h }; });
      var c = M.Vertices.centre(verts);
      return { src: im, w: w, h: h, verts: verts, cx: c.x, cy: c.y, area: 0.62 * w * h };
    }
    var d = 0.17 * W;
    return { src: im || grapeSprite(d), w: d, h: d, area: Math.PI * d * d / 4 };
  }

  /* ---------- cuerpos ---------- */
  function addBody(spr, x, y, tag, angle) {
    var opts = { friction: 0.4, frictionStatic: 0.7, restitution: 0.12, frictionAir: 0.015, density: 0.002, sleepThreshold: 40, angle: angle || 0 };
    var b = spr.verts ? M.Bodies.fromVertices(x, y, [spr.verts], opts) : M.Bodies.circle(x, y, spr.w / 2, opts);
    b.spr = spr; b.tag = tag;
    M.Composite.add(engine.world, b);
    bodies.push(b);
    wake();
  }

  function clearBodies() {
    if (!M || !engine) return;
    bodies.forEach(function (b) { M.Composite.remove(engine.world, b); });
    bodies = [];
    L = { cream: null, streams: [], until: 0 };
    draw();
  }

  function fruitCount(spr) {
    var g = dims.g;
    var wTop = (g.topR - g.topL) * dims.W, wBot = (g.botR - g.botL) * dims.W;
    var area = (wTop + wBot) / 2 * (g.floorY - g.rimY) * dims.H;
    return Math.min(46, Math.round(area * 0.6 / spr.area) + 3);
  }

  /* ---------- líquidos: crema, chorros y manchas ---------- */
  function now() { return performance.now(); }
  function clamp01(t) { return Math.max(0, Math.min(1, t)); }
  function ease(t) { return 1 - Math.pow(1 - clamp01(t), 3); }

  /* x de la pared izquierda/derecha del vaso a la altura y */
  function wallX(y, left) {
    var g = dims.g, k = clamp01((Y(g.floorY) - y) / ((g.floorY - g.rimY) * dims.H));
    return X(left ? g.botL + (g.topL - g.botL) * k : g.botR + (g.topR - g.botR) * k);
  }
  function pileTop() {
    var y = Infinity;
    bodies.forEach(function (b) { if (b.tag === 'fruit' && b.bounds.min.y < y) y = b.bounds.min.y; });
    return y === Infinity ? Y(dims.g.floorY) : y;
  }
  function creamY(t) {
    var c = L.cream;
    return c.from + (c.to - c.from) * ease((t - c.t0) / c.dur);
  }
  function addStain(b, tag, color, t0, big) {
    b.stains = b.stains || [];
    b.stains.push({
      tag: tag, color: color, t0: t0, ox: rand(-0.25, 0.25), sz: big ? rand(0.85, 1.1) : rand(0.6, 0.85),
      drips: [{ dx: rand(-0.3, -0.05), len: rand(0.25, 0.6) }, { dx: rand(0.05, 0.3), len: rand(0.15, 0.5) }]
    });
  }
  function until(t) { if (t > L.until) L.until = t; }

  /* crema: sube desde el fondo por detrás de la fruta y llena los huecos */
  function pourCream() {
    if (!ctx || !bodies.length) return;
    var g = dims.g, t0 = reduced ? -1e6 : now();
    var target = Math.min(Y(g.floorY) - 4, Math.max(Y(g.rimY) + 2, pileTop() + fruitH * 0.45));
    L.cream = { t0: t0 + 600, dur: 2100, from: Y(g.floorY), to: target };
    L.streams.push({ cream: true, x: X((g.topL + g.topR) / 2) + rand(-0.04, 0.04) * dims.W, color: '#fffdf7', edge: '#e6d3b8',
      w: 0.11 * dims.W, t0: t0, dur: 2900, endY: pileTop() + fruitH * 0.1 });
    bodies.forEach(function (b) {
      if (b.tag === 'fruit' && b.bounds.min.y < target + fruitH * 0.25) addStain(b, 'cream', '#fffaf0', t0 + 1700 + rand(0, 600), true);
    });
    until(t0 + 4800); wake();
    if (reduced) draw();
  }

  /* jarabes y cajeta: chorro delgado desde arriba que deja manchas que escurren por la fruta de encima */
  function pourSyrup(t) {
    if (!ctx) return;
    var g = dims.g, top = pileTop(), t0 = reduced ? -1e6 : now();
    var sx = X((g.topL + g.topR) / 2) + rand(-0.12, 0.12) * dims.W;
    L.streams.push({ tag: t.name, x: sx, color: t.liquid, edge: 'rgba(0,0,0,0.25)', w: (t.thick || 0.05) * dims.W,
      t0: t0, dur: 1400, endY: top + fruitH * 0.2 });
    bodies.forEach(function (b) {
      if (b.tag === 'fruit' && Math.abs(b.position.x - sx) < 0.2 * dims.W && b.bounds.min.y < top + fruitH * 0.9)
        addStain(b, t.name, t.liquid, t0 + 350 + rand(0, 250), false);
    });
    until(t0 + 3000); wake();
    if (reduced) draw();
  }

  function drawCream(t) {
    var c = L.cream; if (!c) return;
    var p = clamp01((t - c.t0) / c.dur); if (p <= 0) return;
    var g = dims.g, ys = creamY(t), yb = Y(g.floorY) - 1, amp = p < 1 ? 2.6 : 0.5 + 2.6 * Math.exp(-(t - c.t0 - c.dur) / 380), ph = t / 170;
    var xl = wallX(ys, true) + 2, xr = wallX(ys, false) - 2, n = 14;
    ctx.beginPath();
    ctx.moveTo(X(g.botL) + 2, yb);
    ctx.lineTo(xl, ys);
    for (var i = 1; i <= n; i++) ctx.lineTo(xl + (xr - xl) * i / n, ys + Math.sin(i * 1.3 + ph) * amp);
    ctx.lineTo(X(g.botR) - 2, yb);
    ctx.closePath();
    var gr = ctx.createLinearGradient(0, ys, 0, yb);
    gr.addColorStop(0, '#fffdf8'); gr.addColorStop(1, '#f0dcc2');
    ctx.fillStyle = gr; ctx.fill();
  }

  function drawStains(b, t) {
    var sp = b.spr;
    b.stains.forEach(function (s) {
      var k = ease((t - s.t0) / 900); if (k <= 0) return;
      var cx = b.position.x + s.ox * sp.w, cy = b.bounds.min.y + sp.h * 0.3;
      var dk = ease((t - s.t0 - 250) / 1500);
      ctx.fillStyle = s.color; ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, sp.w * 0.07);
      s.drips.forEach(function (d) {
        var len = d.len * sp.h * dk * 0.8; if (len < 1) return;
        var x = cx + d.dx * sp.w;
        ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy + len); ctx.stroke();
      });
      var rx = sp.w * 0.3 * s.sz * k, ry = sp.h * 0.13 * s.sz * k;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, -0.12, 0, 7);
      ctx.ellipse(cx + rx * 0.55, cy + ry * 0.35, rx * 0.55, ry * 0.8, 0.2, 0, 7);
      ctx.ellipse(cx - rx * 0.6, cy + ry * 0.3, rx * 0.5, ry * 0.75, -0.2, 0, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,50,30,0.28)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.35, ry * 0.3, 0, 0, 7); ctx.fill();
    });
  }

  /* chorro: ondula, se adelgaza al final, termina en gota y forma un montoncito donde cae */
  function drawStreams(t, creamPass) {
    L.streams.forEach(function (s) {
      if (!!s.cream !== creamPass) return;
      var p = (t - s.t0) / s.dur; if (p < 0 || p > 1) return;
      var end = s.endY;
      var yh = end * ease(p / 0.22), yt = end * ease((p - 0.62) / 0.38);
      if (yh - yt < 1) return;
      var thin = 1 - 0.55 * clamp01((p - 0.45) / 0.4), N = 24, lp = [], rp = [];
      for (var i = 0; i <= N; i++) {
        var k = i / N, y = yt + (yh - yt) * k;
        var w = s.w * thin * (0.82 + 0.18 * Math.sin(y * 0.07 - t / 80));
        w *= 1.25 - 0.5 * (y / end); /* más grueso arriba, se estira hacia abajo */
        w *= 0.25 + 0.75 * clamp01((y - yt) / (s.w * 3)); /* la cola se afina al soltarse */
        var cx = s.x + Math.sin(y * 0.045 - t / 140) * s.w * 0.22 * k;
        lp.push([cx - w / 2, y]); rp.push([cx + w / 2, y]);
      }
      var tip = lp[N], tipR = rp[N], hr = (tipR[0] - tip[0]) * 0.5 * (p < 0.5 ? 1.35 : 1.05), hx = (tip[0] + tipR[0]) / 2;
      /* montoncito en la superficie */
      if (p > 0.18 && p < 0.97) {
        var m = ease((p - 0.18) / 0.3) * (1 - 0.6 * clamp01((p - 0.7) / 0.27)), mr = s.w * 1.5 * m;
        ctx.beginPath(); ctx.ellipse(s.x, end, mr, mr * 0.36, 0, Math.PI, 0); ctx.closePath();
        ctx.fillStyle = s.color; ctx.fill(); ctx.strokeStyle = s.edge; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(lp[0][0], lp[0][1]);
      for (i = 1; i <= N; i++) ctx.lineTo(lp[i][0], lp[i][1]);
      ctx.arc(hx, tip[1], hr, Math.PI, 0, true);
      for (i = N; i >= 0; i--) ctx.lineTo(rp[i][0], rp[i][1]);
      ctx.closePath();
      ctx.fillStyle = s.color; ctx.fill();
      ctx.strokeStyle = s.edge; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (i = 1; i < N; i += 1) ctx.fillRect(lp[i][0] + (rp[i][0] - lp[i][0]) * 0.2, lp[i][1], Math.max(1, (rp[i][0] - lp[i][0]) * 0.15), (yh - yt) / N + 0.5);
    });
  }

  /* ---------- dibujo y bucle ---------- */
  function draw() {
    if (!ctx) return;
    var t = now();
    ctx.clearRect(0, 0, dims.cw, dims.ch);
    ctx.save();
    var g = dims.g;
    if (g.front) { /* vaso opaco: se oculta lo que queda debajo del labio delantero */
      var yr = Y(g.rimY), xl = X(g.topL - 0.02), xr = X(g.topR + 0.02);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(dims.cw, 0); ctx.lineTo(dims.cw, yr); ctx.lineTo(xr, yr);
      ctx.ellipse((xl + xr) / 2, yr, (xr - xl) / 2, (g.lipY - g.rimY) * dims.H, 0, 0, Math.PI, false);
      ctx.lineTo(0, yr); ctx.closePath(); ctx.clip();
    }
    drawCream(t);
    drawStreams(t, true); /* la crema cae por detrás de la fruta */
    bodies.forEach(function (b) {
      var s = b.spr;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.drawImage(s.src, -(s.cx || 0) - s.w / 2, -(s.cy || 0) - s.h / 2, s.w, s.h);
      ctx.restore();
      if (b.stains) drawStains(b, t);
    });
    drawStreams(t, false);
    ctx.restore();
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    acc += Math.min(34, t - last); last = t;
    while (acc >= 16.67) { M.Engine.update(engine, 16.67); acc -= 16.67; }
    draw();
    /* cuando todo quedó quieto (o pasaron 6 s) se apaga el bucle y no se gasta batería */
    var still = bodies.every(function (b) { return b.isSleeping; });
    if ((still && t - lastChange > 400 && now() > L.until) || t - lastChange > 7000) { cancelAnimationFrame(raf); raf = 0; }
  }
  function wake() {
    lastChange = performance.now();
    if (!raf && M && engine) { last = lastChange; acc = 0; raf = requestAnimationFrame(tick); }
  }
  function settleNow() { /* sin animación: se calcula el resultado final de golpe */
    for (var i = 0; i < 700; i++) M.Engine.update(engine, 16.67);
    draw();
  }

  /* ---------- fruta y toppings ---------- */
  function fillAll(mySeq) {
    clearBodies();
    cv.style.opacity = 1;
    var fl = cfg.flavors[cur.flavor].fruit;
    loadImg(fl.img).then(function (im) {
      if (mySeq !== seq || !M) return;
      var spr = fruitSprite(fl.shape, im), n = fruitCount(spr), g = dims.g;
      fruitH = spr.h;
      var x0 = X(g.topL) + spr.w * 0.5, x1 = X(g.topR) - spr.w * 0.5;
      for (var i = 0; i < n; i++) {
        (function (i) {
          var go = function () { if (mySeq === seq) addBody(spr, rand(x0, x1), reduced ? 10 - i * spr.h : rand(6, 36), 'fruit', rand(-3, 3)); };
          if (reduced) go(); else setTimeout(go, i * 55);
        })(i);
      }
      if (reduced) settleNow();
      /* cuando la fruta ya se acomodó cae la crema, y después los toppings que ya estaban elegidos */
      setTimeout(function () {
        if (mySeq !== seq) return;
        pourCream();
        setTimeout(function () {
          if (mySeq !== seq) return;
          cur.picked.forEach(function (name) { dropTopping(name); });
        }, reduced ? 0 : 3000);
      }, reduced ? 0 : n * 55 + 700);
    });
  }

  /* pieza de dulce de colores (M&M, chispas) dibujada en código */
  function candySprite(d, color) {
    var c = document.createElement('canvas');
    c.width = c.height = Math.max(2, Math.round(d * DPR));
    var x = c.getContext('2d'), r = d / 2;
    x.scale(DPR, DPR);
    var gr = x.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.35, color); gr.addColorStop(1, color);
    x.fillStyle = color; x.beginPath(); x.arc(r, r, r - 0.4, 0, 7); x.fill();
    x.fillStyle = gr; x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 0.8; x.stroke();
    return c;
  }

  function dropTopping(name) {
    if (!M || !engine) return;
    var t = cfg.toppings.filter(function (x) { return x.name === name; })[0];
    if (!t) return;
    var mySeq = seq, g = dims.g, mid = (g.topL + g.topR) / 2, half = (g.topR - g.topL) * 0.3 * dims.W;
    var ok = function () { return mySeq === seq && cur.picked.indexOf(name) > -1; };

    if (t.liquid) { pourSyrup(t); return; }

    if (t.candy) { /* piezas de colores, una tras otra */
      var d = Math.max(6, t.candy.d * dims.W), n = t.candy.n || 9, sprites = t.candy.colors.map(function (c) { return { src: candySprite(d, c), w: d, h: d }; });
      for (var i = 0; i < n; i++) {
        (function (i) {
          setTimeout(function () {
            if (ok()) addBody(sprites[i % sprites.length], rand(X(mid) - half, X(mid) + half), rand(6, 30), name, rand(-3, 3));
          }, reduced ? 0 : i * 70);
        })(i);
      }
      if (reduced) setTimeout(settleNow, 0);
      return;
    }

    /* piezas con su foto (o con un recorte PNG transparente si se da t.piece) */
    loadImg(t.piece || t.img).then(function (im) {
      if (t.piece && !im) return loadImg(t.img).then(function (im2) { return [im2, false]; });
      return [im, !!t.piece];
    }).then(function (r) {
      if (!ok()) return;
      var im = r[0], cut = r[1], d = Math.max(11, 0.13 * dims.W);
      var spr = cut ? { src: im, w: d, h: d * im.naturalHeight / im.naturalWidth } : { src: im ? roundSprite(im, d) : grapeSprite(d), w: d, h: d };
      for (var i = 0; i < 3; i++) {
        (function (i) {
          setTimeout(function () {
            if (ok()) addBody(spr, rand(X(mid) - half, X(mid) + half), rand(6, 30), name, rand(-3, 3));
          }, reduced ? 0 : i * 90);
        })(i);
      }
      if (reduced) setTimeout(settleNow, 0);
    });
  }

  function removeTopping(name) {
    if (!M || !engine) return;
    L.streams = L.streams.filter(function (st) { return st.tag !== name; });
    bodies.forEach(function (b) { if (b.stains) b.stains = b.stains.filter(function (st) { return st.tag !== name; }); });
    bodies = bodies.filter(function (b) {
      if (b.tag !== name) return true;
      M.Composite.remove(engine.world, b);
      return false;
    });
    /* los de arriba se acomodan solos al faltar la pieza */
    bodies.forEach(function (b) { if (b.isSleeping) M.Sleeping.set(b, false); });
    wake();
    draw();
  }

  /* ---------- cambio de vaso: tornado estilo Taz y bamboleo de moneda ---------- */
  function spinTo(mySeq, dir) {
    return new Promise(function (resolve) {
      if (reduced || !wrap.animate) { applyCup(cur.size); resolve(); return; }
      var A = (90 + 360 * SPIN.turnsOut) * dir;           /* termina de canto: aquí se cambia el vaso */
      var B = (90 + 360 * SPIN.turnsOut + 270 + 360 * SPIN.turnsIn) * dir; /* termina de frente */
      var tf = function (deg, y, sx, sy) { return 'rotateY(' + deg + 'deg) translateY(' + y + 'px) scale(' + sx + ',' + sy + ')'; };
      var a1 = wrap.animate([
        { transform: tf(0, 0, 1, 1) },
        { transform: tf(A, -SPIN.hop, 0.88, 1.12) }
      ], { duration: SPIN.outMs, easing: 'cubic-bezier(.55,0,.9,.6)', fill: 'forwards' });
      a1.onfinish = function () {
        applyCup(cur.size);
        var e = 'cubic-bezier(.2,.7,.3,1)';
        var a2 = wrap.animate([
          { transform: tf(A, -SPIN.hop, 0.88, 1.12), easing: e },
          { transform: tf(B + 20 * dir, 0, 1.05, 0.95), offset: 0.7, easing: 'ease-in-out' },
          { transform: tf(B - 9 * dir, 0, 0.99, 1.01), offset: 0.86, easing: 'ease-in-out' },
          { transform: tf(B + 3 * dir, 0, 1, 1), offset: 0.95, easing: 'ease-in-out' },
          { transform: tf(B, 0, 1, 1) }
        ], { duration: SPIN.inMs });
        a1.cancel();
        setTimeout(resolve, SPIN.inMs * 0.5); /* la fruta empieza a caer mientras termina de bambolearse */
      };
    });
  }

  /* ---------- API ---------- */
  function init(opts) {
    cfg = opts;
    wrap = opts.wrap; img = opts.img; cv = opts.canvas;
  }

  /* next = { size, flavor, picked: [nombres] }   dir = +1 si el nuevo vaso es más chico, -1 si es más grande */
  function set(next, dir) {
    var prev = cur;
    cur = { size: next.size, flavor: next.flavor, picked: next.picked.slice() };
    if (prev.size === null) { applyCup(cur.size); return; }
    if (cur.size !== prev.size) {
      var s1 = ++seq; started = true;
      spinTo(s1, dir || 1).then(function () { if (s1 === seq) fillAll(s1); });
    } else if (cur.flavor !== prev.flavor) {
      var s2 = ++seq; started = true;
      cv.style.transition = 'opacity .18s';
      cv.style.opacity = 0;
      setTimeout(function () { if (s2 === seq) fillAll(s2); }, 200);
    } else if (started) {
      cur.picked.forEach(function (n) { if (prev.picked.indexOf(n) === -1) dropTopping(n); });
      prev.picked.forEach(function (n) { if (cur.picked.indexOf(n) === -1) removeTopping(n); });
    }
  }

  /* primera vez: la fruta cae cuando el pedido aparece en pantalla */
  function start() {
    if (started || cur.size === null) return;
    started = true;
    fillAll(++seq);
  }

  return { init: init, set: set, start: start };
})();
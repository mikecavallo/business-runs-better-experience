/* The page window's scrollbar (theme-coloured, with up and down arrows).
   On standalone pages it also draws the starfield, offers the theme swatches,
   and remembers that the visitor has been inside the site (so closing the window
   lands them straight on the landing page instead of replaying the intro). */
(function () {
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = {
    up: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 8 6 4.5 9.5 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function enhance(panel) {
    if (!panel || panel.dataset.enhanced) return;
    panel.dataset.enhanced = '1';
    var scroller = panel.querySelector('.panel-scroll');
    var well = panel.querySelector('.panel-well');
    if (!scroller || !well) return;

    var rail = document.createElement('div');
    rail.className = 'panel-rail';
    rail.innerHTML = '<button class="pbtn" type="button" data-dir="-1" aria-label="Scroll up">' + ICON.up + '</button>' +
      '<div class="panel-track"><div class="panel-thumb"></div></div>' +
      '<button class="pbtn" type="button" data-dir="1" aria-label="Scroll down">' + ICON.down + '</button>';
    well.appendChild(rail);
    var up = rail.querySelector('[data-dir="-1"]'), down = rail.querySelector('[data-dir="1"]');
    var track = rail.querySelector('.panel-track'), thumb = rail.querySelector('.panel-thumb');

    function metrics() {
      var sh = scroller.scrollHeight, ch = scroller.clientHeight, th = track.clientHeight;
      var h = Math.max(28, th * ch / Math.max(sh, 1));
      return { sh: sh, ch: ch, th: th, h: h, max: Math.max(1, sh - ch) };
    }
    function update() {
      var m = metrics();
      var overflow = m.sh > m.ch + 2;
      panel.classList.toggle('no-overflow', !overflow);
      if (!overflow) return;
      thumb.style.height = m.h + 'px';
      thumb.style.transform = 'translateY(' + ((m.th - m.h) * scroller.scrollTop / m.max).toFixed(1) + 'px)';
      up.disabled = scroller.scrollTop <= 1;
      down.disabled = scroller.scrollTop >= m.max - 1;
    }
    scroller.addEventListener('scroll', update, { passive: true });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(update);
      ro.observe(scroller);
      Array.prototype.forEach.call(scroller.children, function (c) { ro.observe(c); });
    }
    window.addEventListener('resize', update);

    // arrows: a click moves most of a screen; holding one keeps scrolling
    function page(dir) { scroller.scrollBy({ top: dir * scroller.clientHeight * 0.8, behavior: RM ? 'auto' : 'smooth' }); }
    [up, down].forEach(function (b) {
      var dir = +b.dataset.dir, hold = null, rep = null, held = false;
      function stop() { clearTimeout(hold); clearInterval(rep); }
      b.addEventListener('pointerdown', function () {
        held = false; stop();
        hold = setTimeout(function () { held = true; rep = setInterval(function () { scroller.scrollBy(0, dir * 26); }, 30); }, 380);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });
      b.addEventListener('click', function () { if (!held) page(dir); held = false; });
    });

    // drag the thumb, or click the groove to jump a page that way
    thumb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var m = metrics(), y0 = e.clientY, s0 = scroller.scrollTop;
      thumb.setPointerCapture(e.pointerId);
      function move(ev) { scroller.scrollTop = s0 + (ev.clientY - y0) * m.max / Math.max(1, m.th - m.h); }
      function end() { thumb.removeEventListener('pointermove', move); thumb.removeEventListener('pointerup', end); thumb.removeEventListener('pointercancel', end); }
      thumb.addEventListener('pointermove', move);
      thumb.addEventListener('pointerup', end);
      thumb.addEventListener('pointercancel', end);
    });
    track.addEventListener('pointerdown', function (e) {
      if (e.target === thumb) return;
      var r = thumb.getBoundingClientRect();
      page(e.clientY < r.top ? -1 : 1);
    });
    update();
    setTimeout(update, 300);   // after web fonts settle
  }

  window.BRBPanel = { enhance: enhance };

  // ---------------------------------------------------------------- standalone pages
  if (!document.body.classList.contains('pg')) return;
  try { sessionStorage.setItem('brb-entered', '1'); } catch (e) {}
  Array.prototype.forEach.call(document.querySelectorAll('.panel'), enhance);
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // theme swatches
  var sw = document.querySelector('.pc-themes');
  if (sw && window.BRB_THEMES) {
    Object.keys(window.BRB_THEMES).forEach(function (k) {
      var t = window.BRB_THEMES[k];
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.k = k; b.style.setProperty('--sw', t.brand);
      b.setAttribute('aria-label', t.name + ' colour theme');
      b.setAttribute('aria-pressed', String(k === window.BRB_THEME));
      b.addEventListener('click', function () {
        window.BRB_applyTheme(k, true);
        Array.prototype.forEach.call(sw.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x.dataset.k === k)); });
      });
      sw.appendChild(b);
    });
  }

  // the starfield: stars and sparkles that drift, twinkle and shy away from the cursor
  var cv = document.getElementById('pgStars');
  if (!cv) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1, stars = [], px = -9999, py = -9999, seededW = 0, seededH = 0;
  function seed() {
    var n = Math.max(120, Math.round(innerWidth * innerHeight / 5200));
    stars = [];
    for (var i = 0; i < n; i++) {
      var sprite = i % 17 === 0;
      var s = { hx: Math.random() * W, hy: Math.random() * H, vx: 0, vy: 0,
        r: (sprite ? 2.6 + Math.random() * 3.2 : 0.35 + Math.pow(Math.random(), 2.4) * 2.2) * DPR,
        sprite: sprite, tw: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6, dr: 6 + Math.random() * 18 };
      s.x = s.hx; s.y = s.hy; stars.push(s);
    }
    seededW = W; seededH = H;
  }
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = Math.floor(innerWidth * DPR); H = cv.height = Math.floor(innerHeight * DPR);
    if (W !== seededW || Math.abs(H - seededH) > 180 * DPR) seed();
  }
  size();
  window.addEventListener('resize', size);
  window.addEventListener('pointermove', function (e) { px = e.clientX * DPR; py = e.clientY * DPR; }, { passive: true });
  document.addEventListener('pointerleave', function () { px = py = -9999; });
  var t0 = performance.now();
  function frame(now) {
    var rgb = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim() || '76, 125, 255';
    var t = RM ? 0 : (now - t0) / 1000, R = 170 * DPR;
    ctx.clearRect(0, 0, W, H);
    stars.forEach(function (st) {
      var hx = st.hx + Math.sin(t * 0.05 * st.sp + st.tw) * st.dr * DPR, hy = st.hy + Math.cos(t * 0.04 * st.sp + st.tw) * st.dr * DPR;
      var dx = st.x - px, dy = st.y - py, d2 = dx * dx + dy * dy;
      if (d2 < R * R && !RM) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.4 * DPR * (1.4 - Math.min(st.r / DPR, 4) * 0.12); st.vx += dx / d * f; st.vy += dy / d * f; }
      st.vx += (hx - st.x) * 0.012; st.vy += (hy - st.y) * 0.012; st.vx *= 0.88; st.vy *= 0.88; st.x += st.vx; st.y += st.vy;
      var a = st.sprite ? 0.75 + Math.sin(t * st.sp + st.tw) * 0.25 : 0.25 + (0.5 + Math.sin(t * st.sp + st.tw) * 0.5) * 0.55;
      if (st.sprite) {
        var r = st.r * (0.85 + Math.sin(t * st.sp * 1.3 + st.tw) * 0.15);
        var g = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, r * 4);
        g.addColorStop(0, 'rgba(' + rgb + ',' + (0.35 * a) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(st.x, st.y, r * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.beginPath();
        ctx.moveTo(st.x, st.y - r * 2.2); ctx.quadraticCurveTo(st.x, st.y, st.x + r * 2.2, st.y);
        ctx.quadraticCurveTo(st.x, st.y, st.x, st.y + r * 2.2); ctx.quadraticCurveTo(st.x, st.y, st.x - r * 2.2, st.y);
        ctx.quadraticCurveTo(st.x, st.y, st.x, st.y - r * 2.2); ctx.fill();
      } else {
        ctx.fillStyle = (st.r > 1.4 * DPR ? 'rgba(' + rgb + ',' : 'rgba(255,255,255,') + a + ')';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
    });
    if (!RM) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

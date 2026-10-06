/* About page: scroll reveals, counters, timeline progress, testimonials from config. */
(function () {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stagger index for skill chips.
  document.querySelectorAll('.chips').forEach(list => {
    [...list.children].forEach((c, i) => c.style.setProperty('--i', i));
  });

  // Count-up numbers.
  function count(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (RM) { el.textContent = target + suffix; return; }
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1600, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal, .skill-group, .tl-item, .stat-band').forEach(el => io.observe(el));

  // Timeline line fills as you scroll through it.
  const tl = document.querySelector('.timeline');
  if (tl) {
    const update = () => {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.7 - r.top) / r.height, 0), 1);
      tl.style.setProperty('--progress', p.toFixed(3));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Testimonials come from site-config.js; the section stays hidden until there are real ones.
  const quotes = ((window.BRB_CONFIG || {}).testimonials || []).filter(q => q && q.quote && q.name);
  const section = document.getElementById('testimonials');
  if (section && quotes.length) {
    const grid = section.querySelector('.quotes');
    quotes.forEach(q => {
      const fig = document.createElement('figure');
      fig.className = 'card quote';
      const bq = document.createElement('blockquote');
      bq.textContent = '"' + q.quote + '"';
      const cap = document.createElement('figcaption');
      const name = document.createElement('b');
      name.textContent = q.name;
      cap.append(name, q.business ? ', ' + q.business : '');
      fig.append(bq, cap);
      grid.append(fig);
    });
    section.hidden = false;
  }
})();

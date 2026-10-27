/* Shared behavior for the standard pages. Reads window.BRB_CONFIG (site-config.js). */
(function () {
  const cfg = window.BRB_CONFIG || { stripe: {}, email: 'info@businessrunsbetter.com' };
  const form = document.getElementById('contactForm');

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // The site menu: every page, read from the footer's site map, then the call button and phone.
  // Built before the buttons below are wired, so its "Book" link gets the same treatment.
  const menuBtn = document.querySelector('.pg-head .menu-btn');
  const sitemap = document.querySelector('.pc-sitemap');
  if (menuBtn && sitemap) {
    const menu = document.createElement('div');
    menu.className = 'site-menu';
    menu.id = 'siteMenu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menu');
    menu.innerHTML = '<button class="close" type="button" aria-label="Close menu">&times;</button>' +
      '<div class="mm-groups"></div>' +
      '<div class="mm-cta"><a class="mm-book" href="#contact" data-book-call>Book a free 20-minute call</a>' +
      '<a class="mm-phone" href="tel:+19105240056">Or call 910-524-0056</a></div>';
    const groups = menu.querySelector('.mm-groups');
    sitemap.querySelectorAll('.sm-group').forEach(g => {
      const group = document.createElement('div');
      group.className = 'mm-group';
      const head = document.createElement('p');
      head.className = 'mm-head';
      head.textContent = g.querySelector('.sm-head').textContent;
      group.appendChild(head);
      g.querySelectorAll('a').forEach(src => {
        const a = document.createElement('a');
        a.className = 'menu-page';
        a.href = src.getAttribute('href');
        a.textContent = src.textContent;
        if (src.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
        group.appendChild(a);
      });
      groups.appendChild(group);
    });
    document.body.appendChild(menu);
    menuBtn.setAttribute('aria-controls', 'siteMenu');
    // While it's open everything else is inert, so Tab stays inside the menu.
    let released = [];
    const open = () => {
      menu.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      [...document.body.children].forEach(el => {
        if (el !== menu && !el.inert && !/^(SCRIPT|STYLE)$/.test(el.tagName)) { el.inert = true; released.push(el); }
      });
      menu.querySelector('.close').focus();
    };
    const close = () => {
      menu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      released.forEach(el => { el.inert = false; });
      released = [];
      menuBtn.focus();
    };
    menuBtn.addEventListener('click', open);
    menu.querySelector('.close').addEventListener('click', close);
    menu.addEventListener('click', e => { if (e.target.closest('a')) setTimeout(close, 0); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) close(); });
  }

  function goToForm(interest) {
    if (!form) { window.location.href = '/pricing.html#contact'; return; }
    const sel = form.querySelector('[name="interest"]');
    if (interest && sel && [...sel.options].some(o => o.value === interest)) sel.value = interest;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => form.querySelector('[name="name"]').focus({ preventScroll: true }), 450);
  }

  // Buttons that pay through a Stripe Payment Link when one is configured,
  // and fall back to the contact form when it isn't.
  document.querySelectorAll('[data-pay]').forEach(el => {
    const url = (cfg.stripe || {})[el.dataset.pay];
    if (url) {
      el.setAttribute('href', url);
    } else {
      el.setAttribute('href', '#contact');
      el.addEventListener('click', e => { e.preventDefault(); goToForm(el.dataset.interest); });
      if (el.dataset.fallbackLabel) el.textContent = el.dataset.fallbackLabel;
    }
  });

  // "Book a free call": booking calendar if configured, otherwise the form.
  document.querySelectorAll('[data-book-call]').forEach(el => {
    if (cfg.calendarUrl) {
      el.setAttribute('href', cfg.calendarUrl);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    } else {
      el.setAttribute('href', '#contact');
      el.addEventListener('click', e => { e.preventDefault(); goToForm('Free 20-minute call'); });
    }
  });

  document.querySelectorAll('[data-interest]:not([data-pay])').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); goToForm(el.dataset.interest); });
  });

  if (!form) return;

  const started = form.querySelector('[name="started"]');
  if (started) started.value = String(Date.now());
  const status = document.getElementById('formStatus');
  const submit = form.querySelector('[type="submit"]');

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('error', !!isError);
  }
  // Last resort: say so, and offer a pre-filled email link the visitor can choose to click.
  function sendFailed(data) {
    const body = ['name', 'email', 'company', 'phone', 'interest', 'budget', 'message']
      .map(k => `${k[0].toUpperCase() + k.slice(1)}: ${data.get(k) || ''}`).join('\n');
    const subject = `Business Runs Better inquiry: ${data.get('interest') || 'General'}`;
    const link = document.createElement('a');
    link.href = `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.textContent = cfg.email;
    status.textContent = 'Sorry, that didn\'t send. Please try again, or email ';
    status.append(link, '.');
    status.classList.add('error');
  }

  // Bluehost answers a script's first POST with a tiny "are you human" page (HTTP 409) that
  // sets a cookie and reloads. A fetch() can't run that script, so set the cookie it names
  // and retry once.
  async function postForm(url, data) {
    const opts = { method: 'POST', body: data, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    let res = await fetch(url, opts);
    if (res.status === 409) {
      const body = await res.text();
      const m = body.match(/document\.cookie\s*=\s*["']([^"'=;\s]+)=([^"';]*)/);
      if (m) {
        document.cookie = `${m[1]}=${m[2]}; path=/; SameSite=Lax; Secure`;
        res = await fetch(url, opts);
      }
    }
    return res;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    submit.disabled = true;
    setStatus('Sending...');
    try {
      const res = await postForm(form.action, data);
      const json = await res.json().catch(() => null);
      if (json && json.ok) {
        form.hidden = true;
        document.getElementById('formDone').hidden = false;
        return;
      }
      if (json && json.error) { setStatus(json.error, true); return; }
      sendFailed(data);
    } catch (err) {
      sendFailed(data);
    } finally {
      submit.disabled = false;
    }
  });
})();

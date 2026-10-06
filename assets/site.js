/* Shared behavior for the standard pages. Reads window.BRB_CONFIG (site-config.js). */
(function () {
  const cfg = window.BRB_CONFIG || { stripe: {}, email: 'hello@businessrunsbetter.com' };
  const form = document.getElementById('contactForm');

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

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
  function mailtoFallback(data) {
    const body = ['name', 'email', 'company', 'phone', 'interest', 'budget', 'message']
      .map(k => `${k[0].toUpperCase() + k.slice(1)}: ${data.get(k) || ''}`).join('\n');
    const subject = `Business Runs Better inquiry: ${data.get('interest') || 'General'}`;
    window.location.href = `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    submit.disabled = true;
    setStatus('Sending...');
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => null);
      if (json && json.ok) {
        form.hidden = true;
        document.getElementById('formDone').hidden = false;
        return;
      }
      if (json && json.error) { setStatus(json.error, true); return; }
      setStatus('Opening your email app instead...');
      mailtoFallback(data);
    } catch (err) {
      setStatus('Opening your email app instead...');
      mailtoFallback(data);
    } finally {
      submit.disabled = false;
    }
  });
})();

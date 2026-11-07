/* Fill these in before going live. */
const SITE = {
  email: '',    // e.g. hello@yourdomain.com
  whatsapp: '', // with country code, e.g. +91 98765 43210
};

const modal = document.getElementById('lead-modal');

function wireLead(box) {
  const form = box.querySelector('form');
  const submit = box.querySelector('.form-submit');
  const error = box.querySelector('.form-error');
  const sent = box.querySelector('.sent');
  const chips = [...box.querySelectorAll('.chip')];
  const label = submit.textContent;

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  }

  function showError() {
    error.textContent = 'That didn\'t go through. Please try again';
    if (SITE.email) {
      const link = document.createElement('a');
      link.href = `mailto:${SITE.email}`;
      link.textContent = SITE.email;
      error.append(' or write to ', link);
    }
    error.append('.');
    error.hidden = false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;

    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const needs = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent);
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
          needs: needs.join(', '),
          source: box.dataset.source,
          company: form.elements.company.value,
        }),
      });
      if (!response.ok) throw new Error(`/api/lead returned ${response.status}`);
      form.hidden = true;
      sent.hidden = false;
      sent.focus({ preventScroll: true });
    } catch (err) {
      console.error(err);
      showError();
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });

  function reset() {
    form.reset();
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    error.hidden = true;
    sent.hidden = true;
    form.hidden = false;
  }

  return reset;
}

document.querySelectorAll('.lead').forEach((box) => {
  const reset = wireLead(box);
  const again = box.querySelector('.sent-again');
  if (box === modal) {
    again.addEventListener('click', () => modal.close());
    modal.addEventListener('close', () => {
      if (!box.querySelector('.sent').hidden) reset();
    });
  } else {
    again.addEventListener('click', reset);
  }
});

/* Every "Get yours" opens the quick popup. */
document.querySelectorAll('[data-lead]').forEach((cta) => {
  cta.addEventListener('click', (event) => {
    event.preventDefault();
    modal.showModal();
  });
});
document.getElementById('modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

/* The contact line stays hidden until the details above are filled in. */
const contact = document.getElementById('contact');
if (SITE.email) {
  const link = document.createElement('a');
  link.href = `mailto:${SITE.email}`;
  link.textContent = SITE.email;
  contact.append(link);
}
if (SITE.whatsapp) {
  if (SITE.email) contact.append(' · ');
  contact.append(`WhatsApp ${SITE.whatsapp}`);
}
contact.hidden = !(SITE.email || SITE.whatsapp);

/* Pinned sections: on short screens, shrink just enough to clear the nav. */
const header = document.querySelector('.site-header');
const pinned = document.querySelectorAll('.manifesto, .team-inner, .cost-inner, .work-inner');

function fitPinned() {
  const nav = header.offsetHeight;
  const gap = 12;
  for (const el of pinned) {
    const stage = el.parentElement.clientHeight;
    const box = el.offsetHeight;
    const pad = parseFloat(getComputedStyle(el).paddingTop);
    const fit = Math.min(1, (stage - nav - gap * 2) / (box - pad));
    const top = stage / 2 + (pad - box / 2) * fit;
    const shift = Math.max(0, nav + gap - top);
    el.style.transform = fit < 1 || shift > 0 ? `translateY(${shift}px) scale(${fit})` : '';
  }
}

fitPinned();
window.addEventListener('resize', fitPinned);
document.fonts.ready.then(fitPinned);

/* Hero: the last line cycles through what we build. */
const rotor = document.getElementById('rotor');
const wordCount = rotor.children.length;
let word = 0;

function showWord(index, animate) {
  rotor.style.transition = animate ? '' : 'none';
  rotor.style.transform = `translateY(${-index * 1.04}em)`;
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(() => {
    word += 1;
    showWord(word, true);
    if (word === wordCount - 1) {
      setTimeout(() => {
        word = 0;
        showWord(0, false);
      }, 1000);
    }
  }, 2200);
}

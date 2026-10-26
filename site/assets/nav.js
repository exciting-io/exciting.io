// The floating bar's phone menu: a full height panel whose links rise in one after another.
// It keeps focus inside while open, closes on Escape or a link, and gives focus back to the button.
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    const label = toggle.querySelector('.nav-toggle-t');
    const focusables = () => [toggle, ...menu.querySelectorAll('a')];
    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close' : 'Menu';
      root.style.overflow = open ? 'hidden' : '';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      } else {
        menu.classList.remove('is-open');
        setTimeout(() => { if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 300);
      }
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    matchMedia('(min-width: 48rem)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }
})();

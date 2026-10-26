// The Printer's exploded view. One control propagates across the sheet:
// scroll separates the parts, and a part, its number and its row light together.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Highlight sync: part <-> balloon <-> parts-list row. Hover and focus
  // override whatever the scroll has selected.
  for (const fig of document.querySelectorAll('[data-dwg]')) {
    fig._hover = null;
    fig._scroll = null;
    fig._sync = () => {
      const v = fig._hover || fig._scroll || fig.dataset.default;
      if (v) fig.dataset.active = v;
      else delete fig.dataset.active;
    };
    const from = e => {
      const t = e.target.closest('[data-part]');
      return t && fig.contains(t) && t.dataset.part !== '0' ? t.dataset.part : null;
    };
    fig.addEventListener('pointerover', e => { fig._hover = from(e); fig._sync(); });
    fig.addEventListener('pointerleave', () => { fig._hover = null; fig._sync(); });
    fig.addEventListener('focusin', e => { fig._hover = from(e); fig._sync(); });
    fig.addEventListener('focusout', e => {
      if (!fig.contains(e.relatedTarget)) { fig._hover = null; fig._sync(); }
    });
  }

  // Scroll scrubs the exploded view. Each part separates in its own window
  // of progress; the part currently separating is lit with its row.
  for (const fig of document.querySelectorAll('[data-scrub]')) {
    const stage = fig.closest('.stage');
    const parse = el => el.dataset.v.split(';').filter(Boolean).map(t => { const [x, y, k] = t.split(','); return [+x, +y, k]; });
    const parts = [...fig.querySelectorAll('g[data-v]')].map(el => ({ el, v: parse(el) }));
    const marks = [...fig.querySelectorAll('[data-ax]')].map(el => ({ el, v: parse(el), ax: +el.dataset.ax, ay: +el.dataset.ay, rx: el.dataset.rx === undefined ? null : +el.dataset.rx, ry: +el.dataset.ry || 0 }));
    const vb = (fig.querySelector('.dwg').dataset.vb || '0 0 1 1').split(' ').map(Number);
    const e0 = parseFloat(fig.dataset.e0) || 0.4;
    const sched = Object.fromEntries(fig.dataset.sched.split(';').map(t => { const [k, a, b] = t.split(':'); return [k, [+a, +b]]; }));
    const order = Object.keys(sched).sort((a, b) => sched[a][0] - sched[b][0]);
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const ek = (p, k) => {
      const [a, b] = sched[k];
      return e0 + (1 - e0) * ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
    };
    const off = (v, p) => v.reduce((acc, [x, y, k]) => { const e = p === null ? 1 : ek(p, k); return [acc[0] + x * e, acc[1] + y * e]; }, [0, 0]);
    let last = -2;
    const apply = p => {
      if (p !== null && Math.abs(p - last) < 0.0005) return;
      last = p === null ? -2 : p;
      for (const { el, v } of parts) {
        const [x, y] = off(v, p);
        el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      }
      for (const { el, v, ax, ay, rx, ry } of marks) {
        const [dx, dy] = off(v, p);
        const x = ax + dx;
        const y = ay + dy;
        if (el.classList.contains('bal')) {
          el.style.left = `${(((x + rx) - vb[0]) / vb[2] * 100).toFixed(3)}%`;
          el.style.top = `${(((y + ry) - vb[1]) / vb[3] * 100).toFixed(3)}%`;
        } else if (el.tagName === 'line') {
          el.setAttribute('x2', x.toFixed(2)); el.setAttribute('y2', y.toFixed(2));
          if (rx !== null) { el.setAttribute('x1', (x + rx).toFixed(2)); el.setAttribute('y1', (y + ry).toFixed(2)); }
        } else { el.setAttribute('cx', x.toFixed(2)); el.setAttribute('cy', y.toFixed(2)); }
      }
      let live = null;
      if (p !== null && p > 0.005 && p < 0.995) for (const k of order) if (p >= sched[k][0]) live = k;
      fig._scroll = live;
      fig._sync();
    };
    let raf = 0;
    const inner = stage.querySelector('.stage-in');
    const frame = () => {
      raf = 0;
      const r = stage.getBoundingClientRect();
      const run = r.height - innerHeight;
      if (getComputedStyle(inner).position === 'sticky' && run > 0) {
        apply(Math.min(1, Math.max(0, -r.top / run)));
      } else {
        // not pinned (phones): explode as the drawing passes out of view
        apply(Math.min(1, Math.max(0, -r.top / (r.height * 0.75))));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const mode = () => {
      const on = !reduce.matches;
      root.classList.toggle('js-scrub', on);
      removeEventListener('scroll', onScroll);
      if (on) {
        addEventListener('scroll', onScroll, { passive: true });
        last = -2;
        frame();
      } else {
        apply(null);
      }
    };
    reduce.addEventListener('change', mode);
    addEventListener('resize', onScroll);
    mode();
  }
})();

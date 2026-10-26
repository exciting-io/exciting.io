// The home page's moving parts: sections that rise in once, and the tagline whose words come
// up to full colour as they cross a line two thirds of the way down the screen.
// Nothing is hidden until this script runs, so without it the page simply reads.
(() => {
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window)) return;

  // ---------------------------------------------------------- sections rise in, once
  const sections = document.querySelectorAll('.lp-reveal');
  const below = el => el.getBoundingClientRect().top > innerHeight;
  const reveal = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      reveal.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  root.classList.add('lp-js');
  // anything already on screen when the page opens is simply shown
  for (const el of sections) below(el) ? reveal.observe(el) : el.classList.add('is-in');

  // ---------------------------------------------------------- the tagline, word by word
  if (still) return;
  const big = document.querySelector('[data-reveal-words]');
  if (!big || !below(big)) return;
  big.classList.add('lp-reveal-words');
  const words = [...big.querySelectorAll('.lp-word')];
  const light = new IntersectionObserver(entries => {
    // words that cross together (one line) still come up one after another, in reading order
    const crossing = entries.filter(e => e.isIntersecting).map(e => e.target)
      .sort((a, b) => words.indexOf(a) - words.indexOf(b));
    crossing.forEach((w, i) => {
      w.style.transitionDelay = `${i * 70}ms`;
      w.classList.add('is-on');
      light.unobserve(w);
    });
  }, { rootMargin: '0px 0px -33% 0px', threshold: 1 });
  words.forEach(w => light.observe(w));
})();

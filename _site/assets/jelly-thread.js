// "Collapse all" folds every internal comment to one line, and opens them again.
// Each comment is a <details>, so without this script each still folds on its own.
(() => {
  const btn = document.querySelector('.jt-collapse');
  if (!btn) return;
  const notes = [...document.querySelectorAll('.jt-bubble')];
  const label = btn.querySelector('span');
  const sync = () => {
    const allClosed = notes.every(d => !d.open);
    label.textContent = allClosed ? 'Expand all' : 'Collapse all';
  };
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const close = notes.some(d => d.open);
    notes.forEach(d => { d.open = !close; });
    sync();
  });
  notes.forEach(d => d.addEventListener('toggle', sync));
})();

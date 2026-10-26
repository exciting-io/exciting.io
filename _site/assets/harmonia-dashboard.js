// Done! marks a task done where it stands: the title is struck, a tick appears, the card
// quietens, and the button becomes Undo. Nothing moves, so the task stays in view.
(() => {
  const root = document.querySelector('.hm');
  if (!root) return;
  const status = root.querySelector('.hm-status');

  const set = (task, done, announce = true) => {
    const btn = task.querySelector('.hm-btn');
    task.classList.toggle('is-done', done);
    btn.textContent = done ? 'Undo' : 'Done!';
    if (announce) {
      const title = task.querySelector('.hm-t span').textContent;
      status.textContent = done ? `Done: ${title}.` : `Not done yet: ${title}.`;
    }
  };

  for (const btn of root.querySelectorAll('.hm-btn')) {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const task = btn.closest('.hm-task');
      set(task, !task.classList.contains('is-done'));
    });
  }

})();

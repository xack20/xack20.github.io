// Closes the mobile <details> menu after a link is chosen (same-page links don't navigate away)
// and on Escape, returning focus to the Menu button. Without JS the menu still works as a disclosure.
function enhance(menu: HTMLDetailsElement): void {
  const summary = menu.querySelector('summary');
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) menu.open = false;
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    summary?.focus();
  });
}

document.querySelectorAll<HTMLDetailsElement>('details.menu').forEach(enhance);

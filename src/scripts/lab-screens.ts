import { matchScreen, type MatchResult } from '../lib/screens/matcher';

const CERTAINTY_NOTE = {
  exact: 'Exact match: the whole title or a full synonym is in the question.',
  likely: 'Likely match: one strong word matched.',
  weak: "Weak match: only a near-miss, so it can't become a button. The real assistant asks a follow-up question instead.",
} as const;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render(result: MatchResult): HTMLElement {
  const card = el('div', 'card');
  if (result.kind !== 'screen') {
    card.classList.toggle('warn', result.kind === 'safety');
    card.append(el('p', 'badge', result.kind === 'safety' ? 'Safety rule' : result.kind === 'not-covered' ? 'Not covered' : 'No match'), el('p', '', result.message));
    return card;
  }
  const steps = el('ol', '');
  result.screen.steps.forEach((s) => steps.append(el('li', '', s)));
  card.append(el('p', 'badge', `${result.certainty} match`), el('h3', '', result.screen.title), steps, el('p', 'note', CERTAINTY_NOTE[result.certainty]));
  if (result.button) {
    const button = el('button', 'screen-card', `Open ${result.screen.title} →`);
    button.type = 'button';
    button.addEventListener('click', () => card.append(el('p', 'note', 'In the real app, this button opens the screen.')));
    card.append(button);
  }
  return card;
}

function mount(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-form]');
  const input = root.querySelector<HTMLInputElement>('input');
  const output = root.querySelector<HTMLElement>('[data-result]');
  if (!form || !input || !output) return;
  const show = (query: string): void => output.replaceChildren(render(matchScreen(query)));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    show(input.value);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((chip) =>
    chip.addEventListener('click', () => {
      input.value = chip.dataset.example ?? '';
      show(input.value);
    }),
  );
  root.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach((control) => {
    control.disabled = false;
  });
  root.querySelector('[data-nojs]')?.setAttribute('hidden', '');
}

document.querySelectorAll<HTMLElement>('[data-screens]').forEach(mount);

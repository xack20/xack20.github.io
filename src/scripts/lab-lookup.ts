import { checkNumbers } from '../lib/lookup/check';

function mount(root: HTMLElement): void {
  const answer = root.querySelector<HTMLElement>('[data-answer]');
  const verdict = root.querySelector<HTMLElement>('[data-verdict]');
  const toggles = [...root.querySelectorAll<HTMLInputElement>('input[data-tool]')];
  if (!answer || !verdict) return;
  const text = answer.textContent ?? '';

  const update = (): void => {
    const values = toggles.filter((t) => t.checked).map((t) => t.dataset.tool ?? '');
    const result = checkNumbers(text, values);
    answer.replaceChildren(
      ...result.segments.map((s) => {
        if (s.kind === 'text') return document.createTextNode(s.text);
        const mark = document.createElement('mark');
        mark.className = s.kind;
        mark.textContent = s.text;
        mark.title = s.kind === 'backed' ? 'A tool returned this' : 'No tool returned this number';
        return mark;
      }),
    );
    verdict.textContent =
      result.unbacked.length === 0
        ? 'Every number is backed by a tool result.'
        : `Flagged ${result.unbacked.length === 1 ? 'one number' : `${result.unbacked.length} numbers`} with no tool call behind ${result.unbacked.length === 1 ? 'it' : 'them'}: ${result.unbacked.join(', ')}.`;
  };

  toggles.forEach((t) => {
    t.disabled = false;
    t.addEventListener('change', update);
  });
  root.querySelector('[data-nojs]')?.setAttribute('hidden', '');
  update();
}

document.querySelectorAll<HTMLElement>('[data-lookup]').forEach(mount);

import {
  SAMPLE_PAYLOAD, TAMPERED_LIMIT, approve, commit, editDraft, initialState, newTokenId, propose, reset,
  type LedgerState, type Step, type Tone,
} from '../lib/approval/ledger';

type Action = 'propose' | 'approve' | 'commit' | 'replay' | 'tamper' | 'reset';
const LAMPS = ['on', 'ok', 'bad'] as const;
const LAMP_FOR_TONE: Record<Tone, (typeof LAMPS)[number]> = { info: 'on', ok: 'ok', bad: 'bad' };
const ACTIONS: readonly Action[] = ['propose', 'approve', 'commit', 'replay', 'tamper', 'reset'];

const isAction = (value: string | undefined): value is Action => ACTIONS.includes(value as Action);

function run(action: Action, state: LedgerState): Promise<Step> | Step {
  switch (action) {
    case 'propose': return propose(SAMPLE_PAYLOAD);
    case 'approve': return approve(state, newTokenId());
    case 'commit':
    case 'replay': return commit(state);
    case 'tamper': return editDraft(state, { dailyLimit: TAMPERED_LIMIT });
    case 'reset': return reset();
  }
}

function writeLine(log: HTMLElement, step: Step): void {
  const line = document.createElement('p');
  line.className = `tone-${step.event.tone}`;
  line.textContent = step.event.message;
  log.append(line);
  log.scrollTop = log.scrollHeight;
}

function mount(root: HTMLElement): void {
  const log = root.querySelector<HTMLElement>('[data-log]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-action]')];
  if (!log) return;
  let state: LedgerState = initialState;
  let busy = false;

  const onClick = async (button: HTMLButtonElement): Promise<void> => {
    const action = button.dataset.action;
    if (busy || !isAction(action)) return;
    busy = true;
    try {
      const result = await run(action, state);
      state = result.state;
      if (action === 'propose' || action === 'reset') {
        buttons.forEach((b) => b.classList.remove(...LAMPS));
        log.replaceChildren();
      }
      if (action !== 'reset') {
        button.classList.remove(...LAMPS);
        button.classList.add(LAMP_FOR_TONE[result.event.tone]);
      }
      writeLine(log, result);
    } finally {
      busy = false;
    }
  };

  buttons.forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => void onClick(button));
  });
  root.querySelector('[data-nojs]')?.setAttribute('hidden', '');
}

document.querySelectorAll<HTMLElement>('[data-lab]').forEach(mount);

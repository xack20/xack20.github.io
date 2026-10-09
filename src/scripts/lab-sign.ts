import { createSigner, fingerprint, verifySignature, type Signer } from '../lib/signing/offline';

const TAMPERED_AMOUNT = 1200;
const SIGNATURE_PREVIEW = 16;

function mount(root: HTMLElement): void {
  const log = root.querySelector<HTMLElement>('[data-log]');
  const fp = root.querySelector<HTMLElement>('[data-fp]');
  const txView = root.querySelector<HTMLElement>('[data-tx]');
  const tamper = root.querySelector<HTMLInputElement>('[data-tamper]');
  if (!log || !fp || !txView || !tamper) return;
  const original = txView.textContent ?? '';
  let signer: Signer | null = null;
  let signature: string | null = null;

  const write = (text: string, tone: 'info' | 'ok' | 'bad' = 'info'): void => {
    const line = document.createElement('p');
    line.className = `tone-${tone}`;
    line.textContent = text;
    log.append(line);
    log.scrollTop = log.scrollHeight;
  };

  const actions: Record<string, () => Promise<void>> = {
    key: async () => {
      signer = await createSigner();
      signature = null;
      fp.textContent = await fingerprint(signer.publicKey);
      write(`✓ Key pair made on this device. Public key ${fp.textContent}. The private key can't be exported.`, 'ok');
    },
    sign: async () => {
      if (!signer) return write('✗ Make a key first.', 'bad');
      signature = await signer.sign(original);
      write(`✓ Signed in the browser: ${signature.slice(0, SIGNATURE_PREVIEW)}…`, 'ok');
    },
    send: async () => {
      if (!signer || !signature) return write('✗ Sign the payment first.', 'bad');
      const sent = tamper.checked ? original.replace(/"amount":\d+/, `"amount":${TAMPERED_AMOUNT}`) : original;
      txView.textContent = sent;
      const valid = await verifySignature(signer.publicKey, sent, signature);
      write(
        valid ? '✓ Signature valid. The gateway accepts the payment without ever seeing a private key.' : '✗ Rejected: the payment changed after it was signed.',
        valid ? 'ok' : 'bad',
      );
    },
  };

  root.querySelectorAll<HTMLButtonElement>('button[data-act]').forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => void actions[button.dataset.act ?? '']?.());
  });
  tamper.disabled = false;
  tamper.addEventListener('change', () => {
    txView.textContent = original;
  });
  root.querySelector('[data-nojs]')?.setAttribute('hidden', '');
}

document.querySelectorAll<HTMLElement>('[data-sign]').forEach(mount);

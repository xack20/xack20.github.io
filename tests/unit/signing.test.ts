import { describe, expect, it } from 'vitest';
import { createSigner, fingerprint, verifySignature } from '../../src/lib/signing/offline';

const TX = JSON.stringify({ from: 'wallet-a', to: 'merchant-7', amount: 120 });

describe('offline signing', () => {
  it('signs on the device and the gateway verifies with the public key only', async () => {
    const signer = await createSigner();
    const signature = await signer.sign(TX);
    await expect(verifySignature(signer.publicKey, TX, signature)).resolves.toBe(true);
  });

  it('rejects a transaction changed after signing', async () => {
    const signer = await createSigner();
    const signature = await signer.sign(TX);
    await expect(verifySignature(signer.publicKey, TX.replace('120', '1200'), signature)).resolves.toBe(false);
  });

  it('rejects a signature from a different key', async () => {
    const [alice, mallory] = await Promise.all([createSigner(), createSigner()]);
    await expect(verifySignature(alice.publicKey, TX, await mallory.sign(TX))).resolves.toBe(false);
  });

  it('keeps the private key unexportable', async () => {
    const signer = await createSigner();
    expect(signer.privateKeyExtractable).toBe(false);
    expect(signer.publicKey.crv).toBe('P-256');
    expect(signer.publicKey).not.toHaveProperty('d');
  });

  it('gives a short fingerprint of the public key', async () => {
    const signer = await createSigner();
    await expect(fingerprint(signer.publicKey)).resolves.toMatch(/^[0-9a-f]{4}(:[0-9a-f]{4}){3}$/);
  });
});

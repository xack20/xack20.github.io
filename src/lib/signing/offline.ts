/**
 * A toy version of offline transaction signing: the key pair is made in the browser with Web Crypto
 * (ECDSA on P-256, also called secp256r1), the private key can't be exported, and the "gateway" checks
 * signatures with nothing but the public key.
 */
const ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGN_PARAMS = { name: 'ECDSA', hash: 'SHA-256' } as const;
const FINGERPRINT_GROUPS = 4;
const GROUP_LENGTH = 4;

export interface Signer {
  readonly publicKey: JsonWebKey;
  readonly privateKeyExtractable: boolean;
  sign(message: string): Promise<string>;
}

const encode = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);
const toBase64 = (bytes: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export async function createSigner(): Promise<Signer> {
  const pair = await crypto.subtle.generateKey(ALGORITHM, false, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return {
    publicKey,
    privateKeyExtractable: pair.privateKey.extractable,
    sign: async (message) => toBase64(await crypto.subtle.sign(SIGN_PARAMS, pair.privateKey, encode(message))),
  };
}

export async function verifySignature(publicKey: JsonWebKey, message: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('jwk', publicKey, ALGORITHM, false, ['verify']);
  return crypto.subtle.verify(SIGN_PARAMS, key, fromBase64(signature), encode(message));
}

export async function fingerprint(publicKey: JsonWebKey): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encode(`${publicKey.x}.${publicKey.y}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return Array.from({ length: FINGERPRINT_GROUPS }, (_, i) => hex.slice(i * GROUP_LENGTH, (i + 1) * GROUP_LENGTH)).join(':');
}

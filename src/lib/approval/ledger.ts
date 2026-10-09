/**
 * A toy approval ledger for the Lab demo. It mirrors the production design on fake data:
 * the agent can only propose, a person approves, and the approval is a single-use token
 * bound to a SHA-256 hash of the exact payload. Every function returns new state.
 */
export type Tone = 'info' | 'ok' | 'bad';
export type EventKind = 'proposed' | 'approved' | 'committed' | 'edited' | 'blocked' | 'replayed' | 'tampered' | 'reset';

export interface Payload {
  readonly tool: string;
  readonly card: string;
  readonly dailyLimit: number;
}
export interface Draft { readonly payload: Payload; readonly hash: string }
export interface Token { readonly id: string; readonly hash: string; readonly used: boolean }
export interface LedgerState { readonly draft: Draft | null; readonly token: Token | null; readonly committed: boolean }
export interface LedgerEvent { readonly kind: EventKind; readonly tone: Tone; readonly message: string }
export interface Step { readonly state: LedgerState; readonly event: LedgerEvent }

export const SAMPLE_PAYLOAD: Payload = Object.freeze({ tool: 'update_card_limit', card: '••42', dailyLimit: 50_000 });
export const TAMPERED_LIMIT = 500_000;
export const initialState: LedgerState = Object.freeze({ draft: null, token: null, committed: false });

const SHORT_HASH_LENGTH = 8;
const TOKEN_ID_LENGTH = 6;
const BASE36 = 36;

export function canonicalJson(payload: Payload): string {
  const sorted = Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify(sorted);
}

export async function hashPayload(payload: Payload): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(payload)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function shortHash(hash: string): string {
  return hash.slice(0, SHORT_HASH_LENGTH);
}

export function newTokenId(rand: () => number = Math.random): string {
  const chars = Array.from({ length: TOKEN_ID_LENGTH }, () => Math.floor(rand() * BASE36).toString(BASE36));
  return `tok_${chars.join('')}`;
}

const event = (kind: EventKind, tone: Tone, message: string): LedgerEvent => ({ kind, tone, message });
const refuse = (state: LedgerState, kind: EventKind, message: string): Step => ({ state, event: event(kind, 'bad', message) });

export async function propose(payload: Payload): Promise<Step> {
  const hash = await hashPayload(payload);
  return {
    state: { draft: { payload, hash }, token: null, committed: false },
    event: event(
      'proposed',
      'info',
      `propose ${payload.tool}(card=${payload.card}, daily=${payload.dailyLimit}) → saved as a draft, hash ${shortHash(hash)}. Nothing is written yet.`,
    ),
  };
}

export function approve(state: LedgerState, tokenId: string): Step {
  if (!state.draft) return refuse(state, 'blocked', '✗ Nothing to approve yet. The agent has to propose a change first.');
  if (state.committed) return refuse(state, 'blocked', '✗ Already committed. Propose a new change first.');
  if (state.token) return refuse(state, 'blocked', `✗ Already approved. The token is ${state.token.id}.`);
  const token: Token = { id: tokenId, hash: state.draft.hash, used: false };
  return {
    state: { ...state, token },
    event: event('approved', 'ok', `✓ Approved by a person → single-use token ${token.id}, bound to hash ${shortHash(token.hash)}.`),
  };
}

export async function editDraft(state: LedgerState, patch: Partial<Payload>): Promise<Step> {
  if (!state.draft) return refuse(state, 'blocked', '✗ Nothing to edit yet.');
  if (state.committed) return refuse(state, 'blocked', "✗ Already committed. An edit can't change it now.");
  const payload: Payload = { ...state.draft.payload, ...patch };
  const hash = await hashPayload(payload);
  const afterApproval = state.token ? ' after approval' : '';
  const stale = state.token ? ` The token still points at ${shortHash(state.token.hash)}.` : '';
  return {
    state: { ...state, draft: { payload, hash } },
    event: event('edited', 'info', `edit daily=${payload.dailyLimit}${afterApproval} → new hash ${shortHash(hash)}.${stale}`),
  };
}

export async function commit(state: LedgerState): Promise<Step> {
  if (!state.draft) return refuse(state, 'blocked', '✗ Nothing to commit.');
  if (!state.token) return refuse(state, 'blocked', "✗ Blocked: the agent can't approve its own write.");
  if (state.token.used) return refuse(state, 'replayed', `✗ Replay rejected: token ${state.token.id} is already used.`);
  const hash = await hashPayload(state.draft.payload);
  if (hash !== state.token.hash) return refuse(state, 'tampered', '✗ Rejected: the payload changed after approval (hash mismatch).');
  return {
    state: { ...state, token: { ...state.token, used: true }, committed: true },
    event: event('committed', 'ok', `✓ Committed with ${state.token.id}. The hash matches, and the token is now spent.`),
  };
}

export function reset(): Step {
  return { state: initialState, event: event('reset', 'info', '// reset. Click the steps in any order.') };
}

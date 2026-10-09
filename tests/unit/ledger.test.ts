import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  SAMPLE_PAYLOAD, TAMPERED_LIMIT, approve, canonicalJson, commit, editDraft, hashPayload,
  initialState, newTokenId, propose, reset, shortHash, type LedgerState,
} from '../../src/lib/approval/ledger';

const TOKEN = 'tok_test01';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

async function approvedState(): Promise<LedgerState> {
  const proposed = await propose(SAMPLE_PAYLOAD);
  return approve(proposed.state, TOKEN).state;
}

describe('canonicalJson and hashPayload', () => {
  it('sorts keys so equal payloads serialise the same way', () => {
    expect(canonicalJson({ tool: 't', card: 'c', dailyLimit: 1 })).toBe(canonicalJson({ dailyLimit: 1, card: 'c', tool: 't' }));
    expect(canonicalJson(SAMPLE_PAYLOAD)).toBe('{"card":"••42","dailyLimit":50000,"tool":"update_card_limit"}');
  });

  it('hashes the canonical JSON with SHA-256', async () => {
    const expected = createHash('sha256').update(canonicalJson(SAMPLE_PAYLOAD)).digest('hex');
    await expect(hashPayload(SAMPLE_PAYLOAD)).resolves.toBe(expected);
  });

  it('gives a different hash when the payload changes', async () => {
    const changed = await hashPayload({ ...SAMPLE_PAYLOAD, dailyLimit: TAMPERED_LIMIT });
    expect(changed).not.toBe(await hashPayload(SAMPLE_PAYLOAD));
  });

  it('shortens hashes to eight characters', () => {
    expect(shortHash('0123456789abcdef')).toBe('01234567');
  });
});

describe('propose', () => {
  it('saves a draft with its hash and no token', async () => {
    const step = await propose(SAMPLE_PAYLOAD);
    expect(step.state.draft?.hash).toBe(await hashPayload(SAMPLE_PAYLOAD));
    expect(step.state.token).toBeNull();
    expect(step.state.committed).toBe(false);
    expect(step.event).toMatchObject({ kind: 'proposed', tone: 'info' });
    expect(step.event.message).toContain('saved as a draft');
  });
});

describe('approve', () => {
  it('refuses when nothing was proposed', () => {
    const step = approve(initialState, TOKEN);
    expect(step.state).toBe(initialState);
    expect(step.event).toMatchObject({ kind: 'blocked', tone: 'bad' });
  });

  it('issues a single-use token bound to the draft hash', async () => {
    const proposed = await propose(SAMPLE_PAYLOAD);
    const step = approve(proposed.state, TOKEN);
    expect(step.state.token).toEqual({ id: TOKEN, hash: proposed.state.draft?.hash, used: false });
    expect(step.event.message).toContain('Approved by a person');
  });

  it('does not issue a second token', async () => {
    const state = await approvedState();
    const step = approve(state, 'tok_other');
    expect(step.state).toBe(state);
    expect(step.event.message).toContain(TOKEN);
  });

  it('refuses after the change is committed', async () => {
    const committed = (await commit(await approvedState())).state;
    expect(approve(committed, 'tok_other').event.message).toContain('Already committed');
  });
});

describe('commit', () => {
  it('has nothing to commit before a proposal', async () => {
    const step = await commit(initialState);
    expect(step.state).toBe(initialState);
    expect(step.event.kind).toBe('blocked');
  });

  it('blocks a commit without approval', async () => {
    const proposed = await propose(SAMPLE_PAYLOAD);
    const step = await commit(proposed.state);
    expect(step.state).toBe(proposed.state);
    expect(step.event.message).toContain("can't approve its own write");
  });

  it('commits once with a valid token and spends it', async () => {
    const step = await commit(await approvedState());
    expect(step.state.committed).toBe(true);
    expect(step.state.token?.used).toBe(true);
    expect(step.event).toMatchObject({ kind: 'committed', tone: 'ok' });
    expect(step.event.message).toContain(`Committed with ${TOKEN}`);
  });

  it('rejects a replay of a spent token', async () => {
    const first = await commit(await approvedState());
    const second = await commit(first.state);
    expect(second.state).toBe(first.state);
    expect(second.event.kind).toBe('replayed');
    expect(second.event.message).toContain('already used');
  });

  it('rejects a payload edited after approval', async () => {
    const edited = await editDraft(await approvedState(), { dailyLimit: TAMPERED_LIMIT });
    const step = await commit(edited.state);
    expect(step.event.kind).toBe('tampered');
    expect(step.event.message).toContain('hash mismatch');
    expect(step.state.committed).toBe(false);
  });

  it('accepts an edit made before approval', async () => {
    const proposed = await propose(SAMPLE_PAYLOAD);
    const edited = await editDraft(proposed.state, { dailyLimit: TAMPERED_LIMIT });
    const step = await commit(approve(edited.state, TOKEN).state);
    expect(step.event.kind).toBe('committed');
  });
});

describe('editDraft', () => {
  it('refuses with no draft', async () => {
    expect((await editDraft(initialState, { dailyLimit: 1 })).event.kind).toBe('blocked');
  });

  it('refuses after commit', async () => {
    const committed = (await commit(await approvedState())).state;
    expect((await editDraft(committed, { dailyLimit: 1 })).event.kind).toBe('blocked');
  });

  it('says the token still points at the old hash', async () => {
    const step = await editDraft(await approvedState(), { dailyLimit: TAMPERED_LIMIT });
    expect(step.event.message).toContain('still points at');
    expect(step.state.draft?.payload.dailyLimit).toBe(TAMPERED_LIMIT);
  });
});

describe('purity', () => {
  it('never changes the state it is given', async () => {
    const state = deepFreeze(await approvedState());
    await expect(commit(state)).resolves.toBeDefined();
    await expect(editDraft(state, { dailyLimit: 1 })).resolves.toBeDefined();
    expect(() => approve(state, 'tok_x')).not.toThrow();
  });

  it('resets to the initial state', () => {
    expect(reset().state).toBe(initialState);
  });
});

describe('newTokenId', () => {
  it('makes tok_ plus six base-36 characters', () => {
    expect(newTokenId(() => 0.5)).toBe('tok_iiiiii');
    expect(newTokenId()).toMatch(/^tok_[0-9a-z]{6}$/);
  });
});

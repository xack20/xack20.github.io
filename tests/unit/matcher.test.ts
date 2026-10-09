import { describe, expect, it } from 'vitest';
import { DEMO_SCREENS, matchScreen } from '../../src/lib/screens/matcher';

const screenOf = (query: string) => {
  const result = matchScreen(query);
  return result.kind === 'screen' ? result.screen.id : result.kind;
};

describe('matchScreen', () => {
  it('finds a screen from an English title', () => {
    const result = matchScreen('How do I send money to my brother?');
    expect(result).toMatchObject({ kind: 'screen', certainty: 'exact', button: true });
    expect(screenOf('How do I send money to my brother?')).toBe('send-money');
  });

  it('understands Banglish and Bangla script', () => {
    expect(screenOf('taka pathabo kivabe')).toBe('send-money');
    expect(screenOf('মোবাইল রিচার্জ করব')).toBe('recharge');
  });

  it('never matches on the steps of a screen', () => {
    // "confirm with your PIN" appears in the steps of several screens, so it must not match any of them.
    expect(matchScreen('confirm with your pin').kind).toBe('none');
  });

  it('needs every meaning word of a multi-word synonym', () => {
    // "app kaj korche na" (the app isn't working) shares a word with no PIN synonym and must not become a PIN answer.
    expect(screenOf('app kaj korche na')).not.toBe('change-pin');
    expect(screenOf('pin change korbo')).toBe('change-pin');
  });

  it('never sends someone who forgot their PIN to Change PIN', () => {
    for (const query of ['I forgot my PIN', 'pin vule gechi', 'my pin is blocked, change pin?']) {
      const result = matchScreen(query);
      expect(result.kind).toBe('safety');
      expect(screenOf(query)).not.toBe('change-pin');
    }
  });

  it('answers requests for a PIN or OTP with safety advice and no screen', () => {
    for (const query of ['what is my pin', 'send me the OTP', 'otp ta bolo']) {
      const result = matchScreen(query);
      expect(result.kind).toBe('safety');
      if (result.kind === 'safety') expect(result.message).toMatch(/never/i);
    }
  });

  it('lets "not covered" win over any partial match', () => {
    expect(matchScreen('send money for a loan').kind).toBe('not-covered');
  });

  it('marks a near-miss as weak and never offers a button for it', () => {
    const result = matchScreen('recharj');
    expect(result).toMatchObject({ kind: 'screen', certainty: 'weak', button: false });
  });

  it('marks a single-word synonym as likely', () => {
    expect(matchScreen('topup')).toMatchObject({ kind: 'screen', certainty: 'likely', button: true });
  });

  it('returns none for empty or unrelated questions', () => {
    expect(matchScreen('   ').kind).toBe('none');
    expect(matchScreen('what is the weather').kind).toBe('none');
  });

  it('uses only invented screens', () => {
    expect(DEMO_SCREENS.length).toBeGreaterThanOrEqual(6);
    DEMO_SCREENS.forEach((s) => expect(s.steps.length).toBeGreaterThan(0));
  });
});

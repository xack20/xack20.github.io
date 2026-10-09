/**
 * A toy version of the PIN-safe app screen finder, on an invented wallet (not any real app's screens).
 * Same rules as the real one: safety rules run before matching, "not covered" wins over a partial
 * match, only titles and synonyms are matched (never steps), a multi-word synonym needs every word,
 * and a weak match never becomes a button.
 */
export type Certainty = 'exact' | 'likely' | 'weak';

export interface DemoScreen {
  readonly id: string;
  readonly title: string;
  readonly titleBn: string;
  readonly synonyms: readonly string[];
  readonly steps: readonly string[];
}

export type MatchResult =
  | { readonly kind: 'screen'; readonly screen: DemoScreen; readonly certainty: Certainty; readonly button: boolean }
  | { readonly kind: 'safety'; readonly message: string }
  | { readonly kind: 'not-covered'; readonly message: string }
  | { readonly kind: 'none'; readonly message: string };

const CONFIRM = 'Confirm with your PIN';

export const DEMO_SCREENS: readonly DemoScreen[] = [
  { id: 'send-money', title: 'Send money', titleBn: 'টাকা পাঠান', synonyms: ['transfer money', 'taka pathabo', 'taka pathano', 'টাকা পাঠাবো'], steps: ['Tap Send money', 'Enter the number and the amount', CONFIRM] },
  { id: 'cash-out', title: 'Cash out', titleBn: 'ক্যাশ আউট', synonyms: ['cashout', 'taka tulbo', 'টাকা তুলব'], steps: ['Tap Cash out', 'Enter the agent number and the amount', CONFIRM] },
  { id: 'recharge', title: 'Mobile recharge', titleBn: 'মোবাইল রিচার্জ', synonyms: ['recharge', 'topup', 'top up', 'flexiload', 'রিচার্জ'], steps: ['Tap Mobile recharge', 'Pick the operator and the amount', CONFIRM] },
  { id: 'pay-bill', title: 'Pay bill', titleBn: 'বিল পে', synonyms: ['bill pay', 'electricity bill', 'bill dibo'], steps: ['Tap Pay bill', 'Choose the biller', CONFIRM] },
  { id: 'change-pin', title: 'Change PIN', titleBn: 'পিন পরিবর্তন', synonyms: ['pin change', 'new pin', 'pin bodlabo'], steps: ['Open Settings', 'Tap Change PIN', 'Enter your current PIN, then the new one'] },
  { id: 'history', title: 'Transaction history', titleBn: 'লেনদেনের ইতিহাস', synonyms: ['statement', 'history', 'lenden'], steps: ['Tap the clock icon', 'Filter by date'] },
  { id: 'add-money', title: 'Add money from bank', titleBn: 'ব্যাংক থেকে টাকা আনুন', synonyms: ['add money', 'bank to wallet'], steps: ['Tap Add money', 'Pick your bank', CONFIRM] },
];

const SECRET_WORDS = new Set(['pin', 'otp', 'password', 'পিন', 'ওটিপি']);
const ASK_WORDS = new Set(['what', 'tell', 'send', 'give', 'share', 'bolo', 'dao', 'pathao', 'বলো', 'দাও']);
const LOST_WORDS = new Set(['forgot', 'forget', 'forgotten', 'lost', 'blocked', 'block', 'vule', 'bhule', 'ভুলে', 'হারিয়ে', 'ব্লক']);
const NOT_COVERED = new Set(['loan', 'loans', 'insurance', 'savings', 'dps', 'ঋণ']);
const PREFIX_LENGTH = 4;

const SECRET_MESSAGE = 'Never share your PIN or OTP with anyone, including this assistant or someone who calls you. No real service will ask for it.';
const LOST_PIN_MESSAGE = "If you forgot your PIN or it's blocked, the Change PIN screen can't help, because it asks for your current PIN. Reset it through official customer support instead.";
const NOT_COVERED_MESSAGE = "This guide doesn't cover that topic, so it won't guess a screen.";
const NONE_MESSAGE = "I couldn't match that to a screen. Try naming what you want to do, like send money or pay a bill.";

export function tokenize(text: string): readonly string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

const hasAny = (words: ReadonlySet<string>, set: ReadonlySet<string>): boolean => [...words].some((w) => set.has(w));

function safetyRule(words: ReadonlySet<string>): MatchResult | null {
  if (!hasAny(words, SECRET_WORDS)) return null;
  if (hasAny(words, LOST_WORDS)) return { kind: 'safety', message: LOST_PIN_MESSAGE };
  if (hasAny(words, ASK_WORDS)) return { kind: 'safety', message: SECRET_MESSAGE };
  return null;
}

function bestFullMatch(words: ReadonlySet<string>): { screen: DemoScreen; certainty: Certainty } | null {
  const candidates = DEMO_SCREENS.flatMap((screen) =>
    [screen.title, screen.titleBn, ...screen.synonyms].flatMap((phrase) => {
      const phraseWords = tokenize(phrase);
      if (!phraseWords.every((w) => words.has(w))) return [];
      const isTitle = phrase === screen.title || phrase === screen.titleBn;
      const certainty: Certainty = isTitle || phraseWords.length > 1 ? 'exact' : 'likely';
      return [{ screen, certainty, size: phraseWords.length }];
    }),
  );
  const rank = (c: { certainty: Certainty; size: number }): number => (c.certainty === 'exact' ? 100 : 0) + c.size;
  const best = [...candidates].sort((a, b) => rank(b) - rank(a))[0];
  return best ? { screen: best.screen, certainty: best.certainty } : null;
}

function nearMiss(words: ReadonlySet<string>): DemoScreen | null {
  const prefixes = [...words].filter((w) => w.length >= PREFIX_LENGTH).map((w) => w.slice(0, PREFIX_LENGTH));
  return (
    DEMO_SCREENS.find((screen) =>
      [screen.title, ...screen.synonyms].flatMap(tokenize).some((w) => w.length >= PREFIX_LENGTH && prefixes.includes(w.slice(0, PREFIX_LENGTH))),
    ) ?? null
  );
}

export function matchScreen(query: string): MatchResult {
  const words = new Set(tokenize(query));
  if (words.size === 0) return { kind: 'none', message: NONE_MESSAGE };
  const safety = safetyRule(words);
  if (safety) return safety;
  if (hasAny(words, NOT_COVERED)) return { kind: 'not-covered', message: NOT_COVERED_MESSAGE };
  const full = bestFullMatch(words);
  if (full) return { kind: 'screen', screen: full.screen, certainty: full.certainty, button: true };
  const weak = nearMiss(words);
  return weak ? { kind: 'screen', screen: weak, certainty: 'weak', button: false } : { kind: 'none', message: NONE_MESSAGE };
}

import type { Category } from '../lib/scene/plates';

/** The legend's wording for the three kinds of work on the home page. */
export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  agents: 'Agentic AI',
  payments: 'Payments and ledgers',
  personal: 'Personal and open source',
};

export interface ApprovalGate {
  readonly id: 'propose' | 'approve' | 'commit';
  readonly label: string;
  readonly clause: string;
}

/** The three gates of the approval sequence, each with its one-line caption. */
export const APPROVAL_GATES: readonly ApprovalGate[] = [
  { id: 'propose', label: 'Propose', clause: 'The agent drafts a change.' },
  { id: 'approve', label: 'Approve', clause: 'A person approves it.' },
  { id: 'commit', label: 'Commit', clause: 'The approval works once.' },
];

export const HOME_LABELS = {
  work: 'Work',
  caseStudies: (count: number): string => `${count} case studies`,
  viewWork: 'View work',
  getInTouch: 'Get in touch',
  scroll: 'Scroll',
  approvalHeading: 'The approval flow',
} as const;

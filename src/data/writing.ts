export interface WritingItem {
  readonly kind: 'article' | 'oss';
  readonly meta: string;
  readonly title: string;
  readonly short: string;
  readonly body: string;
  readonly href: string;
  readonly home: boolean;
}

export const WRITING: readonly WritingItem[] = [
  {
    kind: 'oss',
    meta: 'Open source · merged · Jun 2026',
    title: "Fixed whichllm's benchmark scraper",
    short: 'Parsed the Next.js RSC stream and made live data overlay the fallback, so a fetch can only add models. Chosen over a competing fix.',
    body: "whichllm (6.7k stars) ranks local LLMs partly by a benchmark it scrapes. After the source site moved to the Next.js App Router, the scraper quietly fell back to a stale snapshot. I parsed the new RSC stream and made live data overlay the curated fallback, so a fetch can only add models, never drop them: coverage grew to 78 models instead of shrinking to 43. The maintainer tested both fixes and merged mine.",
    href: '/work/whichllm-scraper-fix/',
    home: true,
  },
  {
    kind: 'article',
    meta: 'Medium · Apr 2026',
    title: 'I tried running RAGFlow on an Apple M5 Mac',
    short: 'What happened when I ran an open-source RAG engine on Apple Silicon.',
    body: 'What happened when I ran RAGFlow, an open-source RAG engine, on an Apple M5 Mac.',
    href: 'https://medium.com/@zakariahossain/i-tried-running-ragflow-on-an-apple-m5-mac-heres-what-actually-happened-9367c5b24dee',
    home: true,
  },
  {
    kind: 'article',
    meta: 'Medium · May 2025',
    title: 'HSM integration with the Fabric Java SDK',
    short: 'Keeping blockchain identities inside a hardware security module.',
    body: "How to keep Hyperledger Fabric identities' private keys inside a hardware security module, using PKCS#11 and SoftHSM2 with the Fabric Java SDK.",
    href: 'https://medium.com/@zakariahossain/hsm-integration-with-hyperledger-fabric-java-sdk-bridging-the-security-gap-7910c0232150',
    home: true,
  },
  {
    kind: 'oss',
    meta: 'Open source · fork · 2026',
    title: 'LMCanvas, extended',
    short: 'A branching canvas for Claude Code chats, with context tracking and compaction.',
    body: 'A branching canvas for Claude Code chats (TypeScript, React 19, Electron). On top of the original I added context-size tracking, one-click and automatic compaction, retrying an oversized history with less context, a model choice per question, and private access from my other machines over Tailscale behind a deny-by-default gate.',
    href: '/projects/lmcanvas/',
    home: false,
  },
];

export interface ExperienceBullet { readonly text: string; readonly href?: string }
export interface Role {
  readonly id: string;
  readonly title: string;
  readonly org: string;
  readonly location: string;
  readonly start: string;
  readonly end: string;
  readonly intro?: string;
  readonly bullets: readonly ExperienceBullet[];
}

export const ROLES: readonly Role[] = [
  {
    id: 'kona-senior',
    title: 'Senior Software Engineer',
    org: 'KONA Software Lab Ltd.',
    location: 'Dhaka, Bangladesh',
    start: 'Jan 2025',
    end: 'Present',
    intro: "I work on the agentic AI layer of KONA's card management system, the assistants built on it, and the self-hosted models underneath.",
    bullets: [
      {
        text: 'Bank operators ask the card management system about products, cards and transactions in English or Bangla, and the assistant finds the right screen or prepares the change. Nothing it prepares takes effect until a person approves it.',
        href: '/work/agentic-cms-assistant/',
      },
      {
        text: "Designed and wrote most of the MCP tool servers the agents work through: 31 Java/Spring Boot tools in three tiers plus an action catalog for rarer operations, a Node.js screen finder over the portal's 156 screens, and around 700 tests.",
        href: '/work/mcp-tool-servers/',
      },
      {
        text: "Made writes safe by design. The agent can only save drafts or act as the maker in the bank's maker-checker flow. Writes with no approval step of their own wait for a person in an approval ledger I built on Spring WebFlux and PostgreSQL, with single-use tokens bound to the exact change.",
        href: '/lab/',
      },
      {
        text: 'Added guardrails to the Python orchestration service (FastAPI, LangGraph): PII redaction on the output stream, input screening, limits on tool calls, and a check for numbers the model states without looking them up.',
        href: '/work/agent-evals-guardrails/',
      },
      {
        text: 'Wrote the eval suite for the whole stack: 57 suites and 2,265 cases covering guard checks, tool calls and chat. The latest run passed 98.7% of guard checks.',
        href: '/work/agent-evals-guardrails/',
      },
      {
        text: 'Took the same stack into the Nagad app as KON-AI, now integrated and in testing. Split prompts, configuration and builds into a shared base plus per-product profiles, wrote the screen finder that matches Bangla, English and Banglish questions to app screens with PIN-safety rules in code, and added the screen-card event that drives a button in the app. A judge-backed guard cut wrongly blocked questions from 10 of 146 to none.',
        href: '/work/kon-ai-nagad/',
      },
      {
        text: 'Set up our self-hosted LLM stack on an NVIDIA DGX Spark: vLLM serving a 27B Qwen model, embeddings and a reranker behind a LiteLLM gateway. Load-tested it at about 205 tokens/s across 16 streams and moved the agent services onto it.',
        href: '/work/self-hosted-llms-rag/',
      },
      {
        text: 'Built the RAG system our card personalization engineers use as their daily reference: a customised RAGFlow over 54 card specifications (EMV, GlobalPlatform, Mastercard M/Chip, Visa).',
        href: '/work/self-hosted-llms-rag/',
      },
      {
        text: 'Built a dashboard API for card issuers on our Oracle star-schema warehouse, made all 15 cardholder reports tenant-aware, and hardened the Spring Batch ETL with per-table load tracking and rerun safety.',
        href: '/work/card-reporting-data/',
      },
      {
        text: 'Built KONA Tag Explorer, backend and frontend, with one teammate: fund tracing for a KRW-pegged card system where every transaction becomes a UTXO with a lineage tag. I wrote the React explorer, most of its APIs, payment-depth contribution scoring and month-end UTXO consolidation. In production.',
        href: '/work/tag-explorer/',
      },
      {
        text: "Co-built KONA's identity provider on Spring Authorization Server, with passkey (WebAuthn) login and Okta federation, and wrote its React passkey client.",
        href: '/projects/kona-identity-provider/',
      },
      {
        text: 'Made the stack easy to run and ship: a one-command local runner for the services, an auth test harness, and deploy jobs that fail instead of reporting success while the old version is still serving.',
        href: '/projects/running-the-agent-stack/',
      },
      {
        text: "Wrote design docs for the stack, including the high-level design for the agentic AI platform and the product-profiles design, planned and owned the agentic-CMS sprint backlog, and reviewed and merged the team's changes to the stack.",
      },
    ],
  },
  {
    id: 'kona-l2',
    title: 'Software Engineer, Level 2',
    org: 'KONA Software Lab Ltd.',
    location: 'Dhaka, Bangladesh',
    start: 'Jul 2022',
    end: 'Dec 2024',
    bullets: [
      {
        text: "Top contributor to NCP (New Commerce Platform), KONA's token-backed commerce platform on Hyperledger Fabric, live for KONA I in Korea on AWS EC2. Worked directly with the Korea team, in English, on requirements, demos and releases.",
        href: '/work/ncp-fabric/',
      },
      {
        text: 'Owned the token management gateway between the platform and Fabric (Node.js, Express): offline transaction signing through endorsement and commit, X.509 identities through an HSM crypto suite, multi-tenancy across chaincodes, and event callbacks to merchant systems.',
        href: '/work/ncp-fabric/',
      },
      {
        text: 'Made it hold up under failure and load. Failed RabbitMQ publishes go to a retry table and replay once the broker is back, and a Redis-backed Socket.IO adapter lets several gateway instances run behind a load balancer.',
      },
      { text: 'Built the React signing portal, where users generate BIP39/secp256r1 HD-wallet keys and sign transactions on their own device.' },
      {
        text: 'Wrote most of the Fabric operations scripts (chaincode upgrades, certificate revocation, block timeout tuning) and benchmarked minting with Hyperledger Caliper: 5,000 transactions, no failures, about 150 to 170 TPS.',
      },
      {
        text: 'Worked on escrow across the stack: the trade, redeem, refund and multilateral settlement flows in the gateway, and escrow deposit and release in the ERC-1155 Go chaincode. Also added token details, paginated history and a permission matrix to the chaincode, and fixed endorsement failures under concurrent transactions.',
      },
      { text: "Worked on KONA-SCAN, NCP's block explorer (Go/Gin backend, Next.js frontend), including its first block event listener and the re-mint and direct-transfer balance views." },
      {
        text: 'Built out our API and UI test automation (Java, TestNG, RestAssured, Selenium, Allure) around a shared API library and data-driven request variations, with results synced to TestRail and posted to Microsoft Teams.',
      },
    ],
  },
  {
    id: 'bjit',
    title: 'Software Engineer',
    org: 'BJIT Ltd.',
    location: 'Dhaka, Bangladesh',
    start: 'Apr 2021',
    end: 'Jun 2022',
    intro: 'I joined as a Trainee Software Engineer and moved into Hyperledger Fabric research and development.',
    bullets: [
      { text: 'Software Engineer: Hyperledger Fabric R&D in Go and Spring Boot.' },
      { text: 'Trainee Software Engineer: built DeliveryExpress, an Ethereum courier and shipping dApp (React, Next.js, Node.js, Solidity).', href: '/projects/' },
    ],
  },
  {
    id: 'web',
    title: 'Web Developer',
    org: 'iTech Soft Solutions & Semicolon IT Solutions',
    location: 'Remote / Dhaka',
    start: 'Jul 2020',
    end: 'Mar 2021',
    bullets: [{ text: 'React and Node.js web apps on PostgreSQL and MongoDB.' }],
  },
];

export const EDUCATION = {
  degree: 'B.Sc. in Computer Science and Engineering',
  school: 'Daffodil International University',
  years: '2017 – 2021',
  grade: 'CGPA 3.74/4.00',
  thesis: 'Thesis: deep learning on financial transaction data.',
} as const;

export const CONTESTS: readonly string[] = [
  'Codeforces: 286 rated contests (2017–2025), 800+ problems solved, max rating 1414 (Specialist), hardest problem solved rated 1800.',
  'ACM ICPC Dhaka Regional 2018: 96th place.',
  'DIU Intra-University Programming Contest 2019: 1st place.',
  'Executive, DIU Computer & Programming Club (2017–2019).',
];

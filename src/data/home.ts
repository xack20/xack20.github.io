export interface PillarLink { readonly label: string; readonly href: string }
export interface Pillar {
  readonly n: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly links: readonly PillarLink[];
}

export const PILLARS: readonly Pillar[] = [
  {
    n: '01',
    title: 'Safe agentic AI',
    body: 'MCP tool servers, approval flows where the agent can only draft, and guardrails and evals that catch what the model gets wrong.',
    tags: ['MCP', 'LangGraph', 'Evals'],
    links: [
      { label: 'Tool servers', href: '/work/mcp-tool-servers/' },
      { label: 'Evals and guardrails', href: '/work/agent-evals-guardrails/' },
    ],
  },
  {
    n: '02',
    title: 'Self-hosted LLMs',
    body: 'Models served on our own hardware, so bank data never goes to an outside model API. vLLM, LiteLLM, Qwen, and a RAG system our engineers use every day.',
    tags: ['vLLM', 'LiteLLM', 'RAG'],
    links: [{ label: 'LLMs and RAG', href: '/work/self-hosted-llms-rag/' }],
  },
  {
    n: '03',
    title: 'Payments & ledgers',
    body: 'Card platforms, fund tracing, and a token-backed commerce platform on Hyperledger Fabric with HSM-backed identities.',
    tags: ['Java', 'Node.js', 'Fabric'],
    links: [
      { label: 'NCP on Fabric', href: '/work/ncp-fabric/' },
      { label: 'Tag Explorer', href: '/work/tag-explorer/' },
      { label: 'Reporting', href: '/work/card-reporting-data/' },
    ],
  },
];

/** Case studies shown on the home page, in order; the first is the featured wide card. */
export const HOME_WORK: readonly string[] = ['agentic-cms-assistant', 'mcp-tool-servers', 'kon-ai-nagad', 'tag-explorer', 'ncp-fabric'];

export interface SkillGroup { readonly group: string; readonly items: readonly string[] }

export const SKILLS: readonly SkillGroup[] = [
  { group: 'Languages', items: ['Java', 'TypeScript/JavaScript', 'Python', 'Go', 'SQL', 'Solidity', 'C++'] },
  { group: 'Backend', items: ['Spring Boot (WebFlux, Batch, Authorization Server)', 'Node.js/Express', 'FastAPI', 'Microservices', 'RabbitMQ', 'Socket.IO', 'Kafka Connect'] },
  {
    group: 'AI and LLMs',
    items: ['Agentic AI', 'LLMs', 'RAG', 'MCP (Java and TypeScript SDKs)', 'LangGraph', 'vLLM', 'LiteLLM', 'Qwen', 'RAGFlow', 'Embeddings and rerankers', 'Gemini', 'Google Cloud Vision', 'Evals and guardrails'],
  },
  { group: 'Frontend', items: ['React', 'Angular', 'Next.js', 'Svelte'] },
  { group: 'Mobile', items: ['Kotlin Multiplatform', 'Compose Multiplatform', 'Swift', 'Capacitor'] },
  { group: 'Data', items: ['Oracle (star schema)', 'PostgreSQL', 'Redis', 'MongoDB', 'MinIO', 'Spring Batch', 'Apache Superset', 'JasperReports'] },
  { group: 'Security and blockchain', items: ['OAuth2/OIDC', 'WebAuthn passkeys', 'Okta', 'HSM (PKCS#11)', 'X.509', 'Hyperledger Fabric'] },
  {
    group: 'DevOps and testing',
    items: ['Docker', 'AWS EC2', 'Jenkins', 'PM2', 'Gradle', 'Maven', 'JUnit', 'WireMock', 'pytest', 'Jest', 'Playwright', 'TestNG', 'RestAssured', 'Selenium', 'Hyperledger Caliper'],
  },
  { group: 'AI coding tools', items: ['Claude Code (daily)', 'earlier Google Antigravity and GitHub Copilot'] },
];

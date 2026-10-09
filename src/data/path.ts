export interface PathItem { readonly when: string; readonly title: string; readonly body: string; readonly home: boolean }

export const PATH: readonly PathItem[] = [
  {
    when: '2025 – now',
    title: 'Senior Software Engineer, KONA Software Lab',
    body: 'The agentic AI layer of a card management system and the Nagad app, the self-hosted LLM stack under it, and fund tracing for KONA I.',
    home: true,
  },
  {
    when: '2022 – 2024',
    title: 'Software Engineer, Level 2, KONA Software Lab',
    body: 'Top contributor to NCP, a token-backed commerce platform on Hyperledger Fabric, that runs for KONA I in Korea.',
    home: true,
  },
  {
    when: '2021 – 2022',
    title: 'Software Engineer, BJIT',
    body: 'Hyperledger Fabric R&D in Go and Spring Boot, and an Ethereum courier dApp.',
    home: true,
  },
  {
    when: '2020 – 2021',
    title: 'Web Developer, iTech Soft Solutions & Semicolon IT Solutions',
    body: 'React and Node.js web apps on PostgreSQL and MongoDB.',
    home: false,
  },
  {
    when: '2017 – 2021',
    title: 'B.Sc. in CSE, Daffodil International University',
    body: 'Competitive programming on Codeforces, ICPC Dhaka Regional 2018, and 1st place at the DIU programming contest in 2019.',
    home: true,
  },
];

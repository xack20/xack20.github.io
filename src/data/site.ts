export const SITE = {
  name: 'Zakaria Hossain Foysal',
  shortName: 'Zakaria H. Foysal',
  role: 'Senior Software Engineer',
  location: 'Dhaka, Bangladesh',
  url: 'https://xack20.github.io',
  tagline: 'Engineering trust into AI agents',
  description:
    'Senior software engineer in Dhaka. I build the agents, tool servers and guardrails behind banking and mobile-wallet assistants.',
  email: 'zakariahossain20@gmail.com',
  cvPath: '/cv.pdf',
  cvFileName: 'Zakaria_Hossain_Foysal_CV.pdf',
} as const;

export const LINKS = {
  email: `mailto:${SITE.email}`,
  linkedin: 'https://www.linkedin.com/in/zakaria-hossain-b34446160',
  github: 'https://github.com/xack20',
  medium: 'https://medium.com/@zakariahossain',
  codeforces: 'https://codeforces.com/profile/badTouch',
} as const;

export const NAV = [
  { label: 'Work', href: '/work/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Experience', href: '/experience/' },
  { label: 'Lab', href: '/lab/' },
  { label: 'Writing', href: '/writing/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/#contact' },
] as const;

export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  jobTitle: SITE.role,
  url: SITE.url,
  email: LINKS.email,
  worksFor: { '@type': 'Organization', name: 'KONA Software Lab' },
  address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Daffodil International University' },
  sameAs: [LINKS.linkedin, LINKS.github, LINKS.medium, LINKS.codeforces],
  knowsAbout: ['Agentic AI', 'Large language models', 'Retrieval-augmented generation', 'Model Context Protocol', 'LLM evaluation', 'Java', 'Spring Boot', 'TypeScript', 'Microservices', 'Payments', 'Hyperledger Fabric'],
} as const;

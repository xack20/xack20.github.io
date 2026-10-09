import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DIAGRAM_LIMITS } from './lib/diagram/layout';

const node = z.object({
  label: z.string().min(1).max(DIAGRAM_LIMITS.label),
  note: z.string().max(DIAGRAM_LIMITS.note).optional(),
  mine: z.boolean().default(false),
});

const stage = z.object({
  title: z.string().min(1).max(DIAGRAM_LIMITS.stageTitle),
  nodes: z.array(node).min(1).max(DIAGRAM_LIMITS.nodesPerStage),
});

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    card: z.string(),
    summary: z.string().max(260),
    outcome: z.string(),
    meta: z.string(),
    org: z.string(),
    client: z.string().optional(),
    years: z.string(),
    role: z.string(),
    status: z.string(),
    order: z.number().int().positive(),
    featured: z.boolean().default(false),
    group: z.enum(['kona', 'personal']).default('kona'),
    published: z.coerce.date(),
    stack: z.array(z.string()).min(1),
    plain: z.string(),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
    diagram: z.object({ caption: z.string(), stages: z.array(stage).min(2).max(DIAGRAM_LIMITS.stages) }),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(260),
    meta: z.string(),
    org: z.string(),
    years: z.string(),
    role: z.string(),
    status: z.string().optional(),
    group: z.enum(['kona', 'personal', 'open-source', 'earlier']),
    order: z.number().int().positive(),
    page: z.boolean().default(true),
    stack: z.array(z.string()).min(1),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
    published: z.coerce.date(),
  }),
});

export const collections = { work, projects };

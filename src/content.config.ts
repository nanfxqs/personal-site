import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const studyStatusSchema = z.enum(['未开始', '学习中', '已掌握']);

const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url().optional(),
  note: z.string().optional(),
});

const kb = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/kb',
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    subject: z.enum(['408', 'math1', 'english1']),
    course: z.string(),
    chapter: z.string().optional(),
    section: z.string().optional(),
    status: studyStatusSchema.default('学习中'),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    sources: z.array(sourceSchema).default([]),
    vizKind: z.enum(['none', '2d', '3d', 'both']).default('none'),
  }),
});

const journal = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/journal',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    datePrecision: z.enum(['day', 'minute', 'approximate']).default('day'),
    dateLabel: z.string().optional(),
    dateNote: z.string().optional(),
    summary: z.string().optional(),
    mood: z.string().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    media: z
      .array(
        z.object({
          kind: z.enum(['image', 'audio', 'video', 'embed']),
          url: z.string(),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    referencedTopics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { kb, journal };

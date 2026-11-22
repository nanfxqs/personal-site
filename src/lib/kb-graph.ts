import { getCollection, type CollectionEntry } from 'astro:content';
import {
  getAllSyllabusTopics,
  SUBJECT_LIST,
  type ExamWeight,
  type StudyStatus,
  type SubjectId,
  type VizHint,
} from '@/data/syllabus';

export interface BacklinkItem {
  id: string;
  title: string;
  href: string;
  kind: 'topic' | 'journal';
  meta?: string;
}

export interface ResolvedTopic {
  id: string;
  href: string;
  title: string;
  summary?: string;
  subjectId: SubjectId;
  courseId: string;
  subjectTitle: string;
  courseTitle: string;
  courseShortTitle: string;
  chapterTitle: string;
  sectionTitle: string;
  textbookRef?: string;
  weight?: ExamWeight;
  vizHint?: VizHint;
  math1Only?: boolean;
  isPublished: boolean;
  status: StudyStatus;
  entry?: CollectionEntry<'kb'>;
  prerequisites: string[];
  related: string[];
  backlinks: BacklinkItem[];
}

export interface ProgressStats {
  total: number;
  published: number;
  mastered: number;
  inProgress: number;
  notStarted: number;
  percent: number;
}

export interface GraphNode {
  id: string;
  title: string;
  href: string;
  subjectId: SubjectId;
  courseId: string;
  courseShortTitle: string;
  status: StudyStatus;
  isPublished: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: 'prerequisite' | 'related';
}

export interface KnowledgeIndex {
  topicsById: Map<string, ResolvedTopic>;
  allTopics: ResolvedTopic[];
  subjectStats: Record<SubjectId, ProgressStats>;
  courseStats: Map<string, ProgressStats>;
  overallStats: ProgressStats;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

/** Normalize Astro glob collection ID: "408/ds/kmp-algorithm/index" -> "408/ds/kmp-algorithm" */
export function normalizeTopicId(rawId: string): string {
  return rawId.replace(/\/index(\.(md|mdx))?$/, '').replace(/\.(md|mdx)$/, '');
}

/** Normalize journal entry slug: "2026-11-22-hello/index" -> "2026-11-22-hello" */
export function normalizeJournalSlug(rawId: string): string {
  return rawId.replace(/\/index(\.(md|mdx))?$/, '').replace(/\.(md|mdx)$/, '');
}

function computeStats(topics: ResolvedTopic[]): ProgressStats {
  const total = topics.length;
  let published = 0;
  let mastered = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const t of topics) {
    if (t.isPublished) published++;
    if (t.status === '已掌握') mastered++;
    else if (t.status === '学习中') inProgress++;
    else notStarted++;
  }

  const weighted = mastered + inProgress * 0.4;
  const percent = total > 0 ? Math.round((weighted / total) * 100) : 0;

  return { total, published, mastered, inProgress, notStarted, percent };
}

let cachedPromise: Promise<KnowledgeIndex> | null = null;

export function getKnowledgeIndex(): Promise<KnowledgeIndex> {
  if (!cachedPromise) {
    cachedPromise = buildKnowledgeIndex();
  }
  return cachedPromise;
}

async function buildKnowledgeIndex(): Promise<KnowledgeIndex> {
  const kbEntries = await getCollection('kb');
  const journalEntries = await getCollection('journal', ({ data }) => !data.draft);

  const entryById = new Map<string, CollectionEntry<'kb'>>();
  for (const entry of kbEntries) {
    entryById.set(normalizeTopicId(entry.id), entry);
  }

  const topicsById = new Map<string, ResolvedTopic>();

  // 1. Seed all syllabus topics (published or Stub Topic)
  for (const loc of getAllSyllabusTopics()) {
    const { subject, course, chapter, section, stub } = loc;
    const entry = entryById.get(stub.id);
    const mergedRelated = Array.from(
      new Set([...(stub.related ?? []), ...(entry?.data.related ?? [])]),
    );

    topicsById.set(stub.id, {
      id: stub.id,
      href: `/kb/${stub.id}`,
      title: entry?.data.title ?? stub.title,
      summary: entry?.data.summary,
      subjectId: subject.id,
      courseId: course.id,
      subjectTitle: subject.title,
      courseTitle: course.title,
      courseShortTitle: course.shortTitle,
      chapterTitle: chapter.title,
      sectionTitle: section.title,
      textbookRef: chapter.textbookRef,
      weight: stub.weight,
      vizHint: stub.viz,
      math1Only: stub.math1Only,
      isPublished: Boolean(entry),
      status: entry ? entry.data.status : '未开始',
      entry,
      prerequisites: entry?.data.prerequisites ?? [],
      related: mergedRelated,
      backlinks: [],
    });
  }

  // 2. Also include any ad-hoc published Topic not yet registered in a syllabus file (pluggable!)
  for (const [id, entry] of entryById.entries()) {
    if (topicsById.has(id)) continue;
    const subjectObj = SUBJECT_LIST.find((s) => s.id === entry.data.subject);
    const courseObj = subjectObj?.courses.find((c) => c.id === entry.data.course);

    topicsById.set(id, {
      id,
      href: `/kb/${id}`,
      title: entry.data.title,
      summary: entry.data.summary,
      subjectId: entry.data.subject,
      courseId: entry.data.course,
      subjectTitle: subjectObj?.title ?? entry.data.subject,
      courseTitle: courseObj?.title ?? entry.data.course,
      courseShortTitle: courseObj?.shortTitle ?? entry.data.course,
      chapterTitle: entry.data.chapter ?? '扩展专题',
      sectionTitle: entry.data.section ?? '独立知识点',
      isPublished: true,
      status: entry.data.status,
      entry,
      prerequisites: entry.data.prerequisites,
      related: entry.data.related,
      backlinks: [],
    });
  }

  // 3. Build bidirectional backlinks & graph edges
  const edges: GraphEdge[] = [];
  const edgeSeen = new Set<string>();

  for (const topic of topicsById.values()) {
    for (const preId of topic.prerequisites) {
      const target = topicsById.get(preId);
      if (target && target.id !== topic.id) {
        if (!target.backlinks.some((b) => b.id === topic.id)) {
          target.backlinks.push({
            id: topic.id,
            title: topic.title,
            href: topic.href,
            kind: 'topic',
            meta: `${topic.courseShortTitle} · 前置依赖`,
          });
        }
        const key = `${preId}->${topic.id}:pre`;
        if (!edgeSeen.has(key)) {
          edgeSeen.add(key);
          edges.push({ source: preId, target: topic.id, kind: 'prerequisite' });
        }
      }
    }

    for (const relId of topic.related) {
      const target = topicsById.get(relId);
      if (target && target.id !== topic.id) {
        if (!target.backlinks.some((b) => b.id === topic.id)) {
          target.backlinks.push({
            id: topic.id,
            title: topic.title,
            href: topic.href,
            kind: 'topic',
            meta: `${topic.courseShortTitle} · 关联引用`,
          });
        }
        const pair = [topic.id, relId].sort().join('--');
        if (!edgeSeen.has(pair)) {
          edgeSeen.add(pair);
          edges.push({ source: topic.id, target: relId, kind: 'related' });
        }
      }
    }
  }

  // 4. Add backlinks from Journal Entries
  for (const post of journalEntries) {
    const slug = normalizeJournalSlug(post.id);
    for (const topicId of post.data.referencedTopics) {
      const target = topicsById.get(topicId);
      if (target) {
        target.backlinks.push({
          id: `journal:${slug}`,
          title: post.data.title,
          href: `/journal/${slug}`,
          kind: 'journal',
          meta: `日常 · ${post.data.date.toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  const allTopics = Array.from(topicsById.values());

  const subjectStats = {
    '408': computeStats(allTopics.filter((t) => t.subjectId === '408')),
    math1: computeStats(allTopics.filter((t) => t.subjectId === 'math1')),
    english1: computeStats(allTopics.filter((t) => t.subjectId === 'english1')),
  };

  const courseStats = new Map<string, ProgressStats>();
  for (const subject of SUBJECT_LIST) {
    for (const course of subject.courses) {
      courseStats.set(
        `${subject.id}/${course.id}`,
        computeStats(
          allTopics.filter((t) => t.subjectId === subject.id && t.courseId === course.id),
        ),
      );
    }
  }

  const overallStats = computeStats(allTopics);

  const nodes: GraphNode[] = allTopics.map((t) => ({
    id: t.id,
    title: t.title,
    href: t.href,
    subjectId: t.subjectId,
    courseId: t.courseId,
    courseShortTitle: t.courseShortTitle,
    status: t.status,
    isPublished: t.isPublished,
  }));

  return {
    topicsById,
    allTopics,
    subjectStats,
    courseStats,
    overallStats,
    graph: { nodes, edges },
  };
}

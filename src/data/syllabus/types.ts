export type SubjectId = '408' | 'math1' | 'english1';

export type StudyStatus = '未开始' | '学习中' | '已掌握';

export type ExamWeight = '★' | '★★' | '★★★';

export type VizHint = '2d' | '3d' | 'widget';

export interface TopicStub {
  /** Canonical topic ID, e.g. "408/ds/kmp-algorithm" */
  id: string;
  title: string;
  weight?: ExamWeight;
  viz?: VizHint;
  math1Only?: boolean;
  /** Optional cross-subject or cross-course related topic IDs declared at syllabus level */
  related?: string[];
}

export interface SyllabusSection {
  id: string;
  title: string;
  topics: TopicStub[];
}

export interface SyllabusChapter {
  id: string;
  order: number;
  title: string;
  weight?: ExamWeight;
  textbookRef?: string;
  sections: SyllabusSection[];
}

export interface SyllabusCourse {
  id: string;
  subjectId: SubjectId;
  title: string;
  shortTitle: string;
  scoreShare: string;
  description: string;
  chapters: SyllabusChapter[];
}

export interface SyllabusSubject {
  id: SubjectId;
  title: string;
  code: string;
  description: string;
  courses: SyllabusCourse[];
}

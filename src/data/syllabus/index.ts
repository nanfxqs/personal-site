import { syllabus408 } from './408';
import { syllabusMath1 } from './math1';
import { syllabusEnglish1 } from './english1';
import type {
  SubjectId,
  SyllabusChapter,
  SyllabusCourse,
  SyllabusSection,
  SyllabusSubject,
  TopicStub,
} from './types';

export * from './types';

export const SYLLABI: Record<SubjectId, SyllabusSubject> = {
  '408': syllabus408,
  math1: syllabusMath1,
  english1: syllabusEnglish1,
};

export const SUBJECT_LIST: SyllabusSubject[] = [
  syllabus408,
  syllabusMath1,
  syllabusEnglish1,
];

export interface SyllabusTopicLocation {
  subject: SyllabusSubject;
  course: SyllabusCourse;
  chapter: SyllabusChapter;
  section: SyllabusSection;
  stub: TopicStub;
}

export function getAllSyllabusTopics(): SyllabusTopicLocation[] {
  const results: SyllabusTopicLocation[] = [];
  for (const subject of SUBJECT_LIST) {
    for (const course of subject.courses) {
      for (const chapter of course.chapters) {
        for (const section of chapter.sections) {
          for (const stub of section.topics) {
            results.push({ subject, course, chapter, section, stub });
          }
        }
      }
    }
  }
  return results;
}

export function findSyllabusTopic(topicId: string): SyllabusTopicLocation | undefined {
  return getAllSyllabusTopics().find((loc) => loc.stub.id === topicId);
}

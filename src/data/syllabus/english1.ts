import type { SyllabusSubject } from './types';

export const syllabusEnglish1: SyllabusSubject = {
  id: 'english1',
  title: '考研英语一 (201)',
  code: '201',
  description: '按底层能力（词汇、语法长难句）与五大考场题型模块组织，聚焦方法论、语料沉淀与交互式句法训练。',
  courses: [
    {
      id: 'foundation',
      subjectId: 'english1',
      title: '词汇与语法地基',
      shortTitle: '词句地基',
      scoreShare: '全卷底层能力',
      description: '大纲核心词、熟词僻义、同义替换网络与长难句句法拆解。',
      chapters: [
        {
          id: 'en-ch1',
          order: 1,
          title: '词汇与构词体系',
          weight: '★★★',
          sections: [
            {
              id: 'en-1-1',
              title: '高频词汇与词义网络',
              topics: [
                { id: 'english1/foundation/roots-and-affixes', title: '高频词根词缀与派生规律', weight: '★★★', viz: 'widget' },
                { id: 'english1/foundation/polysemy-and-synonyms', title: '考研熟词僻义与同义替换词库', weight: '★★★', viz: 'widget' },
              ],
            },
          ],
        },
        {
          id: 'en-ch2',
          order: 2,
          title: '语法与长难句分析',
          weight: '★★★',
          sections: [
            {
              id: 'en-2-1',
              title: '句法拆解与特殊结构',
              topics: [
                { id: 'english1/foundation/three-clauses-and-non-finite', title: '三大从句与非谓语动词精析', weight: '★★★', viz: 'widget' },
                { id: 'english1/foundation/long-sentence-parsing', title: '长难句“去枝叶抓主干”断句法', weight: '★★★', viz: 'widget' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'reading',
      subjectId: 'english1',
      title: '完形、阅读与新题型',
      shortTitle: '阅读输入',
      scoreShare: '60 分',
      description: '完形填空（10 分）、传统阅读 Part A（40 分）与新题型 Part B（10 分）方法论。',
      chapters: [
        {
          id: 'en-ch3',
          order: 3,
          title: '英语知识运用（完形填空）',
          weight: '★★',
          sections: [
            {
              id: 'en-3-1',
              title: '逻辑与搭配策略',
              topics: [
                { id: 'english1/reading/cloze-logic-markers', title: '句间逻辑关系词与上下文复现技巧', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'en-ch4',
          order: 4,
          title: '阅读理解 Part A（传统阅读）',
          weight: '★★★',
          sections: [
            {
              id: 'en-4-1',
              title: '六大题型与干扰项识别',
              topics: [
                { id: 'english1/reading/reading-question-types', title: '细节/主旨/态度/推断/词义/例证六大题型解法', weight: '★★★', viz: 'widget' },
                { id: 'english1/reading/distractor-patterns', title: '常见干扰项特征与同义替换定位', weight: '★★★' },
              ],
            },
          ],
        },
        {
          id: 'en-ch5',
          order: 5,
          title: '阅读理解 Part B（新题型）',
          weight: '★★',
          sections: [
            {
              id: 'en-5-1',
              title: '篇章衔接技巧',
              topics: [
                { id: 'english1/reading/new-question-types', title: '七选五、段落排序与小标题匹配', weight: '★★', viz: 'widget' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'writing',
      subjectId: 'english1',
      title: '翻译与写作输出',
      shortTitle: '翻译写作',
      scoreShare: '40 分',
      description: '英译汉（10 分）、小作文（10 分）与大作文（20 分）模板与语料库。',
      chapters: [
        {
          id: 'en-ch6',
          order: 6,
          title: '英译汉 Part C',
          weight: '★★',
          sections: [
            {
              id: 'en-6-1',
              title: '拆分重组与表达转换',
              topics: [
                { id: 'english1/writing/translation-techniques', title: '定语/状语从句拆分、被动转主动与词义引申', weight: '★★', viz: 'widget', related: ['english1/foundation/long-sentence-parsing'] },
              ],
            },
          ],
        },
        {
          id: 'en-ch7',
          order: 7,
          title: '写作 Part A（小作文）',
          weight: '★★',
          sections: [
            {
              id: 'en-7-1',
              title: '应用文格式与功能句',
              topics: [
                { id: 'english1/writing/part-a-formats', title: '书信、告示、纪要格式与高频功能句型', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'en-ch8',
          order: 8,
          title: '写作 Part B（大作文）',
          weight: '★★★',
          sections: [
            {
              id: 'en-8-1',
              title: '图画/图表审题与语料',
              topics: [
                { id: 'english1/writing/part-b-structure', title: '图画/图表/文字材料审题与三段论结构', weight: '★★★' },
                { id: 'english1/writing/part-b-corpus', title: '科技、文化、社会、个人成长高频主题语料', weight: '★★★' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

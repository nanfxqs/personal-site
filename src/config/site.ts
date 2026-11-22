export const SITE = {
  nickname: 'nanf',
  title: 'nanf · 日常与考研知识库',
  description: '个人日常随笔、影音记录与考研（408 / 数学一 / 英语一）交互式知识点图谱。',
  bio: '记录生活日常、读书与影音随笔，以及备考 408、数学一、英语一过程中的结构化知识点与原理可视化。',
  location: 'Study & Life',
  status: '备考中 · 408 / 数学一 / 英语一',
  mediaBaseUrl: '/media',
} as const;

export const NAV_LINKS = [
  { label: '首页', href: '/' },
  { label: '日常', href: '/journal' },
  { label: '408', href: '/kb/408' },
  { label: '数学一', href: '/kb/math1' },
  { label: '英语一', href: '/kb/english1' },
  { label: '知识图谱', href: '/graph' },
] as const;

# nanf · 个人日常与考研知识库

基于 **Custom Astro + React Islands + Tailwind CSS + KaTeX + Pagefind** 构建的纯静态个人网站，兼顾「极简阅读/学术杂志风」的个人日常随笔与「高内聚、可插拔、支持 2D/3D 交互可视化与跨科关联」的考研知识图谱（408 / 数学一 / 英语一）。

## 常用命令

```bash
npm run dev      # 启动本地开发服务器
npm run check    # 运行 Astro + TypeScript + Zod Schema 静态校验
npm run build    # 全量校验 + 静态构建 (dist/) + Pagefind 全文索引
npm run preview  # 本地预览静态构建产物（含完整 Pagefind 搜索）
```

## 文档与架构约定

- 领域术语表：[GLOSSARY.md](./GLOSSARY.md)
- 架构决策记录：[docs/adr/](./docs/adr/)
- 调研与三科大纲：[docs/research/](./docs/research/)
- 外部优质参考源：[docs/reference-sources.md](./docs/reference-sources.md)
- AI Agent 增量写作规范：[docs/authoring-guide.md](./docs/authoring-guide.md)

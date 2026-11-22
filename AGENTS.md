# AGENTS.md

本文件仅约定无法直接从代码推断的**协作规则、约束边界与验收标准**，采用渐进式披露，按任务场景按需阅读对应文档。

## 1. 文档导航（按需阅读）

| 任务场景 | 必读文档 |
| --- | --- |
| 统一项目术语（严禁混用禁用词） | [GLOSSARY.md](./GLOSSARY.md) |
| 编写/重构组件或样式 | [docs/coding-standards.md](./docs/coding-standards.md) |
| 新增/修改知识点（Topic）或日常（Journal） | [docs/authoring-guide.md](./docs/authoring-guide.md) |
| 自主增改大纲（Syllabus）后登记变更 | [docs/syllabus-changelog.md](./docs/syllabus-changelog.md) |
| 了解架构选型与媒体/部署约束 | [docs/adr/](./docs/adr/) |

## 2. 核心约定

### 代码与组件边界（详见 [docs/coding-standards.md](./docs/coding-standards.md)）
- **Islands 边界**：静态展示用 `.astro`，仅交互区域用 `.tsx`；2D 交互用 `client:visible`，3D WebGL 用 `client:only="react"` + `Lazy3DScene`。
- **高内聚与复用阈值**：单页专属演示组件放在 `src/content/kb/<topic-id>/` 下，文件名**必须以 `_` 开头**；仅当被 **≥ 2 个**知识点复用时才抽离至 `src/components/viz/`。
- **双主题适配**：交互组件与样式须兼容亮/暗模式（`.dark`），复用 `src/styles/global.css` 中的主题变量。

### 知识点与日常写入（详见 [docs/authoring-guide.md](./docs/authoring-guide.md)）
- **术语一致**：严格遵守 [GLOSSARY.md](./GLOSSARY.md)，严禁混用禁用词。
- **学习状态（`status`）**：新写入 Topic 默认设为 `"学习中"`，仅在用户明确要求时设为 `"已掌握"`。
- **大纲（Syllabus）自主变更与留痕**：Agent 可自主在 `src/data/syllabus/*.ts` 中增删或调整 `TopicStub`，但**每次修改后必须在 [docs/syllabus-changelog.md](./docs/syllabus-changelog.md) 追加变更记录**（时间、操作、Topic ID、原因）。
- **正文与媒体**：暂不强制固定正文结构模板；跨科/跨章节引用统一使用 `<TopicLink id="..." />`；重资产（音频/视频等）不直接提交进仓库，走 `/media` 或外链。

## 3. 验收标准（Verification Gate）

改动完成后须满足以下全部条件方可结束任务：

1. **全量构建通过**：执行 `npm run build`，退出码为 `0` 且无报错。
2. **引用与图谱合法**：新增或修改的 `prerequisites`、`related` 与 `<TopicLink id="..." />` 均指向已发布或已注册在 Syllabus 中的合法 Topic ID。
3. **大纲变更留痕**：若本次改动涉及 `src/data/syllabus/*.ts`，已同步更新 [docs/syllabus-changelog.md](./docs/syllabus-changelog.md)。

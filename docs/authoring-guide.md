# Agent Authoring Guide (内容增量写入规范)

本指南规定了如何以**高内聚、低耦合、可随时插拔**的方式向站点增量写入 **Topic（知识点）** 和 **Journal Entry（个人日常）**。

## 1. 写入或点亮一个知识点 (Topic)

1. 在 `src/data/syllabus/{408|math1|english1}.ts` 中找到目标 Topic ID（例如 `408/os/virtual-memory`），或按需新增/调整章节顺序。
2. 在 `src/content/kb/<topic-id>/` 下创建独立目录包：
   - `index.mdx`：知识点正文与 frontmatter 元数据。
   - `_DemoName.tsx`（可选）：仅本页使用的 2D/3D 交互演示组件（**必须以 `_` 开头**，避免被 Content Layer 当作独立页面扫描）。
   - 若某可视化能力被 ≥2 个知识点复用，再抽离至 `src/components/viz/`。
3. 编写 frontmatter（其中 `sources` 会默认渲染在页面右侧边栏的「参考源」区域，正文末尾无需重复罗列）：
   ```yaml
   ---
   title: "请求分页、页面置换算法 (LRU/Clock) 与抖动"
   summary: "一句话核心摘要"
   subject: "408"          # 408 | math1 | english1
   course: "os"            # ds | co | os | cn | calculus | linalg | prob | foundation | reading | writing
   status: "学习中"         # 未开始 | 学习中 | 已掌握
   updatedAt: 2026-11-22
   tags: ["408", "操作系统", "虚拟内存"]
   prerequisites: ["408/os/contiguous-and-paging"]
   related: ["408/co/cache-mapping", "408/co/virtual-memory-tlb"]
   sources:
     - title: "OSTEP"
       url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
   vizKind: "2d"           # none | 2d | 3d | both
   ---
   ```
4. **正文风格与跨科引用**：撰写正文请严格遵循 [writing-style.md](./writing-style.md)；在逻辑必然处引入 `<TopicLink id="408/co/cache-mapping" />`（避免在开篇或核心推导中插入打断注意力的括号外链），无论目标是否已写入（或是 Stub Topic），均会自动渲染并生成反向引用（Backlinks）。
5. **交互可视化规范**（实现细节见 [coding-standards.md](./coding-standards.md)）：
   - 2D 交互组件（`motion/react` + 自定义 SVG / Mafs）：用 `<InteractiveFigure>` + `<StepPlayer>` 包装，在 MDX 中按算法节拍**就地穿插**并使用 `client:visible={{ rootMargin: '250px' }}` 预水合。
   - 3D WebGL 组件（Three.js / R3F）：仅用于第三维确实承载结构信息的场景（如 Wallace 树多层压缩），用 `<InteractiveFigure>` + `<Lazy3DScene>` 包装，在 MDX 中使用 `client:only="react"`。
6. **拔除知识点**：直接删除 `src/content/kb/<topic-id>/` 文件夹，该节点会自动降级回 `Stub Topic`（待学占位节点），不会破坏任何引用它的页面。

## 2. 写入一篇个人日常 (Journal Entry)

在 `src/content/journal/YYYY-MM-DD-slug/index.mdx` 创建条目：
- 图片可直接放于同目录并通过相对路径引用；
- 音频/视频等重资产按 [ADR-0003](./adr/0003-self-hosted-static-deployment-and-media-separation.md) 存放于 `debian-cloud` 独立媒体路径（如 `/media/...`）或使用外链，通过 frontmatter `media` 字段或 HTML 标签嵌入。

## 3. 构建即验收 (Build-as-Verification)

每次新增或修改内容后，运行：
```bash
npm run build
```
该命令依次执行 `astro check`（TypeScript + Zod Schema 校验）→ `astro build`（静态页面、KaTeX 公式与图谱生成）→ `pagefind`（全文索引）。

# Coding Standards (项目代码规范)

本文档为 [AGENTS.md](../AGENTS.md) 的代码规范补充，仅记录需要人工/Agent 共同遵守的约束规则。

## 1. Astro Islands 与水合边界

- **静态优先**：布局、导航、静态内容优先使用 `.astro` 组件。
- **按需水合**：仅交互区域使用 `.tsx`：
  - 全局非首屏阻塞交互（如 `SearchCommand`）：使用 `client:idle`。
  - 2D 交互演示：使用 `client:visible={{ rootMargin: '250px' }}`（提前预水合防止快速滚动后点击滞后），并用 `InteractiveFigure`（按需搭配 `StepPlayer`）包装。
  - 3D WebGL 演示：使用 `client:only="react"`，并用 `Lazy3DScene` 包装，避免 SSR 阶段加载 WebGL 依赖。

## 2. 导入与类型约束

- 遵循 `astro/tsconfigs/strict`，禁止使用 `any` 或 `@ts-ignore` 绕过类型检查。
- 跨目录导入使用 `@/*` 别名，同目录伴生组件使用相对路径（如 `./_KmpDemo.tsx`）。

## 3. UI 组件库、样式与动效

- **shadcn/ui 原语优先**：按钮、徽章、卡片、弹窗、标签页、开关、提示等通用控件优先复用 `src/components/ui/` 及 `@/lib/utils` 中的 `cn()`；`.astro` 页面直接复用 `buttonVariants` / `badgeVariants`，避免手写不一致的裸控件。
- **晴空冰璃双主题体系**：复用 `src/styles/global.css` 中的 Tailwind v4 语义令牌（`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`bg-primary` 及三学科色 `--subject-408` / `--subject-math1` / `--subject-english1`）与 `.prose-editorial` 排版类；磨砂玻璃容器与聚光卡片复用 `.glass-surface` / `.spotlight-card`（配合 `data-spotlight`）。自定义 SVG、Canvas 或交互控件必须适配 `.dark`，禁止硬编码纯黑/纯白。
- **动效与版式约束**：统一使用 `--ease-out` 曲线并显式声明过渡属性，禁止滥用 `transition-all`；悬停位移与发光须通过 `@media (hover: hover) and (pointer: fine)` 隔离触屏，并尊重 `prefers-reduced-motion`；不在标题上方堆砌全大写模板眉标。

## 4. 组件内聚与抽离阈值

- 单页专属组件放在 `src/content/kb/<topic-id>/` 下，文件名**必须以 `_` 开头**（避免被 Content Layer 扫描为独立页面）。
- 仅当某可视化能力在 **≥ 2 个**知识点中复用时，才抽离到 `src/components/viz/` 或 `src/components/kb/`。

## 5. 2D 可视化、流程图与全屏交互规范

- **2D 动效与技术选型**：步进式寄存器/位移动画优先使用仓库内置的 `motion/react` + 自定义 SVG（并用 `<MotionConfig reducedMotion="user">` 包裹），不盲目引入 D3 或视频型渲染引擎；节点数 `< 10` 的固定或步进联动流程图优先采用响应式 HTML 卡片 + 箭头/SVG 连接，暂不引入重型图引擎；3D 仅在第三维确实承载结构信息（如 Wallace 树多层压缩）时启用。
- **水合与 ID 安全**：同一页面存在多个演示实例时，禁止将带冒号的 React `useId()` 直接用作 SVG `<marker id>` 或 `layoutId`（应改用纯字母数字的确定性实例前缀）；禁止在 `<AnimatePresence mode="popLayout">` 中混用普通非 `motion` 节点（如裸 `<span>`）。
- **响应式防截断**：交互图表容器内不得设置超过正文栏宽（`max-w-3xl`）的硬性 `min-w`，防止右侧可点击节点溢出裁切失效。
- **Portal 全屏放大**：`InteractiveFigure` 的全屏聚焦模式须通过 `createPortal(..., document.body)` 脱离 `page-content` 的 `view-transition-name` 层叠上下文，并使用实心语义背景（`bg-background`）与强模糊遮罩（`backdrop-blur-xl`），杜绝半透明 `bg-card` 导致底层正文透传重叠。

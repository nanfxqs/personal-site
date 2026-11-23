# 定点数的乘除运算可视化调研

部署地址未能连通，页面现状以本地 MDX 和组件为准。该版本有十进制竖式、二进制定点乘除步进和可点选的演进图，MDX 中没有挂载 3D 场景。推荐先用已有 Motion 改善步进演示，用 Mermaid CLI 生成固定算法流程图。若需要联动高亮，再试 React Flow。3D 优先用于 Wallace 树一类确实需要看清并行层级的内容。[知识点正文](../../src/content/kb/408/co/fixed-point-mul-div/index.mdx) · [项目依赖](../../package.json)

## 2D 步进演示

| 候选 | 适用场景 |
| --- | --- |
| Motion（已引入） | 保留 `InteractiveFigure` 和 `StepPlayer`。用 HTML 网格排竖式与寄存器，用 `layout` 或 `layoutId` 表达位移与共享高亮，用 SVG 标出进位和数据流。Booth 演示可按判断末两位、执行加减、算术右移三个阶段呈现，并始终显示实际位值。按图隔离共享动画 ID，尊重系统减少动态效果设置。[GitHub](https://github.com/motiondivision/motion) · [布局动画](https://motion.dev/docs/react-layout-animations) · [减少动态效果](https://motion.dev/docs/react-motion-config) |
| D3 | 适合需要比例尺、轴或数据驱动几何的图，例如输入位宽与迭代次数的对照。当前固定数量的位格和竖式可以直接用 React 表达。若未来引入 D3，优先按需使用计算模块，由 React 管理实际节点。[GitHub](https://github.com/d3/d3) |
| Motion Canvas | 适合有固定分镜、讲解节奏的代码化动画。可用于录制一段完整的 Booth 运算示范，逐步试算仍由页面的交互组件承担。[GitHub](https://github.com/motion-canvas/motion-canvas) |

## 3D 场景

复用仓库已有的 Three.js、React Three Fiber 和 Drei。现有 React 18 对应 Fiber 8。推荐用正交视角展示 Wallace 树的部分积如何按位权分列，并在同一压缩层并行归约。进入下一层时高亮参与运算的组，保留二维位矩阵供逐行核对。使用 `client:only="react"` 和 `Lazy3DScene`，场景静止时可用 `frameloop="demand"`。如需延后下载场景模块，使用动态导入，单纯延后挂载只控制渲染时机。[Fiber GitHub](https://github.com/pmndrs/react-three-fiber) · [Drei GitHub](https://github.com/pmndrs/drei) · [按需渲染](https://r3f.docs.pmnd.rs/advanced/scaling-performance) · [项目代码规范](../coding-standards.md)

## 流程图

### 选型结论

保留页面现有的可选中演进图。它用两条短路线分别串起乘法和除法的改进，选中节点后展示该阶段解决的问题与复杂度变化。新增的固定算法流程图可用 Mermaid 生成静态 SVG。若需要把当前步骤、分支和寄存器状态联动到图上，再评估 React Flow。等真实图出现回边交叉、标签拥挤或多端口对齐问题时，再评估 ELK 自动布局。依据：[现有演进图](../../src/content/kb/408/co/fixed-point-mul-div/_EvolutionFlowchart.tsx)、[知识点正文](../../src/content/kb/408/co/fixed-point-mul-div/index.mdx)。

| 候选 | GitHub 一手资料确认的能力 | 本页的适用场景与代价 |
| --- | --- | --- |
| Mermaid | 文本语法支持节点、带标签的连线、方向和子图。官方 CLI 可输出 SVG，运行时 `mermaid.render()` 则返回 SVG 和可选的事件绑定函数。默认 `strict` 禁用图内点击。 | 适合固定拓扑，例如展示 Booth 的判断、加减、右移和循环回边。静态 SVG 可直接由 Astro 展示，页面无需加载 Mermaid。若高亮要随演示步进同步，运行时渲染、事件和主题适配都会增加维护成本。保留 `strict`，把交互交给页面控件。来源：[流程图语法](https://github.com/mermaid-js/mermaid/blob/develop/docs/syntax/flowchart.md)、[渲染与安全配置](https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/docs/config/usage.md)、[Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) |
| React Flow（`@xyflow/react`） | React 渲染层接受节点、边和节点坐标，支持自定义节点与边、点击回调、焦点配置及缩放和平移。 | 适合图与现有演示共享步骤状态，例如随步进高亮除法中实际走过的余数分支。固定拓扑先设定稳定坐标，关闭拖动和连线编辑，保留键盘操作。需要额外维护画布尺寸、节点样式和小屏滚动行为。来源：[项目 README](https://github.com/xyflow/xyflow/blob/main/README.md)、[`ReactFlow` 实现](https://github.com/xyflow/xyflow/blob/main/packages/react/src/container/ReactFlow/index.tsx) |
| ELK（`elkjs`） | 布局引擎接受图结构和节点尺寸，异步返回布局结果，可通过 Web Worker 执行。ELK Layered 支持折线、正交和样条路由。 | 适合回边多、分支密集或节点尺寸变化明显的流程图。仍需 React Flow 或 SVG 渲染。只将 ELK 坐标传给 React Flow 时，边仍由 React Flow 绘制。若要保留 ELK 的正交转折，需要在自定义边中读取布局结果的 `sections`。固定图可预先算坐标，避免在每个演示步骤重排。来源：[elkjs README](https://github.com/kieler/elkjs/blob/master/README.md)、[ELK 算法结构](https://github.com/eclipse-elk/elk/blob/master/docs/content/documentation/algorithmdevelopers/algorithmimplementation/algorithmstructure.md) |

### Astro 接入与验证

- 静态图放在 Astro 展示层。若采用 Mermaid，生成 SVG 时核对中文标签、分支文字和亮暗主题。Mermaid 支持 `accTitle` 和 `accDescr`。通过 `<img>` 引入时另写适当的 `alt`，并在图旁保留简短的算法路径说明。来源：[Mermaid 无障碍文档](https://github.com/mermaid-js/mermaid/blob/develop/docs/config/accessibility.md)、[项目代码规范](../coding-standards.md)。
- 需要步进联动时，将图与步进控件放在同一个 `client:visible` React island，沿用 `InteractiveFigure`。用演示状态驱动节点和边的高亮，并用文字标明分支条件与当前步骤。预留画布高度，核对键盘选中、主题切换和窄屏页面滚动。来源：[Astro Islands](https://github.com/withastro/docs/blob/main/src/content/docs/en/concepts/islands.mdx)、[项目代码规范](../coding-standards.md)、[React Flow 实现](https://github.com/xyflow/xyflow/blob/main/packages/react/src/container/ReactFlow/index.tsx)。
- 比较布局时，用 Booth 的判断及循环回边、原码加减交替除法的余数正负分支及末步恢复作为样图。检查分支标签是否可读、回边是否穿过节点、逐步高亮时位置是否稳定。若考虑 ELK，先用同一张图对比固定坐标和自动布局，再决定是否引入依赖。样图依据：[知识点正文](../../src/content/kb/408/co/fixed-point-mul-div/index.mdx)。

以上是基于上游文档、源码和页面现状的选型判断。实际渲染效果与包体积留待候选方案进入原型时验证。

# Obsidian 图谱渲染与动效调研

## 当前分支补查

`/graph` 已经使用 `force-graph` 与自定义 Canvas 绘制。筛选会重建节点和初始坐标，随后调用 `zoomToFit(0, 48)`，因此幸存节点的位置和相机可能突变。悬停和选中使用离散透明度，一次重绘就切换到目标样式。默认视图的标签由缩放阈值控制，进入可见区间后随缩放渐变。缩放按钮已经有相机插值，可作为筛选后相机过渡的基础。这些是源码层面可确认的行为。帧率瓶颈仍需浏览器实测。[图谱组件](../../src/components/kb/KnowledgeGraph.tsx#L39) · [页面入口](../../src/pages/graph.astro) · [force-graph API](https://github.com/vasturiano/force-graph#api-reference)

- **低成本基线**｜保留 Canvas，先复用筛选前仍存在节点的坐标，保留用户当前视口，给节点、边和标签透明度做短过渡。静止时继续暂停重绘，过渡期间按需唤醒。分别观察筛选、拖拽释放和缩放时的画面连续性，再测帧时间。[图谱组件](../../src/components/kb/KnowledgeGraph.tsx#L116) · [force-graph API](https://github.com/vasturiano/force-graph#api-reference)
- **首选替换候选**｜用 PixiJS 绘制，沿用 D3 力模型。适合自定义节点、边、标签图层和过渡。接入时要为现有的拖拽、节点命中、高亮、相机、主题与减少动态效果设置重新接线。[PixiJS](https://github.com/pixijs/pixijs) · [d3-force](https://github.com/d3/d3-force)
- **WebGL 对照组**｜Sigma.js + Graphology 更适合以图数据、视口和标签为中心的渲染方案，布局可独立选型。若要保留当前的学科锚点和碰撞参数，可先沿用 D3 计算坐标，再验证拖拽期间更新坐标的成本。[Sigma.js](https://github.com/jacomyal/sigma.js) · [Graphology](https://github.com/graphology/graphology)

> **调研范围**：Obsidian 内置 Graph View，以及本站知识库图谱的三种候选方案。资料核验于 2026 年 11 月 22 日，依据产品官方文档、版本记录、开发者发言和上游源码。

---

## 一、Obsidian 公开确认的行为与实现

| 维度 | 已确认事实 | 一手来源 |
| :--- | :--- | :--- |
| 渲染库 | Obsidian 开发者 joethei 在 2022 年说明 PixiJS 负责绘制，其余实现为自研，并提到早期用过 D3。2026 年 10 月 22 日的 Desktop 1.15.0 提前体验版更新记录进一步确认，首次打开图谱时才加载全局 `PIXI`。 | [官方论坛开发者回复](https://forum.obsidian.md/t/understanding-the-graph-view-core/41020)、[官方人员名单](https://obsidian.md/help/credits)、[Desktop 1.15.0 更新记录](https://obsidian.md/changelog/2026-10-22-desktop-v1.15.0/) |
| 力导向布局 | 可调整向心力、节点斥力、连线拉力和连线距离。 | [Graph View 帮助：Forces](https://obsidian.md/help/plugins/graph#Forces) |
| 图形与交互 | 圆点代表笔记，连线代表内部链接。被引用越多的笔记节点越大。悬停高亮相连关系，点击打开笔记，可缩放和平移。官方还记录了文字淡出阈值、节点大小和线宽设置。局部图谱围绕当前笔记展开，深度可调。 | [Graph View 帮助](https://obsidian.md/help/plugins/graph) |
| 时间推移动画 | `Animate` 按创建时间逐步展示笔记和附件。Desktop 0.12.13 更新记录明确说明，播放从空图开始，逐步加入节点。 | [Graph View 帮助：Time-lapse](https://obsidian.md/help/plugins/graph#Start+a+time-lapse+animation)、[Desktop 0.12.13 更新记录](https://obsidian.md/changelog/2021-08-03-desktop-v0.12.13/) |

### 1.1 公开资料尚未确认的实现细节

上述一手资料能确认 PixiJS 与图谱渲染的关系。当前打包的 PixiJS 版本、各平台选用的图形后端及回退条件、图元批处理和命中检测方式均未由这些资料确认。早期 D3 的说法属于历史说明，涵盖哪些子模块也未细分。力的公式、积分器、初始坐标、阻尼与停止策略、Worker 分工，以及拖拽释放、标签淡出或视口过渡的具体时长与曲线，同样缺少可核对的官方规格。时间推移的创建顺序有文档依据，播放节奏和节点入场曲线仍未确认。([开发者回复](https://forum.obsidian.md/t/understanding-the-graph-view-core/41020)、[Desktop 1.15.0 更新记录](https://obsidian.md/changelog/2026-10-22-desktop-v1.15.0/)、[Graph View 帮助](https://obsidian.md/help/plugins/graph))

---

## 二、候选库对比

| 方案 | 渲染与接入 | 布局与动效控制 | 对本站图谱的取舍 |
| :--- | :--- | :--- | :--- |
| `react-force-graph-2d` | React 封装直接调用 `force-graph`，使用 Canvas 2D。可用 `nodeCanvasObject`、`linkCanvasObject` 自定义绘制，提供节点悬停、点击、拖拽和平移缩放交互。 | 底层依赖 `d3-force-3d`，此组件运行二维模拟。`d3Force` 可调整或添加力，`d3VelocityDecay`、`cooldownTicks`、`cooldownTime` 控制衰减与停止，`d3ReheatSimulation()` 可重新激活模拟。`centerAt`、`zoom` 和 `zoomToFit` 接受过渡时长。 | 与 React 图谱的组件接口直接对应。本站当前清单已列出底层 `force-graph`，其 Canvas 与力模拟 API 可直接使用。([本站依赖清单](../../package.json)、[React 封装源码](https://github.com/vasturiano/react-force-graph/blob/master/src/packages/react-force-graph-2d/index.js)、[React API](https://github.com/vasturiano/react-force-graph#api-reference)、[底层依赖清单](https://github.com/vasturiano/force-graph/blob/master/package.json)、[底层 API](https://github.com/vasturiano/force-graph#api-reference)) |
| Sigma.js | 使用 WebGL 渲染，输入为带 `x`、`y` 坐标的 Graphology 图。渲染架构细节随版本变化，本表依据 v4 文档。 | 响应 Graphology 数据更新和相机操作。力导向坐标可交给独立的 `graphology-layout-forceatlas2` 计算，后者提供同步计算和 Worker 接口。拖拽联动以及布局何时启动、停止由应用接线。 | 适合将 WebGL 绘制与布局算法独立选型的场景。接入需适配 Graphology 数据模型，并编排布局与交互。([Sigma 渲染](https://www.sigmajs.org/concepts/rendering/)、[快速入门](https://www.sigmajs.org/docs/)、[生命周期](https://www.sigmajs.org/concepts/lifecycle/)、[Graphology ForceAtlas2](https://graphology.github.io/standard-library/layout-forceatlas2.html)) |
| AntV G6 5.x | 默认 Canvas，支持配置 SVG 或 WebGL renderer。通过 Graph 实例配置布局、元素与交互行为。 | `d3-force` 布局支持可调的向心、斥力和连线参数，以及实时迭代。`drag-element-force` 提供与布局联动的拖拽。元素入场、更新和退出还可用独立动画配置。 | 适合需要统一管理多种图布局、交互行为和元素动画的场景。单一知识图谱也需要配置 Graph 实例、布局与 behaviors。([G6 渲染器](https://g6.antv.antgroup.com/en/manual/further-reading/renderer)、[D3 Force 布局](https://g6.antv.antgroup.com/en/manual/layout/d3-force-layout)、[内置扩展](https://g6.antv.antgroup.com/en/manual/graph/extensions)、[元素动画](https://g6.antv.antgroup.com/en/manual/animation/animation)) |

## 三、本站 Canvas 接入的依据

从已公开的行为推导，本站采用 `force-graph` 即可覆盖 Canvas 绘制、节点交互、力模拟和视口过渡。`autoPauseRedraw` 默认会在模拟停止时跳过持续重绘，若标签或高亮需要在此时继续渐变，应验证该效果如何触发后续帧。悬停高亮可用节点悬停回调配合绘制样式实现。时间推移需要按内容创建时间编排节点和连线的更新，与模拟本身的冷却分别控制。这里的取舍依据是 API 和接入成本，实际布局稳定性与渲染吞吐量仍需用本站图数据验证。([`force-graph` API](https://github.com/vasturiano/force-graph#api-reference)、[Obsidian Graph View 帮助](https://obsidian.md/help/plugins/graph))

### 3.1 社区二维图谱实例

- **Quartz v5** 的默认图谱插件支持局部与全局视图，用 D3 在 CPU 上计算布局，再由 PixiJS 绘制。拖拽时提高 `alphaTarget` 并重启模拟，用 `fx`、`fy` 固定拖拽节点。松手后清除固定坐标，将 `alphaTarget` 归零，让布局继续冷却。([Quartz v5 文档](https://github.com/jackyzha0/quartz/blob/v5/docs/features/graph%20view.md)、[图谱插件源码](https://github.com/quartz-community/graph/blob/main/src/components/scripts/graph.inline.ts)、[D3 模拟 API](https://d3js.org/d3-force/simulation))
- **Obsidian 社区插件**展示了两种接入方式。Extended Graph 在内置图谱上增加节点固定、标签或属性筛选和节点形状。Juggl 用 Cytoscape.js 提供独立的局部图谱，支持按需展开邻域并自定义节点样式。([Extended Graph](https://github.com/ElsaTam/obsidian-extended-graph#extended-graph)、[Juggl](https://github.com/HEmile/juggl))
- **PixiJS + D3 与 Cosmograph** 的主要区别在于力模拟在哪里执行。Quartz 式组合可通过 D3 注册自定义力，并由应用控制模拟与绘制之间的联动。Cosmograph 的底层引擎 `cosmos.gl` 将力模拟和绘制都放到 WebGL GPU 管线，提供内置力参数及位置、颜色和尺寸等属性的过渡。前者便于逐项定制力和交互，后者可作为大规模图谱的候选，实际收益需在目标设备上测量。([D3 自定义力](https://d3js.org/d3-force/simulation#custom-forces)、[Cosmograph 接入文档](https://cosmograph.app/docs-lib/)、[`cosmos.gl` 引擎与配置](https://github.com/cosmosgl/graph#readme))

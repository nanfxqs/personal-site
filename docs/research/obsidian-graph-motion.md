# Obsidian 图谱渲染与动效调研

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

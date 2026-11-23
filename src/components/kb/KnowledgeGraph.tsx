import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { forceCollide, forceX, forceY } from 'd3-force';
import type ForceGraph from 'force-graph';
import { animate } from 'motion';
import { ArrowUpRight, Maximize, Minus, PanelRight, Plus, X } from 'lucide-react';
import type { GraphEdge, GraphNode } from '@/lib/kb-graph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SUBJECT_META = {
  '408': { label: '408 计算机基础', color: '#0284c7' },
  math1: { label: '数学一', color: '#0d9488' },
  english1: { label: '英语一', color: '#d97706' },
};

const FILTERS = ['all', '408', 'math1', 'english1'] as const;
const VIEW_CONTROLS = [
  { label: '缩小', icon: Minus, factor: 0.8 },
  { label: '放大', icon: Plus, factor: 1.25 },
  { label: '适配视图', icon: Maximize, factor: null },
];
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 5;
const HIGHLIGHT_DURATION = 0.15;
const FLOAT_PERIOD_MS = 5200;
const FLOAT_RADIUS_PX = 3;

type SubjectFilter = typeof FILTERS[number];
type CanvasNode = GraphNode & {
  x: number; y: number; anchorX: number; anchorY: number; floatPhase: number; degree: number;
};
type CanvasLink = { source: CanvasNode; target: CanvasNode; kind: GraphEdge['kind'] };
type Graph = ForceGraph<CanvasNode, CanvasLink>;
type Camera = { x: number; y: number; scale: number };

function nodeRadius(node: CanvasNode) {
  return 3.5 + Math.min(5, 1.6 * Math.sqrt(node.degree));
}

function seedGraphNodes(nodes: GraphNode[], edges: GraphEdge[]) {
  const degrees = new Map<string, number>();
  for (const { source, target } of edges) {
    degrees.set(source, (degrees.get(source) ?? 0) + 1);
    degrees.set(target, (degrees.get(target) ?? 0) + 1);
  }
  const subjects = Array.from(new Set(nodes.map((node) => node.subjectId)));
  const coursesBySubject = new Map(subjects.map((subject) => [
    subject, Array.from(new Set(nodes.filter((node) => node.subjectId === subject).map((node) => node.courseId))),
  ]));
  const byId = new Map<string, CanvasNode>();
  nodes.forEach((node, index) => {
    const angle = 2 * Math.PI * subjects.indexOf(node.subjectId) / subjects.length - Math.PI / 2;
    const distance = subjects.length > 1 ? 72 : 0;
    const courses = coursesBySubject.get(node.subjectId)!;
    const courseAngle = angle + 2 * Math.PI * courses.indexOf(node.courseId) / courses.length;
    const courseDistance = courses.length > 1 ? 32 : 0;
    const anchorX = Math.cos(angle) * distance + Math.cos(courseAngle) * courseDistance;
    const anchorY = Math.sin(angle) * distance + Math.sin(courseAngle) * courseDistance;
    const spiral = index * Math.PI * (3 - Math.sqrt(5));
    const radius = Math.sqrt(index) * 7;
    byId.set(node.id, {
      ...node, anchorX, anchorY, floatPhase: spiral, degree: degrees.get(node.id) ?? 0,
      x: anchorX + Math.cos(spiral) * radius,
      y: anchorY + Math.sin(spiral) * radius,
    });
  });
  return byId;
}

export function KnowledgeGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [onlyConnected, setOnlyConnected] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rendererFailed, setRendererFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const selectionRef = useRef('');
  const cameraAnimation = useRef<{ stop: () => void }>();
  const savedPositions = useRef(new Map<string, Pick<CanvasNode, 'x' | 'y'>>());
  const seeds = useMemo(() => seedGraphNodes(nodes, edges), [nodes, edges]);

  const filtered = useMemo(() => {
    const candidates = nodes.filter((node) => subjectFilter === 'all' || node.subjectId === subjectFilter);
    const ids = new Set(candidates.map((node) => node.id));
    const visibleEdges = edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
    const connected = new Set(visibleEdges.flatMap(({ source, target }) => [source, target]));
    const visibleNodes = onlyConnected ? candidates.filter((node) => connected.has(node.id)) : candidates;
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [nodes, edges, subjectFilter, onlyConnected]);
  const selectedNode = filtered.nodes.find((node) => node.id === selectedId);
  const selectedNeighbors = useMemo(() => {
    const ids = new Set<string>();
    for (const { source, target } of filtered.edges) {
      if (source === selectedId) ids.add(target);
      if (target === selectedId) ids.add(source);
    }
    return filtered.nodes.filter((node) => ids.has(node.id));
  }, [filtered, selectedId]);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let disposed = false;
    let instance: Graph | undefined;
    let observer: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverPreference = window.matchMedia('(hover: hover) and (pointer: fine)');
    let hoveredId = '';
    let activeId = '';
    let neighbors = new Set<string>();
    let text = '';
    let muted = '';
    let labelOutline = '';
    let accent = '';
    let focusAnimation: { stop: () => void } | undefined;

    import('force-graph').then(({ default: ForceGraphRenderer }) => {
      if (disposed) return;
      const renderer = new ForceGraphRenderer<CanvasNode, CanvasLink>(host);
      instance = renderer;
      const refresh = () => renderer.autoPauseRedraw(false);
      let progress = 1;
      let renderedNodes: CanvasNode[] | undefined;
      let canvasVisible = false;
      const offsets = new Map<CanvasNode, { x: number; y: number }>();
      const labels: { title: string; x: number; y: number; opacity: number; priority: number }[] = [];
      let dragging: CanvasNode | undefined;
      let emphasis = (id: string) => Number(id === activeId);
      let labelEmphasis = (id: string) => Number(id === activeId || neighbors.has(id));
      let visibility = (id: string) => Number(!activeId || id === activeId || neighbors.has(id));
      let edgeEmphasis = (link: CanvasLink) =>
        Number(link.source.id === activeId || link.target.id === activeId);
      let dimming = () => Number(Boolean(activeId));
      const readTheme = () => {
        const style = getComputedStyle(host);
        text = style.getPropertyValue('--text').trim();
        muted = style.getPropertyValue('--text-muted').trim();
        labelOutline = style.getPropertyValue('--background').trim();
        accent = style.getPropertyValue('--primary').trim();
        refresh();
      };
      renderer
        .minZoom(MIN_ZOOM).maxZoom(MAX_ZOOM)
        .nodeVal((node) => (nodeRadius(node) / 4) ** 2)
        .nodeLabel('').linkLabel('').linkHoverPrecision(0)
        .d3VelocityDecay(0.43).d3AlphaDecay(0.045).d3AlphaMin(0.015)
        .d3Force('center', null)
        .d3Force('cluster-x', forceX<CanvasNode>((node) => node.anchorX).strength(0.045))
        .d3Force('cluster-y', forceY<CanvasNode>((node) => node.anchorY).strength(0.045))
        .d3Force('collision', forceCollide<CanvasNode>((node) => nodeRadius(node) + 4))
        .onRenderFramePre(() => {
          const { nodes: visibleNodes, links } = renderer.graphData();
          const dataChanged = renderedNodes !== visibleNodes;
          offsets.clear();
          labels.length = 0;
          if (canvasVisible && !motionPreference.matches) {
            const phase = performance.now() * 2 * Math.PI / FLOAT_PERIOD_MS;
            visibleNodes.forEach((node) => {
              if (node === dragging) return;
              const angle = phase + node.floatPhase;
              offsets.set(node, { x: Math.cos(angle) * FLOAT_RADIUS_PX, y: Math.sin(angle) * FLOAT_RADIUS_PX });
            });
          }
          if (dataChanged) hoveredId = '';
          renderedNodes = visibleNodes;
          const requested = dragging?.id || selectionRef.current || hoveredId;
          if (!dataChanged && requested === activeId) return;
          const next = requested && visibleNodes.some((node) => node.id === requested) ? requested : '';
          if (next === activeId && !next) return;
          focusAnimation?.stop();
          const previousEmphasis = new Map(visibleNodes.map(({ id }) => [id, emphasis(id)]));
          const previousLabels = new Map(visibleNodes.map(({ id }) => [id, labelEmphasis(id)]));
          const previousVisibility = new Map(visibleNodes.map(({ id }) => [id, visibility(id)]));
          const previousEdges = new Map(links.map((link) => [link, edgeEmphasis(link)]));
          const previousDimming = dimming();
          activeId = next;
          neighbors = new Set();
          for (const { source, target } of links) {
            if (source.id === activeId) neighbors.add(target.id);
            if (target.id === activeId) neighbors.add(source.id);
          }
          const blend = (from: number, to: number) => from + (to - from) * progress;
          emphasis = (id) => blend(previousEmphasis.get(id) ?? 0, Number(id === activeId));
          labelEmphasis = (id) => blend(previousLabels.get(id) ?? 0, Number(id === activeId || neighbors.has(id)));
          visibility = (id) => blend(previousVisibility.get(id) ?? 1,
            Number(!activeId || id === activeId || neighbors.has(id)));
          edgeEmphasis = (link) => blend(previousEdges.get(link) ?? 0,
            Number(link.source.id === activeId || link.target.id === activeId));
          dimming = () => blend(previousDimming, Number(Boolean(activeId)));
          progress = motionPreference.matches ? 1 : 0;
          if (!motionPreference.matches) {
            focusAnimation = animate(0, 1, {
              duration: HIGHLIGHT_DURATION,
              ease: [0.23, 1, 0.32, 1],
              onUpdate(value) {
                progress = value;
                refresh();
              },
            });
          }
        })
        .onRenderFramePost((context, scale) => {
          context.save();
          context.font = `${12 / scale}px system-ui, sans-serif`;
          context.textAlign = 'center';
          const occupied: { left: number; right: number; top: number; bottom: number }[] = [];
          for (const label of labels.sort((first, second) => second.priority - first.priority)) {
            const halfWidth = context.measureText(label.title).width / 2 + 3 / scale;
            const bounds = { left: label.x - halfWidth, right: label.x + halfWidth,
              top: label.y - 12 / scale, bottom: label.y + 3 / scale };
            if (label.priority < 100 && occupied.some((other) =>
              bounds.left < other.right && bounds.right > other.left
              && bounds.top < other.bottom && bounds.bottom > other.top)) continue;
            occupied.push(bounds);
            context.globalAlpha = label.opacity;
            if (labelOutline) {
              context.strokeStyle = labelOutline;
              context.lineWidth = 3 / scale;
              context.lineJoin = 'round';
              context.strokeText(label.title, label.x, label.y);
            }
            context.fillStyle = text;
            context.fillText(label.title, label.x, label.y);
          }
          context.restore();
          if (renderer.autoPauseRedraw() !== (motionPreference.matches || !canvasVisible)) {
            renderer.autoPauseRedraw(motionPreference.matches || !canvasVisible);
          }
        })
        .nodeCanvasObject((node, context, scale) => {
          const focused = node.id === activeId;
          const focusOpacity = emphasis(node.id);
          const radius = nodeRadius(node);
          const offset = offsets.get(node);
          const x = node.x + (offset?.x ?? 0) / scale;
          const y = node.y + (offset?.y ?? 0) / scale;
          context.save();
          const nodeOpacity = 0.42 + 0.58 * visibility(node.id);
          context.globalAlpha = nodeOpacity * (1 - focusOpacity);
          context.fillStyle = SUBJECT_META[node.subjectId].color;
          context.strokeStyle = context.fillStyle;
          context.lineWidth = 1.4 / scale;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.globalAlpha *= node.isPublished ? 1 : 0.22;
          context.fill();
          if (!node.isPublished) {
            context.globalAlpha = nodeOpacity * (1 - focusOpacity);
            context.stroke();
          }
          if (focusOpacity > 0) {
            context.fillStyle = accent;
            context.globalAlpha = focusOpacity * (node.isPublished ? 1 : 0.6);
            context.fill();
            if (!node.isPublished) {
              context.strokeStyle = accent;
              context.globalAlpha = focusOpacity;
              context.stroke();
            }
          }
          const zoomOpacity = Math.max(0, Math.min(1, (scale - 0.65) / 0.9));
          const relatedOpacity = labelEmphasis(node.id);
          const contextOpacity = zoomOpacity * (0.82 - 0.36 * dimming());
          const labelOpacity = Math.max(relatedOpacity, contextOpacity);
          if (labelOpacity > 0) {
            const title = focused || relatedOpacity > 0 || node.title.length <= 12
              ? node.title : `${node.title.slice(0, 12)}…`;
            const priority = focused ? 200 : relatedOpacity > contextOpacity ? 100 : Math.min(99, node.degree);
            labels.push({ title, x, y: y + radius + 15 / scale, opacity: labelOpacity, priority });
          }
          context.restore();
        })
        .nodePointerAreaPaint((node, color, context, scale) => {
          context.fillStyle = color;
          context.beginPath();
          const offset = offsets.get(node);
          context.arc(node.x + (offset?.x ?? 0) / scale, node.y + (offset?.y ?? 0) / scale,
            Math.max(nodeRadius(node) + 2, 8 / scale), 0, Math.PI * 2);
          context.fill();
        })
        .linkCanvasObjectMode(() => 'replace')
        .linkCanvasObject((link, context, scale) => {
          const { source, target, kind } = link;
          const focusOpacity = edgeEmphasis(link);
          context.save();
          const sourceOffset = offsets.get(source);
          const targetOffset = offsets.get(target);
          const sourceX = source.x + (sourceOffset?.x ?? 0) / scale;
          const sourceY = source.y + (sourceOffset?.y ?? 0) / scale;
          const targetX = target.x + (targetOffset?.x ?? 0) / scale;
          const targetY = target.y + (targetOffset?.y ?? 0) / scale;
          const distance = Math.hypot(targetX - sourceX, targetY - sourceY);
          const sourceRadius = nodeRadius(source) + (source.isPublished ? 0 : 0.4 / scale);
          const targetRadius = nodeRadius(target) + (target.isPublished ? 0 : 0.4 / scale);
          const length = distance - sourceRadius - targetRadius;
          if (length <= 0) {
            context.restore();
            return;
          }
          const directionX = (targetX - sourceX) / distance;
          const directionY = (targetY - sourceY) / distance;
          if (kind === 'related') {
            const gap = 3 / scale;
            const gaps = Math.floor(length * scale / 8);
            context.setLineDash([(length - gap * gaps) / (gaps + 1), gap]);
          }
          context.beginPath();
          context.moveTo(sourceX + directionX * sourceRadius, sourceY + directionY * sourceRadius);
          context.lineTo(targetX - directionX * targetRadius, targetY - directionY * targetRadius);
          context.strokeStyle = muted;
          context.globalAlpha = (0.46 - 0.24 * dimming()) * (1 - focusOpacity);
          context.lineWidth = 0.85 / scale;
          context.stroke();
          if (focusOpacity > 0) {
            context.strokeStyle = accent;
            context.globalAlpha = 0.9 * focusOpacity;
            context.lineWidth = 1.4 / scale;
            context.stroke();
          }
          context.restore();
        })
        .onNodeHover((node) => {
          hoveredId = hoverPreference.matches ? node?.id ?? '' : '';
          refresh();
        })
        .onNodeDrag((node) => { dragging = node; })
        .onNodeDragEnd(() => { dragging = undefined; })
        .onNodeClick((node) => setSelectedId(node.id))
        .onBackgroundClick(() => {
          hoveredId = '';
          setSelectedId('');
          refresh();
        });

      renderer.d3Force('charge')?.strength(-36);
      renderer.d3Force('link')?.distance(38).strength(0.62);
      const syncMotion = () => {
        renderer
          .warmupTicks(motionPreference.matches ? 130 : 32)
          .cooldownTicks(motionPreference.matches ? 0 : Infinity);
        if (motionPreference.matches) {
          focusAnimation?.stop();
          progress = 1;
        }
        refresh();
      };
      const resize = () => renderer.width(host.clientWidth).height(host.clientHeight);
      syncMotion();
      readTheme();
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(host);
      visibilityObserver = new IntersectionObserver(([entry]) => {
        canvasVisible = entry.isIntersecting;
        refresh();
      });
      visibilityObserver.observe(host);
      themeObserver = new MutationObserver(readTheme);
      themeObserver.observe(document.documentElement, { attributeFilter: ['class'] });
      motionPreference.addEventListener('change', syncMotion);
      cleanMotion = () => {
        motionPreference.removeEventListener('change', syncMotion);
        focusAnimation?.stop();
      };
      setGraph(() => renderer);
    }).catch(() => {
      if (!disposed) setRendererFailed(true);
    });

    let cleanMotion: (() => void) | undefined;
    return () => {
      disposed = true;
      observer?.disconnect();
      themeObserver?.disconnect();
      visibilityObserver?.disconnect();
      cleanMotion?.();
      cameraAnimation.current?.stop();
      instance?._destructor();
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!graph) return;
    const firstDraw = graph.graphData().nodes.length === 0 && savedPositions.current.size === 0;
    for (const { id, x, y } of graph.graphData().nodes) {
      savedPositions.current.set(id, { x, y });
    }
    const visible = new Map(filtered.nodes.map(({ id }) =>
      [id, { ...seeds.get(id)!, ...savedPositions.current.get(id) }]));
    graph.graphData({
      nodes: Array.from(visible.values()),
      links: filtered.edges.map(({ source, target, kind }) => ({
        source: visible.get(source)!,
        target: visible.get(target)!,
        kind,
      })),
    });
    if (!firstDraw || !visible.size) return;
    const frame = requestAnimationFrame(() => graph.zoomToFit(0, 48));
    return () => cancelAnimationFrame(frame);
  }, [filtered, graph, seeds]);

  useEffect(() => {
    selectionRef.current = selectedId;
    graph?.autoPauseRedraw(false);
  }, [graph, selectedId]);

  function moveCamera(target: Camera, immediate = false) {
    if (!graph) return;
    cameraAnimation.current?.stop();
    const start = { ...graph.centerAt(), scale: graph.zoom() };
    const update = (progress: number) => {
      graph.centerAt(
        start.x + (target.x - start.x) * progress,
        start.y + (target.y - start.y) * progress,
      );
      graph.zoom(start.scale + (target.scale - start.scale) * progress);
    };
    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) update(1);
    else cameraAnimation.current = animate(0, 1, {
      duration: 0.24, ease: [0.23, 1, 0.32, 1], onUpdate: update,
    });
  }

  function adjustView(factor: number | null, immediate = false) {
    if (!graph) return;
    if (factor !== null) {
      moveCamera({ ...graph.centerAt(), scale: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, graph.zoom() * factor)) }, immediate);
      return;
    }
    const bounds = graph.getGraphBbox();
    if (!bounds) return;
    const { x: [left, right], y: [top, bottom] } = bounds;
    moveCamera({
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      scale: Math.max(MIN_ZOOM, Math.min(2, (graph.width() - 96) / (right - left), (graph.height() - 96) / (bottom - top))),
    }, immediate);
  }

  function selectNode(id: string, immediate = false) {
    setSelectedId(id);
    const node = graph?.graphData().nodes.find((candidate) => candidate.id === id);
    if (graph && node) moveCamera({ x: node.x, y: node.y, scale: graph.zoom() }, immediate);
  }

  function handleCanvasKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') setSelectedId('');
    if (!graph) return;
    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      adjustView(event.key === '0' ? null : event.key === '-' ? 0.8 : 1.25, true);
      return;
    }
    const offsets = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (!Object.hasOwn(offsets, event.key)) return;
    event.preventDefault();
    const [horizontal, vertical] = offsets[event.key as keyof typeof offsets];
    const center = graph.centerAt();
    const scale = graph.zoom();
    moveCamera({ x: center.x + horizontal * 40 / scale, y: center.y + vertical * 40 / scale, scale }, true);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <header className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-editorial text-2xl font-semibold text-[var(--text)] sm:text-3xl">知识图谱</h1>
        <Tabs className="min-w-0 max-w-full" value={subjectFilter} onValueChange={(value) => {
          setSubjectFilter(value as SubjectFilter);
          setSelectedId('');
        }}>
          <TabsList aria-label="学科筛选" className="h-auto max-w-full flex-wrap justify-start">
            {FILTERS.map((key) => (
              <TabsTrigger key={key} value={key}>{key === 'all' ? '全部学科' : SUBJECT_META[key].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>
      <div className={`relative grid grid-cols-[minmax(0,1fr)] gap-3 ${sidebarOpen ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : ''}`}>
        <Card className="relative min-w-0 overflow-hidden">
          <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-xl border border-border bg-background/90 p-1 shadow-sm">
            {VIEW_CONTROLS.map(({ label, icon: Icon, factor }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label={label}
                    disabled={!graph || !filtered.nodes.length} onClick={(event) => adjustView(factor, event.detail === 0)}>
                    <Icon className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
            <Button type="button" variant="ghost" size="icon" className="size-11 sm:size-9"
              aria-label={sidebarOpen ? '收起图谱侧栏' : '展开图谱侧栏'}
              aria-expanded={sidebarOpen} aria-controls="graph-sidebar"
              title={sidebarOpen ? '收起图谱侧栏' : '展开图谱侧栏'}
              onClick={() => setSidebarOpen((open) => !open)}>
              <PanelRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div ref={container} role="group" tabIndex={0} aria-label="知识图谱画布"
            onKeyDown={handleCanvasKey}
            onPointerDownCapture={() => cameraAnimation.current?.stop()}
            onWheelCapture={() => cameraAnimation.current?.stop()}
            className="h-[max(420px,calc(100dvh-10rem))] w-full touch-none overflow-hidden sm:h-[max(480px,calc(100dvh-8rem))]" />
          {(rendererFailed || !filtered.nodes.length) && (
            <p role="status" className="pointer-events-none absolute inset-0 grid place-items-center px-8 text-center text-sm text-muted-foreground">
              {rendererFailed ? '无法加载图谱画布。展开侧栏可通过知识点列表查看关联。' : '当前筛选下没有节点。展开侧栏调整筛选。'}
            </p>
          )}
          <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/90 px-2 py-1 text-xs tabular-nums text-muted-foreground">
            {filtered.nodes.length} 个节点 · {filtered.edges.length} 条关联
          </p>
        </Card>

        <aside id="graph-sidebar" aria-label="图谱筛选与节点详情" hidden={!sidebarOpen}
          className="absolute inset-y-0 right-0 z-20 w-[min(300px,100%)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background shadow-lg lg:relative lg:z-auto lg:max-h-[max(480px,calc(100dvh-8rem))] lg:w-auto lg:min-w-0 lg:shadow-none">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">筛选与详情</CardTitle>
              <Button type="button" variant="ghost" size="icon" className="size-11 lg:hidden"
                aria-label="关闭图谱侧栏" onClick={() => {
                  setSidebarOpen(false);
                  container.current?.focus();
                }}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
              <Switch checked={onlyConnected} onCheckedChange={(checked) => {
                setOnlyConnected(checked);
                setSelectedId('');
              }} />
              仅显示有可见关联的节点
            </label>
              <label className="grid gap-1.5 text-xs text-muted-foreground">
                定位知识点
                <select value={selectedNode?.id ?? ''} onChange={(event) => selectNode(event.target.value, true)}
                  disabled={!filtered.nodes.length}
                  className="w-full min-w-0 rounded-md border border-border bg-background px-2 py-2 text-foreground">
                  <option value="">选择知识点</option>
                  {filtered.nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
                </select>
              </label>
            </CardHeader>
            {selectedNode ? (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{selectedNode.courseShortTitle}</Badge>
                    <Badge variant={selectedNode.status === '已掌握' ? 'success' : selectedNode.status === '学习中' ? 'warning' : 'muted'}>
                      {selectedNode.status}
                    </Badge>
                  </div>
                  <CardTitle>{selectedNode.title}</CardTitle>
                </div>
                <Button asChild className="w-full">
                  <a href={selectedNode.href}>
                    {selectedNode.isPublished ? '阅读该知识点' : '查看待学占位节点'}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </Button>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  关联节点 <Badge variant="outline">{selectedNeighbors.length}</Badge>
                </div>
                {selectedNeighbors.length ? (
                  <ul className="space-y-1.5">
                    {selectedNeighbors.map((neighbor) => (
                      <li key={neighbor.id}>
                        <Button type="button" variant="outline" size="sm" className="w-full justify-between"
                          onClick={(event) => selectNode(neighbor.id, event.detail === 0)}>
                          <span className="truncate">{neighbor.title}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{neighbor.courseShortTitle}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">暂无显式关联节点。</p>}
              </CardContent>
            ) : (
              <CardContent className="space-y-3">
                <CardDescription>拖动空白处平移，滚轮或双指缩放。拖动节点可重新排列，点击节点查看关联。实心为已写入，空心为待学。</CardDescription>
                <Separator />
                {Object.values(SUBJECT_META).map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}
                  </div>
                ))}
              </CardContent>
            )}
        </aside>
      </div>
    </TooltipProvider>
  );
}

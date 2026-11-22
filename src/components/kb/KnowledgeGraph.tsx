import { useEffect, useMemo, useRef, useState } from 'react';
import { drag } from 'd3-drag';
import {
  forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY,
  type SimulationLinkDatum,
} from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { GraphEdge, GraphNode } from '@/lib/kb-graph';

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const SUBJECT_META: Record<string, { label: string; color: string }> = {
  '408': { label: '408 计算机基础', color: '#c2410c' },
  math1: { label: '数学一', color: '#0f766e' },
  english1: { label: '英语一', color: '#4338ca' },
};

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  fx?: number | null;
  fy?: number | null;
}

const VIEW_WIDTH = 920;
const VIEW_HEIGHT = 560;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const VIEW_CONTROLS = [
  { label: '缩小', icon: Minus, factor: 0.8 },
  { label: '放大', icon: Plus, factor: 1.25 },
  { label: '适配视图', icon: Maximize, factor: null },
];

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const [subjectFilter, setSubjectFilter] = useState<'all' | '408' | 'math1' | 'english1'>('all');
  const [onlyConnected, setOnlyConnected] = useState(true);
  const [selection, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneRef = useRef<SVGGElement>(null);
  const controlsRef = useRef<{
    fit: () => void;
    scale: (factor: number) => void;
    pan: (x: number, y: number) => void;
    focus: (id: string) => void;
  } | null>(null);

  const filtered = useMemo(() => {
    const candidates = nodes.filter((node) => subjectFilter === 'all' || node.subjectId === subjectFilter);
    const candidateIds = new Set(candidates.map((node) => node.id));
    const visibleEdges = edges.filter((edge) => candidateIds.has(edge.source) && candidateIds.has(edge.target));
    const connectedIds = new Set(visibleEdges.flatMap(({ source, target }) => [source, target]));
    const visibleNodes = onlyConnected ? candidates.filter((node) => connectedIds.has(node.id)) : candidates;

    const subjects = new Map<string, Map<string, GraphNode[]>>();
    for (const node of visibleNodes) {
      const courses = subjects.get(node.subjectId) ?? new Map<string, GraphNode[]>();
      const course = courses.get(node.courseId) ?? [];
      course.push(node);
      courses.set(node.courseId, course);
      subjects.set(node.subjectId, courses);
    }

    const positions = new Map<string, LayoutNode>();
    Array.from(subjects.values()).forEach((courses, subjectIndex) => {
      const subjectAngle = subjectIndex / subjects.size * Math.PI * 2 - Math.PI / 2;
      const subjectRadius = subjects.size === 1 ? 0 : 195;
      const subjectX = VIEW_WIDTH / 2 + Math.cos(subjectAngle) * subjectRadius;
      const subjectY = VIEW_HEIGHT / 2 + Math.sin(subjectAngle) * subjectRadius;

      Array.from(courses.values()).forEach((course, courseIndex) => {
        const courseAngle = courseIndex / courses.size * Math.PI * 2 + subjectAngle;
        const courseRadius = courses.size === 1 ? 0 : 72;
        const anchorX = subjectX + Math.cos(courseAngle) * courseRadius;
        const anchorY = subjectY + Math.sin(courseAngle) * courseRadius;

        course.forEach((node, index) => {
          const angle = index * Math.PI * (3 - Math.sqrt(5));
          const radius = Math.sqrt(index) * 14;
          positions.set(node.id, {
            id: node.id,
            x: anchorX + Math.cos(angle) * radius,
            y: anchorY + Math.sin(angle) * radius,
            anchorX,
            anchorY,
          });
        });
      });
    });

    return { visibleNodes, visibleEdges, positions };
  }, [nodes, edges, subjectFilter, onlyConnected]);

  const selectedNode = filtered.visibleNodes.find((node) => node.id === selection);
  const selectedId = selectedNode?.id;
  const activeId = selectedId ?? hoveredId;
  const neighbors = useMemo(() => {
    const ids = new Set<string>();
    for (const { source, target } of filtered.visibleEdges) {
      if (source === activeId) ids.add(target);
      if (target === activeId) ids.add(source);
    }
    return ids;
  }, [activeId, filtered]);
  const selectedNeighbors = selectedId ? filtered.visibleNodes.filter((node) => neighbors.has(node.id)) : [];

  useEffect(() => {
    const svg = svgRef.current;
    const scene = sceneRef.current;
    if (!svg || !scene) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const points = new Map(Array.from(filtered.positions, ([id, point]) => [id, { ...point }]));
    const links = filtered.visibleEdges.map(({ source, target }) => ({
      source: points.get(source)!,
      target: points.get(target)!,
    }));
    const nodeSelection = select(scene).selectAll<SVGGElement, LayoutNode>('[data-graph-node]')
      .datum(function () { return points.get(this.dataset.graphNode!)!; });
    const edgeElements = scene.querySelectorAll<SVGLineElement>('line');
    const renderPositions = () => {
      nodeSelection.attr('transform', (node) => `translate(${node.x},${node.y})`);
      links.forEach(({ source, target }, index) => {
        const line = edgeElements[index];
        line.setAttribute('x1', String(source.x));
        line.setAttribute('y1', String(source.y));
        line.setAttribute('x2', String(target.x));
        line.setAttribute('y2', String(target.y));
      });
    };

    const simulation = forceSimulation(Array.from(points.values()))
      .force('repel', forceManyBody<LayoutNode>().strength(-48))
      .force('collide', forceCollide<LayoutNode>(13))
      .force('links', forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(links)
        .distance((link) => {
          const source = link.source as LayoutNode;
          const target = link.target as LayoutNode;
          return source.anchorX === target.anchorX && source.anchorY === target.anchorY ? 45 : 110;
        })
        .strength(0.24))
      .force('cluster-x', forceX<LayoutNode>((node) => node.anchorX).strength(0.15))
      .force('cluster-y', forceY<LayoutNode>((node) => node.anchorY).strength(0.15))
      .stop();
    simulation.tick(reduceMotion.matches ? 180 : 38);
    renderPositions();
    simulation.on('tick', renderPositions);
    if (!reduceMotion.matches && points.size) simulation.restart();

    let width = VIEW_WIDTH;
    let height = VIEW_HEIGHT;
    const canvas = select(svg);
    const camera = zoom<SVGSVGElement, unknown>()
      .extent(() => [[0, 0], [width, height]])
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', ({ transform }) => scene.setAttribute('transform', transform.toString()));
    canvas.call(camera).on('dblclick.zoom', null);

    const fit = () => {
      const positions = Array.from(points.values());
      const [minX, maxX, minY, maxY] = positions.reduce(
        ([left, right, top, bottom], point) => [
          Math.min(left, point.x), Math.max(right, point.x),
          Math.min(top, point.y), Math.max(bottom, point.y),
        ],
        [Infinity, -Infinity, Infinity, -Infinity],
      );
      const scale = Math.max(MIN_ZOOM, Math.min(1.35,
        Math.max(1, width - 64) / Math.max(40, maxX - minX),
        Math.max(1, height - 64) / Math.max(40, maxY - minY),
      ));
      canvas.call(camera.transform, positions.length
        ? zoomIdentity.translate(width / 2, height / 2).scale(scale)
          .translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
        : zoomIdentity);
    };
    const resize = () => {
      const { clientWidth, clientHeight } = svg;
      if (!clientWidth || !clientHeight || (width === clientWidth && height === clientHeight)) return;
      width = clientWidth;
      height = clientHeight;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      fit();
    };
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    fit();
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(svg);

    nodeSelection.call(drag<SVGGElement, LayoutNode>()
      .container(() => scene)
      .clickDistance(5)
      .on('start', (event, node) => {
        node.fx = node.x;
        node.fy = node.y;
        if (!event.active && !reduceMotion.matches) simulation.alphaTarget(0.25).restart();
      })
      .on('drag', (event, node) => {
        node.fx = node.x = event.x;
        node.fy = node.y = event.y;
        renderPositions();
      })
      .on('end', (event, node) => {
        node.fx = null;
        node.fy = null;
        if (!event.active) simulation.alphaTarget(0);
      }));

    controlsRef.current = {
      fit,
      scale: (factor) => canvas.call(camera.scaleBy, factor),
      pan: (x, y) => {
        const transform = zoomTransform(svg);
        canvas.call(camera.translateBy, x / transform.k, y / transform.k);
      },
      focus: (id) => {
        const point = points.get(id);
        if (point) canvas.call(camera.translateTo, point.x, point.y);
      },
    };

    return () => {
      simulation.stop();
      observer.disconnect();
      nodeSelection.on('.drag', null);
      canvas.on('.zoom', null);
      controlsRef.current = null;
    };
  }, [filtered]);

  function changeFilter(filter: typeof subjectFilter, connected: boolean) {
    setSubjectFilter(filter);
    setOnlyConnected(connected);
    setSelectedId(null);
    setHoveredId(null);
  }

  function clearSelection() {
    setSelectedId(null);
    setHoveredId(null);
  }

  function handleCanvasKey(event: React.KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'Escape') clearSelection();
    if (event.target !== event.currentTarget) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const actions: Record<string, () => void> = {
      ArrowUp: () => controls.pan(0, 40),
      ArrowDown: () => controls.pan(0, -40),
      ArrowLeft: () => controls.pan(40, 0),
      ArrowRight: () => controls.pan(-40, 0),
      '+': () => controls.scale(1.25),
      '-': () => controls.scale(0.8),
      '0': controls.fit,
    };
    const action = Object.hasOwn(actions, event.key) ? actions[event.key] : undefined;
    if (action) {
      event.preventDefault();
      action();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', '408', 'math1', 'english1'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => changeFilter(key, onlyConnected)}
              aria-pressed={subjectFilter === key}
              className={[
                'rounded-full px-3 py-1 text-xs transition-colors cursor-pointer',
                subjectFilter === key
                  ? 'bg-[var(--accent)] font-medium text-[var(--bg)]'
                  : 'border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              {key === 'all' ? '全部学科' : SUBJECT_META[key].label}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyConnected}
            onChange={(event) => changeFilter(subjectFilter, event.target.checked)}
            className="accent-[var(--accent)]"
          />
          <span>仅显示有可见关联的节点</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative self-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1">
            {VIEW_CONTROLS.map(({ label, icon: Icon, factor }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => factor === null ? controlsRef.current?.fit() : controlsRef.current?.scale(factor)}
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]"
              >
                <Icon size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
          {filtered.visibleNodes.length === 0 && (
            <p className="pointer-events-none absolute inset-0 grid place-items-center px-8 text-center text-sm text-[var(--text-muted)]">
              当前筛选下没有节点。取消关联筛选或切换学科查看。
            </p>
          )}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block h-[420px] w-full touch-none cursor-grab select-none active:cursor-grabbing sm:h-[520px]"
            role="group"
            tabIndex={0}
            aria-label="跨科知识点关联图谱"
            onKeyDown={handleCanvasKey}
            onClick={(event) => {
              if (event.target === event.currentTarget) clearSelection();
            }}
          >
            <g ref={sceneRef}>
              <g aria-hidden="true" className="pointer-events-none">
                {filtered.visibleEdges.map((edge) => {
                  const source = filtered.positions.get(edge.source)!;
                  const target = filtered.positions.get(edge.target)!;
                  const highlighted = activeId === edge.source || activeId === edge.target;
                  return (
                    <line
                      key={`${edge.kind}:${edge.source}:${edge.target}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={highlighted ? 'var(--accent)' : 'var(--text-muted)'}
                      strokeWidth={highlighted ? 2 : 1}
                      strokeDasharray={edge.kind === 'prerequisite' ? undefined : '4 3'}
                      opacity={highlighted ? 0.9 : activeId ? 0.1 : 0.42}
                      vectorEffect="non-scaling-stroke"
                      className="motion-safe:transition-opacity"
                    />
                  );
                })}
              </g>
              {filtered.visibleNodes.map((node) => {
                const point = filtered.positions.get(node.id)!;
                const color = SUBJECT_META[node.subjectId]?.color ?? '#78716c';
                const isActive = activeId === node.id;
                const isNeighbor = neighbors.has(node.id);
                return (
                  <g
                    key={node.id}
                    data-graph-node={node.id}
                    transform={`translate(${point.x}, ${point.y})`}
                    onClick={() => setSelectedId(node.id)}
                    onPointerEnter={(event) => {
                      if (event.pointerType === 'mouse') setHoveredId(node.id);
                    }}
                    onPointerLeave={() => setHoveredId(null)}
                    onFocus={(event) => {
                      if (!event.currentTarget.matches(':focus-visible')) return;
                      setHoveredId(node.id);
                      controlsRef.current?.focus(node.id);
                    }}
                    onBlur={() => setHoveredId(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(node.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={node.title}
                    aria-pressed={selectedId === node.id}
                    opacity={activeId && !isActive && !isNeighbor ? 0.24 : 1}
                    className="cursor-grab active:cursor-grabbing motion-safe:transition-opacity"
                  >
                    <title>{node.title}</title>
                    <circle r={13} fill="transparent" />
                    {isActive && <circle r={12} fill="none" stroke="var(--text)" strokeWidth={1.5} />}
                    <circle
                      r={node.isPublished ? 7.5 : 5.5}
                      fill={node.isPublished ? color : 'var(--surface)'}
                      stroke={color}
                      strokeWidth={2}
                    />
                    {isActive && (
                      <text
                        y={-19}
                        textAnchor="middle"
                        paintOrder="stroke"
                        stroke="var(--surface)"
                        strokeWidth={4}
                        aria-hidden="true"
                        className="pointer-events-none fill-[var(--text)] text-xs font-medium"
                      >
                        {node.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Inspector side card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {selectedNode.courseShortTitle} · {selectedNode.status}
                </div>
                <h3 className="mt-1 font-editorial text-lg font-semibold text-[var(--text)]">
                  {selectedNode.title}
                </h3>
              </div>

              <a
                href={selectedNode.href}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
              >
                {selectedNode.isPublished ? '阅读该知识点 →' : '查看待学占位节点 →'}
              </a>

              <div>
                <div className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                  关联节点 ({selectedNeighbors.length})
                </div>
                {selectedNeighbors.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedNeighbors.map((nb) => (
                      <li key={nb.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(nb.id);
                            controlsRef.current?.focus(nb.id);
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1.5 text-left text-xs hover:border-[var(--accent)] cursor-pointer"
                        >
                          <span className="truncate text-[var(--text)]">{nb.title}</span>
                          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                            {nb.courseShortTitle}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">暂无显式关联节点。</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs leading-relaxed text-[var(--text-muted)]">
              <h3 className="font-editorial text-base font-semibold text-[var(--text)]">
                图谱说明
              </h3>
              <p>
                实心圆点代表<strong>已写入</strong>的知识点，空心圆点代表大纲中的<strong>待学占位节点</strong>。
              </p>
              <p>拖动空白处平移，滚轮或双指缩放。拖动节点可重新排列，点击节点查看关联与阅读入口。</p>
              <div className="space-y-1.5 pt-2">
                {Object.entries(SUBJECT_META).map(([k, meta]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

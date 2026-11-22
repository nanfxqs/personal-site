import { useMemo, useState } from 'react';
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

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const [subjectFilter, setSubjectFilter] = useState<'all' | '408' | 'math1' | 'english1'>('all');
  const [onlyConnected, setOnlyConnected] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const connectedIds = new Set<string>();
    edges.forEach((e) => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });

    const visibleNodes = nodes.filter((n) => {
      if (subjectFilter !== 'all' && n.subjectId !== subjectFilter) return false;
      if (onlyConnected && !connectedIds.has(n.id)) return false;
      return true;
    });

    const idSet = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));

    // Deterministic radial-cluster layout grouped by subject & course
    const groups = new Map<string, GraphNode[]>();
    for (const n of visibleNodes) {
      const key = `${n.subjectId}:${n.courseId}`;
      const list = groups.get(key) ?? [];
      list.push(n);
      groups.set(key, list);
    }

    const groupKeys = Array.from(groups.keys());
    const width = 920;
    const height = 560;
    const cx = width / 2;
    const cy = height / 2;
    const positions = new Map<string, { x: number; y: number }>();

    groupKeys.forEach((key, gIdx) => {
      const list = groups.get(key) ?? [];
      const baseAngle = (gIdx / Math.max(1, groupKeys.length)) * Math.PI * 2 - Math.PI / 2;
      const clusterRadius = groupKeys.length === 1 ? 0 : 175;
      const gx = cx + Math.cos(baseAngle) * clusterRadius;
      const gy = cy + Math.sin(baseAngle) * clusterRadius;

      list.forEach((node, nIdx) => {
        const subAngle = (nIdx / Math.max(1, list.length)) * Math.PI * 2 + baseAngle;
        const subRadius = list.length === 1 ? 0 : Math.min(82, 30 + list.length * 7);
        positions.set(node.id, {
          x: gx + Math.cos(subAngle) * subRadius,
          y: gy + Math.sin(subAngle) * subRadius,
        });
      });
    });

    return { visibleNodes, visibleEdges, positions, width, height };
  }, [nodes, edges, subjectFilter, onlyConnected]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const selectedNeighbors = useMemo(() => {
    if (!selectedId) return [];
    const neighborIds = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedId) neighborIds.add(e.target);
      if (e.target === selectedId) neighborIds.add(e.source);
    });
    return nodes.filter((n) => neighborIds.has(n.id));
  }, [selectedId, edges, nodes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', '408', 'math1', 'english1'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSubjectFilter(key)}
              className={[
                'rounded-full px-3 py-1 text-xs transition-colors cursor-pointer',
                subjectFilter === key
                  ? 'bg-[var(--accent)] font-medium text-white'
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
            onChange={(e) => setOnlyConnected(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          <span>仅显示有跨科关联的节点</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <svg
            viewBox={`0 0 ${filtered.width} ${filtered.height}`}
            className="h-[520px] w-full"
            role="img"
            aria-label="跨科知识点关联图谱"
          >
            {/* Edges */}
            {filtered.visibleEdges.map((edge, idx) => {
              const p1 = filtered.positions.get(edge.source);
              const p2 = filtered.positions.get(edge.target);
              if (!p1 || !p2) return null;
              const highlighted =
                selectedId === edge.source || selectedId === edge.target;
              return (
                <line
                  key={idx}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={highlighted ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={highlighted ? 2.2 : 1.2}
                  strokeDasharray={edge.kind === 'prerequisite' ? undefined : '4 3'}
                  opacity={selectedId && !highlighted ? 0.25 : 0.85}
                />
              );
            })}

            {/* Nodes */}
            {filtered.visibleNodes.map((node) => {
              const pos = filtered.positions.get(node.id);
              if (!pos) return null;
              const color = SUBJECT_META[node.subjectId]?.color ?? '#78716c';
              const isSelected = selectedId === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedId(node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isSelected ? 10 : node.isPublished ? 7.5 : 5.5}
                    fill={node.isPublished ? color : 'var(--surface)'}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    y={-12}
                    textAnchor="middle"
                    className="fill-[var(--text)] text-[10px] select-none"
                  >
                    {node.title.length > 11 ? `${node.title.slice(0, 10)}…` : node.title}
                  </text>
                </g>
              );
            })}
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
                className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
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
                          onClick={() => setSelectedId(nb.id)}
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
              <p>点击任意节点即可查看其跨科关联与跳转入口。</p>
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

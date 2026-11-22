import React, { useState } from 'react';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';

export interface InteractiveFigureProps {
  title: string;
  caption?: string;
  badge?: string;
  onReset?: () => void;
  children: React.ReactNode;
}

export function InteractiveFigure({
  title,
  caption,
  badge,
  onReset,
  children,
}: InteractiveFigureProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <figure
      className={[
        'not-prose my-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all',
        expanded
          ? 'fixed inset-4 z-50 flex flex-col overflow-auto p-6 shadow-2xl'
          : 'overflow-hidden',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {badge && (
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium tracking-wide text-[var(--accent)]">
              {badge}
            </span>
          )}
          <span className="truncate font-editorial text-sm font-semibold text-[var(--text)]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="重置状态"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">重置</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? '退出全屏' : '全屏聚焦'}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">收起</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">聚焦</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={expanded ? 'flex-1 py-4' : 'p-4 sm:p-6'}>{children}</div>

      {caption && (
        <figcaption className="border-t border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

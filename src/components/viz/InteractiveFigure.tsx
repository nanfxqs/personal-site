import React, { useState } from 'react';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      className={cn(
        'not-prose my-8 rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all',
        expanded
          ? 'fixed inset-4 z-50 flex flex-col overflow-auto p-6 shadow-2xl'
          : 'overflow-hidden',
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/45 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {badge && (
            <Badge variant="outline" className="shrink-0 font-mono text-[10px] uppercase">
              {badge}
            </Badge>
          )}
          <span className="truncate font-editorial text-sm font-semibold text-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onReset && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onReset}
              title="重置状态"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">重置</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? '退出全屏' : '全屏聚焦'}
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
          </Button>
        </div>
      </div>

      <div className={expanded ? 'flex-1 py-4' : 'p-4 sm:p-6'}>{children}</div>

      {caption && (
        <figcaption className="border-t border-border bg-muted/35 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

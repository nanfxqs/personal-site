import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    if (!expanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const figureContent = (
    <figure
      className={cn(
        'not-prose rounded-2xl border border-border text-card-foreground',
        expanded
          ? 'relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-auto bg-background shadow-2xl'
          : 'my-8 overflow-hidden bg-card shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-border px-4 py-2.5',
          expanded ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-md' : 'bg-muted/45',
        )}
      >
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

      <div className={expanded ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-6'}>{children}</div>

      {caption && (
        <figcaption
          className={cn(
            'border-t border-border px-4 py-2.5 text-xs leading-relaxed text-muted-foreground',
            expanded ? 'bg-muted/60' : 'bg-muted/35',
          )}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );

  if (expanded && typeof document !== 'undefined') {
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/82 p-3 backdrop-blur-xl sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setExpanded(false);
          }
        }}
      >
        {figureContent}
      </div>,
      document.body,
    );
  }

  return figureContent;
}

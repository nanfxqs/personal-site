import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface StepItem {
  label: string;
  description: string;
}

export interface StepPlayerProps {
  steps: StepItem[];
  current: number;
  onChange: (index: number) => void;
  intervalMs?: number;
}

export function StepPlayer({
  steps,
  current,
  onChange,
  intervalMs = 1100,
}: StepPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const total = steps.length;
  const activeStep = steps[Math.min(current, Math.max(0, total - 1))];

  useEffect(() => {
    if (!playing) return;
    if (current >= total - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      onChange(current + 1);
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [playing, current, total, intervalMs, onChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mt-4 rounded-xl border border-border bg-muted/45 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    setPlaying(false);
                    onChange(0);
                  }}
                  disabled={current === 0}
                  aria-label="回到起点"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>回到起点</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    setPlaying(false);
                    onChange(Math.max(0, current - 1));
                  }}
                  disabled={current === 0}
                  aria-label="上一步"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>上一步</TooltipContent>
            </Tooltip>

            <Button
              type="button"
              size="xs"
              onClick={() => {
                if (current >= total - 1) {
                  onChange(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="px-3"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{playing ? '暂停' : '自动播放'}</span>
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    setPlaying(false);
                    onChange(Math.min(total - 1, current + 1));
                  }}
                  disabled={current >= total - 1}
                  aria-label="下一步"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>下一步</TooltipContent>
            </Tooltip>
          </div>

          <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
            Step {current + 1} / {total}
          </Badge>
        </div>

        {/* Interactive step progress segments */}
        <div className="mt-3 flex gap-1">
          {steps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPlaying(false);
                onChange(idx);
              }}
              title={s.label}
              aria-label={`跳转到第 ${idx + 1} 步：${s.label}`}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors cursor-pointer',
                idx <= current ? 'bg-primary' : 'bg-border hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>

        {activeStep && (
          <div className="mt-3 rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-sm leading-relaxed">
            <span className="mr-2 font-semibold text-foreground">{activeStep.label}</span>
            <span className="text-muted-foreground">{activeStep.description}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

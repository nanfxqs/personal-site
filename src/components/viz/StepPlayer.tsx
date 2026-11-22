import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';

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
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              onChange(0);
            }}
            disabled={current === 0}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 cursor-pointer"
            title="回到起点"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              onChange(Math.max(0, current - 1));
            }}
            disabled={current === 0}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 cursor-pointer"
            title="上一步"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (current >= total - 1) {
                onChange(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{playing ? '暂停' : '自动播放'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              onChange(Math.min(total - 1, current + 1));
            }}
            disabled={current >= total - 1}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 cursor-pointer"
            title="下一步"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <span>
            Step {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
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
            className={[
              'h-1.5 flex-1 rounded-full transition-colors cursor-pointer',
              idx <= current ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
            ].join(' ')}
          />
        ))}
      </div>

      {activeStep && (
        <div className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          <span className="mr-2 font-semibold text-[var(--accent)]">{activeStep.label}</span>
          <span className="text-[var(--text-muted)]">{activeStep.description}</span>
        </div>
      )}
    </div>
  );
}

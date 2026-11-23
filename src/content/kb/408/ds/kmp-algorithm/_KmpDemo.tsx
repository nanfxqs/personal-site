import { useState } from 'react';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { StepPlayer, type StepItem } from '@/components/viz/StepPlayer';

const TEXT = 'ABABABCABAA';
const PATTERN = 'ABABC';
const NEXT = [-1, 0, 0, 1, 2];

interface MatchFrame {
  i: number;
  j: number;
  matched: boolean;
  label: string;
  description: string;
}

const FRAMES: MatchFrame[] = [
  {
    i: 0,
    j: 0,
    matched: true,
    label: '对齐起始位置',
    description: '主串指针 i=0 与模式串指针 j=0 对齐，字符 A == A，匹配成功，双指针右移。',
  },
  {
    i: 3,
    j: 3,
    matched: true,
    label: '连续匹配前缀 ABAB',
    description: '前 4 个字符 ABAB 全部匹配，来到 i=3, j=3（字符 B == B）。',
  },
  {
    i: 4,
    j: 4,
    matched: false,
    label: '在 j=4 处发生失配',
    description: '主串 T[4]=A，而模式串 P[4]=C。朴素算法会把 i 回退到 1，但 KMP 保持 i=4 不动！',
  },
  {
    i: 4,
    j: 2,
    matched: true,
    label: '查 next[4]=2 跳转',
    description: '已匹配前缀 ABAB 的最长相等前后缀为 AB（长度 2），模式串直接右移使 j=2 对齐 i=4，A == A 命中。',
  },
  {
    i: 6,
    j: 4,
    matched: true,
    label: '完全匹配成功',
    description: '继续推进至 i=6, j=4，字符 C == C，模式串 ABABC 在主串下标 2 处匹配完成！',
  },
];

const STEPS: StepItem[] = FRAMES.map((f) => ({
  label: f.label,
  description: f.description,
}));

export default function KmpDemo() {
  const [step, setStep] = useState(0);
  const frame = FRAMES[step];
  const offset = frame.i - frame.j;

  return (
    <InteractiveFigure
      title="KMP 模式匹配分步演示（i 不回溯）"
      badge="2D 分步交互"
      caption="点击下方播放器逐步观察失配时 j = next[j] 的跳转过程，以及主串指针 i 始终不回溯的特性。"
      onReset={() => setStep(0)}
    >
      <div
        role="region"
        aria-label="KMP 主串与模式串"
        tabIndex={0}
        className="space-y-5 overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {/* Main text row */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-mono">主串 T</span>
            <span className="font-mono">i = {frame.i}</span>
          </div>
          <div className="flex gap-1.5">
            {TEXT.split('').map((ch, idx) => {
              const isCurrent = idx === frame.i;
              const isInMatchedPrefix = idx >= offset && idx < frame.i;
              return (
                <div
                  key={idx}
                  className={[
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border font-mono text-sm transition-all',
                    isCurrent
                      ? frame.matched
                        ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-rose-500 bg-rose-500/15 font-bold text-rose-700 dark:text-rose-300'
                      : isInMatchedPrefix
                        ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/50 text-[var(--text)]'
                        : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  <span>{ch}</span>
                  <span className="text-[9px]">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern row shifted by offset */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-mono">模式串 P（右移 {offset} 格）</span>
            <span className="font-mono">j = {frame.j} · next[{frame.j}] = {NEXT[frame.j]}</span>
          </div>
          <div className="flex gap-1.5" style={{ paddingLeft: `${offset * 46}px` }}>
            {PATTERN.split('').map((ch, idx) => {
              const isCurrent = idx === frame.j;
              const isMatchedPrefix = idx < frame.j;
              return (
                <div
                  key={idx}
                  className={[
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border font-mono text-sm transition-all',
                    isCurrent
                      ? frame.matched
                        ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-rose-500 bg-rose-500/15 font-bold text-rose-700 dark:text-rose-300'
                      : isMatchedPrefix
                        ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/50 text-[var(--text)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
                  ].join(' ')}
                >
                  <span>{ch}</span>
                  <span className="text-[9px]">{NEXT[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <StepPlayer steps={STEPS} current={step} onChange={setStep} />
    </InteractiveFigure>
  );
}

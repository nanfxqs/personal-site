import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { StepPlayer, type StepItem } from '@/components/viz/StepPlayer';
import { cn } from '@/lib/utils';

interface PartialRow {
  digits: string[];
  multiplierDigit: string;
  multiplierColIndex: number;
  shift: number;
}

interface DecimalFrame {
  visibleRows: number;
  showSum: boolean;
  activeColSpan: number;
  activeMultiplierCol: number | null;
  label: string;
  description: string;
}

const COLS = 8; // 2n = 8 for n = 4
const MULTIPLICAND = ['', '', '', '', '3', '1', '2', '4'];
const MULTIPLIER = ['', '', '', '', '4', '2', '1', '3'];
const FINAL_SUM = ['1', '3', '1', '6', '1', '4', '1', '2'];

const PARTIAL_ROWS: PartialRow[] = [
  { digits: ['', '', '', '', '9', '3', '7', '2'], multiplierDigit: '3', multiplierColIndex: 7, shift: 0 },
  { digits: ['', '', '', '3', '1', '2', '4', ''], multiplierDigit: '1', multiplierColIndex: 6, shift: 1 },
  { digits: ['', '', '6', '2', '4', '8', '', ''], multiplierDigit: '2', multiplierColIndex: 5, shift: 2 },
  { digits: ['1', '2', '4', '9', '6', '', '', ''], multiplierDigit: '4', multiplierColIndex: 4, shift: 3 },
];

const FRAMES: DecimalFrame[] = [
  {
    visibleRows: 0,
    showSum: false,
    activeColSpan: 4,
    activeMultiplierCol: null,
    label: '初始状态（n = 4 位）',
    description: '被乘数 3124 与乘数 4213 各自仅占用 4 位（n 位）宽度。',
  },
  {
    visibleRows: 1,
    showSum: false,
    activeColSpan: 4,
    activeMultiplierCol: 7,
    label: '第 1 位（× 3，左移 0 位）',
    description: '取乘数最低位 3 与 3124 相乘得 9372，此时位积仍在低 4 位范围内。',
  },
  {
    visibleRows: 2,
    showSum: false,
    activeColSpan: 5,
    activeMultiplierCol: 6,
    label: '第 2 位（× 1，左移 1 位）',
    description: '对齐十位权重，被乘数位积整体向左平移动 1 位，累加跨度拉长到 5 位（n + 1）。',
  },
  {
    visibleRows: 3,
    showSum: false,
    activeColSpan: 6,
    activeMultiplierCol: 5,
    label: '第 3 位（× 2，左移 2 位）',
    description: '对齐百位权重，整行左移 2 位，加法器所需位宽继续扩展到 6 位（n + 2）。',
  },
  {
    visibleRows: 4,
    showSum: false,
    activeColSpan: 8,
    activeMultiplierCol: 4,
    label: '第 4 位（× 4，左移 3 位）',
    description: '对齐千位权重并产生进位，所有位积横跨全部 8 位（2n 位），4 行中间位积必须同时保存。',
  },
  {
    visibleRows: 4,
    showSum: true,
    activeColSpan: 8,
    activeMultiplierCol: null,
    label: '统一累加得出 2n 位积',
    description: '硬件痛点：直接照搬左移竖式，既需要 2n 位宽加法器，又要额外寄存器暂存全部 n 行中间积。',
  },
];

const STEPS: StepItem[] = FRAMES.map((f) => ({
  label: f.label,
  description: f.description,
}));

export default function DecimalMulDemo() {
  const [step, setStep] = useState(0);
  const frame = FRAMES[step];

  return (
    <MotionConfig reducedMotion="user">
      <InteractiveFigure
        title="十进制竖式乘法：逐位左移对齐与 2n 位宽开销"
        badge="2D 动画演示"
        caption="观察每行位积向左平移对齐时，上方跨度标尺如何从 n = 4 位被撑大到 2n = 8 位。"
        onReset={() => setStep(0)}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              当前加法器跨度：{frame.activeColSpan} 位（n = 4 → 2n = 8）
            </Badge>
            <span className="font-mono text-muted-foreground">
              需暂存的中间位积行数：{frame.visibleRows} / 4
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card/65 p-4">
            <div className="mx-auto w-fit min-w-[340px] space-y-1.5 font-mono text-sm">
              {/* Animated span ruler showing n -> 2n width growth */}
              <div className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 pb-1 text-center text-[10px]">
                <span className="text-left text-muted-foreground">加法器跨度</span>
                <div className="col-span-8 relative flex h-5 items-center justify-end">
                  <motion.div
                    initial={false}
                    animate={{
                      width: `${(frame.activeColSpan / COLS) * 100}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className={cn(
                      'flex h-5 items-center justify-between rounded-md border px-2 font-semibold',
                      frame.activeColSpan > 4
                        ? 'border-amber-500/50 bg-amber-500/12 text-amber-700 dark:text-amber-300'
                        : 'border-primary/45 bg-primary/12 text-primary',
                    )}
                  >
                    <span>←</span>
                    <span>{frame.activeColSpan} 位</span>
                    <span>→</span>
                  </motion.div>
                </div>
              </div>

              {/* Bit weight header */}
              <div className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 text-center text-[10px] text-muted-foreground">
                <span className="text-left">位权列</span>
                {Array.from({ length: COLS }).map((_, colIdx) => {
                  const power = COLS - 1 - colIdx;
                  const isActive = colIdx >= COLS - frame.activeColSpan;
                  return (
                    <span
                      key={colIdx}
                      className={cn(
                        'rounded py-0.5 transition-colors',
                        isActive
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-muted-foreground/45',
                      )}
                    >
                      10^{power}
                    </span>
                  );
                })}
              </div>

              {/* Multiplicand */}
              <div className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 text-center">
                <span className="text-left text-xs text-muted-foreground">被乘数</span>
                {MULTIPLICAND.map((d, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex h-8 items-center justify-center rounded border',
                      d
                        ? 'border-border bg-background/85 font-semibold text-foreground'
                        : 'border-transparent',
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Multiplier */}
              <div className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 border-b border-border pb-2 text-center">
                <span className="text-left text-xs text-muted-foreground">× 乘数</span>
                {MULTIPLIER.map((d, idx) => {
                  const isScanning = frame.activeMultiplierCol === idx;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex h-8 items-center justify-center rounded border transition-colors',
                        isScanning
                          ? 'border-primary bg-primary/15 font-bold text-primary'
                          : d
                            ? 'border-border bg-muted/50 font-semibold text-foreground'
                            : 'border-transparent',
                      )}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              {/* Animated partial product rows sliding left */}
              <AnimatePresence initial={false}>
                {PARTIAL_ROWS.slice(0, frame.visibleRows).map((row, rowIdx) => {
                  const isLatest = rowIdx === frame.visibleRows - 1 && !frame.showSum;
                  return (
                    <motion.div
                      key={rowIdx}
                      initial={{ opacity: 0, x: row.shift * 26 + 18, y: -6 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 text-center"
                    >
                      <span
                        className={cn(
                          'text-left text-[11px]',
                          isLatest ? 'font-semibold text-primary' : 'text-muted-foreground',
                        )}
                      >
                        ×{row.multiplierDigit}（左移 {row.shift}）
                      </span>
                      {row.digits.map((d, colIdx) => {
                        const isShiftPad = colIdx >= COLS - row.shift && d === '';
                        return (
                          <div
                            key={colIdx}
                            className={cn(
                              'flex h-8 items-center justify-center rounded border text-xs',
                              d
                                ? isLatest
                                  ? 'border-primary bg-primary/15 font-bold text-primary'
                                  : 'border-border bg-background/75 text-foreground'
                                : isShiftPad
                                  ? 'border-dashed border-border/70 bg-muted/30 text-[10px] text-muted-foreground'
                                  : 'border-transparent',
                            )}
                          >
                            {d || (isShiftPad ? '0' : '')}
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Final sum row */}
              <AnimatePresence>
                {frame.showSum && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="grid grid-cols-[6rem_repeat(8,2rem)] items-center gap-1 border-t border-border pt-2 text-center"
                  >
                    <span className="text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      2n 位总积
                    </span>
                    {FINAL_SUM.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex h-8 items-center justify-center rounded border border-emerald-500/45 bg-emerald-500/12 font-bold text-emerald-700 dark:text-emerald-300"
                      >
                        {d}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {frame.showSum && (
            <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              硬件代价：左移对齐把单次求和跨度撑到 <strong>2n = 8 位</strong>，且必须开辟寄存器同时暂存 <strong>n = 4 行</strong>中间位积。
            </div>
          )}
        </div>

        <StepPlayer steps={STEPS} current={step} onChange={setStep} intervalMs={1350} />
      </InteractiveFigure>
    </MotionConfig>
  );
}

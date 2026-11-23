import { Fragment, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { cn } from '@/lib/utils';

type TrackId = 'mul' | 'div';

interface StageNode {
  id: string;
  title: string;
  tag: string;
  edgeNote?: string;
  cycleSummary: string;
  costRatio: number;
  bottleneckSolved: string;
  complexityGain: string;
  examNote: string;
}

const TRACKS: Record<
  TrackId,
  {
    label: string;
    subtitle: string;
    nodes: StageNode[];
  }
> = {
  mul: {
    label: '乘法演进路径',
    subtitle: '以时间复杂度下降为主线：缩位宽 → 省加法 → 缩拍数 → 并行化',
    nodes: [
      {
        id: 'orig-mul1',
        title: '原码一位乘法',
        tag: '基准',
        cycleSummary: 'n 拍 · ≤n 次加',
        costRatio: 0.95,
        bottleneckSolved: '固定被乘数 X、右移 ACC/MQ，把加法器位宽从 2n 压回 n 位。',
        complexityGain: '固定 n 次逻辑右移 + 至多 n 次加法（只支持绝对值）。',
        examNote: '408 中高频：重点看逻辑右移与 ACC/MQ 位拼接。',
      },
      {
        id: 'booth-mul1',
        title: 'Booth 一位乘',
        tag: '高频核心',
        edgeNote: '折叠连续 1',
        cycleSummary: 'n 拍 · 少加法',
        costRatio: 0.72,
        bottleneckSolved: '符号位直接参与运算，用首尾“一减一加”折叠一连串 1 的多次加法。',
        complexityGain: '仍是 n 次算术右移（末步不移位），连续 1 越多、实际加法次数越少。',
        examNote: '408 必考重点：附加位初值 0、算术右移、n+1 次判别。',
      },
      {
        id: 'comp-mul2',
        title: '补码两位乘法',
        tag: '周期减半',
        edgeNote: '两步并一步',
        cycleSummary: 'n/2 拍',
        costRatio: 0.45,
        bottleneckSolved: '合并相邻两项 Booth 公式，每拍同时判定 3 位并处理乘数中的 2 位。',
        complexityGain: '算术右移 2 位，总迭代节拍直接减半（代价是需 ±2[x]补 与 3 位符号位）。',
        examNote: '408 极低频：记住“判 3 位、移 2 位”的原理即可。',
      },
      {
        id: 'array-mul',
        title: '并行阵列乘法',
        tag: '空间换时间',
        edgeNote: '面积换速度',
        cycleSummary: '1 级组合延迟',
        costRatio: 0.18,
        bottleneckSolved: '突破复用单一加法器的串行时钟下限，展开全部部分积为二维全加器阵列。',
        complexityGain: '从 O(n) 个时钟周期压缩到组合逻辑单步稳定输出。',
        examNote: '衔接下一节点：ALU 与并行阵列乘除法。',
      },
    ],
  },
  div: {
    label: '除法演进路径',
    subtitle: '以消除回退与统一控制为主线：去恢复步 → 统一符号 → 并行化',
    nodes: [
      {
        id: 'restore-div',
        title: '恢复余数除法',
        tag: '朴素起点',
        cycleSummary: 'n 拍 · 最多 2 次加',
        costRatio: 1.0,
        bottleneckSolved: '对照十进制长除法逐位试减，余数为负时加回除数还原现场。',
        complexityGain: '每次不够减都需“加回 + 左移 + 再减”2 次加减，节拍长且不均匀。',
        examNote: '理解引子：用于推导不恢复余数法。',
      },
      {
        id: 'orig-div',
        title: '原码加减交替',
        tag: '消除回退',
        edgeNote: '2R+|y| 化简',
        cycleSummary: 'n 拍 · 恒 1 次加',
        costRatio: 0.68,
        bottleneckSolved: '用 2(R+|y|)-|y| = 2R+|y| 消除负余数回退步，只需左移后直接加 |y|。',
        complexityGain: '每拍严格收敛为“1 次加减 + 1 次左移”，最坏加减次数减半。',
        examNote: '408 中低频：注意“终步负余数需补加一次 |y|”。',
      },
      {
        id: 'comp-div',
        title: '补码加减交替',
        tag: '符号统一',
        edgeNote: '同异号判断',
        cycleSummary: 'n 拍 · 免终步恢复',
        costRatio: 0.52,
        bottleneckSolved: '推广为“余数与除数同异号”判断，让补码直接带符号参与运算。',
        complexityGain: '无需原补码转换，末位恒置 1 省去最后一步余数恢复。',
        examNote: '408 极低频：记“同号上 1 减、异号上 0 加、末位置 1”。',
      },
      {
        id: 'array-div',
        title: '并行阵列除法',
        tag: '空间换时间',
        edgeNote: '面积换速度',
        cycleSummary: '组合级联输出',
        costRatio: 0.22,
        bottleneckSolved: '将多轮交替加减展开为多行可控加/减单元阵列，消除串行循环。',
        complexityGain: '省去时序控制周期，商由组合逻辑逐级稳定产生。',
        examNote: '衔接下一节点：ALU 与并行阵列乘除法。',
      },
    ],
  },
};

export default function EvolutionFlowchart() {
  const [selected, setSelected] = useState<{ track: TrackId; idx: number }>({
    track: 'mul',
    idx: 1,
  });

  const activeNode = TRACKS[selected.track].nodes[selected.idx];

  return (
    <MotionConfig reducedMotion="user">
      <InteractiveFigure
        title="定点数乘除法演进脉络：以时间复杂度优化为主线"
        badge="演进流程图"
        caption="点击任意算法节点，对比串行周期（条形长度）如何随每次架构改进不断压缩。"
      >
        <div className="space-y-4">
          {(['mul', 'div'] as TrackId[]).map((trackKey) => {
            const track = TRACKS[trackKey];
            const isActiveTrack = selected.track === trackKey;

            return (
              <div
                key={trackKey}
                className="rounded-xl border border-border/80 bg-muted/25 p-3.5"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{track.label}</span>
                  <span className="text-[11px] text-muted-foreground">{track.subtitle}</span>
                </div>

                {/* Responsive flow lane: fits completely within container without clipping */}
                <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-1">
                  {track.nodes.map((node, idx) => {
                    const isSelected = isActiveTrack && selected.idx === idx;
                    const isParallel = idx === track.nodes.length - 1;
                    const isEdgeActive =
                      isActiveTrack && (selected.idx === idx - 1 || selected.idx === idx);

                    return (
                      <Fragment key={node.id}>
                        {idx > 0 && (
                          <div className="flex shrink-0 flex-row items-center justify-center gap-1 py-0.5 md:flex-col md:px-0.5">
                            {node.edgeNote && (
                              <span
                                className={cn(
                                  'rounded-full border px-1.5 py-0.5 font-mono text-[9.5px] whitespace-nowrap transition-colors',
                                  isEdgeActive
                                    ? 'border-primary/45 bg-primary/12 text-primary'
                                    : 'border-border bg-background/80 text-muted-foreground',
                                )}
                              >
                                {node.edgeNote}
                              </span>
                            )}
                            <ArrowRight
                              className={cn(
                                'hidden h-3.5 w-3.5 md:block transition-colors',
                                isEdgeActive ? 'text-primary' : 'text-muted-foreground/60',
                              )}
                            />
                            <ArrowDown
                              className={cn(
                                'block h-3.5 w-3.5 md:hidden transition-colors',
                                isEdgeActive ? 'text-primary' : 'text-muted-foreground/60',
                              )}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelected({ track: trackKey, idx })}
                          aria-pressed={isSelected}
                          className={cn(
                            'group flex min-w-0 flex-1 flex-col items-start rounded-xl border p-2.5 text-left transition-colors cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary/12 shadow-xs'
                              : isParallel
                                ? 'border-dashed border-border bg-muted/45 hover:border-primary/55'
                                : 'border-border bg-card/85 hover:border-primary/55 hover:bg-muted/40',
                          )}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span
                              className={cn(
                                'truncate text-xs font-semibold',
                                isSelected ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {node.title}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            <span>{node.tag}</span>
                            <span>·</span>
                            <span>{node.cycleSummary}</span>
                          </div>

                          {/* Time cost progress bar */}
                          <div className="mt-2.5 w-full space-y-1">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <motion.div
                                initial={false}
                                animate={{ width: `${Math.round(node.costRatio * 100)}%` }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className={cn(
                                  'h-full rounded-full',
                                  isParallel
                                    ? 'bg-emerald-500'
                                    : isSelected
                                      ? 'bg-primary'
                                      : 'bg-sky-500/70',
                                )}
                              />
                            </div>
                            <span className="block font-mono text-[9px] text-muted-foreground/80">
                              相对时间开销
                            </span>
                          </div>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Selected node inspector */}
          <motion.div
            key={`${selected.track}-${selected.idx}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border bg-card/75 p-4 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{activeNode.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {activeNode.tag}
                </Badge>
              </div>
              <span className="font-mono text-[11px] text-primary">{activeNode.examNote}</span>
            </div>
            <p className="mt-2 text-muted-foreground">
              <span className="font-semibold text-foreground">核心设计：</span>
              {activeNode.bottleneckSolved}
            </p>
            <p className="mt-1 text-muted-foreground">
              <span className="font-semibold text-foreground">速度收益：</span>
              {activeNode.complexityGain}
            </p>
          </motion.div>
        </div>
      </InteractiveFigure>
    </MotionConfig>
  );
}

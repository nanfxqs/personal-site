import { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { StepPlayer, type StepItem } from '@/components/viz/StepPlayer';
import { cn } from '@/lib/utils';

type AlgoId = 'orig-mul1' | 'booth-mul1' | 'orig-div' | 'comp-div';
type PriorityTone = 'high' | 'medium' | 'low';
type ActionKind = 'init' | 'add-pos' | 'add-neg' | 'add-zero' | 'shift-right' | 'shift-left' | 'restore';
type BitRole = 'acc' | 'mq' | 'prod' | 'quot' | 'aux';

interface BranchRule {
  code: string;
  label: string;
  action: string;
}

interface AlgoFrame {
  acc: string;
  mq: string;
  aux?: string;
  op: string;
  actionKind: ActionKind;
  activeBranch?: string;
  aluOperand?: string;
  ruleHint: string;
  highlightMqTail?: number;
  highlightAux?: boolean;
  shiftDirection?: 'right' | 'left';
  mqOnlyShift?: boolean;
  quotientInsertIndex?: number;
  label: string;
  description: string;
}

interface AlgoDataset {
  id: AlgoId;
  kind: 'mul' | 'div';
  shortName: string;
  fullName: string;
  priorityLabel: string;
  priorityTone: PriorityTone;
  inputsSummary: string;
  xLabel: string;
  xValue: string;
  negXLabel?: string;
  negXValue?: string;
  resultLabel: string;
  resultValue: string;
  branches: BranchRule[];
  frames: AlgoFrame[];
}

interface BitToken {
  id: string;
  bit: string;
  role: BitRole;
}

interface FrameTokens {
  accTokens: BitToken[];
  mqTokens: BitToken[];
  auxToken?: BitToken;
}

const DATASETS: Record<AlgoId, AlgoDataset> = {
  'orig-mul1': {
    id: 'orig-mul1',
    kind: 'mul',
    shortName: '原码一位乘',
    fullName: '原码一位乘法（符号位独立异或 + 部分积与乘数联合逻辑右移）',
    priorityLabel: '中高频',
    priorityTone: 'high',
    inputsSummary: 'x = -0.1101, y = +0.1011（取 |x| = 0.1101, |y| = 0.1011，符号 Pf = 1⊕0 = 1）',
    xLabel: '|x|',
    xValue: '0.1101',
    resultLabel: '乘积原码 [x·y]原',
    resultValue: '1.10001111 (-143/256)',
    branches: [
      { code: 'mq1', label: 'MQ 末位 = 1', action: 'ACC + |x| 后右移' },
      { code: 'mq0', label: 'MQ 末位 = 0', action: 'ACC + 0 后右移' },
    ],
    frames: [
      {
        acc: '0.0000',
        mq: '1011',
        op: '初始化',
        actionKind: 'init',
        ruleHint: 'ACC 置 0（含 1 位进位保护位）；MQ 存入乘数绝对值 |y| = 1011',
        highlightMqTail: 1,
        label: '初始化部分积与乘数',
        description: '符号位单独求异或 Pf = 1。被乘数 |x| 锁存于 X 不动，ACC 置 0，MQ 装入 |y|。',
      },
      {
        acc: '0.1101',
        mq: '1011',
        op: '末位=1 → +|x|',
        actionKind: 'add-pos',
        activeBranch: 'mq1',
        aluOperand: '+0.1101',
        ruleHint: 'MQ 最低位为 1，ALU 将 X (0.1101) 与 ACC 相加后写回 ACC',
        highlightMqTail: 1,
        label: '第 1 步（加被乘数）',
        description: '判断 MQ 末位 y4 = 1，ALU 计算 ACC + |x| = 0.1101。',
      },
      {
        acc: '0.0110',
        mq: '1101',
        op: '逻辑右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '观察绿色比特位：ACC 末位 1 滑入 MQ 高位，MQ 原末位被右移淘汰',
        highlightMqTail: 1,
        label: '第 1 步（联合逻辑右移）',
        description: 'ACC 与 MQ 整体逻辑右移 1 位：ACC 高位补 0，低位 1 进入 MQ 左侧腾出的空位。',
      },
      {
        acc: '1.0011',
        mq: '1101',
        op: '末位=1 → +|x|',
        actionKind: 'add-pos',
        activeBranch: 'mq1',
        aluOperand: '+0.1101',
        ruleHint: 'MQ 最低位为 1，ACC + 0.1101 = 1.0011（保护位暂存进位 1）',
        highlightMqTail: 1,
        label: '第 2 步（加被乘数）',
        description: '末位 y3 = 1，ALU 计算 0.0110 + 0.1101 = 1.0011，最高位暂存进位 1。',
      },
      {
        acc: '0.1001',
        mq: '1110',
        op: '逻辑右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '逻辑右移将保护位 1 顺势移入小数高位，ACC 末位 1 滑入 MQ',
        highlightMqTail: 1,
        label: '第 2 步（联合逻辑右移）',
        description: '联合逻辑右移 1 位：ACC 变为 0.1001，MQ 已容纳 2 位乘积低位（左侧两格）。',
      },
      {
        acc: '0.1001',
        mq: '1110',
        op: '末位=0 → +0',
        actionKind: 'add-zero',
        activeBranch: 'mq0',
        aluOperand: '+0.0000',
        ruleHint: 'MQ 最低位为 0，ALU 加 0 保持 ACC 不变',
        highlightMqTail: 1,
        label: '第 3 步（加 0）',
        description: '末位 y2 = 0，跳过实质加法，保持 ACC = 0.1001。',
      },
      {
        acc: '0.0100',
        mq: '1111',
        op: '逻辑右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '联合逻辑右移 1 位：ACC 末位 1 滑入 MQ，MQ 当前末位变为 1',
        highlightMqTail: 1,
        label: '第 3 步（联合逻辑右移）',
        description: '联合逻辑右移 1 位，MQ 左侧 3 位现为已算出的低位积，最右侧仅剩最后 1 位待判乘数。',
      },
      {
        acc: '1.0001',
        mq: '1111',
        op: '末位=1 → +|x|',
        actionKind: 'add-pos',
        activeBranch: 'mq1',
        aluOperand: '+0.1101',
        ruleHint: 'MQ 最低位为 1，ALU 计算 0.0100 + 0.1101 = 1.0001',
        highlightMqTail: 1,
        label: '第 4 步（加被乘数）',
        description: '最后一位乘数 y1 = 1，ALU 将 |x| 加到 ACC 得 1.0001。',
      },
      {
        acc: '0.1000',
        mq: '1111',
        op: '逻辑右移 1 位（完成）',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '4 位乘数全部淘汰完毕，ACC 小数部分与 MQ 无缝拼成 8 位数值积 10001111',
        label: '运算完成并拼合符号位',
        description: '拼合数值位 10001111 与符号位 Pf = 1，得 [x·y]原 = 1.10001111（即 -143/256）。',
      },
    ],
  },
  'booth-mul1': {
    id: 'booth-mul1',
    kind: 'mul',
    shortName: 'Booth 补码一位乘',
    fullName: '补码一位乘法（Booth 算法 · 折叠连续 1 串 · 高频核心）',
    priorityLabel: '高频核心',
    priorityTone: 'high',
    inputsSummary: 'x = -0.1101 ([x]补 = 11.0011, [-x]补 = 00.1101), y = +0.1011 ([y]补 = 0.1011)',
    xLabel: '[x]补',
    xValue: '11.0011',
    negXLabel: '[-x]补',
    negXValue: '00.1101',
    resultLabel: '乘积补码 [x·y]补',
    resultValue: '1.01110001 (-143/256)',
    branches: [
      { code: '00/11', label: '00 或 11', action: 'ACC + 0' },
      { code: '01', label: '01（出 1 串）', action: 'ACC + [x]补' },
      { code: '10', label: '10（进 1 串）', action: 'ACC + [-x]补' },
    ],
    frames: [
      {
        acc: '00.0000',
        mq: '0.1011',
        aux: '0',
        op: '初始化',
        actionKind: 'init',
        ruleHint: 'ACC 采用双符号位置 00.0000；MQ 存入 [y]补；附加位 yₙ₊₁ 初值为 0',
        highlightMqTail: 1,
        highlightAux: true,
        label: '初始化（含附加位 0）',
        description: '符号位直接参与运算，ACC 用双符号位 00.0000 防溢出，附加位 y5 = 0。',
      },
      {
        acc: '00.1101',
        mq: '0.1011',
        aux: '0',
        op: '10 → +[-x]补',
        actionKind: 'add-neg',
        activeBranch: '10',
        aluOperand: '+00.1101 ([-x]补)',
        ruleHint: '末两位 (y4, y5) = 10，进入连续 1 串，ALU 送入 [-x]补 与 ACC 相加',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 1 步（加 [-x]补）',
        description: '判定末两位为 10（y5 - y4 = -1），ALU 将 [-x]补 = 00.1101 加到 ACC。',
      },
      {
        acc: '00.0110',
        mq: '1.0101',
        aux: '1',
        op: '算术右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: 'ACC 高位补符号 0；ACC 末位 1 滑入 MQ；MQ 原末位 1 滑入附加位 yₙ₊₁',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 1 步（算术右移）',
        description: '算术右移 1 位：保持符号位不变，MQ 原 y4 = 1 滑入附加位，准备下一组判定。',
      },
      {
        acc: '00.0110',
        mq: '1.0101',
        aux: '1',
        op: '11 → +0',
        actionKind: 'add-zero',
        activeBranch: '00/11',
        aluOperand: '+00.0000',
        ruleHint: '末两位 (y3, y4) = 11，处于连续 1 串内部，折叠省去此次加法',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 2 步（折叠跳过）',
        description: '连续 1 的中间位判定为 11，ALU 加 0，直接准备右移。',
      },
      {
        acc: '00.0011',
        mq: '0.1010',
        aux: '1',
        op: '算术右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '全体算术右移 1 位，此时判定末两位变成 (0, 1)',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 2 步（算术右移）',
        description: '继续算术右移 1 位：ACC 末位 0 滑入 MQ，原 y3 = 1 滑入附加位。',
      },
      {
        acc: '11.0110',
        mq: '0.1010',
        aux: '1',
        op: '01 → +[x]补',
        actionKind: 'add-pos',
        activeBranch: '01',
        aluOperand: '+11.0011 ([x]补)',
        ruleHint: '末两位 = 01（走出 1 串），ALU 将 [x]补 加回高一位权重',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 3 步（加 [x]补）',
        description: '判定末两位为 01，ALU 计算 00.0011 + 11.0011 = 11.0110。',
      },
      {
        acc: '11.1011',
        mq: '0.0101',
        aux: '0',
        op: '算术右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '注意：ACC 为负（符号位 11），算术右移高位必须补 1！',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 3 步（负号算术右移）',
        description: 'ACC 为负值，算术右移时高位补符号 1 得 11.1011，原 y2 = 0 进入附加位。',
      },
      {
        acc: '00.1000',
        mq: '0.0101',
        aux: '0',
        op: '10 → +[-x]补',
        actionKind: 'add-neg',
        activeBranch: '10',
        aluOperand: '+00.1101 ([-x]补)',
        ruleHint: '末两位 = 10，ALU 将 [-x]补 与 ACC 相加得 00.1000',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 4 步（加 [-x]补）',
        description: '判定末两位为 10，加上 [-x]补 后 ACC 转正为 00.1000。',
      },
      {
        acc: '00.0100',
        mq: '0.0010',
        aux: '1',
        op: '算术右移 1 位',
        actionKind: 'shift-right',
        shiftDirection: 'right',
        ruleHint: '第 4 次算术右移完成；接下来进入第 n+1 步（只加减、不移位）',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 4 步（算术右移）',
        description: '第 4 次算术右移完成，此时 MQ 仅剩符号位 y0 = 0（位于最右侧）与附加位 y1 = 1。',
      },
      {
        acc: '11.0111',
        mq: '0.0010',
        aux: '1',
        op: '01 → +[x]补（不移位）',
        actionKind: 'add-pos',
        activeBranch: '01',
        aluOperand: '+11.0011 ([x]补)',
        ruleHint: '第 5 步对应 2⁰ 项，加上 [x]补 后严禁右移；截取 ACC 与 MQ 高 4 位',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 5 步收尾（不移位）',
        description: '末步根据 (0, 1) 加 [x]补 得 11.0111 且不再移位，取 1.0111 与 MQ 高 4 位 0001 得 1.01110001。',
      },
    ],
  },
  'orig-div': {
    id: 'orig-div',
    kind: 'div',
    shortName: '原码加减交替除',
    fullName: '原码加减交替除法（负余数直接左移加 |y| · 中低频）',
    priorityLabel: '中低频·重原理',
    priorityTone: 'medium',
    inputsSummary: 'x = -0.1010, y = +0.1101（|x| = 0.1010, |y| = 0.1101, [-|y|]补 = 11.0011）',
    xLabel: '|y|',
    xValue: '00.1101',
    negXLabel: '-|y|补',
    negXValue: '11.0011',
    resultLabel: '商与余数',
    resultValue: 'Q = 1.1100, R = +0.0100 × 2⁻⁴',
    branches: [
      { code: 'r>=0', label: '余数 R ≥ 0', action: '上商 1，左移后 -|y|' },
      { code: 'r<0', label: '余数 R < 0', action: '上商 0，左移后 +|y|' },
    ],
    frames: [
      {
        acc: '00.1010',
        mq: '0000',
        op: '初始化被除数',
        actionKind: 'init',
        ruleHint: '商符号 Qf = 1⊕0 = 1；ACC 存 |x| = 00.1010，MQ 准备逐位左移写入商',
        label: '初始化余数寄存器',
        description: '符号位单独异或 Qf = 1。ACC 装入 |x| = 00.1010（双符号位防止左移丢失符号）。',
      },
      {
        acc: '11.1101',
        mq: '0000',
        op: '初减 |y| → R < 0',
        actionKind: 'add-neg',
        activeBranch: 'r<0',
        aluOperand: '-|y| (11.0011)',
        ruleHint: '试减后余数 R < 0（未溢出，q0 = 0），跳过恢复余数，下步直接左移加 |y|',
        label: '试减判溢出（q0 = 0）',
        description: '先试减 |y|：余数为负说明 |x| < |y|（无溢出）；利用 2(R+|y|)-|y| = 2R+|y|，直接进入左移。',
      },
      {
        acc: '11.1010',
        mq: '0000',
        op: '逻辑左移 1 位',
        actionKind: 'shift-left',
        shiftDirection: 'left',
        ruleHint: 'ACC 左移 1 位相当于乘 2，准备由 ALU 执行 +|y|',
        label: '左移准备第 1 位商',
        description: 'ACC 左移 1 位得 11.1010，准备执行 +|y|。',
      },
      {
        acc: '00.0111',
        mq: '0001',
        op: '+|y| → R ≥ 0 → q1=1',
        actionKind: 'add-pos',
        activeBranch: 'r>=0',
        aluOperand: '+|y| (00.1101)',
        quotientInsertIndex: 3,
        highlightMqTail: 1,
        ruleHint: 'ACC + |y| = 00.0111 ≥ 0，余数转正，写入商位 q1 = 1',
        label: '第 1 步（上商 q1 = 1）',
        description: 'ALU 加上 |y| 后余数转正，上商 q1 = 1 写入 MQ 末位。',
      },
      {
        acc: '00.0001',
        mq: '0011',
        op: '左移后 -|y| → R ≥ 0 → q2=1',
        actionKind: 'shift-left',
        activeBranch: 'r>=0',
        shiftDirection: 'left',
        aluOperand: '-|y| (11.0011)',
        highlightMqTail: 1,
        ruleHint: 'ACC 左移为 00.1110 并减 |y| 得 00.0001 ≥ 0；MQ 整体左移，写入 q2 = 1',
        label: '第 2 步（上商 q2 = 1）',
        description: '左移并减 |y| 后余数仍非负，MQ 左移接纳新商位 q2 = 1。',
      },
      {
        acc: '11.0101',
        mq: '0110',
        op: '左移后 -|y| → R < 0 → q3=0',
        actionKind: 'shift-left',
        activeBranch: 'r<0',
        shiftDirection: 'left',
        aluOperand: '-|y| (11.0011)',
        highlightMqTail: 1,
        ruleHint: '左移减 |y| 得 11.0101 < 0，MQ 左移写入 q3 = 0，下步改加 |y|',
        label: '第 3 步（上商 q3 = 0）',
        description: '左移减 |y| 后余数为负，上商 q3 = 0 滑入 MQ 末位，下一步转为 +|y|。',
      },
      {
        acc: '11.0111',
        mq: '1100',
        op: '左移后 +|y| → R < 0 → q4=0',
        actionKind: 'shift-left',
        activeBranch: 'r<0',
        shiftDirection: 'left',
        aluOperand: '+|y| (00.1101)',
        highlightMqTail: 1,
        ruleHint: '左移加 |y| 得 11.0111 < 0，MQ 左移写入末位商 q4 = 0（不再左移）',
        label: '第 4 步（最后一位 q4 = 0）',
        description: '第 4 次左移后加 |y|，得到全部 4 位小数商 1100，但最终余数仍为负！',
      },
      {
        acc: '00.0100',
        mq: '1100',
        op: '终步恢复余数 (+|y|)',
        actionKind: 'restore',
        aluOperand: '+|y| (00.1101)',
        ruleHint: '因最终余数 11.0111 < 0，需由 ALU 补加一次 |y| 恢复为正余数 00.0100',
        label: '终步恢复正余数',
        description: '补加一次 |y| 还原最终正余数 00.0100 × 2⁻⁴，商 1.1100 保持不变。',
      },
    ],
  },
  'comp-div': {
    id: 'comp-div',
    kind: 'div',
    shortName: '补码加减交替除',
    fullName: '补码加减交替除法（看余数与除数是否同号 · 极低频）',
    priorityLabel: '极低频·了解即可',
    priorityTone: 'low',
    inputsSummary: 'x = -0.1010 ([x]补 = 11.0110), y = +0.1101 ([y]补 = 00.1101, [-y]补 = 11.0011)',
    xLabel: '[y]补',
    xValue: '00.1101',
    negXLabel: '[-y]补',
    negXValue: '11.0011',
    resultLabel: '商补码（末位恒置 1）',
    resultValue: '[Q]补 = 1.0011（精度误差 < 2⁻⁴）',
    branches: [
      { code: 'same', label: 'R 与 y 同号', action: '上商 1，下步 -[y]补' },
      { code: 'diff', label: 'R 与 y 异号', action: '上商 0，下步 +[y]补' },
    ],
    frames: [
      {
        acc: '11.0110',
        mq: '0.0000',
        op: '初始化 [x]补',
        actionKind: 'init',
        ruleHint: '[x]补(负) 与 [y]补(正) 异号，第一步执行 +[y]补；MQ 含符号位 q0 共 5 位',
        label: '初始化（异号准备 +[y]补）',
        description: '补码除法直接让 [x]补 与 [y]补 参与运算：为使余数逼近 0，异号相加、同号相减。',
      },
      {
        acc: '00.0011',
        mq: '0.0001',
        op: '异号 +[y]补 → 同号 q0=1',
        actionKind: 'add-pos',
        activeBranch: 'same',
        aluOperand: '+[y]补 (00.1101)',
        quotientInsertIndex: 4,
        highlightMqTail: 1,
        ruleHint: '新余数 00.0011(+) 与 [y]补(00.1101, +) 同号 → 商符号位 q0 = 1',
        label: '确定商符号位 q0 = 1',
        description: '相加后余数为正，与 [y]补 同号，故自动在符号位上商 q0 = 1，下一步减 [y]补。',
      },
      {
        acc: '11.1001',
        mq: '0.0010',
        op: '左移后 -[y]补 → 异号 q1=0',
        actionKind: 'shift-left',
        activeBranch: 'diff',
        shiftDirection: 'left',
        aluOperand: '-[y]补 (11.0011)',
        highlightMqTail: 1,
        ruleHint: '左移减 [y]补 得 11.1001(-)，与除数(+) 异号 → 上商 q1 = 0',
        label: '第 1 步（异号上商 0）',
        description: '左移并减 [y]补 后余数转负，与 [y]补 异号，上商 q1 = 0，下一步改加 [y]补。',
      },
      {
        acc: '11.1111',
        mq: '0.0100',
        op: '左移后 +[y]补 → 异号 q2=0',
        actionKind: 'shift-left',
        activeBranch: 'diff',
        shiftDirection: 'left',
        aluOperand: '+[y]补 (00.1101)',
        highlightMqTail: 1,
        ruleHint: '左移加 [y]补 得 11.1111(-)，仍与除数异号 → 上商 q2 = 0',
        label: '第 2 步（异号上商 0）',
        description: '左移并加 [y]补 后余数仍为负，继续上商 q2 = 0。',
      },
      {
        acc: '00.1011',
        mq: '0.1001',
        op: '左移后 +[y]补 → 同号 q3=1',
        actionKind: 'shift-left',
        activeBranch: 'same',
        shiftDirection: 'left',
        aluOperand: '+[y]补 (00.1101)',
        highlightMqTail: 1,
        ruleHint: '左移加 [y]补 得 00.1011(+)，与除数同号 → 上商 q3 = 1',
        label: '第 3 步（同号上商 1）',
        description: '余数转正与除数同号，MQ 左移写入 q3 = 1。',
      },
      {
        acc: '00.1011',
        mq: '1.0011',
        op: '左移 MQ 并末位恒置 1',
        actionKind: 'shift-left',
        shiftDirection: 'left',
        mqOnlyShift: true,
        highlightMqTail: 1,
        ruleHint: '不再对 ACC 加减，仅将 MQ 左移并按“末位恒置 1”法令 q4 = 1，得 [Q]补 = 1.0011',
        label: '第 4 步（末位恒置 1）',
        description: '408 教材采用末位商恒置 1 收尾，无需恢复余数，最大误差不超过 2⁻ⁿ。',
      },
    ],
  },
};

const ALGO_ORDER: AlgoId[] = ['booth-mul1', 'orig-mul1', 'orig-div', 'comp-div'];

export interface MulDivDemoProps {
  algos?: AlgoId[];
  title?: string;
  caption?: string;
}

function stripDots(value: string): string[] {
  return value.replace(/\./g, '').split('');
}

function buildTimeline(uid: string, dataset: AlgoDataset): FrameTokens[] {
  let seq = 0;
  const nextId = () => `${uid}-bit-${seq++}`;
  const timeline: FrameTokens[] = [];

  dataset.frames.forEach((frame, frameIdx) => {
    const accDigits = stripDots(frame.acc);
    const mqDigits = stripDots(frame.mq);

    if (frameIdx === 0) {
      timeline.push({
        accTokens: accDigits.map((bit) => ({ id: nextId(), bit, role: 'acc' })),
        mqTokens: mqDigits.map((bit) => ({ id: nextId(), bit, role: 'mq' })),
        auxToken:
          frame.aux !== undefined ? { id: nextId(), bit: frame.aux, role: 'aux' } : undefined,
      });
      return;
    }

    const prev = timeline[frameIdx - 1];

    if (frame.shiftDirection === 'right') {
      const shiftedAcc: BitToken[] = [
        { id: nextId(), bit: accDigits[0], role: 'acc' },
        ...prev.accTokens.slice(0, -1).map((tok, i) => ({
          ...tok,
          bit: accDigits[i + 1],
        })),
      ];
      const enteringMq = prev.accTokens[prev.accTokens.length - 1];
      const shiftedMq: BitToken[] = [
        { ...enteringMq, bit: mqDigits[0], role: 'prod' },
        ...prev.mqTokens.slice(0, -1).map((tok, i) => ({
          ...tok,
          bit: mqDigits[i + 1],
        })),
      ];
      const nextAux =
        frame.aux !== undefined
          ? {
              ...prev.mqTokens[prev.mqTokens.length - 1],
              bit: frame.aux,
              role: 'aux' as const,
            }
          : undefined;

      timeline.push({
        accTokens: shiftedAcc,
        mqTokens: shiftedMq,
        auxToken: nextAux,
      });
      return;
    }

    if (frame.shiftDirection === 'left') {
      const shiftedAcc: BitToken[] = frame.mqOnlyShift
        ? prev.accTokens.map((tok, i) => ({ ...tok, bit: accDigits[i] }))
        : [
            ...prev.accTokens.slice(1).map((tok, i) => ({
              ...tok,
              bit: accDigits[i],
            })),
            { id: nextId(), bit: accDigits[accDigits.length - 1], role: 'acc' },
          ];

      const keepPrevMq =
        dataset.id === 'orig-div' && frameIdx === 2
          ? prev.mqTokens.map((tok, i) => ({ ...tok, bit: mqDigits[i] }))
          : [
              ...prev.mqTokens.slice(1).map((tok, i) => ({
                ...tok,
                bit: mqDigits[i],
              })),
              {
                id: nextId(),
                bit: mqDigits[mqDigits.length - 1],
                role: 'quot' as const,
              },
            ];

      timeline.push({
        accTokens: shiftedAcc,
        mqTokens: keepPrevMq,
        auxToken: prev.auxToken,
      });
      return;
    }

    // In-place update (ALU add/sub/restore or quotient bit insertion)
    timeline.push({
      accTokens: prev.accTokens.map((tok, i) => ({ ...tok, bit: accDigits[i] })),
      mqTokens: prev.mqTokens.map((tok, i) => {
        if (frame.quotientInsertIndex === i) {
          return { ...tok, bit: mqDigits[i], role: 'quot' };
        }
        return { ...tok, bit: mqDigits[i] };
      }),
      auxToken: prev.auxToken
        ? { ...prev.auxToken, bit: frame.aux ?? prev.auxToken.bit }
        : undefined,
    });
  });

  return timeline;
}

function priorityBadgeStyle(tone: PriorityTone) {
  if (tone === 'high') {
    return 'border-sky-500/40 bg-sky-500/12 text-sky-700 dark:text-sky-300';
  }
  if (tone === 'medium') {
    return 'border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300';
  }
  return 'border-border bg-muted text-muted-foreground';
}

function tokenStyle(token: BitToken, isHighlighted: boolean) {
  if (isHighlighted) {
    return 'border-primary bg-primary/18 font-bold text-primary shadow-xs';
  }
  if (token.role === 'prod' || token.role === 'quot') {
    return 'border-emerald-500/45 bg-emerald-500/12 font-semibold text-emerald-700 dark:text-emerald-300';
  }
  if (token.role === 'acc') {
    return 'border-border bg-background/90 font-semibold text-foreground';
  }
  return 'border-border bg-muted/55 text-foreground';
}

function renderRegisterWithDot(
  rawPattern: string,
  tokens: BitToken[],
  highlightTailCount: number,
  isWritePulse: boolean,
) {
  let digitCursor = 0;
  const totalDigits = tokens.length;

  return rawPattern.split('').map((ch, rawIdx) => {
    if (ch === '.') {
      return (
        <span
          key={`dot-${rawIdx}`}
          className="flex h-9 w-2 items-end justify-center pb-1 font-mono text-base font-bold text-muted-foreground"
        >
          .
        </span>
      );
    }

    const token = tokens[digitCursor];
    const fromRight = totalDigits - 1 - digitCursor;
    const isTail = highlightTailCount > 0 && fromRight < highlightTailCount;
    digitCursor += 1;

    return (
      <motion.div
        key={token.id}
        layout="position"
        layoutId={token.id}
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{
          opacity: 1,
          scale: isWritePulse ? [1, 1.06, 1] : 1,
        }}
        exit={{ opacity: 0, scale: 0.72 }}
        transition={{
          layout: { type: 'spring', stiffness: 380, damping: 30 },
          duration: 0.22,
        }}
        className={cn(
          'flex h-9 w-8 items-center justify-center rounded-md border font-mono text-sm',
          tokenStyle(token, isTail),
        )}
      >
        {token.bit}
      </motion.div>
    );
  });
}

export default function MulDivDemo({
  algos = ALGO_ORDER,
  title = '定点数乘除算法硬件通路与移位演示',
  caption = '观察控制分支、ALU 加减通路与 ACC / MQ 比特块的真实平移动画。',
}: MulDivDemoProps) {
  const activeAlgos = algos.length > 0 ? algos : ALGO_ORDER;
  const instanceKey = activeAlgos.join('-');
  const [algoId, setAlgoId] = useState<AlgoId>(activeAlgos[0] ?? 'booth-mul1');
  const [step, setStep] = useState(0);

  const dataset = DATASETS[algoId] ?? DATASETS[activeAlgos[0]];

  const timeline = useMemo(
    () => buildTimeline(`${instanceKey}-${dataset.id}`, dataset),
    [instanceKey, dataset],
  );

  const safeStep = Math.min(step, dataset.frames.length - 1);
  const frame = dataset.frames[safeStep];
  const frameTokens = timeline[safeStep];
  const steps: StepItem[] = dataset.frames.map((f) => ({
    label: f.label,
    description: f.description,
  }));

  const handleAlgoChange = (next: string) => {
    setAlgoId(next as AlgoId);
    setStep(0);
  };

  const isAluActive =
    frame.actionKind === 'add-pos' ||
    frame.actionKind === 'add-neg' ||
    frame.actionKind === 'restore' ||
    (frame.actionKind === 'shift-left' && Boolean(frame.aluOperand));

  const isShiftActive =
    frame.actionKind === 'shift-right' || frame.actionKind === 'shift-left';

  return (
    <MotionConfig reducedMotion="user">
      <InteractiveFigure
        title={title}
        badge="2D 硬件动画"
        caption={caption}
        onReset={() => setStep(0)}
      >
        <div className="space-y-4">
          {activeAlgos.length > 1 && (
            <Tabs value={algoId} onValueChange={handleAlgoChange}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1.5">
                {activeAlgos.map((id) => {
                  const item = DATASETS[id];
                  return (
                    <TabsTrigger key={id} value={id} className="gap-1.5 px-2.5 py-1.5">
                      <span>{item.shortName}</span>
                      <span
                        className={cn(
                          'rounded px-1 py-0.5 text-[10px] leading-none font-normal',
                          item.priorityTone === 'high'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : item.priorityTone === 'medium'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-muted-foreground/15 text-muted-foreground',
                        )}
                      >
                        {item.priorityTone === 'high'
                          ? '高频'
                          : item.priorityTone === 'medium'
                            ? '中频'
                            : '低频'}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}

          {/* Header info + live branch decision pills */}
          <div className="rounded-xl border border-border bg-muted/35 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{dataset.fullName}</span>
              <Badge variant="outline" className={priorityBadgeStyle(dataset.priorityTone)}>
                408 考频：{dataset.priorityLabel}
              </Badge>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              {dataset.inputsSummary}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">判定分支：</span>
              {dataset.branches.map((br) => {
                const isActive = frame.activeBranch === br.code;
                return (
                  <div
                    key={br.code}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                      isActive
                        ? 'border-primary bg-primary/15 font-semibold text-primary'
                        : 'border-border/80 bg-background/60 text-muted-foreground',
                    )}
                  >
                    <span>{br.label}</span>
                    <span className="opacity-65">→</span>
                    <span>{br.action}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hardware Datapath SVG + Live Registers */}
          <div className="rounded-xl border border-border bg-card/65 p-4">
            {/* SVG Datapath Schematic */}
            <div className="mb-3 overflow-x-auto">
              <svg
                viewBox="0 0 640 108"
                className="mx-auto h-auto w-full max-w-[640px]"
                aria-label="三寄存器与 ALU 硬件数据通路"
              >
                <defs>
                  <marker
                    id={`arrow-${instanceKey}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
                  </marker>
                </defs>

                {/* X Register box */}
                <rect
                  x="16"
                  y="14"
                  width="148"
                  height="42"
                  rx="8"
                  className={cn(
                    'transition-colors',
                    isAluActive
                      ? 'fill-sky-500/12 stroke-sky-500'
                      : 'fill-background/80 stroke-border',
                  )}
                  strokeWidth="1.5"
                />
                <text
                  x="90"
                  y="31"
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[10px]"
                >
                  X（锁存器·不动）
                </text>
                <text
                  x="90"
                  y="47"
                  textAnchor="middle"
                  className="fill-foreground font-mono text-[11px] font-semibold"
                >
                  {dataset.xLabel}={dataset.xValue}
                </text>

                {/* Path X -> ALU */}
                <path
                  d="M 164 35 L 236 35"
                  fill="none"
                  strokeWidth={isAluActive ? '2.2' : '1.4'}
                  strokeDasharray={frame.actionKind === 'add-zero' ? '4 4' : undefined}
                  className={cn(
                    'transition-colors',
                    isAluActive ? 'text-primary stroke-primary' : 'text-muted-foreground/50 stroke-border',
                  )}
                  markerEnd={`url(#arrow-${instanceKey})`}
                />
                {frame.aluOperand && (
                  <text
                    x="200"
                    y="27"
                    textAnchor="middle"
                    className="fill-primary font-mono text-[9.5px] font-semibold"
                  >
                    {frame.aluOperand}
                  </text>
                )}

                {/* ALU box */}
                <polygon
                  points="242,10 358,10 342,60 258,60"
                  className={cn(
                    'transition-colors',
                    isAluActive
                      ? 'fill-primary/15 stroke-primary'
                      : 'fill-muted/50 stroke-border',
                  )}
                  strokeWidth="1.6"
                />
                <text
                  x="300"
                  y="33"
                  textAnchor="middle"
                  className={cn(
                    'font-mono text-[11px] font-bold',
                    isAluActive ? 'fill-primary' : 'fill-muted-foreground',
                  )}
                >
                  ALU 加法器
                </text>
                <text
                  x="300"
                  y="49"
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[9.5px]"
                >
                  {isAluActive
                    ? '执行加减并写回 ACC'
                    : frame.actionKind === 'add-zero'
                      ? '本拍跳过 (+0)'
                      : isShiftActive
                        ? '空闲（移位中）'
                        : '就绪'}
                </text>

                {/* Feedback ALU -> ACC */}
                <path
                  d="M 300 60 L 300 94"
                  fill="none"
                  strokeWidth={isAluActive ? '2.2' : '1.4'}
                  className={cn(
                    'transition-colors',
                    isAluActive ? 'text-primary stroke-primary' : 'text-muted-foreground/45 stroke-border',
                  )}
                  markerEnd={`url(#arrow-${instanceKey})`}
                />

                {/* Control box */}
                <rect
                  x="436"
                  y="14"
                  width="188"
                  height="42"
                  rx="8"
                  className={cn(
                    'transition-colors',
                    isShiftActive
                      ? 'fill-emerald-500/12 stroke-emerald-500'
                      : 'fill-background/80 stroke-border',
                  )}
                  strokeWidth="1.5"
                />
                <text
                  x="530"
                  y="31"
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[10px]"
                >
                  控制与移位信号
                </text>
                <text
                  x="530"
                  y="47"
                  textAnchor="middle"
                  className={cn(
                    'font-mono text-[11px] font-semibold',
                    isShiftActive ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-foreground',
                  )}
                >
                  {frame.op}
                </text>

                {/* Shift bus indicator */}
                <path
                  d={
                    frame.shiftDirection === 'left'
                      ? 'M 490 84 L 372 84'
                      : 'M 372 84 L 490 84'
                  }
                  fill="none"
                  strokeWidth={isShiftActive ? '2.2' : '1.2'}
                  strokeDasharray={isShiftActive ? undefined : '4 4'}
                  className={cn(
                    'transition-colors',
                    isShiftActive
                      ? 'text-emerald-600 stroke-emerald-500 dark:text-emerald-400'
                      : 'text-muted-foreground/40 stroke-border',
                  )}
                  markerEnd={`url(#arrow-${instanceKey})`}
                />
                <text
                  x="431"
                  y="77"
                  textAnchor="middle"
                  className={cn(
                    'font-mono text-[9.5px] font-semibold',
                    isShiftActive ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-muted-foreground/60',
                  )}
                >
                  {frame.shiftDirection === 'right'
                    ? '联合右移 (ACC → MQ)'
                    : frame.shiftDirection === 'left'
                      ? frame.mqOnlyShift
                        ? 'MQ 左移置 1'
                        : '联合左移 (ACC ⇄ MQ)'
                      : '移位总线'}
                </text>
              </svg>
            </div>

            {/* Animated Bit-Token Registers */}
            <div className="flex flex-wrap items-center justify-center gap-4 overflow-x-auto rounded-lg border border-border/80 bg-muted/25 px-3 py-3">
              {/* ACC */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>ACC（部分积 / 余数）</span>
                </div>
                <div className="flex items-center gap-1">
                  <AnimatePresence initial={false}>
                    {renderRegisterWithDot(frame.acc, frameTokens.accTokens, 0, isAluActive)}
                  </AnimatePresence>
                </div>
              </div>

              {/* Direction connector between ACC and MQ */}
              <div className="flex flex-col items-center justify-center pt-4 font-mono text-xs">
                <span
                  className={cn(
                    'rounded border px-1.5 py-0.5 text-[11px] font-semibold transition-colors',
                    isShiftActive
                      ? 'border-emerald-500/45 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                      : 'border-border/70 bg-background/60 text-muted-foreground',
                  )}
                >
                  {frame.shiftDirection === 'right'
                    ? '⇢'
                    : frame.shiftDirection === 'left'
                      ? '⇠'
                      : '·'}
                </span>
              </div>

              {/* MQ */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                  <span>MQ（乘数 / 商）</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    绿格 = {dataset.kind === 'mul' ? '低位积' : '已生成商'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <AnimatePresence initial={false}>
                    {renderRegisterWithDot(
                      frame.mq,
                      frameTokens.mqTokens,
                      frame.highlightMqTail ?? 0,
                      false,
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Auxiliary bit for Booth */}
              {frameTokens.auxToken && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] text-muted-foreground">附加位 yₙ₊₁</div>
                  <div className="flex items-center">
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={frameTokens.auxToken.id}
                        layout="position"
                        layoutId={frameTokens.auxToken.id}
                        initial={{ opacity: 0, scale: 0.82 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.72 }}
                        transition={{
                          layout: { type: 'spring', stiffness: 380, damping: 30 },
                          duration: 0.22,
                        }}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm font-bold',
                          frame.highlightAux
                            ? 'border-primary bg-primary/18 text-primary'
                            : 'border-border bg-muted/50 text-foreground',
                        )}
                      >
                        {frameTokens.auxToken.bit}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{frame.ruleHint}</p>

            {safeStep === dataset.frames.length - 1 && (
              <div className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                {dataset.resultLabel}：{dataset.resultValue}
              </div>
            )}
          </div>
        </div>

        <StepPlayer steps={steps} current={safeStep} onChange={setStep} intervalMs={1400} />
      </InteractiveFigure>
    </MotionConfig>
  );
}

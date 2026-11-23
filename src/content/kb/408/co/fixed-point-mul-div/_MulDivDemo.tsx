import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InteractiveFigure } from '@/components/viz/InteractiveFigure';
import { StepPlayer, type StepItem } from '@/components/viz/StepPlayer';
import { cn } from '@/lib/utils';

type AlgoId = 'orig-mul1' | 'booth-mul1' | 'comp-mul2' | 'orig-div' | 'comp-div';

type PriorityTone = 'high' | 'medium' | 'low';

interface AlgoFrame {
  acc: string;
  mq: string;
  aux?: string;
  op: string;
  ruleHint: string;
  highlightMqTail?: number;
  highlightAux?: boolean;
  shiftDirection?: 'right' | 'left';
  label: string;
  description: string;
}

interface AlgoDataset {
  id: AlgoId;
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
  frames: AlgoFrame[];
}

const DATASETS: Record<AlgoId, AlgoDataset> = {
  'orig-mul1': {
    id: 'orig-mul1',
    shortName: '原码一位乘',
    fullName: '原码一位乘法（符号位独立异或 + 数值位逻辑右移）',
    priorityLabel: '中高频',
    priorityTone: 'high',
    inputsSummary: 'x = -0.1101, y = +0.1011（取 |x| = 0.1101, |y| = 0.1011，符号 Pf = 1⊕0 = 1）',
    xLabel: '|x|',
    xValue: '0.1101',
    resultLabel: '乘积原码 [x·y]原',
    resultValue: '1.10001111 (-143/256)',
    frames: [
      {
        acc: '0.0000',
        mq: '1011',
        op: '初始化',
        ruleHint: 'ACC 置 0；MQ 存入乘数绝对值 |y| = 1011，准备判断末位',
        highlightMqTail: 1,
        label: '初始化部分积与乘数',
        description: '符号位单独求异或 Pf = 1。ACC 设 1 位进位保护位初值 0.0000，MQ 装入 |y| = 1011。',
      },
      {
        acc: '0.1101',
        mq: '1011',
        op: '末位=1 → +|x|',
        ruleHint: 'MQ 最低位为 1，执行 ACC ← ACC + 0.1101',
        highlightMqTail: 1,
        label: '第 1 步（加被乘数）',
        description: '判断 MQ 末位 y4 = 1，将 |x| = 0.1101 加到 ACC，得到 0.1101。',
      },
      {
        acc: '0.0110',
        mq: '1101',
        op: '逻辑右移 1 位',
        ruleHint: 'ACC 与 MQ 联合逻辑右移 1 位，高位补 0，ACC 末位进入 MQ 高位',
        shiftDirection: 'right',
        highlightMqTail: 1,
        label: '第 1 步（逻辑右移）',
        description: '联合逻辑右移 1 位：ACC 变为 0.0110，原末位 1 移入 MQ 高位，MQ 变为 1101（当前待判末位为 1）。',
      },
      {
        acc: '1.0011',
        mq: '1101',
        op: '末位=1 → +|x|',
        ruleHint: 'MQ 最低位为 1，ACC + 0.1101 = 1.0011（保护位产生进位 1）',
        highlightMqTail: 1,
        label: '第 2 步（加被乘数）',
        description: '末位 y3 = 1，执行 ACC + |x| = 0.0110 + 0.1101 = 1.0011，保护位暂存进位 1。',
      },
      {
        acc: '0.1001',
        mq: '1110',
        op: '逻辑右移 1 位',
        ruleHint: '逻辑右移将保护位 1 移回数值位，ACC = 0.1001，MQ = 1110',
        shiftDirection: 'right',
        highlightMqTail: 1,
        label: '第 2 步（逻辑右移）',
        description: '联合逻辑右移 1 位，保护位 1 顺势进入小数最高位，MQ 变为 1110（当前末位为 0）。',
      },
      {
        acc: '0.1001',
        mq: '1110',
        op: '末位=0 → +0',
        ruleHint: 'MQ 最低位为 0，ACC + 0 保持 0.1001 不变',
        highlightMqTail: 1,
        label: '第 3 步（加 0）',
        description: '末位 y2 = 0，只需加 0（跳过加法）。',
      },
      {
        acc: '0.0100',
        mq: '1111',
        op: '逻辑右移 1 位',
        ruleHint: '联合逻辑右移 1 位：ACC = 0.0100，MQ = 1111',
        shiftDirection: 'right',
        highlightMqTail: 1,
        label: '第 3 步（逻辑右移）',
        description: '联合逻辑右移 1 位，ACC 末位 1 移入 MQ，MQ 变为 1111（当前末位为 1）。',
      },
      {
        acc: '1.0001',
        mq: '1111',
        op: '末位=1 → +|x|',
        ruleHint: 'MQ 最低位为 1，ACC + 0.1101 = 1.0001',
        highlightMqTail: 1,
        label: '第 4 步（加被乘数）',
        description: '最后一位 y1 = 1，ACC 加上 0.1101 得 1.0001。',
      },
      {
        acc: '0.1000',
        mq: '1111',
        op: '逻辑右移 1 位（完成）',
        ruleHint: '第 4 次右移后完成：数值部分 = ACC 小数位 + MQ = 10001111',
        shiftDirection: 'right',
        label: '运算完成并拼合符号位',
        description: '拼合数值位 10001111 与符号位 Pf = 1，得 [x·y]原 = 1.10001111（即 -143/256）。',
      },
    ],
  },
  'booth-mul1': {
    id: 'booth-mul1',
    shortName: 'Booth 补码一位乘',
    fullName: '补码一位乘法（Booth 算法 · 高频必考核心）',
    priorityLabel: '高频核心',
    priorityTone: 'high',
    inputsSummary: 'x = -0.1101 ([x]补 = 11.0011, [-x]补 = 00.1101), y = +0.1011 ([y]补 = 0.1011)',
    xLabel: '[x]补',
    xValue: '11.0011',
    negXLabel: '[-x]补',
    negXValue: '00.1101',
    resultLabel: '乘积补码 [x·y]补',
    resultValue: '1.01110001 (-143/256)',
    frames: [
      {
        acc: '00.0000',
        mq: '0.1011',
        aux: '0',
        op: '初始化',
        ruleHint: 'ACC 采用双符号位置 00.0000；MQ 存入 [y]补；附加位 y_n+1 初值为 0',
        highlightMqTail: 1,
        highlightAux: true,
        label: '初始化（含附加位 0）',
        description: '符号位直接参与运算，ACC 用双符号位 00.0000 防中间溢出，附加位 y5 = 0。',
      },
      {
        acc: '00.1101',
        mq: '0.1011',
        aux: '0',
        op: '10 → +[-x]补',
        ruleHint: '末两位 (y4, y5) = 10，执行 ACC ← ACC + [-x]补 (00.1101)',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 1 步（加 [-x]补）',
        description: '判定末两位为 10（即 y4 - y5 = 1），ACC 加上 [-x]补 = 00.1101。',
      },
      {
        acc: '00.0110',
        mq: '1.0101',
        aux: '1',
        op: '算术右移 1 位',
        ruleHint: 'ACC 符号位 0 不变，全体算术右移 1 位，原 y4 挤入附加位',
        shiftDirection: 'right',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 1 步（算术右移）',
        description: '算术右移 1 位：ACC 高位补符号 0 得 00.0110，MQ 变为 1.0101，附加位更新为 1。',
      },
      {
        acc: '00.0110',
        mq: '1.0101',
        aux: '1',
        op: '11 → +0',
        ruleHint: '末两位 (y3, y4) = 11，无加减操作（+0）',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 2 步（加 0）',
        description: '判定末两位为 11，直接保持 ACC = 00.0110。',
      },
      {
        acc: '00.0011',
        mq: '0.1010',
        aux: '1',
        op: '算术右移 1 位',
        ruleHint: '算术右移 1 位：ACC = 00.0011，MQ = 0.1010，附加位 = 1',
        shiftDirection: 'right',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 2 步（算术右移）',
        description: '继续算术右移 1 位，此时判定末两位为 (0, 1)。',
      },
      {
        acc: '11.0110',
        mq: '0.1010',
        aux: '1',
        op: '01 → +[x]补',
        ruleHint: '末两位 = 01，执行 ACC ← ACC + [x]补 (11.0011) = 11.0110',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 3 步（加 [x]补）',
        description: '判定末两位为 01，ACC 加上 [x]补 = 11.0011 得 11.0110。',
      },
      {
        acc: '11.1011',
        mq: '0.0101',
        aux: '0',
        op: '算术右移 1 位',
        ruleHint: '注意：ACC 为负（符号位 11），算术右移高位补 1！',
        shiftDirection: 'right',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 3 步（负号算术右移）',
        description: 'ACC 为负值，算术右移时高位补 1 得到 11.1011，MQ 变为 0.0101，附加位 = 0。',
      },
      {
        acc: '00.1000',
        mq: '0.0101',
        aux: '0',
        op: '10 → +[-x]补',
        ruleHint: '末两位 = 10，ACC + [-x]补 = 11.1011 + 00.1101 = 00.1000',
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
        ruleHint: '第 4 次算术右移：ACC = 00.0100，MQ = 0.0010，附加位 = 1',
        shiftDirection: 'right',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 4 步（算术右移）',
        description: '第 4 次算术右移完成，接下来进入第 n+1 步（只加减、不移位）。',
      },
      {
        acc: '11.0111',
        mq: '0.0010',
        aux: '1',
        op: '01 → +[x]补（不移位）',
        ruleHint: '第 5 步末两位 = 01，加 [x]补 = 11.0111，严禁再右移！',
        highlightMqTail: 1,
        highlightAux: true,
        label: '第 5 步收尾（不移位）',
        description: 'Booth 第 n+1 步根据符号位 0 与附加位 1 加上 [x]补 得 11.0111，不再移位。截取 ACC 与 MQ 高 4 位得 1.01110001。',
      },
    ],
  },
  'comp-mul2': {
    id: 'comp-mul2',
    shortName: '补码两位乘',
    fullName: '补码两位乘法（每次判 3 位、算术右移 2 位 · 极低频了解）',
    priorityLabel: '极低频·了解即可',
    priorityTone: 'low',
    inputsSummary: 'x = -0.1101 ([x]补=111.0011, 2[x]补=110.0110, -2[x]补=001.1010), y = +0.0110',
    xLabel: '[x]补',
    xValue: '111.0011',
    negXLabel: '[-x]补',
    negXValue: '000.1101',
    resultLabel: '乘积补码 [x·y]补',
    resultValue: '1.10110010 (-78/256)',
    frames: [
      {
        acc: '000.0000',
        mq: '00.0110',
        aux: '0',
        op: '初始化（3 位符号位）',
        ruleHint: '因涉及 ±2[x]补，ACC 需 3 位符号位；[y]补 用双符号位 00.0110，附加位 y5 = 0',
        highlightMqTail: 2,
        highlightAux: true,
        label: '初始化（三符号位）',
        description: '一次处理乘数 2 位，乘数 n=4（偶数）需执行 n/2 + 1 = 3 步，其中右移 2 位共 2 次。',
      },
      {
        acc: '001.1010',
        mq: '00.0110',
        aux: '0',
        op: '100 → -2[x]补',
        ruleHint: '末三位 (y3,y4,y5) = 100，查表需加 [-2x]补 (001.1010)',
        highlightMqTail: 2,
        highlightAux: true,
        label: '第 1 步（加 -2[x]补）',
        description: '每次判断 3 位（y_i, y_i+1, y_i+2）：100 对应 -2X，ACC 变为 001.1010。',
      },
      {
        acc: '000.0110',
        mq: '10.0001',
        aux: '1',
        op: '算术右移 2 位',
        ruleHint: 'ACC 补符号位 00 算术右移 2 位，低 2 位 10 移入 MQ 高位',
        shiftDirection: 'right',
        highlightMqTail: 2,
        highlightAux: true,
        label: '第 1 步（算术右移 2 位）',
        description: '算术右移 2 位直接跳过 2 个乘数位，当前待判三位为 (0, 1, 1)。',
      },
      {
        acc: '110.1100',
        mq: '10.0001',
        aux: '1',
        op: '011 → +2[x]补',
        ruleHint: '末三位 = 011，查表加 2[x]补 (110.0110) 得 110.1100',
        highlightMqTail: 2,
        highlightAux: true,
        label: '第 2 步（加 +2[x]补）',
        description: '011 对应 +2X，ACC + 110.0110 = 110.1100。',
      },
      {
        acc: '111.1011',
        mq: '00.1000',
        aux: '0',
        op: '算术右移 2 位',
        ruleHint: 'ACC 高位补符号 11 算术右移 2 位：ACC = 111.1011',
        shiftDirection: 'right',
        highlightMqTail: 2,
        highlightAux: true,
        label: '第 2 步（算术右移 2 位）',
        description: '算术右移 2 位后，ACC = 111.1011，MQ 移入 00 后变成 00.1000，附加位 = 0。',
      },
      {
        acc: '111.1011',
        mq: '00.1000',
        aux: '0',
        op: '000 → +0（不移位）',
        ruleHint: '末步三位 (0, 0, 0) → +0，不移位直接拼合 ACC 与 MQ 高位得 1.10110010',
        highlightMqTail: 2,
        highlightAux: true,
        label: '第 3 步收尾（不移位）',
        description: '最后一步只加减不移位，拼接结果为 1.10110010（即 -78/256）。408 真题极少要求手算，只需理解每次判 3 位、处理 2 位即可。',
      },
    ],
  },
  'orig-div': {
    id: 'orig-div',
    shortName: '原码加减交替除',
    fullName: '原码加减交替除法（不恢复余数法 · 中低频）',
    priorityLabel: '中低频·重思想',
    priorityTone: 'medium',
    inputsSummary: 'x = -0.1010, y = +0.1101（|x| = 0.1010, |y| = 0.1101, [-|y|]补 = 11.0011）',
    xLabel: '|y| (除数)',
    xValue: '00.1101',
    negXLabel: '-|y|补',
    negXValue: '11.0011',
    resultLabel: '商与余数',
    resultValue: 'Q = 1.1100, R = +0.0100 × 2⁻⁴',
    frames: [
      {
        acc: '00.1010',
        mq: '0000',
        op: '初始化被除数',
        ruleHint: '商符号 Qf = 1⊕0 = 1；ACC 存 |x| = 00.1010，MQ 准备逐位装入商',
        label: '初始化余数寄存器',
        description: '符号位单独异或 Qf = 1。ACC 装入 |x| = 00.1010（双符号位防止移位丢失符号）。',
      },
      {
        acc: '11.1101',
        mq: '0000',
        op: '初减 |y| → R < 0',
        ruleHint: 'ACC - |y| = 11.1101 < 0，上商 q0 = 0（未溢出），下步需左移并 +|y|',
        label: '试减判溢出（得 q0=0）',
        description: '先减除数 |y|：余数为负说明 |x| < |y|（无溢出），上商 q0 = 0；不恢复余数，直接左移后加 |y|。',
      },
      {
        acc: '11.1010',
        mq: '0000',
        op: '逻辑左移 + 上商 0',
        ruleHint: 'ACC 左移 1 位得 11.1010，q0 = 0',
        shiftDirection: 'left',
        label: '左移准备第 1 位商',
        description: '左移 1 位：ACC 变为 11.1010，因前一次余数为负，下一步执行 +|y|。',
      },
      {
        acc: '00.0111',
        mq: '0001',
        op: '+|y| → R ≥ 0 → q1=1',
        ruleHint: 'ACC + 00.1101 = 00.0111 ≥ 0，余数转正，上商 q1 = 1',
        highlightMqTail: 1,
        label: '第 1 步（上商 q1=1）',
        description: '执行 +|y| 后余数 00.0111 ≥ 0，上商 q1 = 1（存入 MQ 末位）。',
      },
      {
        acc: '00.0001',
        mq: '0011',
        op: '左移后 -|y| → R ≥ 0 → q2=1',
        ruleHint: '左移为 00.1110，减 |y| 得 00.0001 ≥ 0，上商 q2 = 1',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 2 步（上商 q2=1）',
        description: '左移并减 |y|，余数仍为正（00.0001），继续上商 q2 = 1。',
      },
      {
        acc: '11.0101',
        mq: '0110',
        op: '左移后 -|y| → R < 0 → q3=0',
        ruleHint: '左移为 00.0010，减 |y| 得 11.0101 < 0，上商 q3 = 0',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 3 步（上商 q3=0）',
        description: '左移并减 |y|，余数为负（11.0101），上商 q3 = 0，下一步改为 +|y|。',
      },
      {
        acc: '11.0111',
        mq: '1100',
        op: '左移后 +|y| → R < 0 → q4=0',
        ruleHint: '左移为 10.1010，+|y| 得 11.0111 < 0，上商 q4 = 0（不再左移）',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 4 步（最后一位 q4=0）',
        description: '得到第 4 位小数商 q4 = 0（MQ = 1100），但此时最终余数 11.0111 为负！',
      },
      {
        acc: '00.0100',
        mq: '1100',
        op: '恢复余数 (+|y|)',
        ruleHint: '最终余数为负，必须加一次 |y| 恢复为正余数 00.0100（商不变）',
        label: '终步恢复正余数',
        description: '若最后余数 < 0，加回 |y| 得真正余数 00.0100 × 2⁻⁴；商拼合 Qf 得 [Q]原 = 1.1100。',
      },
    ],
  },
  'comp-div': {
    id: 'comp-div',
    shortName: '补码加减交替除',
    fullName: '补码加减交替除法（看余数与除数同异号 · 极低频）',
    priorityLabel: '极低频·了解即可',
    priorityTone: 'low',
    inputsSummary: 'x = -0.1010 ([x]补 = 11.0110), y = +0.1101 ([y]补 = 00.1101, [-y]补 = 11.0011)',
    xLabel: '[y]补',
    xValue: '00.1101',
    negXLabel: '[-y]补',
    negXValue: '11.0011',
    resultLabel: '商补码（末位恒置 1）',
    resultValue: '[Q]补 = 1.0011（精度误差 < 2⁻⁴）',
    frames: [
      {
        acc: '11.0110',
        mq: '0.0000',
        op: '初始化 [x]补',
        ruleHint: '[x]补(负) 与 [y]补(正) 异号，第一步执行 +[y]补；MQ 含符号位 q0 共 5 位',
        label: '初始化（异号准备 +[y]补）',
        description: '与原码不同，补码除法直接让 [x]补 和 [y]补 参与运算：异号相加，同号相减。',
      },
      {
        acc: '00.0011',
        mq: '0.0001',
        op: '异号 +[y]补 → 同号 q0=1',
        ruleHint: '新余数 00.0011(+) 与除数 00.1101(+) 同号 → 上商 q0 = 1（商符号位）',
        highlightMqTail: 1,
        label: '确定商符号位 q0=1',
        description: '相加后余数为正，与 [y]补 同号，故商符号位 q0 = 1（表示商为负），下一步减 [y]补。',
      },
      {
        acc: '11.1001',
        mq: '0.0010',
        op: '左移后 -[y]补 → 异号 q1=0',
        ruleHint: '左移得 00.0110，加 [-y]补 得 11.1001(-)，与除数异号 → 上商 q1 = 0',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 1 步（异号上商 0）',
        description: '左移并减 [y]补 后余数转负，与 [y]补 异号，上商 q1 = 0，下一步改为 +[y]补。',
      },
      {
        acc: '11.1111',
        mq: '0.0100',
        op: '左移后 +[y]补 → 异号 q2=0',
        ruleHint: '左移得 11.0010，+[y]补 得 11.1111(-)，仍与除数异号 → 上商 q2 = 0',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 2 步（异号上商 0）',
        description: '左移并加 [y]补 后余数仍为负，继续上商 q2 = 0。',
      },
      {
        acc: '00.1011',
        mq: '0.1001',
        op: '左移后 +[y]补 → 同号 q3=1',
        ruleHint: '左移得 11.1110，+[y]补 得 00.1011(+)，与除数同号 → 上商 q3 = 1',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 3 步（同号上商 1）',
        description: '余数转正与除数同号，上商 q3 = 1。',
      },
      {
        acc: '00.1011',
        mq: '1.0011',
        op: '左移 MQ 并末位恒置 1（q4=1）',
        ruleHint: '不再对 ACC 加减，仅将 MQ 左移并按“末位恒置 1”法令 q4 = 1，得 [Q]补 = 1.0011',
        shiftDirection: 'left',
        highlightMqTail: 1,
        label: '第 4 步（末位恒置 1）',
        description: '408 教材常规约定末位商恒置 1，免去复杂修正，最大误差不超过 2⁻ⁿ（此处 | -13/16 - (-10/13) | < 1/16）。',
      },
    ],
  },
};

const ALGO_ORDER: AlgoId[] = [
  'booth-mul1',
  'orig-mul1',
  'orig-div',
  'comp-mul2',
  'comp-div',
];

function priorityBadgeStyle(tone: PriorityTone) {
  if (tone === 'high') {
    return 'border-sky-500/40 bg-sky-500/12 text-sky-700 dark:text-sky-300';
  }
  if (tone === 'medium') {
    return 'border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300';
  }
  return 'border-border bg-muted text-muted-foreground';
}

export default function MulDivDemo() {
  const [algoId, setAlgoId] = useState<AlgoId>('booth-mul1');
  const [step, setStep] = useState(0);

  const dataset = DATASETS[algoId];
  const safeStep = Math.min(step, dataset.frames.length - 1);
  const frame = dataset.frames[safeStep];
  const steps: StepItem[] = dataset.frames.map((f) => ({
    label: f.label,
    description: f.description,
  }));

  const handleAlgoChange = (next: string) => {
    setAlgoId(next as AlgoId);
    setStep(0);
  };

  const mqChars = frame.mq.split('');
  const tailLen = frame.highlightMqTail ?? 0;

  return (
    <InteractiveFigure
      title="定点数五大乘除算法单步寄存器演示"
      badge="2D 分步交互"
      caption="切换不同算法对比高频核心（Booth / 原码一位乘）与低频算法（补码两位乘 / 补码加减交替除）的寄存器变化。"
      onReset={() => setStep(0)}
    >
      <div className="space-y-4">
        <Tabs value={algoId} onValueChange={handleAlgoChange}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1.5">
            {ALGO_ORDER.map((id) => {
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

        {/* Algorithm header & operand info */}
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
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px]">
            <span className="rounded border border-border bg-background/70 px-2 py-0.5">
              {dataset.xLabel} = {dataset.xValue}
            </span>
            {dataset.negXLabel && dataset.negXValue && (
              <span className="rounded border border-border bg-background/70 px-2 py-0.5">
                {dataset.negXLabel} = {dataset.negXValue}
              </span>
            )}
          </div>
        </div>

        {/* Register state row */}
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              当前动作：{frame.op}
            </Badge>
            {frame.shiftDirection && (
              <span className="font-mono text-xs text-primary">
                {frame.shiftDirection === 'right' ? '→ 联合右移 ←' : '← 联合左移 →'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1">
            {/* ACC register */}
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-muted-foreground">
                ACC（部分积 / 余数）
              </div>
              <div className="flex gap-1">
                {frame.acc.split('').map((ch, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md border font-mono text-sm',
                      ch === '.'
                        ? 'w-3 border-transparent bg-transparent text-muted-foreground'
                        : 'w-8 border-border bg-background/90 font-semibold text-foreground',
                    )}
                  >
                    {ch}
                  </div>
                ))}
              </div>
            </div>

            {/* MQ register */}
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-muted-foreground">
                MQ（乘数 / 商寄存器）
              </div>
              <div className="flex gap-1">
                {mqChars.map((ch, idx) => {
                  const nonDotFromRight = mqChars
                    .slice(idx)
                    .filter((c) => c !== '.').length;
                  const isTailHighlight =
                    ch !== '.' && tailLen > 0 && nonDotFromRight <= tailLen;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md border font-mono text-sm',
                        ch === '.'
                          ? 'w-3 border-transparent bg-transparent text-muted-foreground'
                          : isTailHighlight
                            ? 'w-8 border-primary bg-primary/15 font-bold text-primary'
                            : 'w-8 border-border bg-muted/50 text-foreground',
                      )}
                    >
                      {ch}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auxiliary bit for Booth / 2-bit Booth */}
            {frame.aux !== undefined && (
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-muted-foreground">
                  附加位 yₙ₊₁
                </div>
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm font-bold',
                    frame.highlightAux
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-muted/50 text-foreground',
                  )}
                >
                  {frame.aux}
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
  );
}

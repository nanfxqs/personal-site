import type { SyllabusSubject } from './types';

export const syllabusMath1: SyllabusSubject = {
  id: 'math1',
  title: '考研数学一 (301)',
  code: '301',
  description: '涵盖高等数学（约 60%）、线性代数（约 20%）与概率论与数理统计（约 20%），支持 Mafs 2D 与 Three.js 3D 几何直觉可视化。',
  courses: [
    {
      id: 'calculus',
      subjectId: 'math1',
      title: '高等数学',
      shortTitle: '高数',
      scoreShare: '约 60% (~90 分)',
      description: '一元微积分、向量代数与空间解析几何、多元微积分、曲线曲面积分、无穷级数与微分方程。',
      chapters: [
        {
          id: 'calc-ch1',
          order: 1,
          title: '函数、极限与连续',
          weight: '★★★',
          textbookRef: '同济高数 第1章',
          sections: [
            {
              id: 'calc-1-1',
              title: '极限计算与连续性',
              topics: [
                { id: 'math1/calculus/limits-and-continuity', title: '极限性质、等价无穷小与泰勒展开求极限', weight: '★★★', viz: '2d', related: ['408/ds/complexity-analysis'] },
                { id: 'math1/calculus/sequence-limits', title: '数列极限与单调有界/夹逼准则', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'calc-ch2',
          order: 2,
          title: '一元函数微分学',
          weight: '★★★',
          textbookRef: '同济高数 第2-3章',
          sections: [
            {
              id: 'calc-2-1',
              title: '导数、中值定理与几何应用',
              topics: [
                { id: 'math1/calculus/mean-value-theorems', title: '罗尔、拉格朗日、柯西与泰勒中值定理', weight: '★★★', viz: '2d' },
                { id: 'math1/calculus/taylor-series-approximation', title: '泰勒公式、极值拐点与曲率圆', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'calc-ch3',
          order: 3,
          title: '一元函数积分学',
          weight: '★★★',
          textbookRef: '同济高数 第4-5章',
          sections: [
            {
              id: 'calc-3-1',
              title: '定积分、反常积分与应用',
              topics: [
                { id: 'math1/calculus/definite-and-improper-integrals', title: '换元分部积分、变限积分与反常积分敛散性', weight: '★★★', viz: '2d', related: ['math1/prob/continuous-distributions'] },
                { id: 'math1/calculus/integral-geometry-applications', title: '旋转体体积、弧长与物理应用', weight: '★★', viz: '3d' },
              ],
            },
          ],
        },
        {
          id: 'calc-ch4',
          order: 4,
          title: '向量代数和空间解析几何',
          weight: '★★',
          textbookRef: '同济高数 第8章',
          sections: [
            {
              id: 'calc-4-1',
              title: '空间平面、直线与二次曲面',
              topics: [
                { id: 'math1/calculus/quadric-surfaces', title: '空间平面直线与经典二次曲面', weight: '★★', viz: '3d', math1Only: true },
              ],
            },
          ],
        },
        {
          id: 'calc-ch5',
          order: 5,
          title: '多元函数微分学',
          weight: '★★★',
          textbookRef: '同济高数 第9章',
          sections: [
            {
              id: 'calc-5-1',
              title: '偏导数、梯度与极值',
              topics: [
                { id: 'math1/calculus/partial-derivatives', title: '偏导数、全微分、切平面与梯度方向导数', weight: '★★★', viz: '3d', related: ['math1/linalg/quadratic-forms'] },
                { id: 'math1/calculus/multivariable-extrema', title: '多元函数无条件极值与拉格朗日乘数法', weight: '★★★', viz: '3d', related: ['math1/linalg/quadratic-forms'] },
              ],
            },
          ],
        },
        {
          id: 'calc-ch6',
          order: 6,
          title: '多元函数积分学',
          weight: '★★★',
          textbookRef: '同济高数 第10-11章',
          sections: [
            {
              id: 'calc-6-1',
              title: '重积分与三大经典公式',
              topics: [
                { id: 'math1/calculus/double-and-triple-integrals', title: '二重积分、三重积分与柱/球面坐标', weight: '★★★', viz: '3d', related: ['math1/prob/joint-distributions'] },
                { id: 'math1/calculus/green-gauss-stokes', title: '曲线曲面积分与格林/高斯/斯托克斯公式', weight: '★★★', viz: '3d', math1Only: true },
              ],
            },
          ],
        },
        {
          id: 'calc-ch7',
          order: 7,
          title: '无穷级数',
          weight: '★★★',
          textbookRef: '同济高数 第12章',
          sections: [
            {
              id: 'calc-7-1',
              title: '幂级数与傅里叶级数',
              topics: [
                { id: 'math1/calculus/power-series', title: '数项级数判敛、幂级数展开与求和', weight: '★★★', viz: '2d', math1Only: true },
                { id: 'math1/calculus/fourier-series', title: '傅里叶级数与狄利克雷收敛定理', weight: '★★', viz: '2d', math1Only: true },
              ],
            },
          ],
        },
        {
          id: 'calc-ch8',
          order: 8,
          title: '常微分方程',
          weight: '★★★',
          textbookRef: '同济高数 第7章',
          sections: [
            {
              id: 'calc-8-1',
              title: '一阶与高阶线性微分方程',
              topics: [
                { id: 'math1/calculus/ode-methods', title: '一阶方程、高阶常系数线性方程与欧拉方程', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'linalg',
      subjectId: 'math1',
      title: '线性代数',
      shortTitle: '线代',
      scoreShare: '约 20% (~30 分)',
      description: '行列式、矩阵、向量组、线性方程组、特征值特征向量与二次型。',
      chapters: [
        {
          id: 'la-ch1',
          order: 1,
          title: '行列式',
          weight: '★★',
          textbookRef: '同济线代 第1章',
          sections: [
            {
              id: 'la-1-1',
              title: '几何意义与计算',
              topics: [
                { id: 'math1/linalg/determinants', title: '行列式几何意义、展开定理与范德蒙德行列式', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'la-ch2',
          order: 2,
          title: '矩阵',
          weight: '★★★',
          textbookRef: '同济线代 第2章',
          sections: [
            {
              id: 'la-2-1',
              title: '矩阵运算、逆与秩',
              topics: [
                { id: 'math1/linalg/matrix-operations', title: '矩阵线性变换、伴随矩阵、逆矩阵与初等变换', weight: '★★★', viz: '2d', related: ['408/ds/graph-representation'] },
                { id: 'math1/linalg/matrix-rank', title: '矩阵的秩与分块矩阵技巧', weight: '★★★' },
              ],
            },
          ],
        },
        {
          id: 'la-ch3',
          order: 3,
          title: '向量与向量空间',
          weight: '★★★',
          textbookRef: '同济线代 第4章',
          sections: [
            {
              id: 'la-3-1',
              title: '线性相关性与正交化',
              topics: [
                { id: 'math1/linalg/vector-spaces-and-gram-schmidt', title: '线性相关、基与过渡矩阵、施密特正交化', weight: '★★★', viz: '3d', math1Only: true },
              ],
            },
          ],
        },
        {
          id: 'la-ch4',
          order: 4,
          title: '线性方程组',
          weight: '★★★',
          textbookRef: '同济线代 第3-4章',
          sections: [
            {
              id: 'la-4-1',
              title: '解的结构与同解/公共解',
              topics: [
                { id: 'math1/linalg/linear-systems', title: '齐次与非齐次解结构、基础解系与公共解', weight: '★★★', viz: '3d' },
              ],
            },
          ],
        },
        {
          id: 'la-ch5',
          order: 5,
          title: '特征值与特征向量',
          weight: '★★★',
          textbookRef: '同济线代 第5章',
          sections: [
            {
              id: 'la-5-1',
              title: '相似对角化与实对称矩阵',
              topics: [
                { id: 'math1/linalg/eigenvalues-and-diagonalization', title: '特征值几何直觉、相似对角化与实对称正交对角化', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'la-ch6',
          order: 6,
          title: '二次型',
          weight: '★★★',
          textbookRef: '同济线代 第5章',
          sections: [
            {
              id: 'la-6-1',
              title: '标准形、惯性定理与正定性',
              topics: [
                { id: 'math1/linalg/quadratic-forms', title: '配方法/正交变换化标准形、合同与正定判定', weight: '★★★', viz: '3d', related: ['math1/calculus/partial-derivatives', 'math1/calculus/multivariable-extrema'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'prob',
      subjectId: 'math1',
      title: '概率论与数理统计',
      shortTitle: '概率论',
      scoreShare: '约 20% (~30 分)',
      description: '随机事件与概率、一维与多维随机变量、数字特征、大数定律与中心极限定理、参数估计与假设检验。',
      chapters: [
        {
          id: 'prob-ch1',
          order: 1,
          title: '随机事件和概率',
          weight: '★★',
          textbookRef: '浙大概率 第1章',
          sections: [
            {
              id: 'prob-1-1',
              title: '条件概率与贝叶斯',
              topics: [
                { id: 'math1/prob/bayes-and-independence', title: '全概率公式、贝叶斯公式与事件独立性', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'prob-ch2',
          order: 2,
          title: '一维随机变量及其分布',
          weight: '★★★',
          textbookRef: '浙大概率 第2章',
          sections: [
            {
              id: 'prob-2-1',
              title: '常见分布与函数分布',
              topics: [
                { id: 'math1/prob/continuous-distributions', title: '正态/指数/泊松/二项分布与随机变量函数分布', weight: '★★★', viz: '2d', related: ['math1/calculus/definite-and-improper-integrals'] },
              ],
            },
          ],
        },
        {
          id: 'prob-ch3',
          order: 3,
          title: '多维随机变量及其分布',
          weight: '★★★',
          textbookRef: '浙大概率 第3章',
          sections: [
            {
              id: 'prob-3-1',
              title: '联合、边缘与条件分布',
              topics: [
                { id: 'math1/prob/joint-distributions', title: '二维联合/边缘/条件分布与卷积公式', weight: '★★★', viz: '3d', related: ['math1/calculus/double-and-triple-integrals'] },
              ],
            },
          ],
        },
        {
          id: 'prob-ch4',
          order: 4,
          title: '随机变量的数字特征',
          weight: '★★★',
          textbookRef: '浙大概率 第4章',
          sections: [
            {
              id: 'prob-4-1',
              title: '期望、方差与相关性',
              topics: [
                { id: 'math1/prob/expectation-and-variance', title: '数学期望、方差、协方差与相关系数', weight: '★★★', viz: '2d', related: ['408/ds/hash-table', '408/cn/csma-cd-and-ca'] },
              ],
            },
          ],
        },
        {
          id: 'prob-ch5',
          order: 5,
          title: '大数定律和中心极限定理',
          weight: '★',
          textbookRef: '浙大概率 第5章',
          sections: [
            {
              id: 'prob-5-1',
              title: '切比雪夫与中心极限',
              topics: [
                { id: 'math1/prob/lln-and-clt', title: '切比雪夫不等式、大数定律与中心极限定理', weight: '★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'prob-ch6',
          order: 6,
          title: '数理统计的基本概念',
          weight: '★★★',
          textbookRef: '浙大概率 第6章',
          sections: [
            {
              id: 'prob-6-1',
              title: '三大抽样分布',
              topics: [
                { id: 'math1/prob/sampling-distributions', title: 'χ² 分布、t 分布、F 分布与正态总体抽样定理', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'prob-ch7',
          order: 7,
          title: '参数估计',
          weight: '★★★',
          textbookRef: '浙大概率 第7章',
          sections: [
            {
              id: 'prob-7-1',
              title: '点估计与区间估计',
              topics: [
                { id: 'math1/prob/mle-and-confidence-intervals', title: '矩估计、最大似然估计 (MLE)、无偏性与区间估计', weight: '★★★', viz: '2d', math1Only: true },
              ],
            },
          ],
        },
        {
          id: 'prob-ch8',
          order: 8,
          title: '假设检验',
          weight: '★',
          textbookRef: '浙大概率 第8章',
          sections: [
            {
              id: 'prob-8-1',
              title: '两类错误与正态检验',
              topics: [
                { id: 'math1/prob/hypothesis-testing', title: '显著性检验、两类错误与单/双正态总体检验', weight: '★', viz: '2d', math1Only: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};

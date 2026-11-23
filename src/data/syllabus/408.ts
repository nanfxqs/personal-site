import type { SyllabusSubject } from './types';

export const syllabus408: SyllabusSubject = {
  id: '408',
  title: '计算机学科专业基础 (408)',
  code: '408',
  description: '涵盖数据结构、计算机组成原理、操作系统与计算机网络四门核心课程，按 408 考纲 26 章骨架组织并支持跨科交叉引用。',
  courses: [
    {
      id: 'ds',
      subjectId: '408',
      title: '数据结构',
      shortTitle: '数据结构',
      scoreShare: '约 45 分',
      description: '线性表、栈队列串、树与二叉树、图、查找与排序及复杂度分析。',
      chapters: [
        {
          id: 'ds-ch1',
          order: 1,
          title: '绪论',
          weight: '★',
          textbookRef: '严蔚敏 第1章',
          sections: [
            {
              id: 'ds-1-1',
              title: '数据结构与算法复杂度',
              topics: [
                { id: '408/ds/data-structure-basics', title: '逻辑结构与存储结构', weight: '★' },
                { id: '408/ds/complexity-analysis', title: '时间与空间复杂度分析', weight: '★★', related: ['math1/calculus/limits-and-continuity'] },
              ],
            },
          ],
        },
        {
          id: 'ds-ch2',
          order: 2,
          title: '线性表',
          weight: '★★',
          textbookRef: '严蔚敏 第2章',
          sections: [
            {
              id: 'ds-2-1',
              title: '顺序存储与链式存储',
              topics: [
                { id: '408/ds/sequential-list', title: '顺序表与动态扩容', weight: '★★', viz: '2d' },
                { id: '408/ds/linked-list', title: '单链表、双链表与循环链表', weight: '★★★', viz: '2d', related: ['408/os/process-scheduling'] },
              ],
            },
          ],
        },
        {
          id: 'ds-ch3',
          order: 3,
          title: '栈、队列和数组',
          weight: '★★',
          textbookRef: '严蔚敏 第3、5章',
          sections: [
            {
              id: 'ds-3-1',
              title: '栈与队列应用',
              topics: [
                { id: '408/ds/stack-and-expressions', title: '栈、中缀转后缀与递归调用栈', weight: '★★★', viz: '2d', related: ['408/co/machine-code-and-stack'] },
                { id: '408/ds/queue-and-circular-queue', title: '循环队列与双端队列', weight: '★★', viz: '2d' },
                { id: '408/ds/special-matrices', title: '特殊矩阵压缩存储与稀疏矩阵', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'ds-ch4',
          order: 4,
          title: '串',
          weight: '★',
          textbookRef: '严蔚敏 第4章',
          sections: [
            {
              id: 'ds-4-1',
              title: '模式匹配算法',
              topics: [
                { id: '408/ds/kmp-algorithm', title: 'KMP 算法与 next / nextval 数组', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'ds-ch5',
          order: 5,
          title: '树与二叉树',
          weight: '★★★',
          textbookRef: '严蔚敏 第6章',
          sections: [
            {
              id: 'ds-5-1',
              title: '二叉树遍历与线索化',
              topics: [
                { id: '408/ds/binary-tree-traversal', title: '二叉树性质与四种遍历', weight: '★★★', viz: '2d' },
                { id: '408/ds/threaded-binary-tree', title: '线索二叉树', weight: '★★', viz: '2d' },
              ],
            },
            {
              id: 'ds-5-2',
              title: '树、森林与编码',
              topics: [
                { id: '408/ds/tree-forest-conversion', title: '树、森林与二叉树的转换', weight: '★★', viz: '2d', related: ['408/os/file-system-directory'] },
                { id: '408/ds/huffman-tree', title: '哈夫曼树与前缀编码', weight: '★★★', viz: '2d' },
                { id: '408/ds/union-find', title: '并查集与路径压缩', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'ds-ch6',
          order: 6,
          title: '图',
          weight: '★★★',
          textbookRef: '严蔚敏 第7章',
          sections: [
            {
              id: 'ds-6-1',
              title: '存储与遍历',
              topics: [
                { id: '408/ds/graph-representation', title: '邻接矩阵、邻接表与十字链表', weight: '★★★', viz: '2d', related: ['math1/linalg/matrix-operations'] },
                { id: '408/ds/bfs-dfs', title: '广度优先 (BFS) 与深度优先 (DFS)', weight: '★★★', viz: '2d' },
              ],
            },
            {
              id: 'ds-6-2',
              title: '图的核心应用',
              topics: [
                { id: '408/ds/minimum-spanning-tree', title: '最小生成树：Prim 与 Kruskal', weight: '★★★', viz: '2d' },
                { id: '408/ds/shortest-path', title: '最短路径：Dijkstra 与 Floyd', weight: '★★★', viz: '2d', related: ['408/cn/routing-algorithms'] },
                { id: '408/ds/topological-sort-aoe', title: '拓扑排序与关键路径 (AOV/AOE)', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'ds-ch7',
          order: 7,
          title: '查找',
          weight: '★★★',
          textbookRef: '严蔚敏 第9章',
          sections: [
            {
              id: 'ds-7-1',
              title: '线性与树形查找',
              topics: [
                { id: '408/ds/binary-search', title: '折半查找与分块查找', weight: '★★', viz: '2d' },
                { id: '408/ds/bst-and-avl', title: '二叉排序树 (BST) 与平衡二叉树 (AVL)', weight: '★★★', viz: '2d' },
                { id: '408/ds/red-black-tree', title: '红黑树插入与调整规则', weight: '★★★', viz: '2d' },
                { id: '408/ds/b-tree-and-b-plus-tree', title: 'B 树与 B+ 树', weight: '★★★', viz: '2d', related: ['408/os/file-system-directory'] },
              ],
            },
            {
              id: 'ds-7-2',
              title: '散列查找',
              topics: [
                { id: '408/ds/hash-table', title: '散列表、冲突处理与 ASL 分析', weight: '★★★', viz: '2d', related: ['math1/prob/expectation-and-variance'] },
              ],
            },
          ],
        },
        {
          id: 'ds-ch8',
          order: 8,
          title: '排序',
          weight: '★★★',
          textbookRef: '严蔚敏 第10章',
          sections: [
            {
              id: 'ds-8-1',
              title: '内部与外部排序',
              topics: [
                { id: '408/ds/insertion-shell-sort', title: '直接插入、折半插入与希尔排序', weight: '★★', viz: '2d' },
                { id: '408/ds/quick-sort', title: '快速排序与划分策略', weight: '★★★', viz: '2d' },
                { id: '408/ds/heap-sort', title: '堆排序与建堆过程', weight: '★★★', viz: '2d' },
                { id: '408/ds/merge-radix-sort', title: '归并排序与基数排序', weight: '★★★', viz: '2d' },
                { id: '408/ds/external-sort', title: '外部排序、败者树与置换选择', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'co',
      subjectId: '408',
      title: '计算机组成原理',
      shortTitle: '计组',
      scoreShare: '约 45 分',
      description: '数据表示与运算、存储层次与 Cache、指令系统、CPU 流水线、总线与 I/O 系统。',
      chapters: [
        {
          id: 'co-ch1',
          order: 1,
          title: '计算机系统概述',
          weight: '★★',
          textbookRef: '唐朔飞 第1-2章 / 袁春风 第1章',
          sections: [
            {
              id: 'co-1-1',
              title: '层次结构与性能指标',
              topics: [
                { id: '408/co/performance-metrics', title: 'CPI、MIPS、吞吐量与基准测试', weight: '★★★' },
              ],
            },
          ],
        },
        {
          id: 'co-ch2',
          order: 2,
          title: '数据的表示和运算',
          weight: '★★★',
          textbookRef: '唐朔飞 第6章 / 袁春风 第2章',
          sections: [
            {
              id: 'co-2-1',
              title: '定点数与浮点数',
              topics: [
                { id: '408/co/fixed-point-and-complement', title: '原码、补码、移码与加减溢出判断', weight: '★★★', viz: '2d' },
                {
                  id: '408/co/fixed-point-mul-div',
                  title: '定点数的乘除运算',
                  weight: '★★',
                  viz: '2d',
                  related: ['408/co/alu-and-carry-lookahead', '408/co/machine-code-and-stack'],
                },
                { id: '408/co/ieee-754-float', title: 'IEEE 754 浮点数表示与运算', weight: '★★★', viz: '2d' },
                { id: '408/co/alu-and-carry-lookahead', title: 'ALU、先行进位与阵列乘除法', weight: '★★', viz: '2d' },
                { id: '408/co/data-alignment-endianness', title: '大小端模式与边界对齐', weight: '★★', related: ['408/cn/ipv4-and-subnetting'] },
              ],
            },
          ],
        },
        {
          id: 'co-ch3',
          order: 3,
          title: '存储系统',
          weight: '★★★',
          textbookRef: '唐朔飞 第4章 / 袁春风 第4章',
          sections: [
            {
              id: 'co-3-1',
              title: '主存、Cache 与外存',
              topics: [
                { id: '408/co/sram-dram-expansion', title: 'SRAM/DRAM、主存容量扩展与多体交叉', weight: '★★★', viz: '2d' },
                { id: '408/co/cache-mapping', title: 'Cache 映射方式、替换算法与写策略', weight: '★★★', viz: '2d', related: ['408/os/virtual-memory'] },
                { id: '408/co/virtual-memory-tlb', title: '虚拟存储器、页表与 TLB 快表联动', weight: '★★★', viz: '2d', related: ['408/os/virtual-memory'] },
                { id: '408/co/ssd-and-disk', title: '磁盘与固态硬盘 (SSD) 原理', weight: '★★', related: ['408/os/disk-and-ssd-scheduling'] },
              ],
            },
          ],
        },
        {
          id: 'co-ch4',
          order: 4,
          title: '指令系统',
          weight: '★★★',
          textbookRef: '唐朔飞 第7章 / 袁春风 第3章',
          sections: [
            {
              id: 'co-4-1',
              title: '寻址方式与机器级代码',
              topics: [
                { id: '408/co/instruction-format-addressing', title: '指令格式、扩展操作码与寻址方式', weight: '★★★', viz: '2d' },
                { id: '408/co/machine-code-and-stack', title: '程序的机器级代码表示与过程调用栈帧', weight: '★★★', viz: '2d', related: ['408/ds/stack-and-expressions'] },
                { id: '408/co/cisc-vs-risc', title: 'CISC 与 RISC 对比', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'co-ch5',
          order: 5,
          title: '中央处理器 (CPU)',
          weight: '★★★',
          textbookRef: '唐朔飞 第8-10章 / 袁春风 第5章',
          sections: [
            {
              id: 'co-5-1',
              title: '数据通路、控制器与流水线',
              topics: [
                { id: '408/co/datapath-and-control', title: 'CPU 数据通路、硬布线与微程序控制器', weight: '★★★', viz: '2d' },
                { id: '408/co/instruction-pipeline', title: '指令流水线与结构/数据/控制冒险', weight: '★★★', viz: '2d' },
                { id: '408/co/exceptions-and-interrupts', title: '异常与中断的硬件响应机制', weight: '★★★', viz: '2d', related: ['408/os/interrupts-and-syscalls'] },
                { id: '408/co/multicore-and-simd', title: '多核处理器、超标量与 SIMD', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'co-ch6',
          order: 6,
          title: '总线',
          weight: '★',
          textbookRef: '唐朔飞 第3章 / 袁春风 第6章',
          sections: [
            {
              id: 'co-6-1',
              title: '总线结构与传输',
              topics: [
                { id: '408/co/bus-arbitration-and-bandwidth', title: '总线分类、仲裁方式与定时/带宽计算', weight: '★' },
              ],
            },
          ],
        },
        {
          id: 'co-ch7',
          order: 7,
          title: '输入/输出 (I/O) 系统',
          weight: '★★★',
          textbookRef: '唐朔飞 第5章 / 袁春风 第6章',
          sections: [
            {
              id: 'co-7-1',
              title: 'I/O 控制方式',
              topics: [
                { id: '408/co/io-modes-and-dma', title: '程序查询、程序中断与 DMA 方式', weight: '★★★', viz: '2d', related: ['408/os/io-management-and-spooling'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'os',
      subjectId: '408',
      title: '操作系统',
      shortTitle: '操作系统',
      scoreShare: '约 35 分',
      description: '中断与系统调用、进程线程与同步互斥、内存与虚拟内存管理、文件系统与 I/O 设备管理。',
      chapters: [
        {
          id: 'os-ch1',
          order: 1,
          title: '计算机系统概述',
          weight: '★★',
          textbookRef: '汤小丹 第1章',
          sections: [
            {
              id: 'os-1-1',
              title: '运行机制与系统调用',
              topics: [
                { id: '408/os/interrupts-and-syscalls', title: '内核态/用户态、中断异常与系统调用', weight: '★★★', viz: '2d', related: ['408/co/exceptions-and-interrupts'] },
                { id: '408/os/os-architecture-and-vm', title: '大内核、微内核与虚拟机 (VMM)', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'os-ch2',
          order: 2,
          title: '进程与线程',
          weight: '★★★',
          textbookRef: '汤小丹 第2-3章',
          sections: [
            {
              id: 'os-2-1',
              title: '状态转换、调度与同步',
              topics: [
                { id: '408/os/process-thread-and-signal', title: '进程/线程模型、状态转换与信号 (Signal)', weight: '★★★', viz: '2d' },
                { id: '408/os/process-scheduling', title: '处理机调度算法与多核 SMP 调度', weight: '★★★', viz: '2d', related: ['408/ds/linked-list'] },
                { id: '408/os/sync-and-mutex', title: '同步与互斥、信号量、管程与经典 PV 问题', weight: '★★★', viz: '2d' },
                { id: '408/os/deadlock-and-banker', title: '死锁条件与银行家算法', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'os-ch3',
          order: 3,
          title: '内存管理',
          weight: '★★★',
          textbookRef: '汤小丹 第4-5章',
          sections: [
            {
              id: 'os-3-1',
              title: '连续分配与虚拟内存',
              topics: [
                { id: '408/os/contiguous-and-paging', title: '动态分区分配、基本分页与分段管理', weight: '★★★', viz: '2d' },
                { id: '408/os/virtual-memory', title: '请求分页、页面置换算法 (LRU/Clock) 与抖动', weight: '★★★', viz: '2d', related: ['408/co/cache-mapping', '408/co/virtual-memory-tlb'] },
                { id: '408/os/mmap', title: '内存映射文件 (mmap)', weight: '★★', related: ['408/os/file-system-directory'] },
              ],
            },
          ],
        },
        {
          id: 'os-ch4',
          order: 4,
          title: '文件管理',
          weight: '★★★',
          textbookRef: '汤小丹 第7-8章',
          sections: [
            {
              id: 'os-4-1',
              title: '文件结构、目录与 VFS',
              topics: [
                { id: '408/os/file-system-directory', title: '索引节点 (inode)、混合索引与目录/硬软链接', weight: '★★★', viz: '2d', related: ['408/ds/tree-forest-conversion', '408/ds/b-tree-and-b-plus-tree'] },
                { id: '408/os/vfs-and-free-space', title: '空闲空间管理、VFS 虚拟文件系统与挂载', weight: '★★' },
              ],
            },
          ],
        },
        {
          id: 'os-ch5',
          order: 5,
          title: '输入/输出 (I/O) 管理',
          weight: '★★',
          textbookRef: '汤小丹 第6章',
          sections: [
            {
              id: 'os-5-1',
              title: 'I/O 子系统与磁盘调度',
              topics: [
                { id: '408/os/io-management-and-spooling', title: 'I/O 软件层次、缓冲技术与 SPOOLing', weight: '★★', viz: '2d', related: ['408/co/io-modes-and-dma'] },
                { id: '408/os/disk-and-ssd-scheduling', title: '磁盘调度算法 (SCAN/C-SCAN) 与 SSD 磨损均衡', weight: '★★', viz: '2d', related: ['408/co/ssd-and-disk'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'cn',
      subjectId: '408',
      title: '计算机网络',
      shortTitle: '计网',
      scoreShare: '约 25 分',
      description: '体系结构、物理层、数据链路层、网络层路由与 IP、传输层 TCP/UDP 与应用层协议。',
      chapters: [
        {
          id: 'cn-ch1',
          order: 1,
          title: '计算机网络体系结构',
          weight: '★★',
          textbookRef: '谢希仁 第1章',
          sections: [
            {
              id: 'cn-1-1',
              title: '分层模型与性能指标',
              topics: [
                { id: '408/cn/osi-tcpip-and-latency', title: 'OSI/TCP-IP 分层模型与时延带宽积', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'cn-ch2',
          order: 2,
          title: '物理层',
          weight: '★★',
          textbookRef: '谢希仁 第2章',
          sections: [
            {
              id: 'cn-2-1',
              title: '信道极限与编码调制',
              topics: [
                { id: '408/cn/nyquist-shannon-and-encoding', title: '奈奎斯特与香农定理、曼彻斯特编码', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'cn-ch3',
          order: 3,
          title: '数据链路层',
          weight: '★★★',
          textbookRef: '谢希仁 第3章',
          sections: [
            {
              id: 'cn-3-1',
              title: '可靠传输与介质访问控制',
              topics: [
                { id: '408/cn/crc-and-sliding-window', title: 'CRC 校验、停等/GBN/SR 滑动窗口协议', weight: '★★★', viz: '2d' },
                { id: '408/cn/csma-cd-and-ca', title: 'CSMA/CD 与无线局域网 CSMA/CA (802.11)', weight: '★★★', viz: '2d', related: ['math1/prob/expectation-and-variance'] },
                { id: '408/cn/ethernet-switch-vlan', title: '以太网帧、交换机自学习与 VLAN', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'cn-ch4',
          order: 4,
          title: '网络层',
          weight: '★★★',
          textbookRef: '谢希仁 第4章',
          sections: [
            {
              id: 'cn-4-1',
              title: 'IP 编址、转发与路由协议',
              topics: [
                { id: '408/cn/ipv4-and-subnetting', title: 'IPv4 分片、CIDR 子网划分、NAT 与 ARP', weight: '★★★', viz: '2d', related: ['408/co/data-alignment-endianness'] },
                { id: '408/cn/routing-algorithms', title: '路由算法：RIP (距离向量)、OSPF (链路状态) 与 BGP', weight: '★★★', viz: '2d', related: ['408/ds/shortest-path'] },
                { id: '408/cn/ipv6-and-sdn', title: 'IPv6 与 SDN 基础', weight: '★' },
              ],
            },
          ],
        },
        {
          id: 'cn-ch5',
          order: 5,
          title: '传输层',
          weight: '★★★',
          textbookRef: '谢希仁 第5章',
          sections: [
            {
              id: 'cn-5-1',
              title: 'UDP 与 TCP 核心机制',
              topics: [
                { id: '408/cn/tcp-handshake-and-teardown', title: 'TCP 报文段、三次握手与四次挥手状态机', weight: '★★★', viz: '2d' },
                { id: '408/cn/tcp-flow-and-congestion-control', title: 'TCP 流量控制与拥塞控制 (慢开始/拥塞避免/快重传)', weight: '★★★', viz: '2d' },
              ],
            },
          ],
        },
        {
          id: 'cn-ch6',
          order: 6,
          title: '应用层',
          weight: '★★',
          textbookRef: '谢希仁 第6章',
          sections: [
            {
              id: 'cn-6-1',
              title: '经典应用协议',
              topics: [
                { id: '408/cn/dns-http-smtp', title: 'DNS 解析、HTTP/HTTPS 与电子邮件协议', weight: '★★', viz: '2d' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

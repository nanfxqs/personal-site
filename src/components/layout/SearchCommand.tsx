import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  Home,
  Network,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PagefindResult {
  url: string;
  excerpt: string;
  meta?: {
    title?: string;
  };
}

interface PagefindModule {
  init: () => Promise<void>;
  search: (query: string) => Promise<{
    results: Array<{ data: () => Promise<PagefindResult> }>;
  }>;
}

const QUICK_LINKS = [
  { label: '首页', desc: '总览与考研攀登进度', href: '/', icon: Home },
  { label: '个人日常', desc: '时间线与随笔记录', href: '/journal', icon: FileText },
  { label: '408 计算机基础', desc: '数据结构 · 计组 · OS · 计网', href: '/kb/408', icon: BookOpen },
  { label: '数学一', desc: '高等数学 · 线性代数 · 概率论', href: '/kb/math1', icon: BookOpen },
  { label: '英语一', desc: '词汇语法 · 阅读 · 翻译写作', href: '/kb/english1', icon: BookOpen },
  { label: '跨科知识图谱', desc: '全局知识点关联可视化', href: '/graph', icon: Network },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'unavailable' | 'empty' | 'ready'>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const pagefindRef = useRef<PagefindModule | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ensurePagefind(): Promise<PagefindModule | null> {
    if (pagefindRef.current) return pagefindRef.current;
    try {
      const modPath = '/pagefind/pagefind.js';
      const mod = (await import(/* @vite-ignore */ modPath)) as PagefindModule;
      await mod.init();
      pagefindRef.current = mod;
      return mod;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleTriggerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-open-search]')) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleTriggerClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleTriggerClick);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setStatus('idle');
      setActiveIndex(0);
      return;
    }
    ensurePagefind();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setStatus('idle');
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const pf = await ensurePagefind();
      if (cancelled) return;
      if (!pf) {
        setResults([]);
        setStatus('unavailable');
        return;
      }
      const search = await pf.search(trimmed);
      const top = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (cancelled) return;
      setResults(top);
      setActiveIndex(0);
      setStatus(top.length ? 'ready' : 'empty');
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const itemsCount = query.trim() ? results.length : QUICK_LINKS.length;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!itemsCount) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % itemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + itemsCount) % itemsCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetHref = query.trim()
        ? results[activeIndex]?.url
        : QUICK_LINKS[activeIndex]?.href;
      if (targetHref) {
        setOpen(false);
        window.location.href = targetHref;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">站内搜索与快速跳转</DialogTitle>
        <DialogDescription className="sr-only">
          输入关键词搜索知识点、个人日常，或使用方向键快速跳转页面
        </DialogDescription>

        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索知识点、408、数学一、英语一或个人日常…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Kbd className="hidden sm:inline-flex">ESC</Kbd>
        </div>

        <Separator />

        {/* Results / Quick Links */}
        <div className="max-h-[24rem] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                <Compass className="h-3.5 w-3.5" />
                <span>快速导航</span>
              </div>
              {QUICK_LINKS.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === activeIndex;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/60',
                    )}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium leading-tight">
                          {item.label}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {item.desc}
                        </span>
                      </span>
                    </span>
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                        active && 'translate-x-0.5 text-foreground',
                      )}
                    />
                  </a>
                );
              })}
            </div>
          ) : status === 'loading' ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              正在检索索引…
            </div>
          ) : status === 'unavailable' ? (
            <div className="px-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
              开发模式下未生成 Pagefind 索引，请运行{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                npm run build && npm run preview
              </code>{' '}
              体验全文搜索。
            </div>
          ) : status === 'empty' ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              未找到与「{query.trim()}」相关的结果
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                检索结果 ({results.length})
              </div>
              {results.map((item, idx) => {
                const active = idx === activeIndex;
                return (
                  <a
                    key={item.url}
                    href={item.url}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-xl px-3 py-2.5 transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.meta?.title || item.url}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {item.url}
                      </span>
                    </div>
                    <div
                      className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground [&_mark]:rounded [&_mark]:bg-primary/15 [&_mark]:px-0.5 [&_mark]:text-foreground"
                      dangerouslySetInnerHTML={{ __html: item.excerpt }}
                    />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Command Footer Hints */}
        <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>选择</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span>跳转</span>
            </span>
          </div>
          <span className="font-mono text-[10px]">Pagefind Static Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

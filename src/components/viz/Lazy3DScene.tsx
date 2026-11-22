import React, { useEffect, useRef, useState } from 'react';

export interface Lazy3DSceneProps {
  height?: number;
  fallbackText?: string;
  children: React.ReactNode;
}

/**
 * Mounts WebGL / Three.js children strictly on the client after scrolling near viewport.
 * Prevents SSR errors and avoids downloading Three.js until needed.
 */
export function Lazy3DScene({
  height = 360,
  fallbackText = '3D 场景按需加载中…',
  children,
}: Lazy3DSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px` }}
      className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
    >
      {visible ? (
        children
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs tracking-wide text-[var(--text-muted)]">
          {fallbackText}
        </div>
      )}
    </div>
  );
}

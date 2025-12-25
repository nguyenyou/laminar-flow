'use client';

import { use, useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';
import { Maximize2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return;
  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(
  key: string,
  setPromise: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId();
  const fullscreenId = useId();
  const { resolvedTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { default: mermaid } = use(
    cachePromise('mermaid', () => import('mermaid')),
  );

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeCSS: 'margin: 1.5rem auto 0;',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () => {
      return mermaid.render(id, chart.replaceAll('\\n', '\n'));
    }),
  );

  const { svg: fullscreenSvg, bindFunctions: fullscreenBindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}-fullscreen`, () => {
      return mermaid.render(fullscreenId, chart.replaceAll('\\n', '\n'));
    }),
  );

  return (
    <div className="relative group">
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute bottom-1 left-1 p-1.5 rounded-md bg-fd-muted/80 hover:bg-fd-muted opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="View fullscreen"
      >
        <Maximize2Icon className="size-4" />
      </button>
      <div
        ref={(container) => {
          if (container) bindFunctions?.(container);
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="sm:max-w-[95vw] sm:w-[95vw] max-h-[90vh] w-fit overflow-auto">
          <DialogTitle className="sr-only">Mermaid Diagram</DialogTitle>
          <div
            ref={(container) => {
              if (container) fullscreenBindFunctions?.(container);
            }}
            dangerouslySetInnerHTML={{ __html: fullscreenSvg }}
            className="p-4"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
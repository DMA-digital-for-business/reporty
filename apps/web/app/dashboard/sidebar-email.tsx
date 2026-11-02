'use client';

import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';

export function SidebarEmail({ email }: { email: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // Font loading can change the text width without changing its container.
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [email]);

  return <Tooltip.Provider delay={150}>
    <Tooltip.Root disabled={!truncated}>
      <Tooltip.Trigger
        render={<p ref={textRef} />}
        tabIndex={truncated ? 0 : -1}
        className="min-w-0 flex-1 truncate text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >{email}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={6} className="z-[100]">
          <Tooltip.Popup className="max-w-[calc(100vw-2rem)] break-all rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none">{email}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>;
}

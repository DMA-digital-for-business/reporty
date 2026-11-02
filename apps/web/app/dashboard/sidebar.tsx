'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Activity, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Notifications } from './notifications';
import { ThemeSwitch } from '@/components/theme-switch';

function HeaderActions() {
  return <div className="ml-auto flex shrink-0 items-center gap-3">
    <Button variant="outline" size="icon" nativeButton={false} render={<Link href="/dashboard/audit" prefetch={false} />} aria-label="Apri audit Supabase" title="Audit Supabase"><Activity className="size-4" aria-hidden="true" /></Button>
    <ThemeSwitch />
    <Notifications />
  </div>;
}

function subscribeToViewport(onChange: () => void) {
  const mobile = window.matchMedia('(width < 768px)');
  mobile.addEventListener('change', onChange);
  return () => mobile.removeEventListener('change', onChange);
}

const isMobileViewport = () => window.matchMedia('(width < 768px)').matches;
const serverViewport = () => false;

export function DashboardSidebar({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mobile = useSyncExternalStore(subscribeToViewport, isMobileViewport, serverViewport);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return <div className={`fixed inset-0 flex min-h-0 flex-col overflow-hidden md:grid md:transition-[grid-template-columns] md:duration-250 md:ease-in-out motion-reduce:transition-none ${collapsed ? 'md:grid-cols-[0px_minmax(0,1fr)]' : 'md:grid-cols-[248px_minmax(0,1fr)]'}`}>
    <aside id="dashboard-sidebar" aria-label="Navigazione dashboard" aria-hidden={collapsed || mobile} inert={collapsed || mobile} className="hidden h-full min-h-0 min-w-0 overflow-hidden bg-sidebar text-sidebar-foreground md:block">
      <div className={`h-full min-h-0 w-[248px] border-r transition-transform duration-250 ease-in-out motion-reduce:transition-none ${collapsed ? '-translate-x-full' : 'translate-x-0'}`}>{mobile ? null : children}</div>
    </aside>
    <Dialog.Root open={mobile && open} onOpenChange={setOpen}>
      <header className="flex shrink-0 items-center gap-3 border-b bg-sidebar px-5 py-3 text-sidebar-foreground md:hidden">
        <Dialog.Trigger render={<Button variant="outline" size="icon" aria-label="Apri menu di navigazione" />}><Menu aria-hidden="true" /></Dialog.Trigger>
        <div className="min-w-0 overflow-hidden"><BrandLogo /></div>
        {mobile ? <HeaderActions /> : null}
      </header>
      {mobile ? <Dialog.Portal keepMounted>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl outline-none transition-transform duration-200 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full motion-reduce:transition-none">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
            <Dialog.Title className="text-sm font-semibold">Navigazione</Dialog.Title>
            <Dialog.Close render={<Button variant="outline" size="icon" aria-label="Chiudi menu di navigazione" />}><X aria-hidden="true" /></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1" onClick={event => {
            if (event.target instanceof Element && event.target.closest('a[href]')) setOpen(false);
          }}>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal> : null}
    </Dialog.Root>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-muted/30">
      <div className="hidden shrink-0 items-center gap-3 border-b px-5 py-3 md:flex">
        <Button
          variant="outline"
          size="icon"
          aria-label={collapsed ? 'Mostra sidebar' : 'Nascondi sidebar'}
          title={collapsed ? 'Mostra sidebar' : 'Nascondi sidebar'}
          aria-expanded={!collapsed}
          aria-controls="dashboard-sidebar"
          onClick={() => setCollapsed(value => !value)}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </Button>
        {mobile ? null : <HeaderActions />}
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{content}</div>
    </div>
  </div>;
}

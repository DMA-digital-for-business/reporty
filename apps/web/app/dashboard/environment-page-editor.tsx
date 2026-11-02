'use client';

import { useRef, useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastManager } from '@/components/ui/toast';
import { renameEnvironmentPage } from './environment-page-actions';

export function EnvironmentPageEditor({ environmentId, path, count }: { environmentId: string; path: string; count: number }) {
  const [value, setValue] = useState(path);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const toast = useToastManager();
  const id = `page-${environmentId}-${path}`;
  return <form className="space-y-2 rounded-lg border bg-background p-3" aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    startTransition(async () => {
      try {
        const result = await renameEnvironmentPage(environmentId, path, value);
        toast.add({ title: result.error ? 'Rinomina non riuscita' : 'Pagina rinominata', description: result.error ?? `${result.count} segnalazioni aggiornate.`, type: result.error ? 'error' : 'success' });
      } catch { toast.add({ title: 'Rinomina non riuscita', description: 'Riprova tra poco.', type: 'error' }); }
      finally { submitting.current = false; }
    });
  }}>
    <div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor={id} className="min-w-0 break-all">{path}</Label><span className="text-xs text-muted-foreground">{count} {count === 1 ? 'segnalazione' : 'segnalazioni'}</span></div>
    <div className="flex flex-wrap gap-3"><Input id={id} value={value} onChange={event => setValue(event.target.value)} disabled={pending} required maxLength={8192} aria-label={`Nuovo pathname di ${path}`} className="min-w-0 flex-1 basis-48 font-mono text-sm" /><Button type="submit" disabled={pending || value === path}><Save aria-hidden="true" className="size-4" />{pending ? <Skeleton className="h-4 w-24 bg-current opacity-30" /> : 'Rinomina'}</Button></div>
  </form>;
}

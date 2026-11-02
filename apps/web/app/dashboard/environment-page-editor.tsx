'use client';

import { useRef, useState, useTransition } from 'react';
import { Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastManager } from '@/components/ui/toast';
import { renameEnvironmentPage } from './environment-page-actions';

function focusPathInput(input: HTMLInputElement | null) {
  input?.focus();
  input?.select();
}

export function EnvironmentPageEditor({ environmentId, path, count }: { environmentId: string; path: string; count: number }) {
  const [value, setValue] = useState(path);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const toast = useToastManager();
  const id = `page-${environmentId}-${path}`;
  return <form className="space-y-2 rounded-lg border bg-background p-3" aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    if (!editing || submitting.current) return;
    submitting.current = true;
    startTransition(async () => {
      try {
        const result = await renameEnvironmentPage(environmentId, path, value);
        toast.add({ title: result.error ? 'Rinomina non riuscita' : 'Pagina rinominata', description: result.error ?? `${result.count} segnalazioni aggiornate.`, type: result.error ? 'error' : 'success' });
      } catch { toast.add({ title: 'Rinomina non riuscita', description: 'Riprova tra poco.', type: 'error' }); }
      finally { submitting.current = false; }
    });
  }}>
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-1"><p className="break-all text-sm font-medium">{path}</p><p className="text-xs text-muted-foreground">{count} {count === 1 ? 'segnalazione' : 'segnalazioni'}</p></div>
      {editing ? <Button key="save" type="submit" className="shrink-0" disabled={pending || value === path}><Save aria-hidden="true" className="size-4" />{pending ? <Skeleton className="h-4 w-24 bg-current opacity-30" /> : 'Rinomina'}</Button> : <Button key="edit" type="button" variant="ghost" size="icon" className="shrink-0" aria-label={`Modifica pathname di ${path}`} aria-expanded={false} onClick={() => setEditing(true)}><Pencil aria-hidden="true" className="size-4" /></Button>}
    </div>
    {editing ? <div className="space-y-2"><Label htmlFor={id}>Nuovo pathname</Label><Input id={id} ref={focusPathInput} value={value} onChange={event => setValue(event.target.value)} disabled={pending} required maxLength={8192} className="min-w-0 font-mono text-sm" /></div> : null}
  </form>;
}

import { requireUser } from '@/lib/auth';
import { FeedbackToast } from '@/components/feedback-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EnvironmentPageEditor } from './environment-page-editor';

export async function EnvironmentPages({ environmentId }: { environmentId: string }) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('environment_pages', { target: environmentId });
  if (error) return <FeedbackToast message="Impossibile caricare le pagine. Verifica di aver applicato supabase/environment_pages.sql." />;
  const pages = data as { page_path: string; report_count: number }[];
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Rinomina il percorso per spostare tutte le segnalazioni della pagina. Se la destinazione esiste già, le segnalazioni vengono unite. Sono elencate le pagine con almeno una segnalazione, incluse quelle risolte.</p>
    {pages.length ? pages.map(page => <EnvironmentPageEditor key={page.page_path} environmentId={environmentId} path={page.page_path} count={page.report_count} />) : <p className="text-sm text-muted-foreground">Nessuna pagina con segnalazioni in questo ambiente.</p>}
  </div>;
}

export function EnvironmentPagesSkeleton() {
  return <div className="space-y-3" aria-label="Caricamento pagine" role="status"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />{[0, 1, 2].map(row => <div key={row} className="space-y-2 rounded-lg border p-3"><Skeleton className="h-4 w-40" /><div className="flex gap-3"><Skeleton className="h-9 flex-1" /><Skeleton className="h-9 w-28" /></div></div>)}</div>;
}

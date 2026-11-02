import { requireUser } from '@/lib/auth';
import { FeedbackToast } from '@/components/feedback-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EnvironmentPageList } from './environment-page-list';

export async function EnvironmentPages({ environmentId }: { environmentId: string }) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('environment_pages', { target: environmentId });
  if (error) return <FeedbackToast message="Impossibile caricare le pagine. Verifica di aver applicato supabase/environment_pages.sql." />;
  const pages = data as { page_path: string; report_count: number }[];
  return <EnvironmentPageList environmentId={environmentId} pages={pages} />;
}

export function EnvironmentPagesSkeleton() {
  return <div className="space-y-3" aria-label="Caricamento pagine" role="status"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-9 w-full" />{[0, 1, 2].map(row => <div key={row} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div><Skeleton className="size-9" /></div>)}<div className="flex justify-between gap-3 border-t pt-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-28" /></div></div>;
}

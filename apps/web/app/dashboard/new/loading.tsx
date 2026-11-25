import { DashboardPage } from '@/components/dashboard-page';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <DashboardPage role="status" aria-label="Caricamento nuovo progetto">
      <header className="space-y-2">
        <div className="flex h-8 items-center"><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-9 w-56 max-w-full" />
      </header>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-full" /></div>
          <div className="grid gap-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-8 w-full" /><Skeleton className="h-5 w-full max-w-md" /></div>
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    </DashboardPage>
  );
}

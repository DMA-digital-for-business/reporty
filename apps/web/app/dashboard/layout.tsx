import { Plus, LogOut } from 'lucide-react';

import { BrandLogo } from '@/components/brand-logo';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { signOut } from '@/app/login/actions';
import { buttonVariants } from '@/components/ui/button';
import { SubmitButton } from '@/components/submit-button';
import { DashboardNav } from './nav';
import { DashboardSidebar } from './sidebar';
import { SidebarEmail } from './sidebar-email';
import { DashboardCaptureSession, StopScreenshotSharing } from './screenshot-sharing';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email, supabase } = await requireUser();
  const projects = await supabase.from('projects').select('id,name').order('name');
  if (projects.error) throw new Error('Impossibile caricare la navigazione.');
  return (
    <>
      <DashboardCaptureSession />
      <DashboardSidebar content={children}>
        <div className="flex h-full min-h-0 flex-col gap-3 p-5">
          <div className="flex items-center gap-2"><Link href="/dashboard" className="min-w-0"><BrandLogo /></Link></div>
          <DashboardNav projects={projects.data ?? []} />
          <Link href="/dashboard/new" className={buttonVariants({ className: 'w-full justify-start gap-2' })}><Plus className="size-4" aria-hidden="true" />Nuovo progetto</Link>
          <StopScreenshotSharing />
          <div className="mt-auto flex min-w-0 items-center gap-2 border-t pt-4">
            <SidebarEmail email={email} />
            <form action={signOut}><SubmitButton variant="outline" size="sm" pendingLabel="Uscita…"><LogOut className="size-4" aria-hidden="true" />Esci</SubmitButton></form>
          </div>
        </div>
      </DashboardSidebar>
    </>
  );
}

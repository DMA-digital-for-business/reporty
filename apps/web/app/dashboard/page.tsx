import { DashboardPage } from '@/components/dashboard-page';
import { requireUser } from '@/lib/auth';
import { Feedback } from './feedback';
import { ProjectList } from './project-list';

export default async function Dashboard({ searchParams }: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase } = await requireUser();
  const [projectsResult, { message }] = await Promise.all([
    supabase.from('projects').select('id, name, environments(id, name, origin), open_reports:issues!issues_project_id_fkey(count)').in('open_reports.status', ['open', 'in_progress', 'validation']).order('created_at', { ascending: false }),
    searchParams,
  ]);
  if (projectsResult.error) throw new Error('Impossibile caricare i progetti');
  const projects = (projectsResult.data ?? []).map(project => ({ ...project, openReportCount: project.open_reports[0]?.count ?? 0 }));
  return (
    <DashboardPage>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Tutti i progetti</h1>
      </header>
      <Feedback message={message} />
      <ProjectList projects={projects} />
    </DashboardPage>
  );
}

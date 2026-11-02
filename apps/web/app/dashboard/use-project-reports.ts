'use client';
import { useReportPage } from '@reporty/shared/ui/use-report-page';
import type { Report, ReportPageQuery } from '@reporty/shared';
import { useMemo } from 'react';
import { createReportPageBatch } from '@/lib/report-page-batch';
import { getReportPage, getReportPages } from './report-actions';

export function useProjectReports(environmentId: string | undefined, query: ReportPageQuery, view: 'list' | 'kanban', revision: unknown, onError: (message: string) => void) {
  const loadColumns = useMemo(() => createReportPageBatch(inputs => environmentId
    ? getReportPages(environmentId, inputs)
    : Promise.resolve(inputs.map(() => ({ reports: [], total: 0, projectTotal: 0, pages: [] })))), [environmentId]);
  const load = (input: ReportPageQuery) => environmentId ? getReportPage(environmentId, input) : Promise.resolve({ reports: [], total: 0, projectTotal: 0, pages: [] });
  const options = { scope: environmentId ?? '', revision, onError };
  const list = useReportPage(query, load, { ...options, enabled: view === 'list' });
  const columns = {
    open: useReportPage({ ...query, offset: 0, statuses: ['open'] }, loadColumns, { ...options, enabled: view === 'kanban', infinite: true }),
    in_progress: useReportPage({ ...query, offset: 0, statuses: ['in_progress'] }, loadColumns, { ...options, enabled: view === 'kanban', infinite: true }),
    validation: useReportPage({ ...query, offset: 0, statuses: ['validation'] }, loadColumns, { ...options, enabled: view === 'kanban', infinite: true }),
    resolved: useReportPage({ ...query, offset: 0, statuses: ['resolved'] }, loadColumns, { ...options, enabled: view === 'kanban', infinite: true }),
  };
  const active = view === 'list' ? list : columns.open;
  function patchReport(change: Pick<Report, 'id'> & Partial<Pick<Report, 'status' | 'priority'>>) {
    [list, ...Object.values(columns)].forEach(feed => feed.patchReport(change));
  }
  return { ...active, columns, patchReport, poll: async () => {
    const commits: (() => void)[] = [];
    const loaded = await Promise.all((view === 'list' ? [list] : Object.values(columns)).map(feed => feed.poll(apply => commits.push(apply))));
    // Commit the columns together so a moved card never disappears between responses.
    if (loaded.every(Boolean)) commits.forEach(apply => apply());
  }, reports: view === 'list' ? list.reports : Object.values(columns).flatMap(column => column.reports) };
}

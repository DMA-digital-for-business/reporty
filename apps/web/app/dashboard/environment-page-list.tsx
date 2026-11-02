'use client';

import { useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ReportPagination, REPORT_PAGE_SIZE, useReportPagination } from '@/components/report-pagination';
import { EnvironmentPageEditor } from './environment-page-editor';

export function EnvironmentPageList({ environmentId, pages }: { environmentId: string; pages: { page_path: string; report_count: number }[] }) {
  const [search, setSearch] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => pages.filter(page => page.page_path.toLowerCase().includes(query)), [pages, query]);
  const pagination = useReportPagination(filtered.length, query);
  const visible = filtered.slice(pagination.start, pagination.start + REPORT_PAGE_SIZE);

  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Rinomina il percorso per spostare tutte le segnalazioni della pagina. Se la destinazione esiste già, le segnalazioni vengono unite. Sono elencate le pagine con almeno una segnalazione, incluse quelle risolte.</p>
    <Input type="search" aria-label="Cerca pagine per pathname" placeholder="Cerca pathname…" value={search} onChange={event => setSearch(event.target.value)} />
    <div ref={list} className="space-y-3">
      {visible.length ? visible.map(page => <EnvironmentPageEditor key={page.page_path} environmentId={environmentId} path={page.page_path} count={page.report_count} />) : <p className="text-sm text-muted-foreground" role="status">{pages.length ? 'Nessuna pagina corrisponde alla ricerca.' : 'Nessuna pagina con segnalazioni in questo ambiente.'}</p>}
    </div>
    <ReportPagination label="pagine" total={filtered.length} page={pagination.page} pages={pagination.pages} onChange={next => { pagination.setPage(next); list.current?.scrollIntoView({ block: 'start' }); }} />
  </div>;
}

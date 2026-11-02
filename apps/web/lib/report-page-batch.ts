import type { ReportPage, ReportPageQuery } from '@reporty/shared';

/** Coalesce column reads into one server request and release their results together. */
export function createReportPageBatch(load: (queries: ReportPageQuery[]) => Promise<ReportPage[]>) {
  let queued: { query: ReportPageQuery; resolve: (page: ReportPage) => void; reject: (error: unknown) => void }[] = [];
  let scheduled = false;
  return (query: ReportPageQuery): Promise<ReportPage> => new Promise((resolve, reject) => {
    queued.push({ query, resolve, reject });
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      const batch = queued;
      queued = [];
      scheduled = false;
      void (async () => {
        try {
          const pages = await load(batch.map(item => item.query));
          if (pages.length !== batch.length) throw new Error('Risposta di caricamento incompleta.');
          batch.forEach((item, index) => item.resolve(pages[index]));
        } catch (error) {
          batch.forEach(item => item.reject(error));
        }
      })();
    }, 0);
  });
}

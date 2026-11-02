import type { Report, ReportContext, ReportPageQuery, ReportComment } from '@reporty/shared';
import type { createDemoStore, DemoReport, DemoData } from './demo-store';

export const DEMO_PROJECT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_ENVIRONMENT_ID = '00000000-0000-4000-8000-000000000002';
type Store = ReturnType<typeof createDemoStore>;
type Payload = Partial<ReportPageQuery & { id: string; body: string; status: Report['status']; priority: Report['priority']; context: ReportContext; replyId: string }>;
const statusOrder = { open: 0, in_progress: 1, validation: 2, resolved: 3 };
const priorityOrder = { high: 0, medium: 1, low: 2 };

/** The production panel protocol, backed exclusively by the existing local demo store. */
export function createLocalReviewTransport(store: Store, origin: string) {
  function asReport(item: DemoReport): Report {
    const url = new URL(item.url ?? item.pagePath, origin);
    // Old demo records did not store viewport metadata. The anchor remains unchanged.
    const context: Report['context'] = { url: url.href, origin, pagePath: item.pagePath, anchor: item.anchor, viewport: item.viewport, scroll: item.scroll };
    return { id: item.id, project_id: DEMO_PROJECT_ID, environment_id: DEMO_ENVIRONMENT_ID, page_path: item.pagePath, body: item.body, status: item.status, priority: item.priority, context, authorName: item.author, created_at: item.createdAt, updated_at: item.updatedAt ?? null, updatedByName: item.updatedBy, screenshot_path: null, attachments: [], commentCount: item.replies.length, canEdit: true, canChangeStatus: true };
  }
  function save(change: (data: DemoData) => DemoData) {
    const current = store.getSnapshot();
    if (current.error) throw new Error(current.error);
    if (!current.name.trim()) throw new Error('Inserisci il tuo nome prima di scrivere.');
    store.save(change(current));
  }
  return async (message: Record<string, unknown>) => {
    const current = store.getSnapshot();
    if (current.error) throw new Error(current.error);
    if (message.type === 'REPORTY_IDENTITY') {
      if (typeof message.name === 'string') {
        const name = message.name.trim();
        if (!name || name.length > 80) throw new Error('Inserisci un nome entro 80 caratteri.');
        store.save({ ...current, name });
      }
      const name = store.getSnapshot().name;
      return { data: { needsName: !name, displayName: name || null } };
    }
    if (message.type !== 'REPORTY_REPORT') throw new Error('Screenshot e allegati non sono disponibili nella demo locale.');
    const payload = (message.payload ?? {}) as Payload;
    const all = current.reports.map(asReport);
    switch (message.operation) {
      case 'pins': return { data: all.filter(report => !payload.pagePath || report.page_path === payload.pagePath) };
      case 'list': return { data: all };
      case 'page': {
        const query = payload;
        const search = query.search?.trim().toLocaleLowerCase();
        let reports = all.filter(report => (!query.id || report.id === query.id) && (!query.pagePath || report.page_path === query.pagePath) && (!query.statuses?.length || query.statuses.includes(report.status)) && (!query.priorities?.length || query.priorities.includes(report.priority)) && (!search || `${report.body} ${report.page_path} ${report.authorName}`.toLocaleLowerCase().includes(search)));
        const sort = query.sort ?? { field: 'created_at', direction: 'desc' };
        reports.sort((a,b) => {
          const av = sort.field === 'status' ? statusOrder[a.status] : sort.field === 'priority' ? priorityOrder[a.priority] : sort.field === 'environment' ? a.environment_id : a[sort.field] ?? '';
          const bv = sort.field === 'status' ? statusOrder[b.status] : sort.field === 'priority' ? priorityOrder[b.priority] : sort.field === 'environment' ? b.environment_id : b[sort.field] ?? '';
          const comparison = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'it');
          return (sort.direction === 'asc' ? comparison : -comparison) || b.created_at.localeCompare(a.created_at);
        });
        const total = reports.length;
        reports = reports.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
        return { data: { reports, total, projectTotal: all.length, pages: [...new Set(all.map(report => report.page_path))].sort() } };
      }
      case 'notifications': case 'notification_read': case 'notifications_read': return { data: { items: [], total: 0, totalInScope: 0, unread: 0, cursor: null, arrivalCount: 0, latest: null, projects: [], environments: [] } };
      case 'thread': {
        const item = current.reports.find(report => report.id === payload.id);
        if (!item) throw new Error('Segnalazione non disponibile.');
        const comments: ReportComment[] = item.replies.map(reply => ({ id: reply.id, body: reply.body, authorName: reply.author, created_at: reply.createdAt ?? item.createdAt, attachments: [] }));
        return { data: { issue: asReport(item), comments } };
      }
      case 'create': {
        if (current.reports.some(report => report.id === payload.id)) return { data: asReport(current.reports.find(report => report.id === payload.id)!) };
        if (!payload.id || !payload.context || payload.context.anchor.kind === 'page' || typeof payload.body !== 'string') throw new Error('Segnalazione incompleta.');
        if (new URL(payload.context.url).origin !== origin || payload.context.origin !== origin) throw new Error('La demo è limitata a questa pagina.');
        if (current.reports.length >= 200) throw new Error('Limite di 200 segnalazioni locali raggiunto. Azzera la demo per ricominciare.');
        const item: DemoReport = { id: payload.id, body: payload.body.trim(), author: current.name, createdAt: new Date().toISOString(), pagePath: payload.context.pagePath, anchor: payload.context.anchor.kind === 'element' ? { ...payload.context.anchor, textExcerpt: payload.context.anchor.textExcerpt ?? '' } : payload.context.anchor, url: payload.context.url, viewport: payload.context.viewport, scroll: payload.context.scroll, status: 'open', priority: payload.priority ?? 'medium', replies: [] };
        save(data => ({ ...data, reports: [item, ...data.reports] }));
        return { data: asReport(item) };
      }
      case 'reply': {
        const item = current.reports.find(report => report.id === payload.id);
        if (!item || !payload.body?.trim()) throw new Error('Risposta non valida.');
        if (item.replies.some(reply => reply.id === payload.replyId)) return { data: null };
        if (item.replies.length >= 200) throw new Error('Limite di risposte della demo raggiunto.');
        save(data => ({ ...data, reports: data.reports.map(report => report.id === item.id ? { ...report, replies: [...report.replies, { id: payload.replyId ?? crypto.randomUUID(), body: payload.body!.trim(), author: data.name, createdAt: new Date().toISOString() }] } : report) }));
        return { data: null };
      }
      case 'status': case 'priority': case 'edit': case 'delete': {
        if (!current.reports.some(report => report.id === payload.id)) throw new Error('Segnalazione non disponibile.');
        if (message.operation === 'delete') save(data => ({ ...data, reports: data.reports.filter(report => report.id !== payload.id) }));
        else {
          const field = message.operation === 'edit' ? 'body' : message.operation as 'status' | 'priority';
          const value = field === 'body' ? payload.body?.trim() : payload[field];
          save(data => ({ ...data, reports: data.reports.map(report => report.id === payload.id ? { ...report, [field]: value, updatedAt: new Date().toISOString(), updatedBy: data.name } : report) }));
        }
        return { data: null };
      }
      default: throw new Error('Operazione non disponibile nella demo locale.');
    }
  };
}

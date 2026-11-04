import type { Report } from '@reporty/shared';

type Field = 'status' | 'priority';
type Value = Report[Field];
export type ReportFieldChange = Pick<Report, 'id'> & Partial<Pick<Report, Field>>;
type FieldState = { confirmed: Value; pending: Value[]; revision: number; tail: Promise<void> };

/** Keep rapid edits ordered and shield optimistic values from older reads. */
export function createReportFieldUpdates() {
  let revision = 0;
  const reports = new Map<string, Map<Field, FieldState>>();
  function project<T extends Pick<Report, 'id' | 'status' | 'priority'>>(report: T, readRevision = revision): T {
    let result = report;
    for (const [field, state] of reports.get(report.id) ?? []) {
      if (state.pending.length || state.revision > readRevision) {
        result = { ...result, [field]: state.pending.at(-1) ?? state.confirmed };
      }
    }
    return result;
  }
  function update(report: Pick<Report, 'id' | 'status' | 'priority'>, field: Field, value: Value, save: () => Promise<void>, onChange: (change: ReportFieldChange) => void) {
    let fields = reports.get(report.id);
    if (!fields) { fields = new Map(); reports.set(report.id, fields); }
    let state = fields.get(field);
    if (!state) {
      state = { confirmed: report[field], pending: [], revision, tail: Promise.resolve() };
      fields.set(field, state);
    }
    if (!state.pending.length) state.confirmed = report[field];
    const current = state;
    current.pending.push(value);
    current.revision = ++revision;
    onChange({ id: report.id, [field]: value });
    function settle(saved: boolean) {
      if (saved) current.confirmed = value;
      current.pending.shift();
      current.revision = ++revision;
      onChange({ id: report.id, [field]: current.pending.at(-1) ?? current.confirmed });
    }
    const next = current.tail.then(save).then(() => settle(true), error => { settle(false); throw error; });
    // A failed write must not prevent the next queued choice from being saved.
    current.tail = next.catch(() => {});
    return next;
  }
  return {
    get revision() { return revision; },
    project,
    update,
    hasPending: (id: string) => [...(reports.get(id)?.values() ?? [])].some(state => state.pending.length > 0),
  };
}

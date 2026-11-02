export const DEMO_STORAGE_KEY = 'reporty:landing-demo:v1';
export const demoStatuses = { open: 'Aperta', in_progress: 'In lavorazione', validation: 'Validazione', resolved: 'Risolta' } as const;
export const demoPriorities = { high: 'Alta', medium: 'Media', low: 'Bassa' } as const;
export type DemoAnchor = { kind: 'element'; selector: string; offsetX: number; offsetY: number; textExcerpt: string } | { kind: 'pin'; documentX: number; documentY: number };
export type DemoReport = {
  id: string; body: string; author: string; createdAt: string; pagePath: string; anchor: DemoAnchor;
  updatedAt?: string; updatedBy?: string;
  url?: string; viewport?: { width: number; height: number; devicePixelRatio: number }; scroll?: { x: number; y: number };
  status: keyof typeof demoStatuses; priority: keyof typeof demoPriorities;
  replies: { id: string; body: string; author: string; createdAt?: string }[];
};
export type DemoData = { version: 1; name: string; reports: DemoReport[] };
type Snapshot = DemoData & { ready: boolean; error: string | null };
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export const EMPTY_DEMO: Snapshot = { version: 1, name: '', reports: [], ready: false, error: null };
const text = (value: unknown, max: number, empty = false): value is string => typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
function validAnchor(value: unknown): value is DemoAnchor {
  if (!record(value)) return false;
  return value.kind === 'pin' ? number(value.documentX, 1e7) && number(value.documentY, 1e7) : value.kind === 'element' && text(value.selector, 4096) && text(value.textExcerpt, 200, true) && number(value.offsetX, 1) && number(value.offsetY, 1);
}
export function parseDemoData(raw: string | null): DemoData {
  if (raw === null) return { version: 1, name: '', reports: [] };
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('Dati della demo non validi. Puoi azzerarli dalla lista delle segnalazioni.'); }
  if (!record(data) || data.version !== 1 || !text(data.name, 80, true) || !Array.isArray(data.reports) || data.reports.length > 200) throw new Error('Dati della demo non validi. Puoi azzerarli dalla lista delle segnalazioni.');
  const ids = new Set<string>();
  for (const report of data.reports) {
    if (!record(report) || !text(report.id, 64) || ids.has(report.id) || !text(report.body, 10000) || !text(report.author, 80) || !text(report.createdAt, 64) || !Number.isFinite(Date.parse(report.createdAt)) || !text(report.pagePath, 8192) || !validAnchor(report.anchor) || typeof report.status !== 'string' || !Object.hasOwn(demoStatuses, report.status) || typeof report.priority !== 'string' || !Object.hasOwn(demoPriorities, report.priority) || !Array.isArray(report.replies) || report.replies.length > 200 || report.replies.some(item => !record(item) || !text(item.id, 64) || !text(item.body, 10000) || !text(item.author, 80))) throw new Error('Dati della demo non validi. Puoi azzerarli dalla lista delle segnalazioni.');
    if ((report.url !== undefined && !text(report.url, 8192)) || (report.viewport !== undefined && (!record(report.viewport) || !number(report.viewport.width, 1e7) || !report.viewport.width || !number(report.viewport.height, 1e7) || !report.viewport.height || !number(report.viewport.devicePixelRatio, 10) || !report.viewport.devicePixelRatio)) || (report.scroll !== undefined && (!record(report.scroll) || !number(report.scroll.x, 1e7) || !number(report.scroll.y, 1e7)))) throw new Error('Dati della demo non validi. Puoi azzerarli dalla lista delle segnalazioni.');
    if ((report.updatedAt !== undefined && (!text(report.updatedAt, 64) || !Number.isFinite(Date.parse(report.updatedAt)))) || (report.updatedBy !== undefined && !text(report.updatedBy, 80))) throw new Error('Dati della demo non validi. Puoi azzerarli dalla lista delle segnalazioni.');
    ids.add(report.id);
  }
  return { version: 1, name: data.name, reports: data.reports as DemoReport[] };
}

/** Read after hydration and commit to React only after a successful local write. */
export function createDemoStore(storage: () => StorageLike = () => window.localStorage) {
  let snapshot = EMPTY_DEMO;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  function load() {
    try { snapshot = { ...parseDemoData(storage().getItem(DEMO_STORAGE_KEY)), ready: true, error: null }; }
    catch (error) { snapshot = { ...snapshot, ready: true, error: error instanceof Error && error.message.startsWith('Dati della demo') ? error.message : 'Salvataggio locale non disponibile in questo browser.' }; }
    emit();
  }
  function save(data: DemoData) {
    const valid = parseDemoData(JSON.stringify(data));
    try { storage().setItem(DEMO_STORAGE_KEY, JSON.stringify(valid)); }
    catch { throw new Error('Impossibile salvare nel browser. La modifica non è stata salvata: libera spazio o abilita il salvataggio locale e riprova.'); }
    snapshot = { ...valid, ready: true, error: null }; emit();
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!snapshot.ready) load();
    const onStorage = (event: StorageEvent) => { if (event.key === DEMO_STORAGE_KEY || event.key === null) load(); };
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => { listeners.delete(listener); if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); };
  }
  return { getSnapshot: () => snapshot, getServerSnapshot: () => EMPTY_DEMO, subscribe, load, save };
}

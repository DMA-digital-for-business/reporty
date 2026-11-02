import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoStore, parseDemoData, DEMO_STORAGE_KEY } from '../apps/landing/lib/demo-store.ts';

const report = () => ({ id: 'report-1', body: 'Aumentare il contrasto', author: 'Revisore', createdAt: '2026-11-02T10:00:00.000Z', pagePath: '/', anchor: { kind: 'element', selector: '#hero-title', offsetX: .25, offsetY: .75, textExcerpt: 'Titolo' }, status: 'open', priority: 'medium', replies: [] });
const data = () => ({ version: 1, name: 'Revisore', reports: [report()] });
function memoryStorage() {
  const values = new Map([['other-app', 'keep-me']]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('a new visit has no fake reports; the server snapshot never reads browser storage', () => {
  const store = createDemoStore(() => { throw new Error('not accessible'); });
  assert.equal(store.getServerSnapshot().ready, false);
  assert.deepEqual(store.getServerSnapshot().reports, []);
  store.load();
  assert.equal(store.getSnapshot().ready, true);
  assert.match(store.getSnapshot().error, /non disponibile/);
});

test('reports, replies, reviewer and exact relative coordinates survive a fresh store', () => {
  const storage = memoryStorage();
  const first = createDemoStore(() => storage);
  first.load();
  const saved = data();
  saved.reports[0].replies.push({ id: 'reply-1', author: 'Revisore', body: 'Corretto' });
  saved.reports[0].status = 'validation';
  first.save(saved);
  const nextVisit = createDemoStore(() => storage);
  nextVisit.load();
  assert.deepEqual(nextVisit.getSnapshot().reports, saved.reports);
  assert.equal(nextVisit.getSnapshot().name, 'Revisore');
  assert.equal(nextVisit.getSnapshot().reports[0].anchor.offsetX, .25);
  assert.equal(nextVisit.getSnapshot().reports[0].anchor.offsetY, .75);
  assert.equal(JSON.parse(storage.getItem(DEMO_STORAGE_KEY)).ready, undefined);
});

test('quota failures preserve the previous saved and displayed report', () => {
  const storage = memoryStorage();
  const store = createDemoStore(() => storage);
  store.load(); store.save(data());
  const before = store.getSnapshot();
  const raw = storage.getItem(DEMO_STORAGE_KEY);
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => store.save({ ...before, reports: [] }), /non è stata salvata/);
  assert.equal(store.getSnapshot(), before);
  assert.equal(storage.getItem(DEMO_STORAGE_KEY), raw);
});

test('untrusted local data rejects malformed versions, coordinates, statuses and duplicate ids', () => {
  assert.throws(() => parseDemoData('{broken'), /Dati della demo/);
  for (const mutate of [
    item => { item.version = 2; },
    item => { item.reports[0].anchor.offsetX = 1.01; },
    item => { item.reports[0].status = 'administrator'; },
    item => { item.reports.push(item.reports[0]); },
    item => { item.reports[0].replies = [{ id: 'reply', author: '', body: 'x' }]; },
    item => { item.reports[0].createdAt = 'invalid'; },
  ]) { const invalid = data(); mutate(invalid); assert.throws(() => parseDemoData(JSON.stringify(invalid)), /Dati della demo/); }
  const point = data(); point.reports[0].anchor = { kind: 'pin', documentX: 0, documentY: 1200 };
  assert.equal(parseDemoData(JSON.stringify(point)).reports[0].anchor.documentX, 0);
});

test('reset is restricted to the demo namespace and subscriptions receive committed writes', () => {
  const storage = memoryStorage();
  const store = createDemoStore(() => storage);
  let calls = 0;
  const unsubscribe = store.subscribe(() => { calls++; });
  store.save(data());
  store.save({ version: 1, name: '', reports: [] });
  assert.equal(calls, 3);
  assert.equal(storage.getItem('other-app'), 'keep-me');
  assert.deepEqual(parseDemoData(storage.getItem(DEMO_STORAGE_KEY)).reports, []);
  unsubscribe();
  store.save(data());
  assert.equal(calls, 3);
});

const { createLocalReviewTransport } = await import('../apps/landing/lib/demo-transport.ts');
const createInput = (id = 'new-report') => ({ type: 'REPORTY_REPORT', operation: 'create', payload: { id, body: 'Un feedback dal pannello reale', priority: 'high', context: { url: 'https://demo.example/', origin: 'https://demo.example', pagePath: '/', anchor: { kind: 'element', selector: '#hero-title', offsetX: .2, offsetY: .7 }, viewport: { width: 1200, height: 800, devicePixelRatio: 1 }, scroll: { x: 0, y: 0 } } } });

test('the real panel protocol requires identity and preserves create/reply idempotency', async () => {
  const storage = memoryStorage(); const store = createDemoStore(() => storage); store.load();
  const request = createLocalReviewTransport(store, 'https://demo.example');
  assert.equal((await request({ type: 'REPORTY_IDENTITY' })).data.needsName, true);
  await assert.rejects(request(createInput()), /nome/);
  await request({ type: 'REPORTY_IDENTITY', name: 'Revisore' });
  await request(createInput()); await request(createInput());
  const reply = { type: 'REPORTY_REPORT', operation: 'reply', payload: { id: 'new-report', body: 'Risposta locale', replyId: 'reply-1' } };
  await request(reply); await request(reply);
  const thread = (await request({ type: 'REPORTY_REPORT', operation: 'thread', payload: { id: 'new-report' } })).data;
  assert.equal(thread.issue.authorName, 'Revisore'); assert.equal(thread.comments.length, 1);
  assert.equal(store.getSnapshot().reports.length, 1);
  assert.equal(thread.issue.context.anchor.offsetX, .2);
  assert.equal(thread.issue.context.viewport.width, 1200);
  assert.deepEqual(thread.issue.attachments, []);
});

test('panel pagination, filters, mutations and legacy demo records use the same saved dataset', async () => {
  const storage = memoryStorage(); const store = createDemoStore(() => storage); store.load(); store.save(data());
  const request = createLocalReviewTransport(store, 'https://demo.example');
  await request(createInput());
  await request({ type: 'REPORTY_REPORT', operation: 'status', payload: { id: 'new-report', status: 'validation' } });
  await request({ type: 'REPORTY_REPORT', operation: 'edit', payload: { id: 'report-1', body: 'Descrizione aggiornata' } });
  const page = (await request({ type: 'REPORTY_REPORT', operation: 'page', payload: { priorities: ['high'], statuses: ['validation'], limit: 1, offset: 0 } })).data;
  assert.equal(page.total, 1); assert.equal(page.projectTotal, 2); assert.equal(page.reports[0].id, 'new-report');
  const legacy = (await request({ type: 'REPORTY_REPORT', operation: 'thread', payload: { id: 'report-1' } })).data.issue;
  assert.equal(legacy.context.anchor.selector, '#hero-title'); assert.equal(legacy.context.viewport, undefined);
  assert.equal(legacy.body, 'Descrizione aggiornata'); assert.ok(legacy.updated_at);
  await request({ type: 'REPORTY_REPORT', operation: 'delete', payload: { id: 'new-report' } });
  assert.equal(store.getSnapshot().reports.length, 1);
});

test('the local transport rejects other origins and never confirms a failed storage write', async () => {
  const storage = memoryStorage(); const store = createDemoStore(() => storage); store.load(); store.save(data());
  const request = createLocalReviewTransport(store, 'https://demo.example');
  const foreign = createInput(); foreign.payload.context.url = 'https://other.example/';
  await assert.rejects(request(foreign), /limitata/);
  const before = store.getSnapshot(); storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(request({ type: 'REPORTY_REPORT', operation: 'priority', payload: { id: 'report-1', priority: 'high' } }), /non è stata salvata/);
  assert.equal(store.getSnapshot(), before);
  await assert.rejects(request({ type: 'REPORTY_ATTACHMENT', payload: { operation: 'upload' } }), /non sono disponibili/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createReportFieldUpdates } from '../apps/extension/lib/report-field-updates.ts';

const report = { id: 'a', status: 'open', priority: 'medium', canChangeStatus: true };
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function host() {
  const updates = createReportFieldUpdates();
  let visible = { ...report };
  return {
    updates,
    get visible() { return visible; },
    update(field, value, save, target = visible) {
      return updates.update(target, field, value, save, change => {
        if (change.id === visible.id) visible = { ...visible, ...change };
      });
    },
  };
}

test('an optimistic choice is visible synchronously and rapid writes save in click order', async () => {
  const h = host(), first = deferred(), writes = [];
  const a = h.update('status', 'in_progress', async () => { writes.push('in_progress'); await first.promise; });
  assert.equal(h.visible.status, 'in_progress');
  const b = h.update('status', 'resolved', async () => { writes.push('resolved'); });
  assert.equal(h.visible.status, 'resolved');
  await flush();
  assert.deepEqual(writes, ['in_progress']);
  first.resolve();
  await Promise.all([a, b]);
  assert.deepEqual(writes, ['in_progress', 'resolved']);
  assert.equal(h.visible.status, 'resolved');
  assert.equal(h.updates.hasPending(report.id), false);
});

test('priority and other reports save independently while a status write is pending', async () => {
  const h = host(), first = deferred();
  const status = h.update('status', 'validation', () => first.promise);
  let prioritySaved = false, otherSaved = false;
  await Promise.all([
    h.update('priority', 'high', async () => { prioritySaved = true; }),
    h.update('status', 'resolved', async () => { otherSaved = true; }, { ...report, id: 'b' }),
  ]);
  assert.equal(prioritySaved, true);
  assert.equal(otherSaved, true);
  assert.equal(h.visible.status, 'validation');
  assert.equal(h.visible.priority, 'high');
  first.resolve();
  await status;
});

test('a failed earlier write never rolls back a newer choice and the queue continues', async () => {
  const h = host(), first = deferred(), second = deferred();
  const a = h.update('status', 'in_progress', () => first.promise);
  const rejected = assert.rejects(a, /offline/);
  const b = h.update('status', 'validation', () => second.promise);
  first.reject(new Error('offline'));
  await rejected;
  assert.equal(h.visible.status, 'validation');
  second.resolve();
  await b;
  assert.equal(h.visible.status, 'validation');
});

test('a failed last choice restores the last confirmed value and preserves the other field', async () => {
  const h = host(), last = deferred();
  await h.update('status', 'in_progress', async () => {});
  const failed = h.update('status', 'resolved', () => last.promise);
  const rejected = assert.rejects(failed, /denied/);
  await h.update('priority', 'high', async () => {});
  last.reject(new Error('denied'));
  await rejected;
  assert.equal(h.visible.status, 'in_progress');
  assert.equal(h.visible.priority, 'high');
});

test('if all queued writes fail, restore the original confirmed value', async () => {
  const h = host();
  const a = h.update('status', 'in_progress', async () => { throw new Error('offline'); });
  const b = h.update('status', 'resolved', async () => { throw new Error('offline'); });
  await Promise.all([assert.rejects(a, /offline/), assert.rejects(b, /offline/)]);
  assert.equal(h.visible.status, 'open');
  assert.equal(h.updates.hasPending(report.id), false);
});

test('older reads cannot overwrite pending or confirmed edits; later remote edits remain visible', async () => {
  const h = host(), response = deferred();
  const before = h.updates.revision;
  const save = h.update('priority', 'high', () => response.promise);
  const during = h.updates.revision;
  assert.equal(h.updates.project(report, before).priority, 'high');
  assert.equal(h.updates.project(report, during).priority, 'high');
  response.resolve();
  await save;
  assert.equal(h.updates.project(report, before).priority, 'high');
  assert.equal(h.updates.project(report, during).priority, 'high');
  const later = { ...report, priority: 'low' };
  assert.equal(h.updates.project(later, h.updates.revision).priority, 'low');
  // A new edit rolls back to this freshly read remote value if rejected.
  await assert.rejects(h.update('priority', 'medium', async () => { throw new Error('offline'); }, later), /offline/);
  assert.equal(h.visible.priority, 'low');
});

test('a read started during a rejected edit receives the rollback value', async () => {
  const h = host(), response = deferred();
  const save = h.update('status', 'resolved', () => response.promise);
  const rejected = assert.rejects(save, /offline/);
  const during = h.updates.revision;
  response.reject(new Error('offline'));
  await rejected;
  assert.equal(h.updates.project({ ...report, status: 'resolved' }, during).status, 'open');
});

// Exercise the actual shared panel handler, including its background reconciliation.
const overlay = await readFile(new URL('../apps/extension/components/review-overlay.tsx', import.meta.url), 'utf8');
const handlerSource = stripTypeScriptTypes(overlay.slice(overlay.indexOf('  function updateReportField('), overlay.indexOf('  function focusReport(')));
const handler = new Function('{ selected, busy, fieldUpdates, notificationScope, message, fieldUpdateUI, setStatus, fieldRefreshQueue, fieldUpdateRefresh }', handlerSource + '\nreturn updateReportField;');

test('the shared extension/widget handler updates immediately without a global busy operation', async () => {
  const h = host(), response = deferred(), changes = [], toasts = [], refreshes = [];
  const context = {
    selected: report, busy: false, fieldUpdates: h.updates,
    notificationScope: { current: 'env:/' },
    message: async input => { changes.push(input); await response.promise; },
    fieldUpdateUI: { current: change => changes.push(change) },
    setStatus: (...toast) => toasts.push(toast),
    fieldRefreshQueue: { current: Promise.resolve() },
    fieldUpdateRefresh: { current: async id => refreshes.push(id) },
  };
  handler(context)('status', 'resolved');
  assert.deepEqual(changes, [{ id: 'a', status: 'resolved' }]);
  await flush();
  assert.equal(changes[1].operation, 'status');
  assert.deepEqual(refreshes, []);
  response.resolve();
  await flush();
  await context.fieldRefreshQueue.current;
  assert.deepEqual(toasts, [['Stato aggiornato.', 'success']]);
  assert.deepEqual(refreshes, ['a']);
});

test('the handler reports a failed save and does not refresh a page visited in the meantime', async () => {
  const updates = createReportFieldUpdates(), response = deferred(), patches = [], toasts = [], refreshes = [];
  const context = {
    selected: report, busy: false, fieldUpdates: updates,
    notificationScope: { current: 'env:/' },
    message: () => response.promise,
    fieldUpdateUI: { current: change => patches.push(change) },
    setStatus: (...toast) => toasts.push(toast),
    fieldRefreshQueue: { current: Promise.resolve() },
    fieldUpdateRefresh: { current: async id => refreshes.push(id) },
  };
  handler(context)('priority', 'high');
  context.notificationScope.current = 'env:/other';
  response.reject(new Error('offline'));
  await flush();
  assert.deepEqual(patches, [{ id: 'a', priority: 'high' }, { id: 'a', priority: 'medium' }]);
  assert.deepEqual(toasts, [['offline', 'error']]);
  assert.deepEqual(refreshes, []);
});

const refreshSource = stripTypeScriptTypes(overlay.slice(overlay.indexOf('  async function refresh('), overlay.indexOf('  async function run(')));
const refresh = new Function('{ hideReporty, isPageActive, reports, pinsRevision, notificationScope, fieldUpdates, setPinsLoading, listFeed, message, page, setReports }', refreshSource + '\nreturn refresh;');

test('background reconciliation polls the list and pins without enabling skeletons', async () => {
  const updates = createReportFieldUpdates(), response = deferred(), loading = [], pins = [];
  let polls = 0, reloads = 0;
  const reconcile = refresh({
    hideReporty: false, isPageActive: () => true, reports: [report], pinsRevision: { current: 0 },
    notificationScope: { current: 'env:/' }, fieldUpdates: updates,
    setPinsLoading: value => loading.push(value),
    listFeed: { poll: async () => { polls++; }, refresh: () => { reloads++; } },
    message: () => response.promise, page: { pagePath: '/' }, setReports: value => pins.push(value),
  });
  const pending = reconcile(true);
  assert.equal(polls, 1);
  assert.equal(reloads, 0);
  assert.deepEqual(loading, []);
  await updates.update(report, 'status', 'validation', async () => {}, () => {});
  response.resolve({ data: [report] });
  await pending;
  assert.equal(pins[0][0].status, 'validation');
  assert.deepEqual(loading, [false]);
});

test('a failed pin refresh still waits for the list so the next reconciliation can poll again', async () => {
  const listing = deferred();
  let finished = false;
  const reconcile = refresh({
    hideReporty: false, isPageActive: () => true, reports: [report], pinsRevision: { current: 0 },
    notificationScope: { current: 'env:/' }, fieldUpdates: createReportFieldUpdates(),
    setPinsLoading: () => {}, listFeed: { poll: () => listing.promise },
    message: async () => { throw new Error('offline'); }, page: { pagePath: '/' }, setReports: () => {},
  });
  const pending = assert.rejects(reconcile(true), /offline/).then(() => { finished = true; });
  await flush();
  assert.equal(finished, false);
  listing.resolve();
  await pending;
  assert.equal(finished, true);
});

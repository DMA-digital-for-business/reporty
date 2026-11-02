import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(await readFile(new URL('../apps/web/app/dashboard/report-actions.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const createAction = new Function('requireUser', 'isUuid', 'reportPageSchema', source + '\nreturn getPlaygroundReport;');
const environmentId = 'environment', id = 'selected', pagePath = '/page#/route';
const report = { id, environment_id: environmentId, page_path: pagePath, body: 'Selected', status: 'resolved', context: { url: 'https://example.com/old', pagePath: '/old' } };
function setup(responses) {
  const calls = [];
  const action = createAction(async () => ({ supabase: { rpc: async (name, args) => {
    calls.push({ name, args });
    return responses[name];
  } } }), value => value === environmentId, { safeParse: data => ({ success: true, data }) });
  return { calls, load: () => action(environmentId, pagePath, id) };
}
const success = () => ({
  report_page: { data: { reports: [report] } },
  report_operation: { data: { issue: { ...report, attachments: [{ id: 'file' }] }, comments: [{ id: 'reply' }] } },
});

test('playground loads the exact report independently of Kanban status and page offset', async () => {
  const { load, calls } = setup(success());
  const result = await load();
  assert.equal(result.data.report.id, id);
  assert.equal(result.data.report.page_path, pagePath);
  assert.equal(result.data.report.context.pagePath, '/old');
  assert.deepEqual(result.data.report.attachments, [{ id: 'file' }]);
  assert.deepEqual(result.data.comments, [{ id: 'reply' }]);
  assert.deepEqual(calls[0].args.payload, { id, pagePath, environments: [environmentId], limit: 1, projectScope: true });
  assert.deepEqual(calls[1].args, { secret: null, target: environmentId, operation: 'thread', payload: { id } });
});

test('missing reports and RPC errors return recoverable results instead of throwing a 500', async () => {
  for (const responses of [
    { ...success(), report_page: { data: { reports: [] } } },
    { ...success(), report_page: { error: { message: 'database failure' } } },
    { ...success(), report_operation: { error: { message: 'denied' } } },
    { ...success(), report_operation: { data: null } },
  ]) {
    const result = await setup(responses).load();
    assert.equal(typeof result.error, 'string');
    assert.equal(result.data, undefined);
  }
});

test('a wrong ID, environment or hash route never opens an unrelated report', async () => {
  for (const field of ['id', 'environment_id', 'page_path']) {
    for (const side of ['report_page', 'report_operation']) {
      const responses = success();
      const wrong = { ...report, [field]: 'other' };
      responses[side] = { data: side === 'report_page' ? { reports: [wrong] } : { issue: wrong, comments: [] } };
      assert.ok((await setup(responses).load()).error);
    }
  }
});

const drawer = await readFile(new URL('../apps/web/app/dashboard/playground-report-drawer.tsx', import.meta.url), 'utf8');
const effectStart = drawer.indexOf('    let disposed = false;', drawer.indexOf('previous?.isConnected'));
const effectEnd = drawer.indexOf('\n  }, [id, pagePath, cache, attempt]);', effectStart);
assert.ok(effectStart !== -1 && effectEnd > effectStart, 'loading effect must not depend on changing toast state');
const mountLoading = new Function('cache', 'pagePath', 'id', 'setFailed', 'notifyLoadError', 'startNotificationPolling', drawer.slice(effectStart, effectEnd));

test('failed initial reads stop automatic retries, notify once and can be retried explicitly', async () => {
  let reads = 0, notices = 0, poll;
  const cache = { get: () => undefined, refresh: async () => { reads++; throw new Error('unavailable'); } };
  const mount = () => mountLoading(cache, pagePath, id, () => {}, () => { notices++; }, refresh => { poll = refresh; return () => {}; });
  const stop = mount();
  await poll();
  await poll();
  assert.equal(reads, 1);
  assert.equal(notices, 1);
  stop();
  mount(); // The Riprova button increments attempt and mounts a new loading effect.
  await poll();
  assert.equal(reads, 2);
  assert.equal(notices, 2);
});

test('background failures keep the cached detail and allow later scheduled refreshes', async () => {
  let reads = 0, notices = 0, poll;
  const failures = [];
  mountLoading({ get: () => ({ report }), refresh: async () => { reads++; throw new Error('offline'); } }, pagePath, id,
    failed => failures.push(failed), () => { notices++; }, refresh => { poll = refresh; return () => {}; });
  await poll(); await poll();
  assert.equal(reads, 2);
  assert.equal(notices, 1);
  assert.deepEqual(failures, [false, false]);
});

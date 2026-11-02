import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createReportPageBatch } from '../apps/web/lib/report-page-batch.ts';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
const statuses = ['open', 'in_progress', 'validation', 'resolved'];

test('four initial column reads share one request and become available together', async () => {
  const response = deferred();
  const calls = [];
  const completed = [];
  const load = createReportPageBatch(queries => { calls.push(queries); return response.promise; });
  const pending = statuses.map(status => load({ statuses: [status] }).then(page => { completed.push(page); return page; }));
  await tick();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].map(query => query.statuses[0]), statuses);
  assert.deepEqual(completed, []);
  const pages = statuses.map(status => ({ reports: [{ id: status }], total: 1 }));
  response.resolve(pages);
  assert.deepEqual(await Promise.all(pending), pages);
  assert.deepEqual(completed, pages);
});

test('a failed batch rejects every column and a later load can retry', async () => {
  let failed = true;
  const page = { reports: [], total: 0 };
  const load = createReportPageBatch(async queries => {
    if (failed) throw new Error('offline');
    return queries.map(() => page);
  });
  const results = await Promise.allSettled(statuses.map(status => load({ statuses: [status] })));
  assert.ok(results.every(result => result.status === 'rejected' && result.reason.message === 'offline'));
  failed = false;
  assert.deepEqual(await load({ statuses: ['open'] }), page);
});

const source = stripTypeScriptTypes(await readFile(new URL('../apps/web/app/dashboard/report-actions.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const action = new Function('requireUser', 'isUuid', 'reportPageSchema', source + '\nreturn getReportPages;');

test('server starts all authorized column queries before waiting for any result', async () => {
  let authCalls = 0;
  const reads = [];
  const getPages = action(async () => {
    authCalls++;
    return { supabase: { rpc: (name, args) => {
      const response = deferred();
      reads.push({ name, args, ...response });
      return response.promise;
    } } };
  }, value => value === 'environment', { safeParse: input => ({ success: true, data: input }) });
  const pending = getPages('environment', statuses.map(status => ({ statuses: [status] })));
  await tick();
  assert.equal(authCalls, 1);
  assert.equal(reads.length, 4);
  for (const read of reads) {
    assert.equal(read.name, 'report_page');
    assert.equal(read.args.secret, null);
    assert.equal(read.args.target, 'environment');
    assert.equal(read.args.payload.projectScope, true);
  }
  // Replies can arrive out of order; results retain the requested column order.
  [...reads].reverse().forEach(read => read.resolve({ data: read.args.payload.statuses[0], error: null }));
  assert.deepEqual(await pending, statuses);
});

test('invalid batch queries never reach the database', async () => {
  let reads = 0;
  const getPages = action(async () => ({ supabase: { rpc: () => { reads++; } } }), () => true,
    { safeParse: input => input.valid ? { success: true, data: input } : { success: false } });
  await assert.rejects(getPages('environment', [{ valid: true }, { valid: false }]), /non validi/);
  assert.equal(reads, 0);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createReportMoveQueue } from '../apps/web/lib/report-move-queue.ts';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('rapid moves of one report save in order while other reports remain independent', async () => {
  const enqueue = createReportMoveQueue();
  const firstResponse = deferred();
  const writes = [];
  const first = enqueue('a', async () => { writes.push('a:in_progress'); await firstResponse.promise; });
  const second = enqueue('a', async () => { writes.push('a:resolved'); });
  const other = enqueue('b', async () => { writes.push('b:validation'); });
  await other;
  assert.deepEqual(writes, ['a:in_progress', 'b:validation']);
  firstResponse.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(writes, ['a:in_progress', 'b:validation', 'a:resolved']);
});

test('a failed write does not prevent a later move of the same report', async () => {
  const enqueue = createReportMoveQueue();
  const failed = enqueue('a', async () => { throw new Error('denied'); });
  let saved = false;
  const retry = enqueue('a', async () => { saved = true; });
  await assert.rejects(failed, /denied/);
  await retry;
  assert.equal(saved, true);
});

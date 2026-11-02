import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCounts, parseSizes, quotaStatus, nonnegative, parseStorage, STORAGE_USAGE_QUERY } from '../apps/web/lib/supabase/audit-data.ts';

test('audit sums real samples and exposes their range', () => {
  const data = parseCounts({ result: [
    { timestamp: '2026-10-12T10:00:00Z', total_rest_requests: 3, total_auth_requests: 2, total_storage_requests: 1, total_realtime_requests: 0 },
    { timestamp: '2026-10-12T09:00:00Z', total_rest_requests: 4, total_auth_requests: 0, total_storage_requests: 2, total_realtime_requests: 1 },
  ] });
  assert.equal(data.total, 13);
  assert.equal(data.rest, 7);
  assert.equal(data.from, '2026-10-12T09:00:00.000Z');
  assert.equal(data.to, '2026-10-12T10:00:00.000Z');
});
test('audit never treats missing metrics as zero', () => {
  for (const input of [{}, { error: 'unavailable', result: [] }, { result: [] }, { result: [{}] }]) assert.throws(() => parseCounts(input));
  assert.deepEqual(parseSizes([{ bytes: null, screenshot_bytes: '1024' }], ['bytes','screenshot_bytes']), { bytes: null, screenshot_bytes: 1024 });
  assert.throws(() => parseSizes({}, ['bytes']));
  for (const value of [null, undefined, '', -1, 'NaN', Infinity]) assert.equal(nonnegative(value), null);
});
test('quota warnings use actual usage, preserving overages', () => {
  assert.deepEqual(quotaStatus(null, 100), { percent: null, level: 'unknown' });
  assert.equal(quotaStatus(79, 100).level, 'ok');
  assert.equal(quotaStatus(80, 100).level, 'warning');
  assert.equal(quotaStatus(110, 100).level, 'exceeded');
  assert.ok(Math.abs(quotaStatus(110, 100).percent - 110) < 1e-10);
});

test('storage audit lists every bucket, including empty buckets, and sums their usage', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  try {
    await db.exec(`create schema storage;
      create table storage.buckets (id text primary key);
      create table storage.objects (id text primary key, bucket_id text references storage.buckets, metadata jsonb);
      insert into storage.buckets values ('screenshots'), ('attachments'), ('report-attachments'), ('future-bucket');
      insert into storage.objects values
        ('1', 'screenshots', '{"size":1024}'), ('2', 'attachments', '{"size":"2048"}'),
        ('3', 'report-attachments', '{"size":4096}');`);
    const usage = parseStorage((await db.query(STORAGE_USAGE_QUERY)).rows);
    assert.equal(usage.bytes, 7168);
    assert.deepEqual(usage.buckets, [
      { id: 'attachments', bytes: 2048, count: 1 },
      { id: 'future-bucket', bytes: 0, count: 0 },
      { id: 'report-attachments', bytes: 4096, count: 1 },
      { id: 'screenshots', bytes: 1024, count: 1 },
    ]);
    await db.exec(`insert into storage.objects values ('4', 'attachments', '{}');`);
    const incomplete = parseStorage((await db.query(STORAGE_USAGE_QUERY)).rows);
    assert.equal(incomplete.bytes, null);
    assert.deepEqual(incomplete.buckets[0], { id: 'attachments', bytes: null, count: 2 });
    assert.equal(incomplete.buckets[3].bytes, 1024);
    await db.exec('delete from storage.objects; delete from storage.buckets;');
    assert.deepEqual(parseStorage((await db.query(STORAGE_USAGE_QUERY)).rows), { bytes: 0, buckets: [] });
  } finally {
    await db.close();
  }
});

test('storage audit preserves unavailable and unsafe metrics', () => {
  for (const input of [null, {}, [{}], [{ bucket_id: '' }]]) assert.throws(() => parseStorage(input));
  assert.deepEqual(parseStorage([{ bucket_id: 'attachments', bytes: null, file_count: null }]), {
    bytes: null, buckets: [{ id: 'attachments', bytes: null, count: null }],
  });
  assert.equal(parseStorage([
    { bucket_id: 'a', bytes: Number.MAX_SAFE_INTEGER, file_count: 1 },
    { bucket_id: 'b', bytes: 1, file_count: 1 },
  ]).bytes, null);
});

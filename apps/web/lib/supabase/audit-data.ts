export const FREE_DATABASE_BYTES = 500 * 1024 * 1024;
export const FREE_STORAGE_BYTES = 1024 * 1024 * 1024;

export function nonnegative(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (value === '') return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}
export function quotaStatus(used: number | null, limit: number) {
  if (used === null) return { percent: null, level: 'unknown' as const };
  const percent = used / limit * 100;
  return { percent, level: percent >= 100 ? 'exceeded' as const : percent >= 80 ? 'warning' as const : 'ok' as const };
}
export function parseCounts(input: unknown) {
  const response = input as { result?: unknown; error?: unknown } | null;
  if (!response || response.error || !Array.isArray(response.result) || !response.result.length) throw new Error('Conteggi API non disponibili per il periodo richiesto.');
  const totals = { rest: 0, auth: 0, storage: 0, realtime: 0 };
  const dates: string[] = [];
  for (const value of response.result) {
    if (!value || typeof value !== 'object') throw new Error('Conteggi API non validi.');
    const row = value as Record<string, unknown>;
    for (const key of Object.keys(totals) as (keyof typeof totals)[]) {
      const count = nonnegative(row[`total_${key}_requests`]);
      if (count === null) throw new Error('Conteggi API incompleti.');
      totals[key] += count;
      if (!Number.isSafeInteger(totals[key])) throw new Error('Conteggi API non validi.');
    }
    if (typeof row.timestamp === 'string' && Number.isFinite(Date.parse(row.timestamp))) dates.push(new Date(row.timestamp).toISOString());
  }
  dates.sort();
  return { ...totals, total: totals.rest + totals.auth + totals.storage + totals.realtime, from: dates[0] ?? null, to: dates.at(-1) ?? null };
}
export function parseSizes(input: unknown, keys: string[]) {
  if (!Array.isArray(input) || !input[0] || typeof input[0] !== 'object') throw new Error('Misurazione dello spazio non disponibile.');
  const row = input[0] as Record<string, unknown>;
  return Object.fromEntries(keys.map(key => [key, nonnegative(row[key])])) as Record<string, number | null>;
}

export const STORAGE_USAGE_QUERY = `select b.id as bucket_id,
  case when count(*) filter(where o.id is not null and coalesce(o.metadata->>'size','') !~ '^[0-9]+$') > 0 then null
    else coalesce(sum(case when o.metadata->>'size' ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) end as bytes,
  count(o.id) as file_count
  from storage.buckets b left join storage.objects o on o.bucket_id = b.id
  group by b.id order by b.id`;

export function parseStorage(input: unknown) {
  if (!Array.isArray(input)) throw new Error('Misurazione dello spazio non disponibile.');
  const buckets = input.map(value => {
    if (!value || typeof value !== 'object' || typeof value.bucket_id !== 'string' || !value.bucket_id) {
      throw new Error('Metriche dei bucket non valide.');
    }
    return { id: value.bucket_id, bytes: nonnegative(value.bytes), count: nonnegative(value.file_count) };
  });
  const total = buckets.reduce<number | null>((sum, bucket) => {
    if (sum === null || bucket.bytes === null) return null;
    return nonnegative(sum + bucket.bytes);
  }, 0);
  return { bytes: total, buckets };
}

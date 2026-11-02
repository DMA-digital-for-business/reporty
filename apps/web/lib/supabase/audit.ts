import 'server-only';
import { parseCounts, parseSizes, parseStorage, STORAGE_USAGE_QUERY } from './audit-data';

export async function getSupabaseAudit() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const configuredRef = process.env.SUPABASE_PROJECT_REF;
  let ref = configuredRef;
  if (!ref) {
    try { ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1]; } catch { /* Configuration message below. */ }
  }
  if (!token || !ref || !/^[a-z0-9]+$/.test(ref)) return { configured: false as const };
  async function request(path: string, query?: string) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${path}`, {
      method: query ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(query ? { 'Content-Type': 'application/json' } : {}) },
      ...(query ? { body: JSON.stringify({ query }) } : {}),
      cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Token non autorizzato a leggere questa metrica. Verifica accesso al progetto e permessi del token.');
      if (response.status === 429) throw new Error('Troppe richieste a Supabase. Riprova tra poco.');
      throw new Error('Supabase non ha restituito questa metrica. Riprova tra poco.');
    }
    return response.json() as Promise<unknown>;
  }
  const [database, storage, api] = await Promise.allSettled([
    request('database/query/read-only', 'select sum(pg_catalog.pg_database_size(datname))::bigint as bytes from pg_catalog.pg_database').then(data => parseSizes(data, ['bytes'])),
    request('database/query/read-only', STORAGE_USAGE_QUERY).then(parseStorage),
    request('analytics/endpoints/usage.api-counts').then(parseCounts),
  ]);
  function result<T>(settled: PromiseSettledResult<T>) {
    return settled.status === 'fulfilled' ? { data: settled.value, error: null } : { data: null, error: settled.reason instanceof Error && settled.reason.name !== 'TimeoutError' ? settled.reason.message : 'Supabase non ha risposto in tempo. Riprova.' };
  }
  return { configured: true as const, ref, fetchedAt: new Date().toISOString(), database: result(database), storage: result(storage), api: result(api) };
}

'use server';

import { revalidatePath } from 'next/cache';
import { getPageContext, isUuid } from '@reporty/shared';
import { requireUser } from '@/lib/auth';

export async function renameEnvironmentPage(environmentId: string, oldPath: string, newPath: string) {
  if (!isUuid(environmentId) || typeof oldPath !== 'string' || typeof newPath !== 'string') return { error: 'Dati non validi.' };
  try {
    if (!oldPath || oldPath.length > 8192 || !newPath.startsWith('/') || newPath.startsWith('//') || newPath.length > 8192 || getPageContext(`https://reporty.invalid${newPath}`).pagePath !== newPath) {
      return { error: 'Inserisci un percorso valido, ad esempio /nuove-news, senza dominio o query.' };
    }
  } catch { return { error: 'Percorso non valido.' }; }
  if (oldPath === newPath) return { error: 'Il nuovo percorso coincide con quello attuale.' };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('rename_environment_page', { target: environmentId, old_path: oldPath, new_path: newPath });
  if (error) return { error: error.code === 'P0002' ? 'La pagina non esiste più. Ricarica la lista.' : error.code === '22023' ? 'Percorso non valido.' : 'Impossibile rinominare la pagina. Verifica i permessi e la migrazione environment_pages.sql.' };
  revalidatePath('/dashboard', 'layout');
  return { count: Number(data.count) };
}

import { supabaseRepository } from './supabase-repository';
import { localRepository } from './local-mock-repository';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { IInvoiceRepository } from '@/core/ports/repository';

/**
 * Repository par défaut de l'application Izi Factures.
 * Utilise Supabase en priorité lorsque configuré, avec fallback sur le mock local en mémoire.
 */
export const repository: IInvoiceRepository = isSupabaseConfigured ? supabaseRepository : localRepository;

export { supabaseRepository, localRepository };

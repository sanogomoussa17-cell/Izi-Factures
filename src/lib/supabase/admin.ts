import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration is missing in environment variables');
  }
  cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cachedAdmin;
}

export const supabaseAdmin = getSupabaseAdmin();

/**
 * Résout l'organisation liée à la requête utilisateur (Mobile & Ordinateur)
 */
export async function resolveOrganizationForRequest(req: Request) {
  const admin = getSupabaseAdmin();

  // 1. Récupérer les identifiants passés dans les headers
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const userEmailHeader = req.headers.get('x-user-email');
  const userIdHeader = req.headers.get('x-user-id');

  let userEmail = userEmailHeader || '';
  let userId = userIdHeader || '';
  let userFullName = '';
  let userCompanyName = '';

  // Si un token Bearer est fourni, vérifier l'utilisateur auprès de Supabase Auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email || userEmail;
        userFullName = userData.user.user_metadata?.full_name || '';
        userCompanyName = userData.user.user_metadata?.company_name || '';
      }
    } catch (e) {
      console.warn('Erreur vérification token dans resolveOrganizationForRequest:', e);
    }
  }

  // 2. Trouver l'organisation par email
  if (userEmail) {
    const { data: orgByEmail } = await admin
      .from('organizations')
      .select('*')
      .ilike('email', userEmail.trim())
      .maybeSingle();

    if (orgByEmail) {
      return { org: orgByEmail, orgId: orgByEmail.id, userEmail, userId };
    }
  }

  // 3. Trouver la première organisation disponible
  const { data: defaultOrg } = await admin
    .from('organizations')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (defaultOrg) {
    // Si l'utilisateur connecté est sanogomoussa17@gmail.com ou similaire et que l'org par défaut existe
    return { org: defaultOrg, orgId: defaultOrg.id, userEmail, userId };
  }

  // 4. Si aucune organisation n'existe du tout, en créer une nouvelle
  const { data: newOrg, error: createOrgErr } = await admin
    .from('organizations')
    .insert({
      name: userCompanyName || 'Mon Entreprise',
      legal_name: userCompanyName ? `${userCompanyName} SARL` : 'Mon Entreprise SARL',
      email: userEmail || 'contact@mon-entreprise.sn',
      phone: '+221 77 000 00 00',
      address: 'Plateau, Rue Carnot',
      city: 'Dakar',
      country: 'Sénégal',
      tax_id_number: 'SN-DKR-2026-A-001',
      trade_register_number: 'RCCM-SN-DKR-2026-B-001',
      currency: 'XOF',
      is_tax_enabled: true,
      default_tax_rate_bps: 1800,
    })
    .select()
    .single();

  if (createOrgErr || !newOrg) {
    throw new Error(`Impossible de créer ou résoudre une organisation: ${createOrgErr?.message}`);
  }

  return { org: newOrg, orgId: newOrg.id, userEmail, userId };
}

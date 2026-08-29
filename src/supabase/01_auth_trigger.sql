-- ==============================================================================
-- Izi Factures — Trigger Automatique d'Inscription Utilisateur & Création Entreprise
-- ==============================================================================

-- 1. Fonction qui gère l'inscription d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id UUID;
    company_name TEXT;
    currency_choice currency_code;
    user_phone TEXT;
BEGIN
    -- Récupérer les métadonnées passées lors du signUp
    company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'Mon Entreprise');
    user_phone := COALESCE(new.raw_user_meta_data->>'phone', '+221 77 000 00 00');
    
    -- Devise
    BEGIN
        currency_choice := (COALESCE(new.raw_user_meta_data->>'currency', 'XOF'))::currency_code;
    EXCEPTION WHEN OTHERS THEN
        currency_choice := 'XOF'::currency_code;
    END;

    -- Créer l'organisation pour cet utilisateur
    INSERT INTO public.organizations (
        name,
        email,
        phone,
        address,
        city,
        country,
        tax_id_number,
        currency,
        is_tax_enabled,
        default_tax_rate_bps
    ) VALUES (
        company_name,
        new.email,
        user_phone,
        'Siège Social',
        'Dakar',
        'Sénégal',
        'SN-DKR-' || floor(random() * 900000 + 100000)::text,
        currency_choice,
        TRUE,
        1800
    ) RETURNING id INTO new_org_id;

    -- Lier l'utilisateur à l'organisation comme propriétaire (OWNER)
    INSERT INTO public.organization_members (
        org_id,
        user_id,
        role
    ) VALUES (
        new_org_id,
        new.id,
        'OWNER'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Déclencheur sur la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

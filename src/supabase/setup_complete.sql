-- ==============================================================================
-- 🚀 IZI FACTURES — SCRIPT COMPLET D'INITIALISATION SUPABASE
-- À exécuter dans votre éditeur SQL Supabase :
-- https://supabase.com/dashboard/project/udnkmqmucohfjovsdivs/sql/new
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('XOF', 'XAF', 'GNF', 'EUR', 'USD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'BANK_TRANSFER', 'CASH', 'CHECK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_structure AS ENUM ('STANDARD', 'SPLIT', 'RECURRING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. ORGANIZATIONS (Multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    tax_id_number VARCHAR(100) NOT NULL, -- N° IFU / NINEA / RCCM
    trade_register_number VARCHAR(100),
    currency currency_code NOT NULL DEFAULT 'XOF',
    is_tax_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_tax_rate_bps INTEGER NOT NULL DEFAULT 1800, -- 18% = 1800 bps
    bank_details TEXT,
    wave_number VARCHAR(50),
    orange_money_number VARCHAR(50),
    momo_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORGANIZATION MEMBERS (Auth linking)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users
    role VARCHAR(50) NOT NULL DEFAULT 'OWNER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dakar',
    country VARCHAR(100) DEFAULT 'Sénégal',
    tax_id_number VARCHAR(100),
    total_invoiced BIGINT DEFAULT 0,
    total_paid BIGINT DEFAULT 0,
    outstanding_balance BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    category VARCHAR(100) DEFAULT 'Fournitures & Services',
    tax_id_number VARCHAR(100),
    total_purchased BIGINT DEFAULT 0,
    total_paid BIGINT DEFAULT 0,
    balance_due BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    status document_status NOT NULL DEFAULT 'DRAFT',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    payment_structure payment_structure NOT NULL DEFAULT 'STANDARD',
    currency currency_code NOT NULL DEFAULT 'XOF',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    is_tax_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    tax_exemption_reason TEXT,
    subtotal_amount BIGINT NOT NULL DEFAULT 0, -- HT en entiers stricts
    tax_amount BIGINT NOT NULL DEFAULT 0,      -- TVA en entiers stricts
    discount_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,    -- TTC à payer
    paid_amount BIGINT NOT NULL DEFAULT 0,     -- Dérivé des allocations
    remaining_balance BIGINT NOT NULL DEFAULT 0,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_invoice_number UNIQUE (org_id, invoice_number)
);

-- 8. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price BIGINT NOT NULL DEFAULT 0, -- en entiers stricts
    tax_rate_bps INTEGER NOT NULL DEFAULT 1800,
    is_tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    total_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PAYMENT SCHEDULES (Échéancier prévisionnel)
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL,
    percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    expected_amount BIGINT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    paid_amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAYMENTS (Encaissements réels)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency currency_code NOT NULL DEFAULT 'XOF',
    payment_method payment_method NOT NULL DEFAULT 'WAVE',
    transaction_reference VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INSERTION DE L'ORGANISATION PAR DÉFAUT
INSERT INTO organizations (
    id,
    name,
    legal_name,
    tax_id_number,
    trade_register_number,
    address,
    city,
    country,
    phone,
    email,
    currency,
    is_tax_enabled,
    default_tax_rate_bps,
    wave_number,
    orange_money_number
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Izi Factures Studio',
    'Izi Factures Studio SARL',
    'SN-DKR-2026-A-9921',
    'RCCM-SN-DKR-2026-B-1402',
    'Plateau, Rue Carnot x Boulevard de la République',
    'Dakar',
    'Sénégal',
    '+221 77 849 20 40',
    'contact@izifactures.sn',
    'XOF',
    TRUE,
    1800,
    '+221 77 849 20 40',
    '+221 78 520 11 22'
) ON CONFLICT (id) DO NOTHING;

-- 12. INSERTION DE CLIENTS DE DÉPART
INSERT INTO clients (
    id,
    org_id,
    name,
    company_name,
    email,
    phone,
    address,
    city,
    country,
    tax_id_number
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Mamadou Diop',
    'Teranga Digital Agency',
    'm.diop@teranga.sn',
    '+221 77 450 12 34',
    'Almadies, Zone 12',
    'Dakar',
    'Sénégal',
    'SN-DKR-2025-C-8812'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Aïssatou Ba',
    'Ba & Associés Consulting',
    'aissatou.ba@ba-consulting.ci',
    '+225 07 88 99 00',
    'Cocody Ambassades',
    'Abidjan',
    'Côte d’Ivoire',
    'CI-ABJ-2025-A-1029'
) ON CONFLICT (id) DO NOTHING;

-- 13. TRIGGER D'INSCRIPTION AUTOMATIQUE (auth.users -> organizations)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id UUID;
    company_name TEXT;
    currency_choice currency_code;
    user_phone TEXT;
BEGIN
    company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'Mon Entreprise');
    user_phone := COALESCE(new.raw_user_meta_data->>'phone', '+221 77 000 00 00');
    
    BEGIN
        currency_choice := (COALESCE(new.raw_user_meta_data->>'currency', 'XOF'))::currency_code;
    EXCEPTION WHEN OTHERS THEN
        currency_choice := 'XOF'::currency_code;
    END;

    INSERT INTO public.organizations (
        name,
        legal_name,
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
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

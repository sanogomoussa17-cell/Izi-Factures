-- ==============================================================================
-- Izi Factures - DDL PostgreSQL Supabase
-- Modélisation fiscale UEMOA, Devises sans flottant, Split Payments 3 Tables
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE currency_code AS ENUM ('XOF', 'XAF', 'GNF', 'EUR', 'USD');
CREATE TYPE document_status AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');
CREATE TYPE payment_method AS ENUM ('WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'BANK_TRANSFER', 'CASH', 'CHECK');
CREATE TYPE payment_structure AS ENUM ('STANDARD', 'SPLIT', 'RECURRING');

-- 3. ORGANIZATIONS (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    tax_id_number VARCHAR(100) NOT NULL, -- N° IFU / NINEA / RCCM
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
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users
    role VARCHAR(50) NOT NULL DEFAULT 'OWNER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLIENTS
CREATE TABLE clients (
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
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    category VARCHAR(100) DEFAULT 'Fournitures & Services',
    tax_id_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INVOICES
CREATE TABLE invoices (
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
CREATE TABLE invoice_items (
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
CREATE TABLE payment_schedules (
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
CREATE TABLE payments (
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

-- 11. PAYMENT ALLOCATIONS (Lettrage)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
    allocated_amount BIGINT NOT NULL CHECK (allocated_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. INVOICE SEQUENCE COUNTER (Numérotation sans trou)
CREATE TABLE invoice_sequences (
    org_id UUID NOT NULL,
    year INTEGER NOT NULL,
    prefix VARCHAR(20) NOT NULL DEFAULT 'FAC',
    last_sequence INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (org_id, year, prefix)
);

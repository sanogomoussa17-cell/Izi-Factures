-- ==============================================================================
-- Fonctions Stored Procedures & Triggers de Conformité Fiscale
-- ==============================================================================

-- 1. Fonction de numérotation séquentielle sans trou (Atomic Sequence)
CREATE OR REPLACE FUNCTION generate_next_invoice_number(
    p_org_id UUID,
    p_prefix VARCHAR(20) DEFAULT 'FAC',
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq INTEGER;
BEGIN
    INSERT INTO invoice_sequences (org_id, year, prefix, last_sequence)
    VALUES (p_org_id, p_year, p_prefix, 1)
    ON CONFLICT (org_id, year, prefix)
    DO UPDATE SET last_sequence = invoice_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;

    RETURN p_prefix || '-' || p_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- 2. Trigger d'Immuabilité des Factures Émises (Fiscal Guard)
CREATE OR REPLACE FUNCTION guard_issued_invoice_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si la facture était déjà émise
    IF OLD.status = 'ISSUED' THEN
        -- Interdire toute modification de montant ou de numéro de facture
        IF (OLD.total_amount != NEW.total_amount OR 
            OLD.subtotal_amount != NEW.subtotal_amount OR
            OLD.tax_amount != NEW.tax_amount OR
            OLD.invoice_number != NEW.invoice_number) THEN
            RAISE EXCEPTION 'Une facture déjà émise ne peut être modifiée. Veuillez émettre un avoir rectificatif.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_invoice_immutability ON invoices;
CREATE TRIGGER trg_guard_invoice_immutability
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION guard_issued_invoice_immutability();

-- 3. Vue Dynamique des Factures avec Calcul du Retard en Temps Réel (Pas de cron nocturne fragile)
CREATE OR REPLACE VIEW view_invoices_realtime AS
SELECT 
    i.*,
    c.name AS client_name,
    c.company_name AS client_company_name,
    c.phone AS client_phone,
    CASE 
        WHEN i.remaining_balance = 0 THEN 'PAID'::payment_status
        WHEN i.due_date < CURRENT_DATE AND i.remaining_balance > 0 THEN 'OVERDUE'::payment_status
        WHEN i.paid_amount > 0 AND i.remaining_balance > 0 THEN 'PARTIALLY_PAID'::payment_status
        ELSE 'UNPAID'::payment_status
    END AS computed_payment_status,
    GREATEST(0, (CURRENT_DATE - i.due_date)) AS days_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id;

-- ==============================================================================
-- Row Level Security (RLS) - Isolation multi-tenant étanche
-- ==============================================================================

-- 1. Helper function anti-récursion pour récupérer les organisations de l'utilisateur
CREATE OR REPLACE FUNCTION get_current_user_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- 2. Activer la RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;

-- 3. Politiques Organisations
CREATE POLICY "Users can view organizations they belong to"
ON organizations FOR SELECT
USING (id IN (SELECT get_current_user_org_ids()));

CREATE POLICY "Owners can update their organization"
ON organizations FOR UPDATE
USING (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'OWNER'));

-- 4. Politiques Clients
CREATE POLICY "Clients isolation by organization"
ON clients FOR ALL
USING (org_id IN (SELECT get_current_user_org_ids()))
WITH CHECK (org_id IN (SELECT get_current_user_org_ids()));

-- 5. Politiques Fournisseurs
CREATE POLICY "Suppliers isolation by organization"
ON suppliers FOR ALL
USING (org_id IN (SELECT get_current_user_org_ids()))
WITH CHECK (org_id IN (SELECT get_current_user_org_ids()));

-- 6. Politiques Factures
CREATE POLICY "Invoices isolation by organization"
ON invoices FOR ALL
USING (org_id IN (SELECT get_current_user_org_ids()))
WITH CHECK (org_id IN (SELECT get_current_user_org_ids()));

-- 7. Politiques Lignes de Facture
CREATE POLICY "Invoice items isolation"
ON invoice_items FOR ALL
USING (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())))
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())));

-- 8. Politiques Échéanciers
CREATE POLICY "Payment schedules isolation"
ON payment_schedules FOR ALL
USING (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())))
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())));

-- 9. Politiques Paiements
CREATE POLICY "Payments isolation by organization"
ON payments FOR ALL
USING (org_id IN (SELECT get_current_user_org_ids()))
WITH CHECK (org_id IN (SELECT get_current_user_org_ids()));

-- 10. Politiques Allocations de Paiement
CREATE POLICY "Payment allocations isolation"
ON payment_allocations FOR ALL
USING (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())))
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT get_current_user_org_ids())));

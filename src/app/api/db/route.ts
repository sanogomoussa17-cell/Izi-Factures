import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, resolveOrganizationForRequest } from '@/lib/supabase/admin';
import { calculateInvoiceTotals } from '@/core/domain/tax-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 200 });
    }

    const { org, orgId } = await resolveOrganizationForRequest(req);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization unavailable' }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    switch (action) {
      // =========================================================================
      // 1. ORGANISATION
      // =========================================================================
      case 'getOrganization': {
        const { data, error } = await admin
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (error || !data) {
          return NextResponse.json({ success: true, data: mapOrganizationRow(org) });
        }
        return NextResponse.json({ success: true, data: mapOrganizationRow(data) });
      }

      case 'updateOrganization': {
        const updateData = payload || {};
        const dbPayload: any = {
          updated_at: new Date().toISOString(),
        };

        if (updateData.name !== undefined) dbPayload.name = updateData.name;
        if (updateData.legalName !== undefined) dbPayload.legal_name = updateData.legalName;
        if (updateData.taxIdNumber !== undefined) dbPayload.tax_id_number = updateData.taxIdNumber;
        if (updateData.tradeRegisterNumber !== undefined) dbPayload.trade_register_number = updateData.tradeRegisterNumber;
        if (updateData.address !== undefined) dbPayload.address = updateData.address;
        if (updateData.city !== undefined) dbPayload.city = updateData.city;
        if (updateData.country !== undefined) dbPayload.country = updateData.country;
        if (updateData.phone !== undefined) dbPayload.phone = updateData.phone;
        if (updateData.email !== undefined) dbPayload.email = updateData.email;
        if (updateData.currency !== undefined) dbPayload.currency = updateData.currency;
        if (updateData.isTaxEnabled !== undefined) dbPayload.is_tax_enabled = updateData.isTaxEnabled;
        if (updateData.defaultTaxRateBps !== undefined) dbPayload.default_tax_rate_bps = updateData.defaultTaxRateBps;
        if (updateData.waveNumber !== undefined) dbPayload.wave_number = updateData.waveNumber;
        if (updateData.orangeMoneyNumber !== undefined) dbPayload.orange_money_number = updateData.orangeMoneyNumber;
        if (updateData.momoNumber !== undefined) dbPayload.momo_number = updateData.momoNumber;
        if (updateData.bankName !== undefined || updateData.bankDetails !== undefined) {
          dbPayload.bank_details = updateData.bankName || updateData.bankDetails;
        }

        const { data, error } = await admin
          .from('organizations')
          .update(dbPayload)
          .eq('id', orgId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: mapOrganizationRow(data) });
      }

      // =========================================================================
      // 2. FACTURES
      // =========================================================================
      case 'getInvoices': {
        const filters = payload?.filters || {};
        let query = admin
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        if (filters.clientId) {
          query = query.eq('client_id', filters.clientId);
        }

        const { data, error } = await query;
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        let invoices = (data || []).map(mapInvoiceRow);
        if (filters.search) {
          const q = filters.search.toLowerCase();
          invoices = invoices.filter(
            (inv) =>
              inv.invoiceNumber.toLowerCase().includes(q) ||
              inv.client?.name?.toLowerCase().includes(q) ||
              inv.client?.companyName?.toLowerCase().includes(q)
          );
        }
        return NextResponse.json({ success: true, data: invoices });
      }

      case 'getInvoiceById': {
        const { id } = payload || {};
        const { data, error } = await admin
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error || !data) {
          return NextResponse.json({ success: true, data: null });
        }
        return NextResponse.json({ success: true, data: mapInvoiceRow(data) });
      }

      case 'createInvoice': {
        const invoiceData = payload;
        let finalClientId = isValidUUID(invoiceData.clientId) ? invoiceData.clientId : null;

        // Si le clientId n'est pas un UUID valide, trouver ou créer le client
        if (!finalClientId && invoiceData.client?.name) {
          const { data: matchedClient } = await admin
            .from('clients')
            .select('id')
            .eq('org_id', orgId)
            .ilike('name', `%${invoiceData.client.name.trim()}%`)
            .maybeSingle();

          if (matchedClient?.id) {
            finalClientId = matchedClient.id;
          } else {
            const { data: createdClient } = await admin
              .from('clients')
              .insert({
                org_id: orgId,
                name: invoiceData.client.name,
                company_name: invoiceData.client.companyName || '',
                email: invoiceData.client.email || '',
                phone: invoiceData.client.phone || '',
                address: invoiceData.client.address || '',
                city: invoiceData.client.city || 'Dakar',
                country: invoiceData.client.country || 'Sénégal',
              })
              .select()
              .single();
            if (createdClient?.id) finalClientId = createdClient.id;
          }
        }

        if (!finalClientId) {
          const { data: firstClient } = await admin
            .from('clients')
            .select('id')
            .eq('org_id', orgId)
            .limit(1)
            .maybeSingle();
          if (firstClient?.id) finalClientId = firstClient.id;
        }

        const calculated = calculateInvoiceTotals(
          invoiceData.items || [],
          invoiceData.isTaxEnabled ?? true,
          invoiceData.isTaxExempt ?? false,
          invoiceData.discountAmount || 0
        );

        const dbInvoicePayload = {
          org_id: orgId,
          invoice_number: invoiceData.invoiceNumber,
          client_id: finalClientId,
          status: invoiceData.status || 'DRAFT',
          payment_status: invoiceData.paymentStatus || 'UNPAID',
          payment_structure: invoiceData.paymentStructure || 'STANDARD',
          currency: invoiceData.currency || org.currency || 'XOF',
          issue_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate || new Date().toISOString().split('T')[0],
          is_tax_enabled: invoiceData.isTaxEnabled ?? true,
          is_tax_exempt: invoiceData.isTaxExempt ?? false,
          tax_exemption_reason: invoiceData.taxExemptionReason || null,
          subtotal_amount: calculated.subtotalAmount,
          tax_amount: calculated.taxAmount,
          discount_amount: calculated.discountAmount,
          total_amount: calculated.totalAmount,
          paid_amount: invoiceData.paidAmount || 0,
          remaining_balance: invoiceData.remainingBalance ?? calculated.totalAmount,
          notes: invoiceData.notes || null,
          terms_and_conditions: invoiceData.termsAndConditions || null,
        };

        const { data: createdInvoice, error: invError } = await admin
          .from('invoices')
          .insert(dbInvoicePayload)
          .select()
          .single();

        if (invError || !createdInvoice) {
          return NextResponse.json({ success: false, error: invError?.message }, { status: 400 });
        }

        // Insérer items
        if (invoiceData.items && invoiceData.items.length > 0) {
          const itemsPayload = invoiceData.items.map((it: any) => ({
            invoice_id: createdInvoice.id,
            description: it.description,
            quantity: it.quantity || 1,
            unit_price: it.unitPrice || 0,
            tax_rate_bps: it.taxRateBps || 1800,
            is_tax_exempt: it.isTaxExempt || false,
            total_amount: it.totalAmount || (it.quantity * it.unitPrice),
            tax_amount: it.taxAmount || 0,
          }));
          await admin.from('invoice_items').insert(itemsPayload);
        }

        // Insérer schedules
        if (invoiceData.schedules && invoiceData.schedules.length > 0) {
          const schedulesPayload = invoiceData.schedules.map((sc: any) => ({
            invoice_id: createdInvoice.id,
            installment_number: sc.installmentNumber || 1,
            label: sc.label || 'Tranche',
            percentage: sc.percentage || 100,
            expected_amount: sc.expectedAmount || calculated.totalAmount,
            due_date: sc.dueDate || invoiceData.dueDate || new Date().toISOString().split('T')[0],
            status: sc.status || 'PENDING',
            paid_amount: sc.paidAmount || 0,
          }));
          await admin.from('payment_schedules').insert(schedulesPayload);
        }

        // Récupérer la facture complète
        const { data: fullInvoice } = await admin
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .eq('id', createdInvoice.id)
          .single();

        return NextResponse.json({ success: true, data: mapInvoiceRow(fullInvoice) });
      }

      case 'updateInvoice': {
        const { id, invoiceUpdate } = payload;
        const { data: current } = await admin
          .from('invoices')
          .select('*, items:invoice_items(*)')
          .eq('id', id)
          .single();

        if (!current) {
          return NextResponse.json({ success: false, error: 'Facture introuvable' }, { status: 404 });
        }

        const isTaxEnabled = invoiceUpdate.isTaxEnabled ?? current.is_tax_enabled;
        const isTaxExempt = invoiceUpdate.isTaxExempt ?? current.is_tax_exempt;
        const discountAmount = invoiceUpdate.discountAmount ?? current.discount_amount;
        const items = invoiceUpdate.items || current.items?.map((it: any) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          taxRateBps: it.tax_rate_bps,
          isTaxExempt: it.is_tax_exempt,
          totalAmount: it.total_amount,
          taxAmount: it.tax_amount,
        })) || [];

        const calculated = calculateInvoiceTotals(items, isTaxEnabled, isTaxExempt, discountAmount);
        const paid = invoiceUpdate.paidAmount !== undefined ? invoiceUpdate.paidAmount : current.paid_amount;
        const remaining = invoiceUpdate.remainingBalance !== undefined ? invoiceUpdate.remainingBalance : Math.max(0, calculated.totalAmount - paid);

        const dbUpdatePayload: any = {
          updated_at: new Date().toISOString(),
          subtotal_amount: calculated.subtotalAmount,
          tax_amount: calculated.taxAmount,
          discount_amount: calculated.discountAmount,
          total_amount: calculated.totalAmount,
          paid_amount: paid,
          remaining_balance: remaining,
        };

        if (invoiceUpdate.status) dbUpdatePayload.status = invoiceUpdate.status;
        if (invoiceUpdate.paymentStatus) dbUpdatePayload.payment_status = invoiceUpdate.paymentStatus;
        if (invoiceUpdate.paymentStructure) dbUpdatePayload.payment_structure = invoiceUpdate.paymentStructure;
        if (invoiceUpdate.issueDate) dbUpdatePayload.issue_date = invoiceUpdate.issueDate;
        if (invoiceUpdate.dueDate) dbUpdatePayload.due_date = invoiceUpdate.dueDate;
        if (invoiceUpdate.notes !== undefined) dbUpdatePayload.notes = invoiceUpdate.notes;
        if (invoiceUpdate.cancellationReason !== undefined) dbUpdatePayload.cancellation_reason = invoiceUpdate.cancellationReason;
        if (invoiceUpdate.cancelledAt !== undefined) dbUpdatePayload.cancelled_at = invoiceUpdate.cancelledAt;
        if (invoiceUpdate.clientId && isValidUUID(invoiceUpdate.clientId)) dbUpdatePayload.client_id = invoiceUpdate.clientId;

        await admin.from('invoices').update(dbUpdatePayload).eq('id', id);

        // Remplacer items si fournis
        if (invoiceUpdate.items) {
          await admin.from('invoice_items').delete().eq('invoice_id', id);
          const itemsPayload = invoiceUpdate.items.map((it: any) => ({
            invoice_id: id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            tax_rate_bps: it.taxRateBps || 1800,
            is_tax_exempt: it.isTaxExempt || false,
            total_amount: it.totalAmount,
            tax_amount: it.taxAmount || 0,
          }));
          await admin.from('invoice_items').insert(itemsPayload);
        }

        // Remplacer schedules si fournis
        if (invoiceUpdate.schedules) {
          await admin.from('payment_schedules').delete().eq('invoice_id', id);
          const schedulesPayload = invoiceUpdate.schedules.map((sc: any) => ({
            invoice_id: id,
            installment_number: sc.installmentNumber,
            label: sc.label,
            percentage: sc.percentage,
            expected_amount: sc.expectedAmount,
            due_date: sc.dueDate,
            status: sc.status || 'PENDING',
            paid_amount: sc.paidAmount || 0,
          }));
          await admin.from('payment_schedules').insert(schedulesPayload);
        }

        const { data: updatedFull } = await admin
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .eq('id', id)
          .single();

        return NextResponse.json({ success: true, data: mapInvoiceRow(updatedFull) });
      }

      case 'deleteInvoice': {
        const { id } = payload;
        try {
          await admin.from('payment_schedules').delete().eq('invoice_id', id);
          await admin.from('invoice_items').delete().eq('invoice_id', id);
          await admin.from('payments').delete().eq('invoice_id', id);
        } catch (e) {}

        const { error } = await admin.from('invoices').delete().eq('id', id);
        return NextResponse.json({ success: !error });
      }

      // =========================================================================
      // 3. CLIENTS
      // =========================================================================
      case 'getClients': {
        const { search } = payload || {};
        let query = admin
          .from('clients')
          .select('*')
          .eq('org_id', orgId)
          .order('name');

        const { data, error } = await query;
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        let clients = (data || []).map(mapClientRow);
        if (search) {
          const q = search.toLowerCase();
          clients = clients.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.companyName?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q) ||
              c.phone?.toLowerCase().includes(q)
          );
        }
        return NextResponse.json({ success: true, data: clients });
      }

      case 'getClientById': {
        const { id } = payload;
        const { data, error } = await admin
          .from('clients')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error || !data) {
          return NextResponse.json({ success: true, data: null });
        }
        return NextResponse.json({ success: true, data: mapClientRow(data) });
      }

      case 'createClient': {
        const clientData = payload;
        const { data, error } = await admin
          .from('clients')
          .insert({
            org_id: orgId,
            name: clientData.name,
            company_name: clientData.companyName || '',
            tax_id_number: clientData.taxIdNumber || '',
            email: clientData.email || '',
            phone: clientData.phone || '',
            address: clientData.address || '',
            city: clientData.city || 'Dakar',
            country: clientData.country || 'Sénégal',
            notes: clientData.notes || '',
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: mapClientRow(data) });
      }

      case 'updateClient': {
        const { id, client } = payload;
        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        };

        if (client.name !== undefined) updatePayload.name = client.name;
        if (client.companyName !== undefined) updatePayload.company_name = client.companyName;
        if (client.taxIdNumber !== undefined) updatePayload.tax_id_number = client.taxIdNumber;
        if (client.email !== undefined) updatePayload.email = client.email;
        if (client.phone !== undefined) updatePayload.phone = client.phone;
        if (client.address !== undefined) updatePayload.address = client.address;
        if (client.city !== undefined) updatePayload.city = client.city;
        if (client.country !== undefined) updatePayload.country = client.country;
        if (client.notes !== undefined) updatePayload.notes = client.notes;

        const { data, error } = await admin
          .from('clients')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: mapClientRow(data) });
      }

      case 'deleteClient': {
        const { id } = payload;
        const { error } = await admin.from('clients').delete().eq('id', id);
        return NextResponse.json({ success: !error });
      }

      // =========================================================================
      // 4. FOURNISSEURS
      // =========================================================================
      case 'getSuppliers': {
        const { search } = payload || {};
        let query = admin
          .from('suppliers')
          .select('*')
          .eq('org_id', orgId)
          .order('name');

        const { data, error } = await query;
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        let suppliers = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          companyName: s.company_name,
          taxIdNumber: s.tax_id_number,
          category: s.category || 'Général',
          email: s.email,
          phone: s.phone,
          address: s.address,
          totalPurchases: s.total_purchases || 0,
          totalPaid: s.total_paid || 0,
          outstandingBalance: s.outstanding_balance || 0,
          createdAt: s.created_at,
        }));

        if (search) {
          const q = search.toLowerCase();
          suppliers = suppliers.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.companyName?.toLowerCase().includes(q) ||
              s.category?.toLowerCase().includes(q)
          );
        }
        return NextResponse.json({ success: true, data: suppliers });
      }

      case 'createSupplier': {
        const supplierData = payload;
        const { data, error } = await admin
          .from('suppliers')
          .insert({
            org_id: orgId,
            name: supplierData.name,
            company_name: supplierData.companyName || '',
            category: supplierData.category || 'Fournitures & Services',
            email: supplierData.email || '',
            phone: supplierData.phone || '',
            address: supplierData.address || '',
            tax_id_number: supplierData.taxIdNumber || '',
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          data: {
            id: data.id,
            name: data.name,
            companyName: data.company_name,
            taxIdNumber: data.tax_id_number,
            category: data.category,
            email: data.email,
            phone: data.phone,
            address: data.address,
            totalPurchases: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            createdAt: data.created_at,
          },
        });
      }

      case 'deleteSupplier': {
        const { id } = payload;
        const { error } = await admin.from('suppliers').delete().eq('id', id);
        return NextResponse.json({ success: !error });
      }

      // =========================================================================
      // 5. PAIEMENTS & ENCAISSEMENTS
      // =========================================================================
      case 'recordPayment': {
        const { invoiceId, paymentData } = payload;
        const { data: inv } = await admin
          .from('invoices')
          .select('*, payments:payments(*)')
          .eq('id', invoiceId)
          .single();

        if (!inv) {
          return NextResponse.json({ success: false, error: 'Facture introuvable' }, { status: 404 });
        }

        const amount = paymentData.amount || 0;
        const { data: newPayment, error: payErr } = await admin
          .from('payments')
          .insert({
            org_id: orgId,
            invoice_id: invoiceId,
            client_id: inv.client_id,
            amount: amount,
            currency: paymentData.currency || inv.currency || 'XOF',
            payment_date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
            payment_method: paymentData.paymentMethod || 'WAVE',
            transaction_reference: paymentData.transactionReference || `PAY-${Date.now()}`,
            notes: paymentData.notes || null,
          })
          .select()
          .single();

        if (payErr) {
          return NextResponse.json({ success: false, error: payErr.message }, { status: 400 });
        }

        const newPaid = Number(inv.paid_amount || 0) + Number(amount);
        const newRemaining = Math.max(0, Number(inv.total_amount || 0) - newPaid);
        const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';

        await admin
          .from('invoices')
          .update({
            paid_amount: newPaid,
            remaining_balance: newRemaining,
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        const { data: updatedFull } = await admin
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .eq('id', invoiceId)
          .single();

        return NextResponse.json({
          success: true,
          data: {
            invoice: mapInvoiceRow(updatedFull),
            payment: {
              id: newPayment.id,
              invoiceId: newPayment.invoice_id,
              amount: newPayment.amount,
              paymentDate: newPayment.payment_date,
              paymentMethod: newPayment.payment_method,
              transactionReference: newPayment.transaction_reference,
              notes: newPayment.notes,
              createdAt: newPayment.created_at,
            },
          },
        });
      }

      // =========================================================================
      // 6. DASHBOARD METRICS
      // =========================================================================
      case 'getDashboardMetrics': {
        const { data: invoices } = await admin
          .from('invoices')
          .select('*')
          .eq('org_id', orgId);

        const invList = (invoices || []).map(mapInvoiceRow);
        const active = invList.filter((i) => i.status !== 'CANCELLED');

        const totalInvoiced = active.reduce((acc, i) => acc + i.totalAmount, 0);
        const totalPaid = active.reduce((acc, i) => acc + i.paidAmount, 0);
        const totalOutstanding = active.reduce((acc, i) => acc + i.remainingBalance, 0);

        const today = new Date().toISOString().split('T')[0];
        const overdueInvoices = active.filter(
          (i) => i.remainingBalance > 0 && i.dueDate < today && i.status !== 'DRAFT'
        );
        const totalOverdue = overdueInvoices.reduce((acc, i) => acc + i.remainingBalance, 0);
        const recoveryRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

        return NextResponse.json({
          success: true,
          data: {
            totalInvoiced,
            totalPaid,
            totalOutstanding,
            totalOverdue,
            overdueCount: overdueInvoices.length,
            recoveryRate,
            currency: org.currency || 'XOF',
          },
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Action inconnue: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Erreur API /api/db:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Helpers
const isValidUUID = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

function mapOrganizationRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country,
    taxIdNumber: row.tax_id_number,
    tradeRegisterNumber: row.trade_register_number,
    currency: row.currency || 'XOF',
    isTaxEnabled: row.is_tax_enabled ?? true,
    defaultTaxRateBps: row.default_tax_rate_bps ?? 1800,
    waveNumber: row.wave_number,
    orangeMoneyNumber: row.orange_money_number,
    momoNumber: row.momo_number,
    bankName: row.bank_details,
    bankDetails: row.bank_details,
    logoUrl: row.logo_url,
    createdAt: row.created_at,
  };
}

function mapInvoiceRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    clientId: row.client_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentStructure: row.payment_structure,
    currency: row.currency || 'XOF',
    issueDate: row.issue_date,
    dueDate: row.due_date,
    isTaxEnabled: row.is_tax_enabled ?? true,
    isTaxExempt: row.is_tax_exempt ?? false,
    taxExemptionReason: row.tax_exemption_reason,
    subtotalAmount: Number(row.subtotal_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    remainingBalance: Number(row.remaining_balance ?? row.total_amount ?? 0),
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at,
    notes: row.notes,
    termsAndConditions: row.terms_and_conditions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    client: row.client ? mapClientRow(row.client) : undefined,
    items: Array.isArray(row.items)
      ? row.items.map((it: any) => ({
          id: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: Number(it.unit_price || 0),
          taxRateBps: it.tax_rate_bps || 1800,
          isTaxExempt: it.is_tax_exempt || false,
          totalAmount: Number(it.total_amount || 0),
          taxAmount: Number(it.tax_amount || 0),
        }))
      : [],
    schedules: Array.isArray(row.schedules)
      ? row.schedules.map((sc: any) => ({
          id: sc.id,
          installmentNumber: sc.installment_number,
          label: sc.label,
          percentage: sc.percentage,
          expectedAmount: Number(sc.expected_amount || 0),
          dueDate: sc.due_date,
          status: sc.status,
          paidAmount: Number(sc.paid_amount || 0),
        }))
      : [],
    payments: Array.isArray(row.payments)
      ? row.payments.map((p: any) => ({
          id: p.id,
          invoiceId: p.invoice_id,
          amount: Number(p.amount || 0),
          paymentDate: p.payment_date,
          paymentMethod: p.payment_method,
          transactionReference: p.transaction_reference,
          notes: p.notes,
          createdAt: p.created_at,
        }))
      : [],
  };
}

function mapClientRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city || 'Dakar',
    country: row.country || 'Sénégal',
    taxIdNumber: row.tax_id_number,
    notes: row.notes,
    totalInvoiced: Number(row.total_invoiced || 0),
    totalPaid: Number(row.total_paid || 0),
    outstandingBalance: Number(row.outstanding_balance || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

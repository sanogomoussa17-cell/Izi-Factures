import { IInvoiceRepository } from '@/core/ports/repository';
import {
  Invoice,
  Client,
  Supplier,
  Organization,
  PaymentRecord,
  PaymentSchedule,
  DashboardMetrics,
} from '@/core/domain/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { localRepository } from '@/core/adapters/local-mock-repository';
import { calculateInvoiceTotals } from '@/core/domain/tax-engine';

const DEFAULT_ORG_UUID = 'a0000000-0000-0000-0000-000000000001';
const isValidUUID = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

/**
 * Adaptateur Supabase Full-Stack implémentant IInvoiceRepository.
 * Interagit directement avec la base de données PostgreSQL de Supabase.
 */
export class SupabaseInvoiceRepository implements IInvoiceRepository {
  private useMockFallback(): boolean {
    return !isSupabaseConfigured || !supabase;
  }

  // --- Organisation ---
  async getOrganization(): Promise<Organization> {
    if (this.useMockFallback()) return localRepository.getOrganization();

    try {
      const { data, error } = await supabase!
        .from('organizations')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Erreur Supabase getOrganization, utilisation du fallback local:', error.message);
        return localRepository.getOrganization();
      }

      if (!data) {
        // Créer l'organisation par défaut dans Supabase si la table est vide
        const { data: newOrg, error: createError } = await supabase!
          .from('organizations')
          .insert({
            name: 'Mon Entreprise',
            legal_name: 'Mon Entreprise SARL',
            tax_id_number: 'SN-DKR-2026-001',
            trade_register_number: 'RCCM-SN-DKR-2026-B-01',
            address: 'Plateau, Rue Carnot',
            city: 'Dakar',
            country: 'Sénégal',
            phone: '+221 77 000 00 00',
            email: 'contact@mon-entreprise.sn',
            currency: 'XOF',
            is_tax_enabled: true,
            default_tax_rate_bps: 1800,
          })
          .select()
          .single();

        if (createError || !newOrg) {
          return localRepository.getOrganization();
        }
        return this.mapOrganizationRow(newOrg);
      }

      return this.mapOrganizationRow(data);
    } catch (err: any) {
      console.warn('Exception getOrganization Supabase:', err?.message);
      return localRepository.getOrganization();
    }
  }

  async updateOrganization(orgUpdate: Partial<Organization>): Promise<Organization> {
    if (this.useMockFallback()) return localRepository.updateOrganization(orgUpdate);

    try {
      const current = await this.getOrganization();
      const payload: any = {
        name: orgUpdate.name ?? current.name,
        legal_name: orgUpdate.legalName ?? current.legalName,
        tax_id_number: orgUpdate.taxIdNumber ?? current.taxIdNumber,
        trade_register_number: orgUpdate.tradeRegisterNumber ?? current.tradeRegisterNumber,
        address: orgUpdate.address ?? current.address,
        city: orgUpdate.city ?? current.city,
        country: orgUpdate.country ?? current.country,
        phone: orgUpdate.phone ?? current.phone,
        email: orgUpdate.email ?? current.email,
        currency: orgUpdate.currency ?? current.currency,
        is_tax_enabled: orgUpdate.isTaxEnabled ?? current.isTaxEnabled,
        default_tax_rate_bps: orgUpdate.defaultTaxRateBps ?? current.defaultTaxRateBps,
        wave_number: orgUpdate.waveNumber ?? current.waveNumber,
        orange_money_number: orgUpdate.orangeMoneyNumber ?? current.orangeMoneyNumber,
        momo_number: orgUpdate.momoNumber ?? current.momoNumber,
        bank_details: orgUpdate.bankName ?? current.bankName,
      };

      const { data, error } = await supabase!
        .from('organizations')
        .update(payload)
        .eq('id', current.id)
        .select()
        .single();

      if (error) {
        console.warn('Erreur Supabase updateOrganization:', error.message);
        return localRepository.updateOrganization(orgUpdate);
      }
      return this.mapOrganizationRow(data);
    } catch (err: any) {
      console.warn('Exception updateOrganization Supabase:', err?.message);
      return localRepository.updateOrganization(orgUpdate);
    }
  }

  // --- Factures ---
  async getInvoices(filters?: { status?: string; clientId?: string; search?: string }): Promise<Invoice[]> {
    let supabaseInvoices: Invoice[] = [];
    if (!this.useMockFallback()) {
      try {
        let query = supabase!
          .from('invoices')
          .select(`
            *,
            client:clients(*),
            items:invoice_items(*),
            schedules:payment_schedules(*),
            payments:payments(*)
          `)
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        if (filters?.clientId) {
          query = query.eq('client_id', filters.clientId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          supabaseInvoices = data.map((row: any) => this.mapInvoiceRow(row));
        } else if (error) {
          console.warn('Erreur getInvoices Supabase:', error.message);
        }
      } catch (err: any) {
        console.warn('Exception getInvoices Supabase:', err?.message);
      }
    }

    const localInvoices = await localRepository.getInvoices(filters);

    // Fusion sans doublon (Supabase prioritaire, complété par les factures locales)
    const invoiceMap = new Map<string, Invoice>();
    for (const inv of localInvoices) {
      invoiceMap.set(inv.id, inv);
      if (inv.invoiceNumber) invoiceMap.set(inv.invoiceNumber, inv);
    }
    for (const inv of supabaseInvoices) {
      invoiceMap.set(inv.id, inv);
      if (inv.invoiceNumber) invoiceMap.set(inv.invoiceNumber, inv);
    }

    let merged = Array.from(new Set(Array.from(invoiceMap.values())));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      merged = merged.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.client?.companyName?.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      merged = merged.filter((inv) => inv.status === filters.status || inv.paymentStatus === filters.status);
    }

    if (filters?.clientId) {
      merged = merged.filter((inv) => inv.clientId === filters.clientId);
    }

    return merged;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    const found = invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
    if (found) return found;

    if (this.useMockFallback()) return localRepository.getInvoiceById(id);

    try {
      const { data, error } = await supabase!
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
        return localRepository.getInvoiceById(id);
      }

      return this.mapInvoiceRow(data);
    } catch (err: any) {
      console.warn('Exception getInvoiceById Supabase:', err?.message);
      return localRepository.getInvoiceById(id);
    }
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    // 1. Toujours enregistrer immédiatement dans le repository local pour persistance garantie
    const localCreated = await localRepository.createInvoice(invoiceData);

    if (this.useMockFallback()) return localCreated;

    try {
      const org = await this.getOrganization();
      const orgId = isValidUUID(invoiceData.orgId) ? invoiceData.orgId : isValidUUID(org?.id) ? org.id : DEFAULT_ORG_UUID;
      const clientId = isValidUUID(invoiceData.clientId) ? invoiceData.clientId : 'bc251950-a38b-4e5d-a920-1d3ea94f8f6a';

      const payload = {
        org_id: orgId,
        invoice_number: invoiceData.invoiceNumber,
        client_id: clientId,
        status: invoiceData.status || 'DRAFT',
        payment_status: invoiceData.paymentStatus || 'UNPAID',
        payment_structure: invoiceData.paymentStructure || 'STANDARD',
        currency: invoiceData.currency || org.currency || 'XOF',
        issue_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || new Date().toISOString().split('T')[0],
        is_tax_enabled: invoiceData.isTaxEnabled ?? true,
        is_tax_exempt: invoiceData.isTaxExempt ?? false,
        tax_exemption_reason: invoiceData.taxExemptionReason,
        subtotal_amount: invoiceData.subtotalAmount || 0,
        tax_amount: invoiceData.taxAmount || 0,
        discount_amount: invoiceData.discountAmount || 0,
        total_amount: invoiceData.totalAmount || 0,
        paid_amount: invoiceData.paidAmount || 0,
        remaining_balance: invoiceData.remainingBalance ?? invoiceData.totalAmount ?? 0,
        notes: invoiceData.notes,
        terms_and_conditions: invoiceData.termsAndConditions,
      };

      const { data: createdInvoice, error: invError } = await supabase!
        .from('invoices')
        .insert(payload)
        .select()
        .single();

      if (invError || !createdInvoice) {
        console.warn('Erreur insert invoice Supabase (sauvegardé en local):', invError?.message);
        return localCreated;
      }

      // Insérer les items
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemsPayload = invoiceData.items.map((it) => ({
          invoice_id: createdInvoice.id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          tax_rate_bps: it.taxRateBps || 1800,
          is_tax_exempt: it.isTaxExempt || false,
          total_amount: it.totalAmount,
          tax_amount: it.taxAmount || 0,
        }));
        await supabase!.from('invoice_items').insert(itemsPayload);
      }

      // Insérer les échéanciers
      if (invoiceData.schedules && invoiceData.schedules.length > 0) {
        const schedulesPayload = invoiceData.schedules.map((sc) => ({
          invoice_id: createdInvoice.id,
          installment_number: sc.installmentNumber,
          label: sc.label,
          percentage: sc.percentage,
          expected_amount: sc.expectedAmount,
          due_date: sc.dueDate,
          status: sc.status || 'PENDING',
          paid_amount: sc.paidAmount || 0,
        }));
        await supabase!.from('payment_schedules').insert(schedulesPayload);
      }

      return (await this.getInvoiceById(createdInvoice.id)) || localCreated;
    } catch (err: any) {
      console.warn('Exception createInvoice Supabase (sauvegardé en local):', err?.message);
      return localCreated;
    }
  }

  async updateInvoice(id: string, invoiceUpdate: Partial<Invoice>): Promise<Invoice> {
    if (this.useMockFallback()) return localRepository.updateInvoice(id, invoiceUpdate);

    try {
      const current = await this.getInvoiceById(id);
      if (!current) return localRepository.updateInvoice(id, invoiceUpdate);

      // Recalcul des totaux si les items ont changé
      let subtotal = current.subtotalAmount;
      let tax = current.taxAmount;
      let total = current.totalAmount;
      let paid = invoiceUpdate.paidAmount !== undefined ? invoiceUpdate.paidAmount : current.paidAmount;
      let remaining = invoiceUpdate.remainingBalance !== undefined ? invoiceUpdate.remainingBalance : current.remainingBalance;

      if (invoiceUpdate.items) {
        const calculated = calculateInvoiceTotals(
          invoiceUpdate.items,
          invoiceUpdate.isTaxEnabled ?? current.isTaxEnabled,
          invoiceUpdate.isTaxExempt ?? current.isTaxExempt,
          invoiceUpdate.discountAmount ?? current.discountAmount
        );
        subtotal = calculated.subtotalAmount;
        tax = calculated.taxAmount;
        total = calculated.totalAmount;
        remaining = Math.max(0, total - paid);
      }

      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (invoiceUpdate.status) payload.status = invoiceUpdate.status;
      if (invoiceUpdate.paymentStatus) payload.payment_status = invoiceUpdate.paymentStatus;
      if (invoiceUpdate.paymentStructure) payload.payment_structure = invoiceUpdate.paymentStructure;
      if (invoiceUpdate.issueDate) payload.issue_date = invoiceUpdate.issueDate;
      if (invoiceUpdate.dueDate) payload.due_date = invoiceUpdate.dueDate;
      if (invoiceUpdate.notes !== undefined) payload.notes = invoiceUpdate.notes;
      if (invoiceUpdate.cancellationReason !== undefined) payload.cancellation_reason = invoiceUpdate.cancellationReason;
      if (invoiceUpdate.cancelledAt !== undefined) payload.cancelled_at = invoiceUpdate.cancelledAt;
      if (invoiceUpdate.clientId) payload.client_id = invoiceUpdate.clientId;

      payload.subtotal_amount = subtotal;
      payload.tax_amount = tax;
      payload.total_amount = total;
      payload.paid_amount = paid;
      payload.remaining_balance = remaining;

      const { error: invErr } = await supabase!
        .from('invoices')
        .update(payload)
        .eq('id', id);

      if (invErr) {
        console.warn('Erreur update invoice Supabase:', invErr.message);
        return localRepository.updateInvoice(id, invoiceUpdate);
      }

      // Si de nouveaux items sont fournis, remplacer les anciens
      if (invoiceUpdate.items) {
        await supabase!.from('invoice_items').delete().eq('invoice_id', id);
        const itemsPayload = invoiceUpdate.items.map((it) => ({
          invoice_id: id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          tax_rate_bps: it.taxRateBps || 1800,
          is_tax_exempt: it.isTaxExempt || false,
          total_amount: it.totalAmount,
          tax_amount: it.taxAmount || 0,
        }));
        await supabase!.from('invoice_items').insert(itemsPayload);
      }

      // Si de nouveaux échéanciers sont fournis, remplacer les anciens
      if (invoiceUpdate.schedules) {
        await supabase!.from('payment_schedules').delete().eq('invoice_id', id);
        const schedulesPayload = invoiceUpdate.schedules.map((sc) => ({
          invoice_id: id,
          installment_number: sc.installmentNumber,
          label: sc.label,
          percentage: sc.percentage,
          expected_amount: sc.expectedAmount,
          due_date: sc.dueDate,
          status: sc.status || 'PENDING',
          paid_amount: sc.paidAmount || 0,
        }));
        await supabase!.from('payment_schedules').insert(schedulesPayload);
      }

      // Rafraîchir stats client
      const clientId = invoiceUpdate.clientId || current.clientId;
      if (clientId) await this.refreshClientStats(clientId);

      return (await this.getInvoiceById(id))!;
    } catch (err: any) {
      console.warn('Exception updateInvoice Supabase:', err?.message);
      return localRepository.updateInvoice(id, invoiceUpdate);
    }
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await localRepository.deleteInvoice(id);
    } catch (e) {}

    if (this.useMockFallback()) return localRepository.deleteInvoice(id);
    try {
      const inv = await this.getInvoiceById(id);
      // Supprimer les dépendances en premier pour éviter les erreurs de clé étrangère
      try {
        await supabase!.from('payment_schedules').delete().eq('invoice_id', id);
        await supabase!.from('invoice_items').delete().eq('invoice_id', id);
        await supabase!.from('payments').delete().eq('invoice_id', id);
      } catch (childErr) {}

      const { error } = await supabase!.from('invoices').delete().eq('id', id);
      if (inv?.clientId) await this.refreshClientStats(inv.clientId);
      return !error;
    } catch (err) {
      return localRepository.deleteInvoice(id);
    }
  }

  async issueInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'ISSUED' });
  }

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      remainingBalance: 0,
    });
  }

  // --- Clients ---
  async getClients(search?: string): Promise<Client[]> {
    let supabaseClients: Client[] = [];
    if (!this.useMockFallback()) {
      try {
        let query = supabase!.from('clients').select('*').order('name');
        if (search) {
          query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          supabaseClients = data.map((row: any) => this.mapClientRow(row));
        } else if (error) {
          console.warn('Erreur getClients Supabase:', error.message);
        }
      } catch (err: any) {
        console.warn('Exception getClients Supabase:', err?.message);
      }
    }

    const localClients = await localRepository.getClients(search);

    // Fusion sans doublon (Supabase prioritaire, complété par les créations locales)
    const clientMap = new Map<string, Client>();
    for (const c of localClients) {
      clientMap.set(c.id, c);
      if (c.name) clientMap.set(c.name.trim().toLowerCase(), c);
    }
    for (const c of supabaseClients) {
      clientMap.set(c.id, c);
      if (c.name) clientMap.set(c.name.trim().toLowerCase(), c);
    }

    let merged = Array.from(new Set(Array.from(clientMap.values())));

    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }

    return merged;
  }

  async getClientById(id: string): Promise<Client | null> {
    const clients = await this.getClients();
    const found = clients.find((c) => c.id === id);
    if (found) return found;

    if (this.useMockFallback()) return localRepository.getClientById(id);
    try {
      const { data, error } = await supabase!.from('clients').select('*').eq('id', id).maybeSingle();
      if (error || !data) return localRepository.getClientById(id);
      return this.mapClientRow(data);
    } catch (err) {
      return localRepository.getClientById(id);
    }
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>): Promise<Client> {
    // 1. Toujours enregistrer immédiatement dans le repository local pour persistance garantie
    const localCreated = await localRepository.createClient(clientData);

    if (this.useMockFallback()) return localCreated;

    try {
      const org = await this.getOrganization();
      const orgId = isValidUUID(clientData.orgId) ? clientData.orgId : isValidUUID(org?.id) ? org.id : DEFAULT_ORG_UUID;

      const { data, error } = await supabase!
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

      if (error || !data) {
        console.warn('Erreur createClient Supabase (sauvegardé en local):', error?.message);
        return localCreated;
      }

      return this.mapClientRow(data);
    } catch (err: any) {
      console.warn('Exception createClient Supabase (sauvegardé en local):', err?.message);
      return localCreated;
    }
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    try {
      await localRepository.updateClient(id, client);
    } catch (e) {}

    if (this.useMockFallback()) return localRepository.updateClient(id, client);
    try {
      const payload: any = {};
      if (client.name) payload.name = client.name;
      if (client.companyName !== undefined) payload.company_name = client.companyName;
      if (client.taxIdNumber !== undefined) payload.tax_id_number = client.taxIdNumber;
      if (client.email !== undefined) payload.email = client.email;
      if (client.phone) payload.phone = client.phone;
      if (client.address !== undefined) payload.address = client.address;
      if (client.city !== undefined) payload.city = client.city;
      if (client.country !== undefined) payload.country = client.country;
      if (client.notes !== undefined) payload.notes = client.notes;

      await supabase!.from('clients').update(payload).eq('id', id);
      return (await this.getClientById(id))!;
    } catch (err) {
      return localRepository.updateClient(id, client);
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      await localRepository.deleteClient(id);
    } catch (e) {}

    if (this.useMockFallback()) return localRepository.deleteClient(id);
    try {
      const { error } = await supabase!.from('clients').delete().eq('id', id);
      return !error;
    } catch (err) {
      return localRepository.deleteClient(id);
    }
  }

  // --- Fournisseurs ---
  async getSuppliers(search?: string): Promise<Supplier[]> {
    let supabaseSuppliers: Supplier[] = [];
    if (!this.useMockFallback()) {
      try {
        let query = supabase!.from('suppliers').select('*').order('name');
        if (search) {
          query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,category.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          supabaseSuppliers = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            companyName: s.company_name,
            taxIdNumber: s.tax_id_number,
            category: s.category || 'Général',
            email: s.email,
            phone: s.phone,
            address: s.address,
            city: s.city || 'Dakar',
            country: s.country || 'Sénégal',
            totalPurchased: s.total_purchased || 0,
            totalPaid: s.total_paid || 0,
            balanceDue: s.balance_due || 0,
            createdAt: s.created_at,
          }));
        }
      } catch (err) {
        console.warn('Exception getSuppliers Supabase:', err);
      }
    }

    const localSuppliers = await localRepository.getSuppliers(search);
    const supplierMap = new Map<string, Supplier>();
    for (const s of localSuppliers) {
      supplierMap.set(s.id, s);
      if (s.name) supplierMap.set(s.name.trim().toLowerCase(), s);
    }
    for (const s of supabaseSuppliers) {
      supplierMap.set(s.id, s);
      if (s.name) supplierMap.set(s.name.trim().toLowerCase(), s);
    }

    return Array.from(new Set(Array.from(supplierMap.values())));
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'balanceDue'>): Promise<Supplier> {
    const localCreated = await localRepository.createSupplier(supplier);
    if (this.useMockFallback()) return localCreated;

    try {
      const org = await this.getOrganization();
      const orgId = isValidUUID(org?.id) ? org.id : DEFAULT_ORG_UUID;

      const { data, error } = await supabase!
        .from('suppliers')
        .insert({
          org_id: orgId,
          name: supplier.name,
          company_name: supplier.companyName || '',
          tax_id_number: supplier.taxIdNumber || '',
          category: supplier.category || 'Général',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || 'Dakar',
          country: supplier.country || 'Sénégal',
        })
        .select()
        .single();

      if (error || !data) return localCreated;
      return {
        id: data.id,
        name: data.name,
        companyName: data.company_name,
        taxIdNumber: data.tax_id_number,
        category: data.category,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        totalPurchased: 0,
        totalPaid: 0,
        balanceDue: 0,
        createdAt: data.created_at,
      };
    } catch (err) {
      return localCreated;
    }
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      await localRepository.updateSupplier(id, supplier);
    } catch (e) {}

    if (this.useMockFallback()) return localRepository.updateSupplier(id, supplier);
    try {
      const payload: any = {};
      if (supplier.name) payload.name = supplier.name;
      if (supplier.companyName !== undefined) payload.company_name = supplier.companyName;
      if (supplier.taxIdNumber !== undefined) payload.tax_id_number = supplier.taxIdNumber;
      if (supplier.category !== undefined) payload.category = supplier.category;
      if (supplier.email !== undefined) payload.email = supplier.email;
      if (supplier.phone !== undefined) payload.phone = supplier.phone;
      if (supplier.address !== undefined) payload.address = supplier.address;
      if (supplier.city !== undefined) payload.city = supplier.city;
      if (supplier.country !== undefined) payload.country = supplier.country;

      await supabase!.from('suppliers').update(payload).eq('id', id);
      const updated = await this.getSuppliers();
      return updated.find((s) => s.id === id) || (await localRepository.updateSupplier(id, supplier));
    } catch (err) {
      return localRepository.updateSupplier(id, supplier);
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      await localRepository.deleteSupplier(id);
    } catch (e) {}

    if (this.useMockFallback()) return localRepository.deleteSupplier(id);
    try {
      const { error } = await supabase!.from('suppliers').delete().eq('id', id);
      return !error;
    } catch (err) {
      return localRepository.deleteSupplier(id);
    }
  }

  // --- Paiements ---
  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    transactionReference: string;
    paymentDate: string;
    scheduleId?: string;
    notes?: string;
  }): Promise<{ payment: PaymentRecord; updatedInvoice: Invoice }> {
    if (this.useMockFallback()) return localRepository.recordPayment(params);

    try {
      const org = await this.getOrganization();
      const currentInvoice = await this.getInvoiceById(params.invoiceId);
      if (!currentInvoice) return localRepository.recordPayment(params);

      // Insérer l'enregistrement de paiement
      const { data: payRow, error: payErr } = await supabase!
        .from('payments')
        .insert({
          org_id: org.id,
          invoice_id: params.invoiceId,
          client_id: currentInvoice.clientId,
          amount: params.amount,
          currency: currentInvoice.currency,
          payment_method: params.paymentMethod,
          transaction_reference: params.transactionReference,
          payment_date: params.paymentDate,
          notes: params.notes,
        })
        .select()
        .single();

      if (payErr || !payRow) {
        console.warn('Erreur recordPayment Supabase, bascule sur local:', payErr?.message);
        return localRepository.recordPayment(params);
      }

      // Si une tranche est ciblée, la marquer comme payée
      if (params.scheduleId) {
        await supabase!
          .from('payment_schedules')
          .update({
            status: 'PAID',
            paid_amount: params.amount,
          })
          .eq('id', params.scheduleId);
      }

      // Calculer le nouveau solde de la facture
      const newPaidAmount = (currentInvoice.paidAmount || 0) + params.amount;
      const newRemainingBalance = Math.max(0, currentInvoice.totalAmount - newPaidAmount);
      const newPaymentStatus = newRemainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

      await supabase!
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          remaining_balance: newRemainingBalance,
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.invoiceId);

      // Rafraîchir les statistiques du client
      await this.refreshClientStats(currentInvoice.clientId);

      const updatedInv = (await this.getInvoiceById(params.invoiceId))!;
      return {
        payment: {
          id: payRow.id,
          invoiceId: payRow.invoice_id,
          amount: payRow.amount,
          paymentMethod: payRow.payment_method,
          transactionReference: payRow.transaction_reference,
          paymentDate: payRow.payment_date,
          notes: payRow.notes,
          createdAt: payRow.created_at,
        },
        updatedInvoice: updatedInv,
      };
    } catch (err: any) {
      console.warn('Exception recordPayment Supabase:', err?.message);
      return localRepository.recordPayment(params);
    }
  }

  // --- Dashboard & Métriques en temps réel ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (this.useMockFallback()) return localRepository.getDashboardMetrics();

    try {
      const invoices = await this.getInvoices();
      const clients = await this.getClients();
      const org = await this.getOrganization();

      const today = new Date().toISOString().split('T')[0];

      let totalRevenue = 0;
      let totalCollected = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let paidCount = 0;
      let overdueCount = 0;
      let pendingCount = 0;

      const allPayments: PaymentRecord[] = [];

      for (const inv of invoices) {
        if (inv.status === 'CANCELLED') continue;

        totalRevenue += inv.totalAmount;
        totalCollected += inv.paidAmount;

        if (inv.paymentStatus === 'PAID') {
          paidCount++;
        } else if (inv.remainingBalance > 0) {
          if (inv.dueDate < today && inv.paymentStatus !== 'PAID') {
            totalOverdue += inv.remainingBalance;
            overdueCount++;
          } else {
            totalPending += inv.remainingBalance;
            pendingCount++;
          }
        }

        if (inv.payments && inv.payments.length > 0) {
          allPayments.push(...inv.payments);
        }
      }

      const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

      // Tendances mensuelles des 6 derniers mois
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const currentDate = new Date();
      const monthlyRevenueChart: { month: string; invoiced: number; collected: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const mLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        const mYear = d.getFullYear();
        const mMonth = d.getMonth();

        let monthInvoiced = 0;
        let monthCollected = 0;

        for (const inv of invoices) {
          const invDate = new Date(inv.issueDate);
          if (invDate.getFullYear() === mYear && invDate.getMonth() === mMonth) {
            if (inv.status !== 'CANCELLED') monthInvoiced += inv.totalAmount;
            monthCollected += inv.paidAmount;
          }
        }

        monthlyRevenueChart.push({
          month: mLabel,
          invoiced: monthInvoiced,
          collected: monthCollected,
        });
      }

      allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

      return {
        totalRevenue,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
        invoiceCount: invoices.length,
        paidInvoiceCount: paidCount,
        overdueInvoiceCount: overdueCount,
        pendingInvoiceCount: pendingCount,
        clientCount: clients.length,
        currency: org.currency || 'XOF',
        recentInvoices: invoices.slice(0, 5),
        recentPayments: allPayments.slice(0, 5),
        monthlyRevenueChart,
      };
    } catch (err: any) {
      console.warn('Exception getDashboardMetrics Supabase:', err?.message);
      return localRepository.getDashboardMetrics();
    }
  }

  // --- Helpers de mapping ---
  private async refreshClientStats(clientId: string) {
    if (!supabase || !clientId) return;
    try {
      const { data: invs } = await supabase
        .from('invoices')
        .select('total_amount, paid_amount, remaining_balance, status')
        .eq('client_id', clientId);

      if (invs) {
        let totalInvoiced = 0;
        let totalPaid = 0;
        let outstanding = 0;

        for (const inv of invs) {
          if (inv.status !== 'CANCELLED') {
            totalInvoiced += inv.total_amount || 0;
            totalPaid += inv.paid_amount || 0;
            outstanding += inv.remaining_balance || 0;
          }
        }

        await supabase
          .from('clients')
          .update({
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            outstanding_balance: outstanding,
          })
          .eq('id', clientId);
      }
    } catch (err) {
      console.warn('Impossible de rafraîchir stats client:', err);
    }
  }

  private mapOrganizationRow(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name,
      taxIdNumber: data.tax_id_number,
      tradeRegisterNumber: data.trade_register_number,
      address: data.address,
      city: data.city,
      country: data.country,
      phone: data.phone,
      email: data.email,
      currency: data.currency || 'XOF',
      isTaxEnabled: data.is_tax_enabled ?? true,
      defaultTaxRateBps: data.default_tax_rate_bps ?? 1800,
      waveNumber: data.wave_number,
      orangeMoneyNumber: data.orange_money_number,
      momoNumber: data.momo_number,
      bankName: data.bank_details || data.bank_name,
      bankIban: data.bank_iban,
      bankBic: data.bank_bic,
    };
  }

  private mapClientRow(row: any): Client {
    return {
      id: row.id,
      name: row.name,
      companyName: row.company_name,
      taxIdNumber: row.tax_id_number,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city || 'Dakar',
      country: row.country || 'Sénégal',
      totalInvoiced: row.total_invoiced || 0,
      totalPaid: row.total_paid || 0,
      outstandingBalance: row.outstanding_balance || 0,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  private mapInvoiceRow(row: any): Invoice {
    return {
      id: row.id,
      orgId: row.org_id,
      invoiceNumber: row.invoice_number,
      clientId: row.client_id,
      client: row.client ? this.mapClientRow(row.client) : ({} as any),
      status: row.status,
      paymentStatus: row.payment_status,
      paymentStructure: row.payment_structure,
      currency: row.currency || 'XOF',
      issueDate: row.issue_date,
      dueDate: row.due_date,
      isTaxEnabled: row.is_tax_enabled,
      isTaxExempt: row.is_tax_exempt,
      taxExemptionReason: row.tax_exemption_reason,
      items: (row.items || []).map((it: any) => ({
        id: it.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        taxRateBps: it.tax_rate_bps,
        isTaxExempt: it.is_tax_exempt,
        totalAmount: it.total_amount,
        taxAmount: it.tax_amount,
      })),
      subtotalAmount: row.subtotal_amount,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount || 0,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount || 0,
      remainingBalance: row.remaining_balance || 0,
      schedules: (row.schedules || []).map((sc: any) => ({
        id: sc.id,
        invoiceId: sc.invoice_id,
        installmentNumber: sc.installment_number,
        label: sc.label,
        percentage: sc.percentage,
        expectedAmount: sc.expected_amount,
        dueDate: sc.due_date,
        status: sc.status,
        paidAmount: sc.paid_amount || 0,
      })),
      payments: (row.payments || []).map((p: any) => ({
        id: p.id,
        invoiceId: p.invoice_id,
        amount: p.amount,
        paymentMethod: p.payment_method,
        transactionReference: p.transaction_reference,
        paymentDate: p.payment_date,
        notes: p.notes,
        createdAt: p.created_at,
      })),
      cancellationReason: row.cancellation_reason,
      cancelledAt: row.cancelled_at,
      notes: row.notes,
      termsAndConditions: row.terms_and_conditions,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const supabaseRepository = new SupabaseInvoiceRepository();

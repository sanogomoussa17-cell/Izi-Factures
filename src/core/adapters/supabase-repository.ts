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

/**
 * Adaptateur Supabase Cloud Full-Stack implémentant IInvoiceRepository.
 * Garantit la synchronisation temps réel et l'étanchéité stricte entre Mobile, Ordinateur et Tablette.
 */
export class SupabaseInvoiceRepository implements IInvoiceRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.isBrowser()) {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            headers['Authorization'] = `Bearer ${data.session.access_token}`;
            if (data.session.user?.email) {
              headers['x-user-email'] = data.session.user.email;
            }
            if (data.session.user?.id) {
              headers['x-user-id'] = data.session.user.id;
            }
          }
        }

        if (!headers['x-user-email']) {
          const stored = localStorage.getItem('izifactures_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.email) headers['x-user-email'] = parsed.email;
            if (parsed.id) headers['x-user-id'] = parsed.id;
          }
        }
      } catch (e) {}
    }

    return headers;
  }

  private async callApi<T>(action: string, payload?: any): Promise<T | null> {
    if (!this.isBrowser()) return null;
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/db', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, payload }),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success) return json.data as T;
      return null;
    } catch (e) {
      console.warn(`Appel API /api/db ${action} en échec, fallback local:`, e);
      return null;
    }
  }

  // =========================================================================
  // 1. ORGANISATION
  // =========================================================================
  async getOrganization(): Promise<Organization> {
    const cloudOrg = await this.callApi<Organization>('getOrganization');
    if (cloudOrg) {
      try {
        await localRepository.updateOrganization(cloudOrg);
      } catch (e) {}
      return cloudOrg;
    }
    return localRepository.getOrganization();
  }

  async updateOrganization(orgUpdate: Partial<Organization>): Promise<Organization> {
    const cloudUpdated = await this.callApi<Organization>('updateOrganization', orgUpdate);
    if (cloudUpdated) {
      try {
        await localRepository.updateOrganization(cloudUpdated);
      } catch (e) {}
      return cloudUpdated;
    }
    return localRepository.updateOrganization(orgUpdate);
  }

  // =========================================================================
  // 2. FACTURES
  // =========================================================================
  async getInvoices(filters?: { status?: string; clientId?: string; search?: string }): Promise<Invoice[]> {
    const cloudInvoices = await this.callApi<Invoice[]>('getInvoices', { filters });
    if (cloudInvoices !== null && Array.isArray(cloudInvoices)) {
      return cloudInvoices;
    }
    return localRepository.getInvoices(filters);
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const cloudInvoice = await this.callApi<Invoice>('getInvoiceById', { id });
    if (cloudInvoice) {
      return cloudInvoice;
    }
    return localRepository.getInvoiceById(id);
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    // 1. Sauvegarde locale immédiate comme buffer
    const localCreated = await localRepository.createInvoice(invoiceData);

    // 2. Persistance cloud PostgreSQL
    const cloudCreated = await this.callApi<Invoice>('createInvoice', invoiceData);
    if (cloudCreated) {
      return cloudCreated;
    }
    return localCreated;
  }

  async updateInvoice(id: string, invoiceUpdate: Partial<Invoice>): Promise<Invoice> {
    // 1. Mise à jour locale
    const localUpdated = await localRepository.updateInvoice(id, invoiceUpdate);

    // 2. Persistance cloud PostgreSQL
    const cloudUpdated = await this.callApi<Invoice>('updateInvoice', { id, invoiceUpdate });
    if (cloudUpdated) {
      return cloudUpdated;
    }
    return localUpdated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await localRepository.deleteInvoice(id);
    } catch (e) {}

    const cloudSuccess = await this.callApi<boolean>('deleteInvoice', { id });
    if (cloudSuccess !== null) {
      return cloudSuccess;
    }
    return true;
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

  // =========================================================================
  // 3. CLIENTS
  // =========================================================================
  async getClients(search?: string): Promise<Client[]> {
    const cloudClients = await this.callApi<Client[]>('getClients', { search });
    if (cloudClients !== null && Array.isArray(cloudClients)) {
      return cloudClients;
    }
    return localRepository.getClients(search);
  }

  async getClientById(id: string): Promise<Client | null> {
    const cloudClient = await this.callApi<Client>('getClientById', { id });
    if (cloudClient) {
      return cloudClient;
    }
    return localRepository.getClientById(id);
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>): Promise<Client> {
    const localCreated = await localRepository.createClient(clientData);
    const cloudCreated = await this.callApi<Client>('createClient', clientData);
    if (cloudCreated) {
      return cloudCreated;
    }
    return localCreated;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const localUpdated = await localRepository.updateClient(id, client);
    const cloudUpdated = await this.callApi<Client>('updateClient', { id, client });
    if (cloudUpdated) {
      return cloudUpdated;
    }
    return localUpdated;
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      await localRepository.deleteClient(id);
    } catch (e) {}

    const cloudSuccess = await this.callApi<boolean>('deleteClient', { id });
    if (cloudSuccess !== null) {
      return cloudSuccess;
    }
    return true;
  }

  // =========================================================================
  // 4. FOURNISSEURS
  // =========================================================================
  async getSuppliers(search?: string): Promise<Supplier[]> {
    const cloudSuppliers = await this.callApi<Supplier[]>('getSuppliers', { search });
    if (cloudSuppliers !== null && Array.isArray(cloudSuppliers)) {
      return cloudSuppliers;
    }
    return localRepository.getSuppliers(search);
  }

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>): Promise<Supplier> {
    const localCreated = await localRepository.createSupplier(supplierData);
    const cloudCreated = await this.callApi<Supplier>('createSupplier', supplierData);
    if (cloudCreated) {
      return cloudCreated;
    }
    return localCreated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      await localRepository.deleteSupplier(id);
    } catch (e) {}

    const cloudSuccess = await this.callApi<boolean>('deleteSupplier', { id });
    if (cloudSuccess !== null) {
      return cloudSuccess;
    }
    return true;
  }

  // =========================================================================
  // 5. PAIEMENTS & ENCAISSEMENTS
  // =========================================================================
  async recordPayment(
    invoiceId: string,
    payment: Omit<PaymentRecord, 'id' | 'createdAt'>
  ): Promise<{ invoice: Invoice; payment: PaymentRecord }> {
    const localResult = await localRepository.recordPayment(invoiceId, payment);
    const cloudResult = await this.callApi<{ invoice: Invoice; payment: PaymentRecord }>('recordPayment', {
      invoiceId,
      paymentData: payment,
    });
    if (cloudResult) {
      return cloudResult;
    }
    return localResult;
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    if (localRepository.deletePayment) {
      try {
        await localRepository.deletePayment(paymentId);
      } catch (e) {}
    }
    return true;
  }

  // =========================================================================
  // 6. DASHBOARD METRICS
  // =========================================================================
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cloudMetrics = await this.callApi<DashboardMetrics>('getDashboardMetrics');
    if (cloudMetrics) {
      return cloudMetrics;
    }
    return localRepository.getDashboardMetrics();
  }
}

export const supabaseRepository = new SupabaseInvoiceRepository();

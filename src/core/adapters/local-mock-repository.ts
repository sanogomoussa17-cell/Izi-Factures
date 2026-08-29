import { IInvoiceRepository } from '../ports/repository';
import {
  Invoice,
  Client,
  Supplier,
  Organization,
  PaymentRecord,
  DashboardMetrics,
} from '../domain/types';
import {
  INITIAL_ORGANIZATION,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_INVOICES,
} from '@/lib/fixtures/mock-data';
import { calculateInvoiceTotals } from '../domain/tax-engine';

const STORAGE_KEYS = {
  ORG: 'izi_org_v1',
  INVOICES: 'izi_invoices_v1',
  CLIENTS: 'izi_clients_v1',
  SUPPLIERS: 'izi_suppliers_v1',
  PAYMENTS: 'izi_payments_v1',
};

export class LocalMockRepository implements IInvoiceRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getStorageKey(baseKey: string): string {
    if (!this.isBrowser()) return baseKey;
    try {
      const session = localStorage.getItem('izifactures_session');
      if (session) {
        const parsed = JSON.parse(session);
        const userKey = parsed.id || parsed.email;
        if (userKey) {
          return `${baseKey}_${String(userKey).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        }
      }
    } catch (e) {}
    return baseKey;
  }

  private getItem<T>(baseKey: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const key = this.getStorageKey(baseKey);
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      const parsed = JSON.parse(data);

      // Filtrer les anciennes fausses données d'exemples
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((item: any) => {
          const id = item?.id || '';
          const name = item?.name || '';
          const company = item?.companyName || '';
          const isMockId = ['inv_01', 'inv_02', 'inv_03', 'cli_01', 'cli_02', 'cli_03', 'sup_01', 'sup_02'].includes(id);
          const isMockName = ['BillCraft Africa', 'Angelina Caroline', 'Cansaas Agency', 'Mamadou Diallo', 'Sahel Logistique SARL', 'Koffi Mensah', 'Bénin Fintech Solutions', 'Cloud Hosting Africa', 'Papeterie & Fournitures Sahel'].includes(name) || ['Cansaas Agency', 'Sahel Logistique SARL', 'Bénin Fintech Solutions', 'Cloud Africa SAS', 'Papeterie Sahel SA'].includes(company);
          return !isMockId && !isMockName;
        });
        return cleaned as unknown as T;
      }

      if (parsed && typeof parsed === 'object' && (parsed as any).name === 'BillCraft Africa & Studio') {
        return defaultValue;
      }

      return parsed;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(baseKey: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      const key = this.getStorageKey(baseKey);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage for key ${baseKey}`, e);
    }
  }

  // Organisation
  async getOrganization(): Promise<Organization> {
    return this.getItem<Organization>(STORAGE_KEYS.ORG, INITIAL_ORGANIZATION);
  }

  async updateOrganization(orgUpdate: Partial<Organization>): Promise<Organization> {
    const current = await this.getOrganization();
    const updated = { ...current, ...orgUpdate };
    this.setItem(STORAGE_KEYS.ORG, updated);
    return updated;
  }

  // Clients
  async getClients(search?: string): Promise<Client[]> {
    const clients = this.getItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }

  async getClientById(id: string): Promise<Client | null> {
    const clients = await this.getClients();
    return clients.find((c) => c.id === id) || null;
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>): Promise<Client> {
    const clients = await this.getClients();
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      totalInvoiced: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    clients.unshift(newClient);
    this.setItem(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  }

  async updateClient(id: string, updateData: Partial<Client>): Promise<Client> {
    const clients = await this.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Client introuvable');
    const updated = { ...clients[index], ...updateData };
    clients[index] = updated;
    this.setItem(STORAGE_KEYS.CLIENTS, clients);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const clients = await this.getClients();
    const filtered = clients.filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  }

  // Fournisseurs
  async getSuppliers(search?: string): Promise<Supplier[]> {
    const suppliers = this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.companyName && s.companyName.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
    );
  }

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'balanceDue'>): Promise<Supplier> {
    const suppliers = await this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(newSupplier);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSupplier;
  }

  async updateSupplier(id: string, updateData: Partial<Supplier>): Promise<Supplier> {
    const suppliers = await this.getSuppliers();
    const index = suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Fournisseur introuvable');
    const updated = { ...suppliers[index], ...updateData };
    suppliers[index] = updated;
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const suppliers = await this.getSuppliers();
    const filtered = suppliers.filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SUPPLIERS, filtered);
    return true;
  }

  // Factures
  async getInvoices(filters?: { status?: string; clientId?: string; search?: string }): Promise<Invoice[]> {
    const invoices = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    return invoices.filter((inv) => {
      if (filters?.status && filters.status !== 'ALL' && inv.paymentStatus !== filters.status && inv.status !== filters.status) {
        return false;
      }
      if (filters?.clientId && inv.clientId !== filters.clientId) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchesNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesClient = inv.client.name.toLowerCase().includes(q) || (inv.client.companyName && inv.client.companyName.toLowerCase().includes(q));
        if (!matchesNumber && !matchesClient) return false;
      }
      return true;
    });
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((inv) => inv.id === id) || null;
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const now = new Date().toISOString();
    const invoiceId = `inv_${Date.now()}`;
    const defaultSchedules: PaymentSchedule[] = [
      {
        id: `sched_single_${Date.now()}`,
        invoiceId,
        installmentNumber: 1,
        label: 'Règlement comptant',
        percentage: 100,
        expectedAmount: invoiceData.totalAmount || 0,
        dueDate: invoiceData.dueDate || now.slice(0, 10),
        status: 'PENDING',
        paidAmount: 0,
      },
    ];

    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      items: invoiceData.items || [],
      schedules: (invoiceData.schedules && invoiceData.schedules.length > 0) ? invoiceData.schedules : defaultSchedules,
      payments: invoiceData.payments || [],
      createdAt: now,
      updatedAt: now,
    };
    invoices.unshift(newInvoice);
    this.setItem(STORAGE_KEYS.INVOICES, invoices);

    // Mettre à jour les stats du client
    await this.refreshClientStats(newInvoice.clientId);

    return newInvoice;
  }

  async updateInvoice(id: string, invoiceUpdate: Partial<Invoice>): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new Error('Facture introuvable');

    const current = invoices[index];
    const updated: Invoice = {
      ...current,
      ...invoiceUpdate,
      updatedAt: new Date().toISOString(),
    };

    // Si les montants ont été modifiés, recalculer le solde restant
    if (invoiceUpdate.totalAmount !== undefined || invoiceUpdate.paidAmount !== undefined) {
      const paid = invoiceUpdate.paidAmount !== undefined ? invoiceUpdate.paidAmount : current.paidAmount;
      const total = invoiceUpdate.totalAmount !== undefined ? invoiceUpdate.totalAmount : current.totalAmount;
      updated.remainingBalance = Math.max(0, total - paid);
      if (updated.remainingBalance === 0 && paid > 0) {
        updated.paymentStatus = 'PAID';
      } else if (paid > 0) {
        updated.paymentStatus = 'PARTIALLY_PAID';
      } else {
        updated.paymentStatus = 'UNPAID';
      }
    }

    invoices[index] = updated;
    this.setItem(STORAGE_KEYS.INVOICES, invoices);

    // Mettre à jour les stats du client (et de l'ancien client si changé)
    await this.refreshClientStats(updated.clientId);
    if (current.clientId !== updated.clientId) {
      await this.refreshClientStats(current.clientId);
    }

    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoices = await this.getInvoices();
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return false;
    const filtered = invoices.filter((inv) => inv.id !== id);
    this.setItem(STORAGE_KEYS.INVOICES, filtered);
    await this.refreshClientStats(target.clientId);
    return true;
  }

  async issueInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'ISSUED' });
  }

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new Error('Facture introuvable');

    const current = invoices[index];
    const now = new Date().toISOString();
    const updated: Invoice = {
      ...current,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: now,
      remainingBalance: 0,
      updatedAt: now,
    };

    invoices[index] = updated;
    this.setItem(STORAGE_KEYS.INVOICES, invoices);

    await this.refreshClientStats(updated.clientId);
    return updated;
  }

  // Enregistrement d'un paiement / encaissement
  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    transactionReference: string;
    paymentDate: string;
    scheduleId?: string;
    notes?: string;
  }): Promise<{ payment: PaymentRecord; updatedInvoice: Invoice }> {
    const invoice = await this.getInvoiceById(params.invoiceId);
    if (!invoice) throw new Error('Facture introuvable');

    const paymentId = `pay_${Date.now()}`;
    const newPayment: PaymentRecord = {
      id: paymentId,
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.client.name,
      paymentDate: params.paymentDate,
      amount: params.amount,
      currency: invoice.currency,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      notes: params.notes,
      allocations: [
        {
          id: `alloc_${Date.now()}`,
          paymentId,
          invoiceId: invoice.id,
          scheduleId: params.scheduleId,
          amount: params.amount,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const newPaidAmount = invoice.paidAmount + params.amount;
    const remaining = Math.max(0, invoice.totalAmount - newPaidAmount);

    let paymentStatus: Invoice['paymentStatus'] = 'PARTIALLY_PAID';
    if (remaining === 0) {
      paymentStatus = 'PAID';
    } else if (newPaidAmount === 0) {
      paymentStatus = 'UNPAID';
    }

    // Mise à jour de l'échéancier
    const updatedSchedules = invoice.schedules.map((sched) => {
      if (params.scheduleId && sched.id === params.scheduleId) {
        const schedPaid = sched.paidAmount + params.amount;
        return {
          ...sched,
          paidAmount: schedPaid,
          status: (schedPaid >= sched.expectedAmount ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING',
        };
      }
      return sched;
    });

    const updatedInvoice = await this.updateInvoice(invoice.id, {
      paidAmount: newPaidAmount,
      remainingBalance: remaining,
      paymentStatus,
      schedules: updatedSchedules,
      payments: [...invoice.payments, newPayment],
    });

    return { payment: newPayment, updatedInvoice };
  }

  async updatePayment(params: {
    paymentId: string;
    invoiceId: string;
    amount?: number;
    paymentMethod?: PaymentRecord['paymentMethod'];
    transactionReference?: string;
    paymentDate?: string;
    notes?: string;
  }): Promise<{ payment: PaymentRecord; updatedInvoice: Invoice }> {
    const invoice = await this.getInvoiceById(params.invoiceId);
    if (!invoice) throw new Error('Facture introuvable');

    const targetPayment = (invoice.payments || []).find((p) => p.id === params.paymentId);
    if (!targetPayment) throw new Error('Paiement introuvable');

    const updatedPayment: PaymentRecord = {
      ...targetPayment,
      amount: params.amount !== undefined ? params.amount : targetPayment.amount,
      paymentMethod: params.paymentMethod || targetPayment.paymentMethod,
      transactionReference: params.transactionReference || targetPayment.transactionReference,
      paymentDate: params.paymentDate || targetPayment.paymentDate,
      notes: params.notes !== undefined ? params.notes : targetPayment.notes,
    };

    const newPayments = (invoice.payments || []).map((p) => (p.id === params.paymentId ? updatedPayment : p));
    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, invoice.totalAmount - totalPaid);

    let paymentStatus: Invoice['paymentStatus'] = 'PARTIALLY_PAID';
    if (remaining === 0) paymentStatus = 'PAID';
    else if (totalPaid === 0) paymentStatus = 'UNPAID';

    const updatedInvoice = await this.updateInvoice(invoice.id, {
      paidAmount: totalPaid,
      remainingBalance: remaining,
      paymentStatus,
      payments: newPayments,
    });

    return { payment: updatedPayment, updatedInvoice };
  }

  private async refreshClientStats(clientId: string): Promise<void> {
    const invoices = await this.getInvoices({ clientId });
    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    invoices.forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
        totalInvoiced += inv.totalAmount;
        totalPaid += inv.paidAmount;
        outstandingBalance += inv.remainingBalance;
      }
    });

    await this.updateClient(clientId, {
      totalInvoiced,
      totalPaid,
      outstandingBalance,
    });
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const org = await this.getOrganization();
    const invoices = await this.getInvoices();
    const clients = await this.getClients();

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    const allPayments: PaymentRecord[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    invoices.forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
        totalRevenue += inv.totalAmount;
        totalCollected += inv.paidAmount;
        
        if (inv.paymentStatus === 'PAID') {
          paidCount++;
        } else {
          // Vérifier si en retard
          const isOverdue = inv.dueDate < todayStr && inv.remainingBalance > 0;
          if (isOverdue || inv.paymentStatus === 'OVERDUE') {
            totalOverdue += inv.remainingBalance;
            overdueCount++;
          } else {
            totalPending += inv.remainingBalance;
            pendingCount++;
          }
        }
      }
      if (inv.payments && inv.payments.length > 0) {
        allPayments.push(...inv.payments);
      }
    });

    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Simulation graphique mensuel réaliste
    const monthlyRevenueChart = [
      { month: 'Oct', invoiced: 8200000, collected: 7500000 },
      { month: 'Nov', invoiced: 11400000, collected: 9800000 },
      { month: 'Déc', invoiced: 16800000, collected: 14200000 },
      { month: 'Jan', invoiced: 27450000, collected: 17500000 },
      { month: 'Fév', invoiced: totalRevenue, collected: totalCollected },
    ];

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
      currency: org.currency,
      recentInvoices: invoices.slice(0, 5),
      recentPayments: allPayments.slice(0, 5),
      monthlyRevenueChart,
    };
  }
}

export const localRepository = new LocalMockRepository();

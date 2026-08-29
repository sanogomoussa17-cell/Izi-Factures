import {
  Invoice,
  Client,
  Supplier,
  Organization,
  PaymentRecord,
  DashboardMetrics,
} from '../domain/types';

export interface IInvoiceRepository {
  // Organisation
  getOrganization(): Promise<Organization>;
  updateOrganization(org: Partial<Organization>): Promise<Organization>;

  // Factures
  getInvoices(filters?: {
    status?: string;
    clientId?: string;
    search?: string;
  }): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<boolean>;
  issueInvoice(id: string): Promise<Invoice>;
  cancelInvoice(id: string, reason: string): Promise<Invoice>;

  // Clients
  getClients(search?: string): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  createClient(client: Omit<Client, 'id' | 'createdAt' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;

  // Fournisseurs
  getSuppliers(search?: string): Promise<Supplier[]>;
  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'balanceDue'>): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<boolean>;

  // Paiements & Encaissements
  recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentRecord['paymentMethod'];
    transactionReference: string;
    paymentDate: string;
    scheduleId?: string;
    notes?: string;
  }): Promise<{ payment: PaymentRecord; updatedInvoice: Invoice }>;

  updatePayment(params: {
    paymentId: string;
    invoiceId: string;
    amount?: number;
    paymentMethod?: PaymentRecord['paymentMethod'];
    transactionReference?: string;
    paymentDate?: string;
    notes?: string;
  }): Promise<{ payment: PaymentRecord; updatedInvoice: Invoice }>;

  // Dashboard & Métriques
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

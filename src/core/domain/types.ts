export type CurrencyCode = 'XOF' | 'XAF' | 'GNF' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  exponent: number; // 0 for XOF/XAF/GNF, 2 for EUR/USD
  prefix?: string;
  suffix?: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  XOF: { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', exponent: 0, suffix: ' FCFA' },
  XAF: { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', exponent: 0, suffix: ' FCFA' },
  GNF: { code: 'GNF', name: 'Franc Guinéen', symbol: 'GNF', exponent: 0, suffix: ' GNF' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', exponent: 2, suffix: ' €' },
  USD: { code: 'USD', name: 'Dollar US', symbol: '$', exponent: 2, prefix: '$' },
};

export type DocumentStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'BANK_TRANSFER' | 'CASH' | 'CHECK';
export type PaymentStructure = 'STANDARD' | 'SPLIT' | 'RECURRING';

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxIdNumber: string; // N° IFU / NINEA / RCCM
  logoUrl?: string;
  currency: CurrencyCode;
  isTaxEnabled: boolean; // TVA activée globalement
  defaultTaxRateBps: number; // 1800 pour 18%
  bankDetails?: string;
  waveNumber?: string;
  orangeMoneyNumber?: string;
  momoNumber?: string;
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxIdNumber?: string; // N° IFU / NINEA
  notes?: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  orgId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  taxIdNumber?: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // Integer (in currency minor units)
  taxRateBps: number; // e.g. 1800 for 18%, 0 for 0%
  isTaxExempt: boolean;
  totalAmount: number; // calculated HT or TTC based on line
  taxAmount: number;
}

export interface PaymentSchedule {
  id: string;
  invoiceId: string;
  installmentNumber: number;
  label: string; // e.g. "Acompte 30% à la commande", "Solde 70% à la livraison"
  percentage: number; // e.g. 30, 70
  expectedAmount: number; // Integer
  dueDate: string; // YYYY-MM-DD
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAmount: number;
}

export interface PaymentRecord {
  id: string;
  orgId: string;
  invoiceId?: string;
  clientId: string;
  clientName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number; // Integer
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  transactionReference: string; // e.g. "WAVE-SN-29384", "OM-CI-99482"
  notes?: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  scheduleId?: string;
  amount: number;
}

export interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string; // e.g. "FAC-2026-0042"
  clientId: string;
  client: Client;
  status: DocumentStatus;
  paymentStatus: PaymentStatus;
  paymentStructure: PaymentStructure;
  currency: CurrencyCode;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  isTaxEnabled: boolean; // TVA activée pour ce document
  isTaxExempt: boolean; // Exonération légale
  taxExemptionReason?: string; // e.g. "Exonération art. 35 CGI - Régime exportateur"
  items: InvoiceItem[];
  subtotalAmount: number; // Total HT
  taxAmount: number; // Total TVA
  discountAmount: number; // Remise
  totalAmount: number; // Total TTC à payer
  paidAmount: number; // Montant déjà encaissé
  remainingBalance: number; // Solde restant dû
  schedules: PaymentSchedule[];
  payments: PaymentRecord[];
  notes?: string;
  termsAndConditions?: string;
  cancellationReason?: string; // Motif d'annulation obligatoire
  cancelledAt?: string; // Date et heure d'annulation
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number; // Total facturé TTC
  totalCollected: number; // Total encaissé
  totalPending: number; // Total en attente
  totalOverdue: number; // Total en retard
  collectionRate: number; // Taux de recouvrement % (0-100)
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  pendingInvoiceCount: number;
  clientCount: number;
  currency: CurrencyCode;
  recentInvoices: Invoice[];
  recentPayments: PaymentRecord[];
  monthlyRevenueChart: {
    month: string;
    invoiced: number;
    collected: number;
  }[];
}

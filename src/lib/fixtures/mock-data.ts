import { Organization, Client, Supplier, Invoice } from '@/core/domain/types';

export const INITIAL_ORGANIZATION: Organization = {
  id: 'org_default',
  name: 'Mon Entreprise',
  legalName: '',
  email: '',
  phone: '',
  address: '',
  city: 'Dakar',
  country: 'Sénégal',
  taxIdNumber: '',
  currency: 'XOF',
  isTaxEnabled: true,
  defaultTaxRateBps: 1800, // 18% TVA UEMOA
  bankDetails: '',
  waveNumber: '',
  orangeMoneyNumber: '',
};

// Tableaux vides par défaut : aucune donnée virtuelle/fictive
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_INVOICES: Invoice[] = [];

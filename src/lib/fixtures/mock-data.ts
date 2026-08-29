import { Organization, Client, Supplier, Invoice } from '@/core/domain/types';

export const INITIAL_ORGANIZATION: Organization = {
  id: 'org_default',
  name: 'Izi Factures Studio',
  email: 'contact@izifactures.sn',
  phone: '+221 77 849 20 40',
  address: 'Dakar Plateau',
  city: 'Dakar',
  country: 'Sénégal',
  taxIdNumber: 'SN-DKR-2026-001',
  currency: 'XOF',
  isTaxEnabled: true,
  defaultTaxRateBps: 1800, // 18% TVA UEMOA
  bankDetails: '',
  waveNumber: '+221 77 849 20 40',
  orangeMoneyNumber: '+221 77 849 20 40',
};

// Tableaux vides par défaut : aucune donnée virtuelle/fictive
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_INVOICES: Invoice[] = [];

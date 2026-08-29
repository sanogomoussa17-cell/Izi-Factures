import { InvoiceItem } from './types';

export interface TaxCalculationResult {
  subtotalAmount: number; // Montant HT
  taxAmount: number;      // Total TVA
  discountAmount: number; // Remise appliquée
  totalAmount: number;    // Montant TTC
  items: InvoiceItem[];
}

/**
 * Moteur de calcul de TVA et totaux avec précision arithmétique entière.
 * Gère :
 * - TVA activée/désactivée globalement sur le document
 * - Exonération légale explicite
 * - Taux par article (18%, 10%, 0%)
 * - Remises
 */
export function calculateInvoiceTotals(params: {
  items: Omit<InvoiceItem, 'totalAmount' | 'taxAmount'>[];
  isTaxEnabled: boolean;
  isTaxExempt?: boolean;
  discountPercentage?: number; // e.g. 5 for 5%
  discountFlatAmount?: number; // Integer
}): TaxCalculationResult {
  const { items, isTaxEnabled, isTaxExempt = false, discountPercentage = 0, discountFlatAmount = 0 } = params;

  let subtotalAmount = 0;
  let totalTaxAmount = 0;

  const computedItems: InvoiceItem[] = items.map((item) => {
    const rawLineTotal = Math.round(item.quantity * item.unitPrice);
    subtotalAmount += rawLineTotal;

    // Si la TVA est désactivée sur le document, ou que le document est exonéré, ou que la ligne est exonérée
    const effectiveTaxRateBps = (!isTaxEnabled || isTaxExempt || item.isTaxExempt) ? 0 : (item.taxRateBps || 1800);
    const lineTaxAmount = Math.round((rawLineTotal * effectiveTaxRateBps) / 10000);
    
    totalTaxAmount += lineTaxAmount;

    return {
      ...item,
      totalAmount: rawLineTotal,
      taxAmount: lineTaxAmount,
      taxRateBps: effectiveTaxRateBps,
    };
  });

  // Calcul de la remise
  let calculatedDiscount = 0;
  if (discountFlatAmount > 0) {
    calculatedDiscount = Math.min(subtotalAmount, discountFlatAmount);
  } else if (discountPercentage > 0) {
    calculatedDiscount = Math.round((subtotalAmount * discountPercentage) / 100);
  }

  // Ajustement TVA si remise globale (proportionnelle)
  const effectiveSubtotal = Math.max(0, subtotalAmount - calculatedDiscount);
  const effectiveTaxAmount = isTaxEnabled && !isTaxExempt 
    ? (subtotalAmount > 0 ? Math.round((totalTaxAmount * effectiveSubtotal) / subtotalAmount) : 0)
    : 0;

  const totalAmount = effectiveSubtotal + effectiveTaxAmount;

  return {
    subtotalAmount,
    taxAmount: effectiveTaxAmount,
    discountAmount: calculatedDiscount,
    totalAmount,
    items: computedItems,
  };
}

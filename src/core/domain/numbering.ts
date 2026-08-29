/**
 * Formatage standard et sans trou des numéros de facture
 * Exemples :
 * - "FAC-2026-0001"
 * - "DEV-2026-0042"
 */
export function formatInvoiceNumber(sequence: number, prefix: string = 'FAC', year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSeq = sequence.toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedSeq}`;
}

export function parseInvoiceNumber(invoiceNum: string): { prefix: string; year: number; sequence: number } | null {
  const match = invoiceNum.match(/^([A-Z]+)-(\d{4})-(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}

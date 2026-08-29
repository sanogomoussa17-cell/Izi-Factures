import { CurrencyCode, CURRENCY_CONFIGS } from './types';

/**
 * Formate un montant en entier strict vers une représentation lisible adaptée à l'Afrique et l'international.
 * Exemples :
 * - 12500000 XOF -> "12 500 000 FCFA"
 * - 4950 EUR -> "49,50 €"
 * - 1448024 USD -> "$14,480.24"
 */
export function formatMoney(amount: number, currency: CurrencyCode = 'XOF'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.XOF;
  
  if (config.exponent === 0) {
    // Monnaie sans centimes (FCFA, GNF)
    const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted}${config.suffix || ''}`;
  }

  // Monnaie avec centimes (EUR, USD)
  const divisor = Math.pow(10, config.exponent);
  const realValue = amount / divisor;
  const parts = realValue.toFixed(config.exponent).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency === 'USD' ? ',' : ' ');
  const decPart = parts[1];

  const fullNumber = `${intPart}${currency === 'USD' ? '.' : ','}${decPart}`;

  if (config.prefix) {
    return `${config.prefix}${fullNumber}`;
  }
  return `${fullNumber}${config.suffix || ''}`;
}

/**
 * Formate un taux de taxe en basis points (bps) en pourcentage lisible
 * Ex: 1800 bps -> "18%", 1000 bps -> "10%", 1925 bps -> "19.25%"
 */
export function formatTaxRate(taxRateBps: number): string {
  const rate = taxRateBps / 100;
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(2)}%`;
}

/**
 * Parse un nombre utilisateur (ex: 12500000 ou "12 500 000") vers un entier monétaire selon la devise
 */
export function parseMoneyInput(raw: string | number, currency: CurrencyCode = 'XOF'): number {
  if (typeof raw === 'number') {
    return Math.round(raw);
  }
  const cleanStr = raw.replace(/\s+/g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed)) return 0;

  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.XOF;
  if (config.exponent === 0) {
    return Math.round(parsed);
  }
  return Math.round(parsed * Math.pow(10, config.exponent));
}

const assert = require('assert');

// 1. Money tests
function formatMoney(amount, currency = 'XOF') {
  if (currency === 'XOF' || currency === 'XAF' || currency === 'GNF') {
    const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FCFA`;
  }
  const realValue = amount / 100;
  const parts = realValue.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency === 'USD' ? ',' : ' ');
  const fullNumber = `${intPart}${currency === 'USD' ? '.' : ','}${parts[1]}`;
  return currency === 'USD' ? `$${fullNumber}` : `${fullNumber} €`;
}

console.log('Testing Money formatting...');
assert.strictEqual(formatMoney(12500000, 'XOF'), '12 500 000 FCFA');
assert.strictEqual(formatMoney(4950, 'EUR'), '49,50 €');
assert.strictEqual(formatMoney(1448024, 'USD'), '$14,480.24');
console.log('✓ Money formatting OK');

// 2. Tax engine calculation tests
function calculateInvoiceTotals(params) {
  const { items, isTaxEnabled, isTaxExempt = false, discountFlatAmount = 0 } = params;
  let subtotalAmount = 0;
  let totalTaxAmount = 0;

  const computedItems = items.map((item) => {
    const rawLineTotal = Math.round(item.quantity * item.unitPrice);
    subtotalAmount += rawLineTotal;
    const effectiveTaxRateBps = (!isTaxEnabled || isTaxExempt || item.isTaxExempt) ? 0 : (item.taxRateBps || 1800);
    const lineTaxAmount = Math.round((rawLineTotal * effectiveTaxRateBps) / 10000);
    totalTaxAmount += lineTaxAmount;
    return { ...item, totalAmount: rawLineTotal, taxAmount: lineTaxAmount };
  });

  const effectiveSubtotal = Math.max(0, subtotalAmount - discountFlatAmount);
  const effectiveTaxAmount = isTaxEnabled && !isTaxExempt
    ? (subtotalAmount > 0 ? Math.round((totalTaxAmount * effectiveSubtotal) / subtotalAmount) : 0)
    : 0;
  const totalAmount = effectiveSubtotal + effectiveTaxAmount;

  return { subtotalAmount, taxAmount: effectiveTaxAmount, totalAmount, items: computedItems };
}

console.log('Testing 18% Tax Engine...');
// Test 1: Standard 18% VAT on 1 000 000 FCFA
const res1 = calculateInvoiceTotals({
  items: [{ quantity: 1, unitPrice: 1000000, taxRateBps: 1800, isTaxExempt: false }],
  isTaxEnabled: true,
  isTaxExempt: false,
});
assert.strictEqual(res1.subtotalAmount, 1000000);
assert.strictEqual(res1.taxAmount, 180000);
assert.strictEqual(res1.totalAmount, 1180000);
console.log('✓ Standard 18% VAT OK (1 000 000 -> 1 180 000 FCFA)');

// Test 2: Tax Exempt
const res2 = calculateInvoiceTotals({
  items: [{ quantity: 1, unitPrice: 1000000, taxRateBps: 1800, isTaxExempt: false }],
  isTaxEnabled: true,
  isTaxExempt: true,
});
assert.strictEqual(res2.taxAmount, 0);
assert.strictEqual(res2.totalAmount, 1000000);
console.log('✓ Tax Exemption OK (1 000 000 -> 1 000 000 FCFA)');

// 3. Split Payment Engine tests (30/70 split on 1 180 000 FCFA)
function generatePaymentSchedules(totalAmount, splits) {
  let allocatedSum = 0;
  return splits.map((split, index) => {
    const isLast = index === splits.length - 1;
    const expectedAmount = isLast ? totalAmount - allocatedSum : Math.round((totalAmount * split.percentage) / 100);
    allocatedSum += expectedAmount;
    return { ...split, expectedAmount };
  });
}

console.log('Testing Split Payment Schedules...');
const splits30_70 = [
  { label: 'Acompte 30%', percentage: 30 },
  { label: 'Solde 70%', percentage: 70 },
];
const schedules = generatePaymentSchedules(1180000, splits30_70);
assert.strictEqual(schedules[0].expectedAmount, 354000);
assert.strictEqual(schedules[1].expectedAmount, 826000);
assert.strictEqual(schedules[0].expectedAmount + schedules[1].expectedAmount, 1180000);
console.log('✓ 30/70 Split Schedule OK (354 000 + 826 000 = 1 180 000 FCFA)');

console.log('\nAll domain unit tests passed with 100% precision!');

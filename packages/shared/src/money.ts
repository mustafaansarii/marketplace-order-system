export function getFractionDigits(currency: string): number {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.resolvedOptions().maximumFractionDigits ?? 2;
}

export function formatMoney(cents: number, currency: string): string {
  const digits = getFractionDigits(currency);
  const majorUnits = cents / Math.pow(10, digits);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(majorUnits);
}

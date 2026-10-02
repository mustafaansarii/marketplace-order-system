import { describe, it, expect } from 'vitest';
import { formatMoney, getFractionDigits } from './money.js';

describe('money', () => {
  it('formats USD correctly', () => {
    expect(formatMoney(1500, 'USD')).toBe('$15.00');
  });

  it('formats JPY correctly (0 decimal places)', () => {
    expect(formatMoney(1500, 'JPY')).toBe('¥1,500');
  });

  it('gets correct fraction digits', () => {
    expect(getFractionDigits('USD')).toBe(2);
    expect(getFractionDigits('JPY')).toBe(0);
  });
});

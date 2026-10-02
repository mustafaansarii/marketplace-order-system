import { describe, it, expect } from 'vitest';
import { OrderSchema } from './order.js';

describe('OrderSchema', () => {
  it('validates a valid order', () => {
    const validOrder = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      provider: 'uber',
      external_order_id: 'ext-123',
      status: 'new',
      customer: { name: 'John Doe', phone: '+1234567890' },
      line_items: [
        {
          name: 'Burger',
          quantity: 2,
          unit_price_cents: 500,
          line_total_cents: 1000,
        },
      ],
      total_cents: 1000,
      currency: 'USD',
      created_at: new Date().toISOString(),
      raw_payload: {},
    };

    expect(() => OrderSchema.parse(validOrder)).not.toThrow();
  });

  it('rejects invalid status', () => {
    const invalidOrder = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      provider: 'uber',
      external_order_id: 'ext-123',
      status: 'invalid_status', // Invalid
      customer: { name: 'John Doe', phone: null },
      line_items: [],
      total_cents: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      raw_payload: {},
    };

    const result = OrderSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
  });
});

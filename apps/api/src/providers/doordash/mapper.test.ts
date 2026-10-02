import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mapDoorDashOrder } from './mapper.js';
import { DoorDashWebhookSchema } from './schema.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('DoorDash Mapper', () => {
  it('maps golden fixtures to internal order correctly', () => {
    const webhookJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../../../fixtures/doordash/webhook-order-create.json'), 'utf-8')
    );

    const payload = DoorDashWebhookSchema.parse(webhookJson);
    const receivedAt = new Date('2024-01-01T12:00:00Z').getTime(); // mock received time

    const order = mapDoorDashOrder(payload, webhookJson, receivedAt, 'USD');

    expect(order.provider).toBe('doordash');
    expect(order.external_order_id).toBe('abc12345');
    expect(order.status).toBe('new'); // NEW maps to new
    expect(order.customer.name).toBe('Kelley W.');
    expect(order.customer.phone).toBe('+18559731040');
    expect(order.total_cents).toBe(2300); // 2000 subtotal + 300 tax
    expect(order.currency).toBe('USD');
    expect(order.created_at).toBe('2024-01-01T12:00:00.000Z');
    
    expect(order.line_items).toHaveLength(1);
    expect(order.line_items[0]!.name).toBe('Burrito Scram-Bowl');
    expect(order.line_items[0]!.quantity).toBe(1);
    expect(order.line_items[0]!.unit_price_cents).toBe(0); 
    expect(order.line_items[0]!.line_total_cents).toBe(0);
  });
});

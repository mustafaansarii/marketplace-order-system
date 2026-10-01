import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { mapUberOrder } from './mapper.js';
import { UberNotificationSchema, UberGetOrderSchema } from './schema.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Uber Mapper', () => {
  it('maps golden fixtures to internal order correctly', () => {
    const notificationJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../../../fixtures/uber/webhook-orders-notification.json'), 'utf-8')
    );
    const getOrderJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../../../fixtures/uber/get-order-response.json'), 'utf-8')
    );

    const notification = UberNotificationSchema.parse(notificationJson);
    const fetchedOrder = UberGetOrderSchema.parse(getOrderJson);

    const order = mapUberOrder(notification, fetchedOrder);

    expect(order.provider).toBe('uber');
    expect(order.external_order_id).toBe('f9f363d1-55c3-42e1-a083-d34346bbecf2');
    expect(order.status).toBe('new'); // CREATED maps to new
    expect(order.customer.name).toBe('Jane Doe');
    expect(order.customer.phone).toBe('+15551234567');
    expect(order.total_cents).toBe(1000);
    expect(order.currency).toBe('USD');
    expect(order.created_at).toBe('2021-04-12T18:55:51.000Z'); // ISO from 2021-04-12T11:55:51-07:00
    
    expect(order.line_items).toHaveLength(1);
    expect(order.line_items[0]!.name).toBe('Pizza');
    expect(order.line_items[0]!.quantity).toBe(1);
    expect(order.line_items[0]!.unit_price_cents).toBe(1000);
    expect(order.line_items[0]!.line_total_cents).toBe(1000);
  });
});

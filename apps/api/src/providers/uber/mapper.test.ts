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

    const order = mapUberOrder(notification, fetchedOrder, getOrderJson);

    expect(order.provider).toBe('uber');
    expect(order.external_order_id).toBe('f9f363d1-e1c2-4595-b477-c649845bc953');
    expect(order.status).toBe('new'); // CREATED maps to new
    expect(order.customer.name).toBe('Larry');
    expect(order.customer.phone).toBe('+1 555-555-5555');
    expect(order.total_cents).toBe(1399);
    expect(order.currency).toBe('USD');
    expect(order.created_at).toBe('2019-05-14T20:16:54.000Z'); // ISO from 2019-05-14T15:16:54-05:00
    
    expect(order.line_items).toHaveLength(3);
    expect(order.line_items[0]!.name).toBe('Fresh-baked muffin');
    expect(order.line_items[0]!.quantity).toBe(1);
    expect(order.line_items[0]!.unit_price_cents).toBe(350);
    expect(order.line_items[0]!.line_total_cents).toBe(350);

    expect(order.line_items[1]!.name).toBe('Coffee');
    expect(order.line_items[1]!.quantity).toBe(1);
    expect(order.line_items[1]!.unit_price_cents).toBe(300);
    expect(order.line_items[1]!.line_total_cents).toBe(300);

    expect(order.line_items[2]!.name).toBe('Strawberry Donut');
    expect(order.line_items[2]!.quantity).toBe(1);
    expect(order.line_items[2]!.unit_price_cents).toBe(250);
    expect(order.line_items[2]!.line_total_cents).toBe(250);
  });
});

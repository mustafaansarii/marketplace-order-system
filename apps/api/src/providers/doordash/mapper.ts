import { OrderDraft } from '../../domain/order.js';
import { DoorDashWebhookPayload } from './schema.js';
import { OrderStatus } from '@marketplace/shared';

function mapDoorDashStatus(status: string): OrderStatus {
  switch (status) {
    case 'NEW':
    case 'OrderCreate':
      return OrderStatus.NEW;
    default:
      console.warn(`Unknown DoorDash status: ${status}`);
      return OrderStatus.NEW;
  }
}

export function mapDoorDashOrder(
  payload: DoorDashWebhookPayload,
  rawPayload: any,
  receivedAtMs: number,
  defaultCurrency: string = 'USD'
): OrderDraft {
  const { event, order } = payload;
  
  const consumerName = [order.consumer?.first_name, order.consumer?.last_name]
    .filter(Boolean)
    .join(' ');

  const lineItems = order.categories.flatMap(category => 
    category.items.map(item => {
      return {
        name: item.name,
        quantity: item.quantity,
        unit_price_cents: item.price,
        line_total_cents: item.price * item.quantity,
      };
    })
  );

  return {
    provider: 'doordash',
    external_order_id: order.id,
    status: mapDoorDashStatus(event.status),
    customer: {
      name: consumerName || 'Unknown',
      phone: order.consumer?.phone || null,
    },
    line_items: lineItems,
    total_cents: order.subtotal + order.tax,
    currency: defaultCurrency,
    created_at: new Date(receivedAtMs).toISOString(),
    raw_payload: { webhook: rawPayload },
  };
}

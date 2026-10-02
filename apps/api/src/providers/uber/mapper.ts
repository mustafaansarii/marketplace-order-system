import { OrderDraft } from '../../domain/order.js';
import { UberGetOrderPayload, UberNotificationPayload } from './schema.js';
import { OrderStatus } from '@marketplace/shared';

function mapUberStatus(currentState: string): OrderStatus {
  switch (currentState) {
    case 'CREATED':
      return OrderStatus.NEW;
    case 'ACCEPTED':
      return OrderStatus.ACCEPTED;
    case 'FINISHED':
      return OrderStatus.COMPLETED;
    case 'CANCELED':
    case 'DENIED':
      return OrderStatus.CANCELLED;
    default:
      console.warn(`Unknown Uber state: ${currentState}`);
      return OrderStatus.NEW;
  }
}

export function mapUberOrder(
  notification: UberNotificationPayload,
  fetchedOrder: UberGetOrderPayload,
  rawFetchedOrder: any
): OrderDraft {
  const eaterName = [fetchedOrder.eater?.first_name, fetchedOrder.eater?.last_name]
    .filter(Boolean)
    .join(' ');

  const items = fetchedOrder.cart?.items ?? [];

  return {
    provider: 'uber',
    external_order_id: fetchedOrder.id, // id (= meta.resource_id)
    status: mapUberStatus(fetchedOrder.current_state),
    customer: {
      name: eaterName || 'Unknown',
      phone: fetchedOrder.eater?.phone || null,
    },
    line_items: items.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      unit_price_cents: item.price.unit_price.amount,
      line_total_cents: item.price.total_price.amount,
    })),
    total_cents: fetchedOrder.payment.charges.total.amount,
    currency: fetchedOrder.payment.charges.total.currency_code,
    created_at: fetchedOrder.placed_at 
      ? new Date(fetchedOrder.placed_at).toISOString() 
      : new Date((notification.event_time || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    raw_payload: { notification, fetched_order: rawFetchedOrder },
  };
}

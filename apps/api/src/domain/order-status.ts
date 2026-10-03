import { OrderStatus } from '../shared/index.js';

export const ORDER_STATUS_FLOW = [
  OrderStatus.NEW,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED
];

export function nextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_FLOW.length - 1) {
    return null;
  }
  return ORDER_STATUS_FLOW[currentIndex + 1] || null;
}

export function canAdvance(currentStatus: OrderStatus): boolean {
  return nextStatus(currentStatus) !== null;
}

export function mergeIncomingStatus(currentStatus: OrderStatus, incomingStatus: OrderStatus): OrderStatus {
  if (incomingStatus === OrderStatus.CANCELLED || currentStatus === OrderStatus.CANCELLED) {
    return OrderStatus.CANCELLED;
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const incomingIndex = ORDER_STATUS_FLOW.indexOf(incomingStatus);
  if (incomingIndex > currentIndex) {
    return incomingStatus;
  }
  return currentStatus;
}

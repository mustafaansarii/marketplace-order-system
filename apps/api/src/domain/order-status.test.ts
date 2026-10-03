import { describe, it, expect } from 'vitest';
import { nextStatus, canAdvance, mergeIncomingStatus } from './order-status.js';
import { OrderStatus } from '../shared/index.js';

describe('order-status domain', () => {
  it('computes nextStatus', () => {
    expect(nextStatus(OrderStatus.NEW)).toBe(OrderStatus.ACCEPTED);
    expect(nextStatus(OrderStatus.READY)).toBe(OrderStatus.COMPLETED);
    expect(nextStatus(OrderStatus.COMPLETED)).toBeNull();
    expect(nextStatus(OrderStatus.CANCELLED)).toBeNull();
  });

  it('computes canAdvance', () => {
    expect(canAdvance(OrderStatus.NEW)).toBe(true);
    expect(canAdvance(OrderStatus.COMPLETED)).toBe(false);
  });

  it('merges incoming status correctly', () => {
    expect(mergeIncomingStatus(OrderStatus.NEW, OrderStatus.NEW)).toBe(OrderStatus.NEW);
    expect(mergeIncomingStatus(OrderStatus.NEW, OrderStatus.CANCELLED)).toBe(OrderStatus.CANCELLED);
    // Ignore backward transitions
    expect(mergeIncomingStatus(OrderStatus.READY, OrderStatus.NEW)).toBe(OrderStatus.READY);
  });
});

import React from 'react';
import { OrderStatus } from '../shared';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: 'bg-blue-100 text-blue-800',
    [OrderStatus.ACCEPTED]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.PREPARING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.READY]: 'bg-green-100 text-green-800',
    [OrderStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${colors[status]}`}>
      {status}
    </span>
  );
}

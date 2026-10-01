import { Order } from '@marketplace/shared';

export type OrderDraft = Omit<Order, 'id'>;

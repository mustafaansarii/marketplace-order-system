import { Order } from '../shared/index.js';

export type OrderDraft = Omit<Order, 'id'>;

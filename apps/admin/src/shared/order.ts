export enum OrderStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type LineItem = {
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type Customer = {
  name: string;
  phone: string | null;
};

export type Order = {
  id: string;
  provider: 'uber' | 'doordash';
  external_order_id: string;
  status: OrderStatus;
  customer: Customer;
  line_items: LineItem[];
  total_cents: number;
  currency: string;
  created_at: string;
  raw_payload: unknown;
  can_advance?: boolean;
  next_status?: OrderStatus | null;
};

export type OrderSummary = Omit<Order, 'raw_payload'>;

export type ListQuery = {
  provider?: 'uber' | 'doordash';
  status?: OrderStatus;
  q?: string;
  sort?: 'time_asc' | 'time_desc';
  limit?: number;
  page?: number;
};

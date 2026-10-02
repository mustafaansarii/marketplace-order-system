import { z } from 'zod';

export enum OrderStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const OrderStatusSchema = z.nativeEnum(OrderStatus);

export const STATUS_RANK: Record<OrderStatus, number> = {
  [OrderStatus.NEW]: 0,
  [OrderStatus.ACCEPTED]: 1,
  [OrderStatus.PREPARING]: 2,
  [OrderStatus.READY]: 3,
  [OrderStatus.COMPLETED]: 4,
  [OrderStatus.CANCELLED]: 99,
};

export const LineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  unit_price_cents: z.number().int(),
  line_total_cents: z.number().int(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const CustomerSchema = z.object({
  name: z.string(),
  phone: z.string().nullable(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  provider: z.enum(['uber', 'doordash']),
  external_order_id: z.string(),
  status: OrderStatusSchema,
  customer: CustomerSchema,
  line_items: z.array(LineItemSchema),
  total_cents: z.number().int(),
  currency: z.string(),
  created_at: z.string().datetime(), // ISO-8601 UTC
  raw_payload: z.unknown(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrderSummarySchema = OrderSchema.omit({ raw_payload: true });

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

export const ListQuerySchema = z.object({
  provider: z.enum(['uber', 'doordash']).optional(),
  status: OrderStatusSchema.optional(),
  q: z.string().optional(),
  sort: z.enum(['time_asc', 'time_desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ListQuery = z.infer<typeof ListQuerySchema>;

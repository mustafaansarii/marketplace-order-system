import { z } from 'zod';

export const UberGetOrderSchema = z.object({
  id: z.string(),
  current_state: z.string(),
  placed_at: z.string().optional(),
  eater: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  cart: z.object({
    items: z.array(z.object({
      title: z.string(),
      quantity: z.number(),
      price: z.object({
        unit_price: z.object({ amount: z.number() }),
        total_price: z.object({ amount: z.number() }),
      })
    })).optional().default([])
  }).optional(),
  payment: z.object({
    charges: z.object({
      total: z.object({
        amount: z.number(),
        currency_code: z.string()
      })
    })
  })
});

export const UberNotificationSchema = z.object({
  event_time: z.number().optional(), // unix seconds
  event_type: z.string(),
  event_id: z.string(),
  meta: z.object({
    resource_id: z.string().optional(),
  }).passthrough(),
});

export type UberGetOrderPayload = z.infer<typeof UberGetOrderSchema>;
export type UberNotificationPayload = z.infer<typeof UberNotificationSchema>;

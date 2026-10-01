import { z } from 'zod';

export const DoorDashOrderSchema = z.object({
  id: z.string(),
  consumer: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  subtotal: z.number(),
  tax: z.number(),
  categories: z.array(z.object({
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
      extras: z.array(z.object({
        options: z.array(z.object({
          price: z.number(),
          quantity: z.number()
        }))
      })).optional()
    }))
  })).optional().default([])
});

export const DoorDashWebhookSchema = z.object({
  event: z.object({
    type: z.string(),
    status: z.string(),
  }),
  order: DoorDashOrderSchema
});

export type DoorDashWebhookPayload = z.infer<typeof DoorDashWebhookSchema>;
export type DoorDashOrderPayload = z.infer<typeof DoorDashOrderSchema>;

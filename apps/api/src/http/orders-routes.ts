import { Router } from 'express';
import { OrderService } from '../services/order-service.js';
import { ListQuerySchema } from '../shared/index.js';
import { PayloadValidationError, OrderNotFoundError } from '../domain/errors.js';
import { z } from 'zod';

export function createOrdersRouter(orderService: OrderService): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const result = await orderService.list(query);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new PayloadValidationError('Invalid query parameters'));
      } else {
        next(err);
      }
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      if (!z.string().uuid().safeParse(req.params.id).success) {
        throw new OrderNotFoundError();
      }
      const order = await orderService.get(req.params.id);
      if (!order) {
        throw new OrderNotFoundError();
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/advance', async (req, res, next) => {
    try {
      if (!z.string().uuid().safeParse(req.params.id).success) {
        throw new OrderNotFoundError();
      }
      const order = await orderService.advance(req.params.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

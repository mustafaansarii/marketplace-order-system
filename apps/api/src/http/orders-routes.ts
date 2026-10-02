import { Router } from 'express';
import { OrderRepository } from '../db/order-repository.js';
import { ListQuerySchema } from '../shared/index.js';
import { PayloadValidationError, OrderNotFoundError, InvalidStatusTransitionError, ConcurrentUpdateError } from './errors.js';
import { z } from 'zod';

export function createOrdersRouter(repo: OrderRepository): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const result = await repo.list(query);
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
      const order = await repo.findById(req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/advance', async (req, res, next) => {
    try {
      const order = await repo.advanceStatus(req.params.id);
      res.json(order);
    } catch (err: any) {
      if (err instanceof OrderNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err instanceof InvalidStatusTransitionError || err instanceof ConcurrentUpdateError) {
        res.status(409).json({ error: err.message });
        return;
      }
      next(err);
    }
  });

  return router;
}

import { Router } from 'express';
import express from 'express';
import { IngestService } from '../ingest/ingest-service.js';

export function createWebhookRouter(ingestService: IngestService): Router {
  const router = Router();

  router.post('/orders', express.raw({ type: '*/*' }), async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        throw new Error('Raw body parser failed. Body is not a buffer.');
      }

      const outcome = await ingestService.processWebhook({
        rawBody: req.body,
        headers: req.headers
      });

      if (outcome.body === '') {
        res.status(outcome.status).send();
      } else {
        res.status(outcome.status).json(outcome.body);
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
}


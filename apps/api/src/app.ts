import express from 'express';
import cors from 'cors';
import { createWebhookRouter } from './http/webhook-route.js';
import { createOrdersRouter } from './http/orders-routes.js';
import { errorHandler } from './http/error-middleware.js';
import { IngestService } from './ingest/ingest-service.js';
import { OrderService } from './services/order-service.js';

export function createApp(ingestService: IngestService, orderService: OrderService) {
  const app = express();
  
  app.use(cors());

  app.use('/webhooks', createWebhookRouter(ingestService));

  app.use(express.json());

  app.use('/api/orders', createOrdersRouter(orderService));

  app.use(errorHandler);

  return app;
}

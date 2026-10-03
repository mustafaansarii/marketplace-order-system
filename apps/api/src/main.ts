import { config } from './config.js';
import { createDbConnection } from './db/connection.js';
import { OrderRepository } from './db/order-repository.js';
import { UberTokenProvider } from './providers/uber/token-provider.js';
import { UberClient } from './providers/uber/client.js';
import { UberAdapter } from './providers/uber/adapter.js';
import { DoorDashAdapter } from './providers/doordash/adapter.js';
import { IngestService } from './ingest/ingest-service.js';
import { createApp } from './app.js';

import { OrderService } from './services/order-service.js';

const db = await createDbConnection(config.DATABASE_URL);
const repo = new OrderRepository(db);
const orderService = new OrderService(repo);

const tokenProvider = new UberTokenProvider(
  config.UBER_AUTH_URL,
  config.UBER_CLIENT_ID,
  config.UBER_CLIENT_SECRET,
  config.UBER_SCOPE
);

const uberClient = new UberClient(config.UBER_API_BASE_URL, tokenProvider);

const uberAdapter = new UberAdapter(
  config.UBER_CLIENT_SECRET,
  uberClient
);

const doorDashAdapter = new DoorDashAdapter(
  config.DOORDASH_WEBHOOK_AUTH_TOKEN,
  config.DOORDASH_WEBHOOK_AUTH_HEADER,
  config.DEFAULT_CURRENCY
);

const ingestService = new IngestService([uberAdapter, doorDashAdapter], orderService);

const app = createApp(ingestService, orderService);

app.listen(config.PORT, () => {
  console.log(`Marketplace API listening on port ${config.PORT}`);
});

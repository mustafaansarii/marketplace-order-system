import { config } from '../config.js';
import { createDbConnection } from './connection.js';
import { OrderRepository } from './order-repository.js';
import { OrderService } from '../services/order-service.js';
import { mapUberOrder } from '../providers/uber/mapper.js';
import { mapDoorDashOrder } from '../providers/doordash/mapper.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function resetDb() {
  const db = await createDbConnection(config.DATABASE_URL);
  
  console.log('Truncating orders table...');
  await db.query('TRUNCATE TABLE orders');
  
  const repo = new OrderRepository(db);
  const orderService = new OrderService(repo);
  
  console.log('Ingesting Uber fixture...');
  const uberWebhook = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../fixtures/uber/webhook-orders-notification.json'), 'utf8'));
  const uberGetOrder = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../fixtures/uber/get-order-response.json'), 'utf8'));
  const uberDraft = mapUberOrder(uberWebhook, uberGetOrder, uberGetOrder);
  await orderService.ingestDraft(uberDraft);
  
  console.log('Ingesting DoorDash fixture...');
  const ddWebhook = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../fixtures/doordash/webhook-order-create.json'), 'utf8'));
  const ddDraft = mapDoorDashOrder(ddWebhook, ddWebhook, Date.now(), config.DEFAULT_CURRENCY);
  await orderService.ingestDraft(ddDraft);
  
  console.log('Database reset complete.');
  process.exit(0);
}

resetDb().catch(e => {
  console.error(e);
  process.exit(1);
});

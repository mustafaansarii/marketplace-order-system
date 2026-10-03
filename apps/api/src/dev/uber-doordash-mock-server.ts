import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. UBER OAUTH & GET ORDER MOCKS (What Uber's API does)

let validToken = 'mock-access-token';

app.post('/oauth/v2/token', (req, res) => {
  const { grant_type } = req.body;
  if (grant_type !== 'client_credentials') {
    res.status(400).json({ error: 'unsupported_grant_type' });
    return;
  }
  res.json({ access_token: validToken, expires_in: 3600, token_type: 'Bearer' });
});

app.get('/v2/eats/order/:id', (req, res) => {
  if (req.headers.authorization !== `Bearer ${validToken}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const fixturePath = path.join(__dirname, '../../../../fixtures/uber/get-order-response.json');
    const data = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    data.id = req.params.id;
    data.placed_at = new Date().toISOString();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read fixture' });
  }
});

// 2. WEBHOOK SIMULATORS (Acts like the marketplace sending to US)

const MARKETPLACE_API = 'http://localhost:3001/webhooks/orders';

app.post('/simulator/trigger/uber', async (req, res) => {
  try {
    const fixturePath = path.join(__dirname, '../../../../fixtures/uber/webhook-orders-notification.json');
    const rawBody = fs.readFileSync(fixturePath, 'utf8');
    
    const payload = JSON.parse(rawBody);
    const newResourceId = crypto.randomUUID();
    payload.event_id = crypto.randomUUID();
    payload.meta.resource_id = newResourceId;
    payload.resource_href = `https://api.uber.com/v2/eats/order/${newResourceId}`;
    const modifiedBody = JSON.stringify(payload);
    
    const secret = config.UBER_CLIENT_SECRET;
    const signature = crypto.createHmac('sha256', secret).update(modifiedBody).digest('hex');

    const response = await fetch(`${MARKETPLACE_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Uber-Signature': signature
      },
      body: modifiedBody
    });

    res.json({ success: true, status: response.status, resource_id: payload.meta.resource_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/simulator/trigger/doordash', async (req, res) => {
  try {
    const fixturePath = path.join(__dirname, '../../../../fixtures/doordash/webhook-order-create.json');
    const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    payload.order.id = crypto.randomUUID();
    payload.order.estimated_pickup_time = new Date().toISOString();

    const token = config.DOORDASH_WEBHOOK_AUTH_TOKEN;

    const response = await fetch(`${MARKETPLACE_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    res.json({ success: true, status: response.status, order_id: payload.order.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Uber/DoorDash Mock & Simulator Server listening on port ${PORT}`);
});

import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { UberGetOrderDto, UberNotificationDto } from './dtos/uber.dto.js';
import { DoorDashWebhookDto } from './dtos/doordash.dto.js';

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

const mockUberDatabase = new Map<string, any>();

app.get('/v2/eats/order/:id', (req, res) => {
  if (req.headers.authorization !== `Bearer ${validToken}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const orderId = req.params.id;
  const existingOrder = mockUberDatabase.get(orderId);
  
  if (existingOrder) {
    res.json(existingOrder);
    return;
  }
  
  res.json(new UberGetOrderDto(orderId));
});

// 2. WEBHOOK SIMULATORS (Acts like the marketplace sending to US)
const MARKETPLACE_API = 'http://localhost:3001/webhooks/orders';

app.post('/simulator/trigger/uber', async (req, res) => {
  try {
    const notificationDto = new UberNotificationDto();
    const resourceId = notificationDto.meta.resource_id;
    
    // Store matching GET DTO in mock DB
    mockUberDatabase.set(resourceId, new UberGetOrderDto(resourceId));
    
    const modifiedBody = JSON.stringify(notificationDto);
    
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

    res.json({ success: true, status: response.status, resource_id: resourceId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/simulator/trigger/doordash', async (req, res) => {
  try {
    const payload = new DoorDashWebhookDto();

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

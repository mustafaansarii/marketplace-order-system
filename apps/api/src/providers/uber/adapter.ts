import { ProviderAdapter, IngestOutcome } from '../types.js';
import { IncomingHttpHeaders } from 'http';
import { verifyUberSignature } from './verify-signature.js';
import { UberNotificationSchema, UberGetOrderSchema } from './schema.js';
import { UberClient } from './client.js';
import { OrderRepository } from '../../db/order-repository.js';
import { mapUberOrder } from './mapper.js';
import { PayloadValidationError, UpstreamError } from '../../http/errors.js';
import * as crypto from 'crypto';

export class UberAdapter implements ProviderAdapter {
  id = 'uber' as const;

  constructor(
    private clientSecret: string,
    private client: UberClient,
    private repo: OrderRepository
  ) {}

  matches(payload: unknown): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'event_type' in payload &&
      'event_id' in payload &&
      'meta' in payload
    );
  }

  authenticate(input: { rawBody: Buffer; headers: IncomingHttpHeaders }): void {
    const signature = input.headers['x-uber-signature'];
    verifyUberSignature(
      this.clientSecret,
      input.rawBody,
      Array.isArray(signature) ? signature[0] : signature
    );
  }

  async handle(payload: unknown): Promise<IngestOutcome> {
    const parsed = UberNotificationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new PayloadValidationError('Uber payload schema mismatch');
    }

    const anyPayload = payload as any;
    const resourceId = anyPayload.meta?.resource_id;

    if (!resourceId) {
      console.log(`Skipping Uber event ${anyPayload.event_type} (no resource_id)`);
      return { type: 'ignored' };
    }

    if (anyPayload.event_type !== 'orders.notification' && 
        anyPayload.event_type !== 'orders.cancel' && 
        anyPayload.event_type !== 'orders.failure') {
      console.log(`Skipping unsupported Uber event ${anyPayload.event_type}`);
      return { type: 'ignored' };
    }

    const fetchedOrderRaw = await this.client.getOrder(resourceId);
    
    const parsedOrder = UberGetOrderSchema.safeParse(fetchedOrderRaw);
    if (!parsedOrder.success) {
      throw new PayloadValidationError('Uber Get Order response schema mismatch');
    }

    if (parsedOrder.data.id !== resourceId) {
      throw new UpstreamError(`Uber resource ID mismatch. Expected ${resourceId}, got ${parsedOrder.data.id}`);
    }

    const draft = mapUberOrder(parsed.data, parsedOrder.data);
    const generatedId = crypto.randomUUID();
    
    const internalId = await this.repo.upsertFromMarketplace(draft, generatedId);

    return { type: 'upserted', internalId };
  }

  ack(outcome: IngestOutcome): { status: number; body?: unknown } {
    return { status: 200, body: '' };
  }
}


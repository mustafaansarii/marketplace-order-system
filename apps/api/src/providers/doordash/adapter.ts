import { ProviderAdapter, IngestOutcome } from '../types.js';
import { IncomingHttpHeaders } from 'http';
import { verifyDoorDashToken } from './verify-token.js';
import { DoorDashWebhookSchema } from './schema.js';
import { OrderRepository } from '../../db/order-repository.js';
import { mapDoorDashOrder } from './mapper.js';
import { PayloadValidationError } from '../../http/errors.js';
import * as crypto from 'crypto';

export class DoorDashAdapter implements ProviderAdapter {
  id = 'doordash' as const;

  constructor(
    private expectedToken: string,
    private authHeaderName: string,
    private defaultCurrency: string,
    private repo: OrderRepository
  ) {}

  matches(payload: unknown): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'event' in payload &&
      (payload as any).event?.type === 'OrderCreate' &&
      'order' in payload
    );
  }

  authenticate(input: { rawBody: Buffer; headers: IncomingHttpHeaders }): void {
    const providedToken = input.headers[this.authHeaderName.toLowerCase()];
    verifyDoorDashToken(
      this.expectedToken,
      Array.isArray(providedToken) ? providedToken[0] : providedToken
    );
  }

  async handle(payload: unknown): Promise<IngestOutcome> {
    const parsed = DoorDashWebhookSchema.safeParse(payload);
    if (!parsed.success) {
      throw new PayloadValidationError('DoorDash payload schema mismatch');
    }

    const draft = mapDoorDashOrder(parsed.data, payload, Date.now(), this.defaultCurrency);
    const generatedId = crypto.randomUUID();

    const internalId = await this.repo.upsertFromMarketplace(draft, generatedId);

    return { type: 'upserted', internalId };
  }

  ack(outcome: IngestOutcome): { status: number; body?: unknown } {
    if (outcome.type === 'upserted') {
      return {
        status: 200,
        body: {
          merchant_supplied_id: outcome.internalId,
          order_status: 'success'
        }
      };
    }
    return { status: 200, body: { order_status: 'success' } };
  }
}


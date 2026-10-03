import { ProviderAdapter, IngestOutcome } from '../types.js';
import { IncomingHttpHeaders } from 'http';
import { verifyDoorDashToken } from './verify-token.js';
import { DoorDashWebhookSchema } from './schema.js';
import { mapDoorDashOrder } from './mapper.js';
import { PayloadValidationError } from '../../domain/errors.js';

export class DoorDashAdapter implements ProviderAdapter {
  id = 'doordash' as const;

  constructor(
    private expectedToken: string,
    private authHeaderName: string,
    private defaultCurrency: string
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
    return { type: 'draft', draft };
  }

  ack(outcome: IngestOutcome, internalId?: string): { status: number; body?: unknown } {
    if (outcome.type === 'draft' && internalId) {
      return {
        status: 200,
        body: {
          merchant_supplied_id: internalId,
          order_status: 'success'
        }
      };
    }
    return { status: 200, body: { order_status: 'success' } };
  }
}

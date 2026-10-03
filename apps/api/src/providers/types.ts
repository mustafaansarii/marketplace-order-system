import { IncomingHttpHeaders } from 'http';
import { OrderDraft } from '../domain/order.js';

export type IngestOutcome = 
  | { type: 'draft'; draft: OrderDraft }
  | { type: 'deferred'; process: () => Promise<OrderDraft> }
  | { type: 'ignored' };

export interface ProviderAdapter {
  id: 'uber' | 'doordash';
  matches(payload: unknown): boolean;
  authenticate(input: { rawBody: Buffer; headers: IncomingHttpHeaders }): void;
  handle(payload: unknown): Promise<IngestOutcome>;
  ack(outcome: IngestOutcome, internalId?: string): { status: number; body?: unknown };
}

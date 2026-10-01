import { IncomingHttpHeaders } from 'http';

export type IngestOutcome = 
  | { type: 'upserted'; internalId: string }
  | { type: 'ignored' };

export interface ProviderAdapter {
  id: 'uber' | 'doordash';
  matches(payload: unknown): boolean;
  authenticate(input: { rawBody: Buffer; headers: IncomingHttpHeaders }): void;
  handle(payload: unknown): Promise<IngestOutcome>;
  ack(outcome: IngestOutcome): { status: number; body?: unknown };
}


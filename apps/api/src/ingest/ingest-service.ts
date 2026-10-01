import { IncomingHttpHeaders } from 'http';
import { ProviderAdapter } from '../providers/types.js';
import { UnrecognizedPayloadError } from '../http/errors.js';

export class IngestService {
  constructor(private adapters: ProviderAdapter[]) {}

  async processWebhook(input: { rawBody: Buffer; headers: IncomingHttpHeaders }): Promise<{ status: number; body?: unknown }> {
    let payload: unknown;
    try {
      payload = JSON.parse(input.rawBody.toString('utf8'));
    } catch (e) {
      throw new UnrecognizedPayloadError('Invalid JSON');
    }

    const adapter = this.adapters.find(a => a.matches(payload));
    if (!adapter) {
      throw new UnrecognizedPayloadError();
    }

    adapter.authenticate(input);

    const outcome = await adapter.handle(payload);
    return adapter.ack(outcome);
  }
}


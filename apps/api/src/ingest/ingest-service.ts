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

    const matchingAdapters = this.adapters.filter(a => a.matches(payload));
    
    if (matchingAdapters.length === 0) {
      throw new UnrecognizedPayloadError();
    }
    
    if (matchingAdapters.length > 1) {
      throw new UnrecognizedPayloadError('Payload matched multiple providers (ambiguous)');
    }
    
    const adapter = matchingAdapters[0]!;

    adapter.authenticate(input);

    const outcome = await adapter.handle(payload);
    return adapter.ack(outcome);
  }
}


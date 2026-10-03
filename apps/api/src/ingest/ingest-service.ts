import { IncomingHttpHeaders } from 'http';
import { ProviderAdapter } from '../providers/types.js';
import { UnrecognizedPayloadError } from '../domain/errors.js';
import { OrderService } from '../services/order-service.js';

export class IngestService {
  constructor(private adapters: ProviderAdapter[], private orderService: OrderService) {}

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
    
    if (outcome.type === 'draft') {
      const internalId = await this.orderService.ingestDraft(outcome.draft);
      return adapter.ack(outcome, internalId);
    }
    
    if (outcome.type === 'deferred') {
      // Run in background with retry
      this.runBackgroundProcess(outcome.process, 3).catch(err => {
        console.error(`[Background Task] Failed to process deferred webhook after retries:`, err);
      });
      return adapter.ack(outcome);
    }
    
    return adapter.ack(outcome);
  }
  
  private async runBackgroundProcess(process: () => Promise<any>, retries: number): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const draft = await process();
        await this.orderService.ingestDraft(draft);
        console.log(`[Background Task] Successfully saved deferred order`);
        return;
      } catch (err) {
        console.error(`[Background Task] Attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw err;
        }
      }
    }
  }
}

import { OrderRepository } from '../db/order-repository.js';
import { OrderDraft } from '../domain/order.js';
import { ListQuery } from '../shared/index.js';
import { randomUUID } from 'crypto';
import { canAdvance, nextStatus } from '../domain/order-status.js';

export class OrderService {
  constructor(private repo: OrderRepository) {}

  async list(query: ListQuery) {
    const result = await this.repo.list(query);
    return {
      ...result,
      items: result.items.map(item => ({
        ...item,
        can_advance: canAdvance(item.status as any),
        next_status: nextStatus(item.status as any)
      }))
    };
  }

  async get(id: string) {
    const order = await this.repo.findById(id);
    if (order) {
      return {
        ...order,
        can_advance: canAdvance(order.status as any),
        next_status: nextStatus(order.status as any)
      };
    }
    return undefined;
  }

  async advance(id: string) {
    const order = await this.repo.advanceStatus(id);
    return {
      ...order,
      can_advance: canAdvance(order.status as any),
      next_status: nextStatus(order.status as any)
    };
  }

  async ingestDraft(draft: OrderDraft): Promise<string> {
    const id = randomUUID();
    return this.repo.upsertFromMarketplace(draft, id);
  }
}

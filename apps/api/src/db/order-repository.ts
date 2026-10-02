import mysql from 'mysql2/promise';
import { Order, OrderStatus, STATUS_RANK, ListQuery, OrderSummary } from '@marketplace/shared';
import { OrderDraft } from '../domain/order.js';
import { OrderNotFoundError, InvalidStatusTransitionError, ConcurrentUpdateError } from '../http/errors.js';

export class OrderRepository {
  constructor(private db: mysql.Pool) {}

  async upsertFromMarketplace(draft: OrderDraft, generatedId: string): Promise<string> {
    await this.db.query(
      `
        INSERT INTO orders (
          id, provider, external_order_id, status, customer_name, customer_phone,
          line_items, total_cents, currency, created_at, updated_at, raw_payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          customer_name = VALUES(customer_name),
          customer_phone = VALUES(customer_phone),
          line_items = VALUES(line_items),
          total_cents = VALUES(total_cents),
          currency = VALUES(currency),
          updated_at = VALUES(updated_at),
          raw_payload = VALUES(raw_payload),
          status = CASE 
            WHEN VALUES(status) = 'cancelled' THEN 'cancelled'
            WHEN status = 'cancelled' THEN 'cancelled'
            WHEN FIELD(VALUES(status), 'new', 'accepted', 'preparing', 'ready', 'completed') > 
                 FIELD(status, 'new', 'accepted', 'preparing', 'ready', 'completed') THEN VALUES(status)
            ELSE status
          END
      `,
      [
        generatedId,
        draft.provider,
        draft.external_order_id,
        draft.status,
        draft.customer.name,
        draft.customer.phone,
        JSON.stringify(draft.line_items),
        draft.total_cents,
        draft.currency,
        new Date(draft.created_at),
        new Date(),
        JSON.stringify(draft.raw_payload)
      ]
    );

    const [rows] = await this.db.query<any[]>(
      `SELECT id FROM orders WHERE provider = ? AND external_order_id = ?`,
      [draft.provider, draft.external_order_id]
    );

    return rows[0].id;
  }

  async list(query: ListQuery): Promise<{ items: OrderSummary[]; next_cursor?: string; total_count: number }> {
    const { conditions: baseConditions, params: baseParams } = this.buildBaseFilters(query);
    const whereBase = baseConditions.length > 0 ? `WHERE ${baseConditions.join(' AND ')}` : '';

    const [countRows] = await this.db.query<any[]>(
      `SELECT COUNT(*) AS count FROM orders ${whereBase}`,
      baseParams
    );

    const totalCount = countRows[0]?.count ?? 0;
    const conditions = [...baseConditions];
    const params = [...baseParams];

    const sortDirection = query.sort === 'time_asc' ? 'ASC' : 'DESC';
    const cursorOperator = sortDirection === 'ASC' ? '>' : '<';

    this.addCursorFilter(conditions, params, query.cursor, cursorOperator);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit ?? 50;

    const [rows] = await this.db.query<any[]>(
      `
        SELECT id, provider, external_order_id, status, customer_name, customer_phone,
               line_items, total_cents, currency, created_at
        FROM orders
        ${where}
        ORDER BY created_at ${sortDirection}, id ${sortDirection}
        LIMIT ?
      `,
      [...params, limit + 1]
    );

    const hasMore = rows.length > limit;
    if (hasMore) {
      rows.pop();
    }

    const items = rows.map(this.toOrderSummary);
    const nextCursor = hasMore && items.length > 0 ? this.createCursor(items[items.length - 1]!) : undefined;

    return { items, next_cursor: nextCursor, total_count: totalCount };
  }

  async advanceStatus(id: string): Promise<Order> {
    const currentOrder = await this.findById(id);

    if (!currentOrder) {
      throw new OrderNotFoundError();
    }

    const statusFlow = [
      OrderStatus.NEW,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED
    ];

    const currentIndex = statusFlow.indexOf(currentOrder.status as OrderStatus);

    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
      throw new InvalidStatusTransitionError();
    }

    const nextStatus = statusFlow[currentIndex + 1];

    const [result] = await this.db.query<mysql.ResultSetHeader>(
      `UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?`,
      [nextStatus, new Date(), id, currentOrder.status]
    );

    if (result.affectedRows === 0) {
      throw new ConcurrentUpdateError();
    }

    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Order | undefined> {
    const [rows] = await this.db.query<any[]>(
      `SELECT * FROM orders WHERE id = ?`,
      [id]
    );

    const order = rows[0];

    if (!order) {
      return undefined;
    }

    return this.toOrder(order);
  }

  // -------------------------Helper methods-----------------------


  private buildBaseFilters(query: ListQuery): { conditions: string[]; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query.provider) {
      conditions.push('provider = ?');
      params.push(query.provider);
    }

    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    if (query.q) {
      const searchTerm = query.q.replace(/[%_]/g, '\\$&');
      conditions.push('(customer_name LIKE ? OR external_order_id LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    return { conditions, params };
  }

  private addCursorFilter(conditions: string[], params: any[], cursor: string | undefined, operator: string): void {
    if (!cursor) {
      return;
    }

    const [cursorTime, cursorId] = cursor.split('|');

    if (cursorTime && cursorId) {
      conditions.push(`(created_at ${operator} ? OR (created_at = ? AND id ${operator} ?))`);
      params.push(cursorTime, cursorTime, cursorId);
    }
  }

  private toOrderSummary(row: any): OrderSummary {
    return {
      id: row.id,
      provider: row.provider,
      external_order_id: row.external_order_id,
      status: row.status,
      customer: {
        name: row.customer_name,
        phone: row.customer_phone
      },
      line_items: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : row.line_items,
      total_cents: row.total_cents,
      currency: row.currency,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
  }

  private createCursor(order: OrderSummary): string {
    return `${order.created_at}|${order.id}`;
  }

  private toOrder(row: any): Order {
    return {
      id: row.id,
      provider: row.provider,
      external_order_id: row.external_order_id,
      status: row.status,
      customer: {
        name: row.customer_name,
        phone: row.customer_phone
      },
      line_items: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : row.line_items,
      total_cents: row.total_cents,
      currency: row.currency,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      raw_payload: typeof row.raw_payload === 'string' ? JSON.parse(row.raw_payload) : row.raw_payload
    };
  }
}
import mysql from 'mysql2/promise';

export async function createDbConnection(url: string): Promise<mysql.Pool> {
  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const schema = `
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      provider VARCHAR(50) NOT NULL,
      external_order_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      line_items JSON NOT NULL,
      total_cents INT NOT NULL,
      currency VARCHAR(10) NOT NULL,
      created_at VARCHAR(50) NOT NULL,
      updated_at VARCHAR(50) NOT NULL,
      raw_payload JSON NOT NULL,
      UNIQUE KEY provider_ext_id (provider, external_order_id),
      INDEX idx_created_at_id (created_at, id),
      INDEX idx_status_created_at_id (status, created_at, id),
      INDEX idx_provider_created_at_id (provider, created_at, id)
    )
  `;

  await pool.query(schema);

  return pool;
}

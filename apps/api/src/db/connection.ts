import mysql from 'mysql2/promise';
import fs from 'fs/promises';

export async function createDbConnection(url: string): Promise<mysql.Pool> {
  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const schemaPath = new URL('./schema.sql', import.meta.url).pathname;
  const schema = await fs.readFile(schemaPath, 'utf8');

  await pool.query(schema);

  return pool;
}

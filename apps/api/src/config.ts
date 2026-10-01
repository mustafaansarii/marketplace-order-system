import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  DEFAULT_CURRENCY: z.string().default('USD'),
  UBER_CLIENT_ID: z.string().default('mock-client-id'),
  UBER_CLIENT_SECRET: z.string().default('mock-client-secret'),
  UBER_AUTH_URL: z.string().default('http://localhost:3002/oauth/v2/token'),
  UBER_API_BASE_URL: z.string().default('http://localhost:3002'),
  UBER_SCOPE: z.string().default('eats.order'),
  DOORDASH_WEBHOOK_AUTH_TOKEN: z.string().default('mock-dd-token'),
  DOORDASH_WEBHOOK_AUTH_HEADER: z.string().default('authorization'),
});

export const config = ConfigSchema.parse(process.env);


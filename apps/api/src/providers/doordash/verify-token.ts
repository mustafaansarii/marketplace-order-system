import * as crypto from 'crypto';
import { AuthError } from '../../http/errors.js';

export function verifyDoorDashToken(
  expectedToken: string,
  providedToken: string | undefined
): void {
  if (!providedToken) {
    throw new AuthError('Missing DoorDash auth token');
  }

  const cleanProvided = providedToken.replace(/^Bearer\s+/i, '').trim();

  const expectedHash = crypto.createHash('sha256').update(expectedToken).digest();
  const providedHash = crypto.createHash('sha256').update(cleanProvided).digest();

  const isValid = crypto.timingSafeEqual(expectedHash, providedHash);

  if (!isValid) {
    throw new AuthError('Token mismatch');
  }
}


import * as crypto from 'crypto';
import { AuthError } from '../../domain/errors.js';

export function verifyUberSignature(
  secret: string,
  rawBody: Buffer,
  signatureHeader: string | undefined
): void {
  if (!signatureHeader) {
    throw new AuthError('Missing X-Uber-Signature header');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
    
  const lowerSignature = signatureHeader.toLowerCase();

  if (expectedSignature.length !== lowerSignature.length) {
    throw new AuthError('Signature mismatch');
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(lowerSignature, 'utf8')
  );

  if (!isValid) {
    throw new AuthError('Signature mismatch');
  }
}


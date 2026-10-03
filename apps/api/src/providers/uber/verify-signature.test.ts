import { describe, it, expect } from 'vitest';
import { verifyUberSignature } from './verify-signature.js';
import { AuthError } from '../../domain/errors.js';
import * as crypto from 'crypto';

describe('verifyUberSignature', () => {
  const secret = 'test-secret';
  const body = Buffer.from('test-body');
  const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  it('passes for valid signature', () => {
    expect(() => verifyUberSignature(secret, body, validSignature)).not.toThrow();
  });

  it('passes for valid uppercase signature', () => {
    expect(() => verifyUberSignature(secret, body, validSignature.toUpperCase())).not.toThrow();
  });

  it('throws AuthError for missing signature', () => {
    expect(() => verifyUberSignature(secret, body, undefined)).toThrow(AuthError);
  });

  it('throws AuthError for invalid signature length', () => {
    expect(() => verifyUberSignature(secret, body, 'short')).toThrow(AuthError);
  });

  it('throws AuthError for wrong signature', () => {
    const wrongSignature = crypto.createHmac('sha256', secret).update(Buffer.from('wrong')).digest('hex');
    expect(() => verifyUberSignature(secret, body, wrongSignature)).toThrow(AuthError);
  });
});

import { describe, it, expect } from 'vitest';
import { verifyDoorDashToken } from './verify-token.js';
import { AuthError } from '../../domain/errors.js';

describe('verifyDoorDashToken', () => {
  const expectedToken = 'valid-token';

  it('passes for valid token', () => {
    expect(() => verifyDoorDashToken(expectedToken, 'valid-token')).not.toThrow();
  });

  it('passes for valid Bearer token', () => {
    expect(() => verifyDoorDashToken(expectedToken, 'Bearer valid-token')).not.toThrow();
  });

  it('throws AuthError for missing token', () => {
    expect(() => verifyDoorDashToken(expectedToken, undefined)).toThrow(AuthError);
  });

  it('throws AuthError for invalid token', () => {
    expect(() => verifyDoorDashToken(expectedToken, 'wrong-token')).toThrow(AuthError);
    expect(() => verifyDoorDashToken(expectedToken, 'Bearer wrong-token')).toThrow(AuthError);
  });
});

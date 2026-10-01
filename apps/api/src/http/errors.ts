export class UnrecognizedPayloadError extends Error {
  constructor(message = 'Payload not recognized as any known provider') {
    super(message);
    this.name = 'UnrecognizedPayloadError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

export class PayloadValidationError extends Error {
  constructor(message = 'Payload failed schema validation') {
    super(message);
    this.name = 'PayloadValidationError';
  }
}

export class UpstreamError extends Error {
  constructor(message = 'Upstream API error') {
    super(message);
    this.name = 'UpstreamError';
  }
}


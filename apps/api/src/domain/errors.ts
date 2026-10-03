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

export class OrderNotFoundError extends Error {
  constructor(message = 'Order not found') {
    super(message);
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(message = 'Cannot advance from terminal or unknown status') {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class ConcurrentUpdateError extends Error {
  constructor(message = 'Conflict: Status was changed by another process') {
    super(message);
    this.name = 'ConcurrentUpdateError';
  }
}

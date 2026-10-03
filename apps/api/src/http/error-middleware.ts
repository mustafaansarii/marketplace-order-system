import { Request, Response, NextFunction } from 'express';
import {
  UnrecognizedPayloadError,
  AuthError,
  PayloadValidationError,
  UpstreamError,
  OrderNotFoundError,
  InvalidStatusTransitionError,
  ConcurrentUpdateError
} from '../domain/errors.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (err instanceof UnrecognizedPayloadError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof AuthError) {
    res.status(401).json({ error: err.message });
    return;
  }
  if (err instanceof PayloadValidationError || err instanceof InvalidStatusTransitionError) {
    res.status(422).json({ error: err.message });
    return;
  }
  if (err instanceof OrderNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof ConcurrentUpdateError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof UpstreamError) {
    res.status(502).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
}

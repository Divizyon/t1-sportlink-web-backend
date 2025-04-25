import { Response } from 'express';
import { UnauthorizedError, ValidationError, NotFoundError } from '../errors/customErrors';
import logger from './logger';

export const handleError = (error: Error, res: Response): void => {
  logger.error(`Error: ${error.message}`);

  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      status: 'error',
      message: error.message
    });
    return;
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}; 
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, BadRequestError } from '../errors/customErrors';
import logger from './logger';

export const handleError = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(`Error: ${error.message}`);

  if (error instanceof UnauthorizedError) {
    res.status(401).json({ message: error.message });
    return;
  }

  if (error instanceof BadRequestError) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}; 
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to validate request using express-validator
 * 
 * @param req Request object
 * @param res Response object
 * @param next Next function
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  
  next();
}; 
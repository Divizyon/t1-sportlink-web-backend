import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    lastReset: number;
  };
}

const ipLimitStore: RateLimitStore = {};

/**
 * Basic rate limiter middleware to prevent brute force attacks
 * @param maxRequests Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export const rateLimit = (maxRequests: number = 100, windowMs: number = 60 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Initialize or reset if window has expired
    if (!ipLimitStore[ip] || now - ipLimitStore[ip].lastReset > windowMs) {
      ipLimitStore[ip] = {
        count: 1,
        lastReset: now,
      };
      return next();
    }
    
    // Increment count
    ipLimitStore[ip].count += 1;
    
    // Check if over limit
    if (ipLimitStore[ip].count > maxRequests) {
      return res.status(429).json({
        status: 'error',
        message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.'
      });
    }
    
    next();
  };
}; 
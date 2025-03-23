import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import * as userService from '../services/userService';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userProfile?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Get token from the Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    // 2) Verify token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    // 3) Check if user still exists in our custom users table
    const userProfile = await userService.findUserById(data.user.id);
    
    if (!userProfile) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu kullanıcı artık mevcut değil.'
      });
    }

    // 4) Grant access to protected route
    req.user = data.user;
    req.userProfile = userProfile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Kimlik doğrulama başarısız oldu.'
    });
  }
};

// Middleware to restrict access to certain roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user has required role
    if (!req.userProfile || !roles.includes(req.userProfile.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için yetkiniz yok.'
      });
    }

    next();
  };
}; 
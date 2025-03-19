import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';

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

    // 3) Check if user still exists
    // This is handled by Supabase automatically

    // 4) Grant access to protected route
    req.user = data.user;
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
        });
      }

      // Get user role from the database
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !data) {
        return res.status(401).json({
          status: 'error',
          message: 'Kullanıcı bulunamadı.'
        });
      }

      // Check if user role is allowed
      if (!roles.includes(data.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Bu işlemi gerçekleştirmek için yetkiniz yok.'
        });
      }

      next();
    } catch (error) {
      console.error('Role restriction error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Yetkilendirme sırasında bir hata oluştu.'
      });
    }
  };
};

// Add user property to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
} 
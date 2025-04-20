import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import * as userService from '../services/userService';
import logger from '../utils/logger';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userProfile?: any;
      userId?: string;
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

    // GEÇİCİ ÇÖZÜM: Kullanıcı profilini kontrol etmeyi atlıyoruz
    // Supabase Auth'daki kullanıcı bilgilerini direkt olarak kullanacağız
    logger.info(`Token doğrulandı, kullanıcı ID: ${data.user.id}`);
    
    // Kullanıcı bilgilerini profil tablosundan almayı deniyoruz
    // ama bulunamazsa bile devam ediyoruz
    const userProfile = await userService.findUserById(data.user.id);
    
    // 4) Grant access to protected route
    req.user = data.user;
    req.userId = data.user.id;
    req.userProfile = userProfile || {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata?.first_name || 'Test',
      last_name: data.user.user_metadata?.last_name || 'User',
      role: 'USER'
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Kimlik doğrulama başarısız oldu.'
    });
  }
};

/**
 * Opsiyonel kimlik doğrulama middleware'i
 * Eğer token varsa kullanıcıyı doğrular ve req.user'a atar,
 * yoksa işlemi kesintiye uğratmadan devam eder.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Token'ı al
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa, isteği doğrudan ilerlet
    if (!token) {
      logger.info('Token bulunamadı, misafir kullanıcı olarak devam ediliyor');
      return next();
    }

    // 2) Token'ı doğrula
    const { data, error } = await supabase.auth.getUser(token);

    // Token geçersizse, isteği doğrudan ilerlet
    if (error || !data.user) {
      logger.info('Geçersiz token, misafir kullanıcı olarak devam ediliyor');
      return next();
    }

    // Kullanıcı bilgilerini profil tablosundan almayı deniyoruz
    // ama bulunamazsa bile devam ediyoruz
    const userProfile = await userService.findUserById(data.user.id);
    
    // Kullanıcı bilgilerini request'e ekle
    req.user = data.user;
    req.userId = data.user.id;
    req.userProfile = userProfile || {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata?.first_name || 'Test',
      last_name: data.user.user_metadata?.last_name || 'User',
      role: 'USER'
    };
    
    logger.info(`Kullanıcı doğrulandı, ID: ${data.user.id}`);
    next();
  } catch (error) {
    // Hata durumunda bile isteği ilerlet
    logger.error('Opsiyonel kimlik doğrulama hatası:', error);
    next();
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

// Admin yetkisi kontrolü yapan middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Önce kullanıcının giriş yapmış olduğunu kontrol et
  if (!req.userProfile) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
    });
  }
  
  // Kullanıcının admin rolüne sahip olup olmadığını kontrol et
  if (req.userProfile.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız.'
    });
  }
  
  // Eğer admin yetkisine sahipse, bir sonraki middleware'e veya route handler'a geç
  next();
}; 
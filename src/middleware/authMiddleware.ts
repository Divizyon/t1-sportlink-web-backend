import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import * as userService from '../services/userService';
import { User } from '../models/User';
import logger from '../utils/logger';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userProfile?: User;
      userId?: string;
    }
  }
}

type DefaultUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  created_at: string;
  updated_at: string;
};

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
      logger.error('Token bulunamadı');
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    // 2) Verify token
    logger.info('Token doğrulanıyor...');
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.error('Token doğrulama hatası:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    if (!data.user) {
      logger.error('Token geçerli ama kullanıcı bulunamadı');
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    logger.info(`Token doğrulandı, kullanıcı ID: ${data.user.id}`);
    
    // Kullanıcı bilgilerini profil tablosundan almayı deniyoruz
    logger.info('Kullanıcı profili aranıyor...');
    const userProfile = await userService.findUserById(data.user.id);
    
    if (!userProfile) {
      logger.warn('Kullanıcı profili bulunamadı, varsayılan profil kullanılacak');
    } else {
      logger.info('Kullanıcı profili bulundu:', {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role
      });
    }

    // 4) Grant access to protected route
    req.user = data.user;
    req.userId = data.user.id;
    const defaultUser: DefaultUser = {
      id: data.user.id,
      email: data.user.email || '',
      first_name: data.user.user_metadata?.first_name || 'Test',
      last_name: data.user.user_metadata?.last_name || 'User',
      role: (userProfile?.role || 'USER') as 'ADMIN' | 'STAFF' | 'USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    req.userProfile = userProfile || defaultUser;
    
    logger.info('Kullanıcı yetkilendirildi:', {
      id: req.userProfile.id,
      email: req.userProfile.email,
      role: req.userProfile.role
    });
    
    next();
  } catch (error) {
    logger.error('Auth middleware hatası:', error);
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
    const defaultUser: DefaultUser = {
      id: data.user.id,
      email: data.user.email || '',
      first_name: data.user.user_metadata?.first_name || 'Test',
      last_name: data.user.user_metadata?.last_name || 'User',
      role: 'USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    req.userProfile = userProfile || defaultUser;
    
    logger.info(`Kullanıcı doğrulandı, ID: ${data.user.id}`);
    next();
  } catch (error) {
    // Hata durumunda bile isteği ilerlet
    logger.error('Opsiyonel kimlik doğrulama hatası:', error);
    next();
  }
};

// Middleware to restrict access to certain roles
export const restrictTo = (...roles: ('ADMIN' | 'STAFF' | 'USER')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userProfile || !roles.includes(req.userProfile.role)) {
      logger.warn(`Yetkisiz erişim denemesi. Kullanıcı rolü: ${req.userProfile?.role}, Gereken roller: ${roles.join(', ')}`);
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
  if (!req.userProfile) {
    logger.warn('Yetkisiz erişim denemesi: Kullanıcı giriş yapmamış');
    return res.status(401).json({
      status: 'error',
      message: 'Lütfen giriş yapın.'
    });
  }

  if (req.userProfile.role !== 'ADMIN') {
    logger.warn(`Yetkisiz admin erişimi denemesi. Kullanıcı rolü: ${req.userProfile.role}`);
    return res.status(403).json({
      status: 'error',
      message: 'Bu işlemi gerçekleştirmek için admin yetkisi gerekiyor.'
    });
  }

  next();
};
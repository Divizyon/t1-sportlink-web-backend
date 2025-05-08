import { Request, Response, NextFunction } from 'express';
import supabase, { supabaseAdmin } from '../config/supabase';
import * as userService from '../services/userService';
import { User } from '../models/User';
import logger from '../utils/logger';
import { getSupabaseForToken } from '../config/supabaseClient';

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
    console.log('##### AUTH MIDDLEWARE BAŞLATILDI #####');
    console.log('Request URL:', req.originalUrl);
    
    // 1) Get token from the Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token bulundu:', token.substring(0, 10) + '...');
    }

    if (!token) {
      console.log('##### TOKEN BULUNAMADI HATASI #####');
      console.log('Headers:', JSON.stringify(req.headers));
      logger.error('Token bulunamadı');
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    // 2) Verify token
    console.log('Token doğrulanıyor...');
    logger.info('Token doğrulanıyor...');
    
    // Supabase client with JWT for RLS and auth
    const supa = getSupabaseForToken(token);
    const { data, error } = await supa.auth.getUser();

    if (error) {
      console.log('##### TOKEN DOĞRULAMA HATASI #####');
      console.log('Hata:', error);
      logger.error('Token doğrulama hatası:', error);
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    if (!data.user) {
      console.log('##### KULLANICI BULUNAMADI HATASI #####');
      logger.error('Token geçerli ama kullanıcı bulunamadı');
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }

    // Kullanıcının durumunu kontrol et
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('status')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.log('##### KULLANICI DURUMU KONTROL HATASI #####');
      console.log('Hata:', userError);
      logger.error('Kullanıcı durumu kontrolü hatası:', userError);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }

    if (userData?.status === 'inactive') {
      console.log('##### KULLANICI İNAKTİF HATASI #####');
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin.' });
    }

    console.log(`Token doğrulandı, kullanıcı ID: ${data.user.id}`);
    logger.info(`Token doğrulandı, kullanıcı ID: ${data.user.id}`);
    
    // Kullanıcı bilgilerini profil tablosundan almayı deniyoruz
    console.log('Kullanıcı profili aranıyor...');
    logger.info('Kullanıcı profili aranıyor...');
    const userProfile = await userService.findUserById(data.user.id);
    
    if (!userProfile) {
      console.log('##### KULLANICI PROFİLİ BULUNAMADI #####');
      logger.warn('Kullanıcı profili bulunamadı, varsayılan profil kullanılacak');
    } else {
      console.log('Kullanıcı profili bulundu:', {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role
      });
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
    
    console.log('##### AUTH MIDDLEWARE TAMAMLANDI #####');
    console.log('req.user atandı:', !!req.user);
    console.log('req.userProfile atandı:', !!req.userProfile);
    
    logger.info('Kullanıcı yetkilendirildi:', {
      id: req.userProfile.id,
      email: req.userProfile.email,
      role: req.userProfile.role
    });
    
    next();
  } catch (error) {
    console.error('##### AUTH MIDDLEWARE HATASI #####');
    console.error('Hata:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    logger.error('Auth middleware hatası:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
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
    
    // Supabase client with JWT for RLS and auth
    const supa = getSupabaseForToken(token);
    const { data: dataOptional, error: errorOptional } = await supa.auth.getUser();

    // Token geçersizse, isteği doğrudan ilerlet
    if (errorOptional || !dataOptional.user) {
      logger.info('Geçersiz token, misafir kullanıcı olarak devam ediliyor');
      return next();
    }

    // Kullanıcının durumunu kontrol et
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('status')
      .eq('id', dataOptional.user.id)
      .single();

    if (userError) {
      logger.error('Kullanıcı durumu kontrolü hatası:', userError);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }

    if (userData?.status === 'inactive') {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin.' });
    }

    // Kullanıcı bilgilerini profil tablosundan almayı deniyoruz
    // ama bulunamazsa bile devam ediyoruz
    const userProfile = await userService.findUserById(dataOptional.user.id);
    
    // Kullanıcı bilgilerini request'e ekle
    req.user = dataOptional.user;
    req.userId = dataOptional.user.id;
    const defaultUser: DefaultUser = {
      id: dataOptional.user.id,
      email: dataOptional.user.email || '',
      first_name: dataOptional.user.user_metadata?.first_name || 'Test',
      last_name: dataOptional.user.user_metadata?.last_name || 'User',
      role: 'USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    req.userProfile = userProfile || defaultUser;
    
    logger.info(`Kullanıcı doğrulandı, ID: ${dataOptional.user.id}`);
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

// Kimlik doğrulama middleware'i - ana route'larda kullanılır
export const authenticate = protect;

// Kimlik doğrulama gerektiren route'lar için
export const requireAuth = protect;

// Admin yetkisi gerektiren route'lar için
export const requireAdmin = isAdmin;

/**
 * URL tabanlı token doğrulama için özel middleware
 * Authorization header veya URL'deki token parametresini kontrol eder
 */
export const urlTokenAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('##### URL TOKEN AUTH MIDDLEWARE BAŞLATILDI #####');
    console.log('Request URL:', req.originalUrl);
    
    // 1) Token'ı iki yerden kontrol et: Authorization header veya URL query parametresi
    let token;
    
    // Önce Header'dan kontrol
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Authorization header\'dan token bulundu');
    } 
    // Header'da yoksa URL'den kontrol
    else if (req.query.token) {
      token = req.query.token as string;
      console.log('URL parametresinden token bulundu');
    }

    if (!token) {
      console.log('##### TOKEN BULUNAMADI HATASI #####');
      console.log('Headers:', JSON.stringify(req.headers));
      logger.error('Token bulunamadı');
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }

    // 2) Token doğrulama - Supabase kullanarak
    try {
      // Supabase client with token
      const supa = getSupabaseForToken(token);
      const { data, error } = await supa.auth.getUser();
      
      if (error || !data.user) {
        logger.warn('Geçersiz token');
        return res.status(401).json({
          status: 'error',
          message: 'Oturumunuz geçersiz veya süresi dolmuş.'
        });
      }
      
      console.log('Token doğrulama başarılı');
      
      // User değerlerini istek nesnesine ekle
      req.user = data.user;
      
      // 3) Kullanıcı hala var mı kontrol et
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, profile_image, role, created_at, updated_at')
        .eq('id', data.user.id)
        .single();
      
      if (userError || !userData) {
        logger.warn('Kullanıcı veritabanında bulunamadı');
        return res.status(401).json({
          status: 'error',
          message: 'Bu kullanıcı artık mevcut değil.'
        });
      }
      
      // UserProfile bilgilerini istek nesnesine ekle (artık tüm gerekli alanları içeriyor)
      req.userProfile = userData;
      
      // Sonraki middleware'e geç
      next();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Token doğrulama hatası: ${error.message}`);
      }
      return res.status(401).json({
        status: 'error',
        message: 'Oturumunuz geçersiz veya süresi dolmuş.'
      });
    }
  } catch (error) {
    logger.error(`Auth middleware hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    return res.status(500).json({
      status: 'error',
      message: 'Kimlik doğrulama sırasında bir hata oluştu.'
    });
  }
};
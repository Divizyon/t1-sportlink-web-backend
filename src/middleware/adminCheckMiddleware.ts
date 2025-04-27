import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger'; // Loglama için logger'ı import edelim

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // userProfile nesnesinin ve role özelliğinin varlığını kontrol et
    // Rolün 'ADMIN' olup olmadığını kontrol et (Büyük/küçük harf duyarlı olabilir, veritabanındaki değere göre ayarlayın)
    if (req.userProfile && req.userProfile.role === 'ADMIN') {
      // Kullanıcı admin ise bir sonraki adıma geç
      next();
    } else {
      // Kullanıcı admin değilse veya userProfile yoksa yetkisiz hatası döndür
      logger.warn(`Admin yetki reddedildi: Kullanıcı ID ${req.userProfile?.id || 'bilinmiyor'}, Rol: ${req.userProfile?.role || 'yok'}`);
      res.status(403).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız.'
      });
    }
  } catch (error) {
    // Beklenmedik bir hata olursa logla ve sunucu hatası döndür
    logger.error('Admin kontrol middleware hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Yetki kontrolü sırasında bir sunucu hatası oluştu.'
    });
  }
}; 
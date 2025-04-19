import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

/**
 * Admin rolü kontrolü middleware
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Kullanıcı ID'sini authMiddleware'den al
    const userId = req.user.id;
    
    // Kullanıcı bilgilerini getir
    const user = await userService.findUserById(userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Yetkilendirme hatası: Kullanıcı bulunamadı.'
      });
    }
    
    // Admin rolünü kontrol et
    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Yetkilendirme hatası: Bu işlem için yönetici yetkiniz yok.'
      });
    }
    
    // Admin ise, sonraki middleware'e devam et
    next();
  } catch (error) {
    console.error('Role middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Yetkilendirme kontrol edilirken bir hata oluştu.'
    });
  }
}; 
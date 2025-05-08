import { Request, Response } from 'express';
import * as warningService from '../services/warningService';
import logger from '../utils/logger';

/**
 * Kullanıcının tüm uyarı mesajlarını getirir
 * @route GET /api/warnings
 */
export const getUserWarnings = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Auth middleware'den gelen kullanıcı ID'si
    
    const warnings = await warningService.getUserWarnings(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        warnings
      }
    });
  } catch (error) {
    logger.error('Kullanıcı uyarıları getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Uyarı mesajları getirilirken bir hata oluştu'
    });
  }
};

/**
 * Uyarı mesajını okundu olarak işaretler
 * @route PATCH /api/warnings/:warningId/read
 */
export const markWarningAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Auth middleware'den gelen kullanıcı ID'si
    const { warningId } = req.params;
    
    const updatedWarning = await warningService.markWarningAsRead(warningId, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        warning: updatedWarning
      }
    });
  } catch (error) {
    logger.error('Uyarı okundu işaretleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Uyarı mesajı okundu işaretlenirken bir hata oluştu'
    });
  }
};

/**
 * Kullanıcının okunmamış uyarı sayısını getirir
 * @route GET /api/warnings/unread/count
 */
export const getUnreadWarningsCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Auth middleware'den gelen kullanıcı ID'si
    
    const { count } = await warningService.getUnreadWarningsCount(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        count
      }
    });
  } catch (error) {
    logger.error('Okunmamış uyarı sayısı getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Okunmamış uyarı sayısı getirilirken bir hata oluştu'
    });
  }
}; 
import { Request, Response, NextFunction } from 'express';
import { SportsService } from '../services/SportsService';
import logger from '../utils/logger';

export const SportsController = {
  async getAllSports(req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.info('SportsController: Tüm spor kategorileri isteği alındı.');
    try {
      const sports = await SportsService.getAllSports();

      res.status(200).json({
        status: 'success',
        message: 'Spor kategorileri başarıyla getirildi.',
        data: sports
      });

    } catch (error) {
      logger.error('SportsController.getAllSports - Hata:', error);
      next(error); // Hata yönetimi için merkezi yere gönder
    }
  }
}; 
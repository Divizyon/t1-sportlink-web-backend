import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/NewsService';
import logger from '../utils/logger';

export const UserNewsController = {
  /**
   * Tüm haberleri getir (filtreleme seçenekleriyle)
   */
  async getAllNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametrelerini alma
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      const newsList = await NewsService.getAllNews({ sportId, limit, offset });
      
      res.status(200).json({
        success: true,
        data: newsList.data,
        count: newsList.count,
        pagination: {
          limit,
          offset,
          totalPages: Math.ceil(newsList.count / limit)
        }
      });
    } catch (error) {
      logger.error('UserNewsController.getAllNews - Hata:', error);
      next(error);
    }
  },

  /**
   * ID'ye göre haber detaylarını getir
   */
  async getNewsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newsId = req.params.id ? parseInt(req.params.id, 10) : undefined;
      
      if (!newsId || isNaN(newsId)) {
        res.status(400).json({ success: false, message: 'Geçersiz haber ID formatı' });
        return;
      }

      const news = await NewsService.getNewsById(newsId);
      
      if (!news) {
        res.status(404).json({ success: false, message: 'Haber bulunamadı' });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: news
      });
    } catch (error) {
      logger.error('UserNewsController.getNewsById - Hata:', error);
      next(error);
    }
  },

  /**
   * Bir spor kategorisine ait son haberleri getir
   */
  async getNewsBySportId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sportId = req.params.sportId ? parseInt(req.params.sportId, 10) : undefined;
      
      if (!sportId || isNaN(sportId)) {
        res.status(400).json({ success: false, message: 'Geçersiz spor kategorisi ID formatı' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      const newsList = await NewsService.getAllNews({ sportId, limit, offset: 0 });
      
      res.status(200).json({
        success: true,
        data: newsList.data,
        count: newsList.count
      });
    } catch (error) {
      logger.error('UserNewsController.getNewsBySportId - Hata:', error);
      next(error);
    }
  },

  /**
   * En son eklenen haberleri getir
   */
  async getLatestNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      
      const newsList = await NewsService.getAllNews({ limit, offset: 0 });
      
      res.status(200).json({
        success: true,
        data: newsList.data
      });
    } catch (error) {
      logger.error('UserNewsController.getLatestNews - Hata:', error);
      next(error);
    }
  }
}; 
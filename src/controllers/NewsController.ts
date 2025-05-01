import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/NewsService';
import logger from '../utils/logger';

export const NewsController = {
  async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Metin alanlarını req.body'den al
      const { 
        title, 
        content, 
        sport_id: sportIdStr,
        type,
        end_time: endTimeStr
      } = req.body;
      
      // Görsel dosyasını req.file'dan al (multer tarafından eklenir)
      const file = req.file;
      
      // Admin kullanıcısının ID'sini req.userProfile'dan al (auth middleware tarafından eklenir)
      const creatorId = req.userProfile?.id;

      // Zorunlu alan kontrolü (başlık, içerik, sport_id)
      if (!title || !content || !sportIdStr) {
        res.status(400).json({ status: 'error', message: `Başlık, içerik ve spor kategorisi ID'si alanları zorunludur.` });
        return;
      }

      // sport_id'yi sayıya çevir ve doğrula
      const sport_id = parseInt(sportIdStr, 10);
      if (isNaN(sport_id)) {
          res.status(400).json({ status: 'error', message: `Spor kategorisi ID'si geçerli bir sayı olmalıdır.` });
          return;
      }

      // end_time eğer varsa tarihe çevir
      let end_time = undefined;
      if (endTimeStr) {
        try {
          end_time = new Date(endTimeStr);
          // Geçerli bir tarih mi kontrol et
          if (isNaN(end_time.getTime())) {
            res.status(400).json({ status: 'error', message: 'Geçersiz tarih formatı (end_time)' });
            return;
          }
        } catch (err) {
          res.status(400).json({ status: 'error', message: 'Geçersiz tarih formatı (end_time)' });
          return;
        }
      }

      // creatorId kontrolü
      if (!creatorId) {
         logger.error('NewsController.createNews: Creator ID bulunamadı!', { userProfile: req.userProfile });
         res.status(401).json({ status: 'error', message: 'Kullanıcı kimliği doğrulanamadı.' });
         return;
      }

      logger.info('NewsController: Haber oluşturma isteği alındı', { 
        title, 
        creatorId, 
        sport_id, 
        type: type || 'default',
        hasFile: !!file 
      });

      // Servis katmanını çağır (güncellenmiş input ile)
      const newNews = await NewsService.createNews({
        title,
        content,
        creatorId,
        sport_id, // Doğrulanmış sayısal ID
        type,
        end_time,
        file
      });

      // Başarılı yanıt
      res.status(201).json({
        status: 'success',
        message: 'Haber başarıyla oluşturuldu.',
        data: newNews
      });

    } catch (error) {
      // Hata yönetimi
      logger.error('NewsController.createNews - Hata:', error);
      next(error);
    }
  },

  async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newsId = req.params.id ? parseInt(req.params.id, 10) : undefined;
      
      if (req.params.id && isNaN(newsId!)) {
        res.status(400).json({ status: 'error', message: 'Geçersiz haber ID formatı' });
        return;
      }

      // Tek bir haberi getir veya tüm haberleri listele
      if (newsId) {
        const news = await NewsService.getNewsById(newsId);
        
        if (!news) {
          res.status(404).json({ status: 'error', message: 'Haber bulunamadı' });
          return;
        }
        
        res.status(200).json({
          status: 'success',
          data: news
        });
      } else {
        // Query parametrelerini alma
        const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
        
        const newsList = await NewsService.getAllNews({ sportId, limit, offset });
        
        res.status(200).json({
          status: 'success',
          data: newsList
        });
      }
    } catch (error) {
      logger.error('NewsController.getNews - Hata:', error);
      next(error);
    }
  },

  async updateNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newsId = parseInt(req.params.id, 10);
      
      if (isNaN(newsId)) {
        res.status(400).json({ status: 'error', message: 'Geçersiz haber ID formatı' });
        return;
      }
      
      const { 
        title, 
        content, 
        sport_id: sportIdStr,
        type,
        end_time: endTimeStr
      } = req.body;
      
      const file = req.file;
      
      // En az bir alanın güncellenmesi gerekiyor
      if (!title && !content && !sportIdStr && !type && !endTimeStr && !file) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Güncellenecek en az bir alan belirtilmelidir (başlık, içerik, spor kategorisi ID, tür, bitiş tarihi veya görsel)' 
        });
        return;
      }
      
      // sportIdStr varsa, sayıya çevir ve doğrula
      let sport_id;
      if (sportIdStr) {
        sport_id = parseInt(sportIdStr, 10);
        if (isNaN(sport_id)) {
          res.status(400).json({ status: 'error', message: `Spor kategorisi ID'si geçerli bir sayı olmalıdır.` });
          return;
        }
      }
      
      // end_time eğer varsa tarihe çevir
      let end_time = undefined;
      if (endTimeStr) {
        try {
          end_time = new Date(endTimeStr);
          // Geçerli bir tarih mi kontrol et
          if (isNaN(end_time.getTime())) {
            res.status(400).json({ status: 'error', message: 'Geçersiz tarih formatı (end_time)' });
            return;
          }
        } catch (err) {
          res.status(400).json({ status: 'error', message: 'Geçersiz tarih formatı (end_time)' });
          return;
        }
      }
      
      const updatedNews = await NewsService.updateNews({
        id: newsId,
        title,
        content,
        sport_id,
        type,
        end_time,
        file
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Haber başarıyla güncellendi.',
        data: updatedNews
      });
      
    } catch (error) {
      logger.error('NewsController.updateNews - Hata:', error);
      next(error);
    }
  },

  async deleteNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newsId = parseInt(req.params.id, 10);
      
      if (isNaN(newsId)) {
        res.status(400).json({ status: 'error', message: 'Geçersiz haber ID formatı' });
        return;
      }
      
      const result = await NewsService.deleteNews(newsId);
      
      if (!result) {
        res.status(404).json({ status: 'error', message: 'Silinecek haber bulunamadı' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Haber başarıyla silindi.'
      });
      
    } catch (error) {
      logger.error('NewsController.deleteNews - Hata:', error);
      next(error);
    }
  }
}; 
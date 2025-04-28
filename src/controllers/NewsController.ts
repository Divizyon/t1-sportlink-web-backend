import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/NewsService';
import logger from '../utils/logger';

export const NewsController = {
  async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Metin alanlarını req.body'den al
      const { title, content, sport_id: sportIdStr } = req.body;
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

      // creatorId kontrolü
      if (!creatorId) {
         logger.error('NewsController.createNews: Creator ID bulunamadı!', { userProfile: req.userProfile });
         res.status(401).json({ status: 'error', message: 'Kullanıcı kimliği doğrulanamadı.' });
         return;
      }

      logger.info('NewsController: Haber oluşturma isteği alındı', { title, creatorId, sport_id, hasFile: !!file });

      // Servis katmanını çağır (güncellenmiş input ile)
      const newNews = await NewsService.createNews({
        title,
        content,
        creatorId,
        sport_id, // Doğrulanmış sayısal ID
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
  }
}; 
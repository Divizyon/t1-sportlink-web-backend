import { Request, Response } from 'express';
import { mediaService } from '../services/mediaService';

export class MediaController {
  /**
   * Etkinliğe medya dosyası ekler
   */
  async uploadEventMedia(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { mediaType, isCover } = req.body;
      
      // Dosyanın yüklenip yüklenmediğini kontrol et
      if (!req.file) {
        res.status(400).json({ error: 'Dosya bulunamadı' });
        return;
      }
      
      // Dosya tipi kontrolü
      if (mediaType !== 'image' && mediaType !== 'video') {
        res.status(400).json({ error: 'Geçersiz medya tipi. "image" veya "video" olmalıdır.' });
        return;
      }
      
      // Dosya boyutu kontrolü
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (req.file.size > MAX_FILE_SIZE) {
        res.status(400).json({ error: 'Dosya boyutu 10MB\'dan büyük olamaz' });
        return;
      }
      
      const result = await mediaService.uploadEventMedia(
        req.file.buffer,
        req.file.originalname,
        eventId,
        mediaType as 'image' | 'video',
        isCover === 'true' || isCover === true
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Medya yükleme hatası:', error);
      res.status(500).json({ error: 'Medya yüklenirken bir hata oluştu' });
    }
  }
  
  /**
   * Etkinliğe ait tüm medya dosyalarını getirir
   */
  async getEventMedia(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      
      const media = await mediaService.getEventMedia(eventId);
      
      res.status(200).json(media);
    } catch (error) {
      console.error('Medya getirme hatası:', error);
      res.status(500).json({ error: 'Medya getirilirken bir hata oluştu' });
    }
  }
  
  /**
   * Etkinlikten medya dosyasını siler
   */
  async deleteEventMedia(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId } = req.params;
      
      await mediaService.deleteEventMedia(mediaId);
      
      res.status(200).json({ message: 'Medya başarıyla silindi' });
    } catch (error) {
      console.error('Medya silme hatası:', error);
      res.status(500).json({ error: 'Medya silinirken bir hata oluştu' });
    }
  }
}

export default new MediaController(); 
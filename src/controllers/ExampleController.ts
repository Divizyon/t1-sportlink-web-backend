import { Request, Response } from 'express';
import logger from '../utils/logger';

export class ExampleController {
  public async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Örnek bir istek işleniyor', {
        path: req.path,
        method: req.method,
        body: req.body
      });

      // İşlem başarılı
      res.status(200).json({ message: 'İşlem başarılı' });
    } catch (error) {
      logger.error('İstek işlenirken bir hata oluştu', {
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        path: req.path,
        method: req.method
      });
      
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
} 
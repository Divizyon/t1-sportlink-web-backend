import { Request, Response } from 'express';
import { StatisticsService } from '../services/StatisticsService';
import { isValid, parseISO } from 'date-fns';

export const StatisticsController = {
  async getWeeklyStats(req: Request, res: Response): Promise<void> {
    // Query parametrelerini al: startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    const { startDate: startDateStr, endDate: endDateStr } = req.query;

    // Parametrelerin varlığını ve geçerli tarih formatında olup olmadığını kontrol et
    if (typeof startDateStr !== 'string' || typeof endDateStr !== 'string') {
      res.status(400).json({ message: 'Başlangıç (startDate) ve bitiş (endDate) tarihleri zorunludur.' });
      return;
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (!isValid(startDate) || !isValid(endDate)) {
       res.status(400).json({ message: 'Geçersiz tarih formatı. Lütfen YYYY-MM-DD formatını kullanın.' });
       return;
    }

    // Bitiş tarihinin başlangıç tarihinden önce olup olmadığını kontrol et (opsiyonel ama önerilir)
    if (endDate < startDate) {
        res.status(400).json({ message: 'Bitiş tarihi başlangıç tarihinden önce olamaz.' });
        return;
    }


    try {
      const stats = await StatisticsService.getWeeklyStats(startDateStr, endDateStr);
      res.status(200).json(stats);
    } catch (error) {
      // Servis katmanından gelen genel hataları yakala
      console.error('Error in StatisticsController.getWeeklyStats:', error);
      // Gerçek hatayı logla, istemciye genel bir mesaj gönder
      if (error instanceof Error) {
         res.status(500).json({ message: error.message || 'Haftalık istatistikler alınırken bir sunucu hatası oluştu.' });
      } else {
         res.status(500).json({ message: 'Haftalık istatistikler alınırken bilinmeyen bir sunucu hatası oluştu.' });
      }
    }
  },
  // Aylık istatistikler için controller fonksiyonu buraya eklenecek...
  // async getMonthlyStats(req: Request, res: Response) { ... }
  async getMonthlyStats(req: Request, res: Response): Promise<void> {
    // Query parametrelerini al: year=YYYY&month=M veya MM
    const { year: yearStr, month: monthStr } = req.query;

    // Parametrelerin varlığını kontrol et
    if (typeof yearStr !== 'string' || typeof monthStr !== 'string') {
      res.status(400).json({ message: 'Yıl (year) ve ay (month) parametreleri zorunludur.' });
      return;
    }

    // Parametreleri sayıya çevir ve doğrula
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || year < 1970 || year > 2100) { // Makul bir yıl aralığı
       res.status(400).json({ message: 'Geçersiz yıl değeri.' });
       return;
    }

    if (isNaN(month) || month < 1 || month > 12) {
       res.status(400).json({ message: 'Geçersiz ay değeri (1-12 arası olmalı).' });
       return;
    }

    try {
      const stats = await StatisticsService.getMonthlyStats(year, month);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in StatisticsController.getMonthlyStats:', error);
      if (error instanceof Error) {
         // Servisten gelen spesifik hata mesajlarını kullan
         if (error.message.includes('Geçersiz')) { // Örneğin 'Geçersiz ay', 'Geçersiz yıl/ay'
             res.status(400).json({ message: error.message });
         } else {
            res.status(500).json({ message: error.message || 'Aylık istatistikler alınırken bir sunucu hatası oluştu.' });
         }
      } else {
         res.status(500).json({ message: 'Aylık istatistikler alınırken bilinmeyen bir sunucu hatası oluştu.' });
      }
    }
  }
}; 
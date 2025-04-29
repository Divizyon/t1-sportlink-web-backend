import { Request, Response } from 'express';
import { NewsScraperService, NewsStatus } from '../services/NewsScraperService';
import logger from '../utils/logger';
import { supabase } from '../utils/supabaseClient';
import supabaseAdmin from '../utils/supabaseClient';

export class NewsScraperController {
  private newsScraperService: NewsScraperService;
  
  constructor() {
    this.newsScraperService = new NewsScraperService();
  }
  
  /**
   * URL'den haberleri scrape eder ve veritabanına kaydeder
   * @route POST /api/news/scrape
   */
  public scrapeNewsFromUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, sport_id } = req.body;
      
      if (!url) {
        res.status(400).json({ status: 'error', message: 'Haber URL\'si gereklidir' });
        return;
      }
      
      if (!sport_id) {
        res.status(400).json({ status: 'error', message: 'Spor kategorisi ID\'si gereklidir' });
        return;
      }
      
      logger.info('NewsScraperController: URL\'den haber çekme isteği alındı', { url, sport_id });
      
      // Haberleri scrape et (sport_id parametresini de geçiyoruz)
      const scrapedNews = await this.newsScraperService.scrapeNewsFromUrl(url, Number(sport_id));
      
      if (scrapedNews.length === 0) {
        res.status(404).json({ status: 'error', message: 'URL\'den haber bulunamadı' });
        return;
      }
      
      // Haberleri veritabanına kaydet
      const savedNews = await this.newsScraperService.saveScrapedNews(scrapedNews, sport_id);
      
      res.status(201).json({
        status: 'success',
        message: `${savedNews.length} haber başarıyla kaydedildi`,
        data: savedNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.scrapeNewsFromUrl - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Haber scraping sırasında bir hata oluştu'
      });
    }
  };
  
  /**
   * Bekleyen haberleri listeler
   * @route GET /api/news/pending
   */
  public listPendingNews = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pendingNews = await this.newsScraperService.listNewsByStatus(NewsStatus.PENDING);
      
      res.status(200).json({
        status: 'success',
        count: pendingNews.length,
        data: pendingNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.listPendingNews - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Bekleyen haberler listelenirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Onaylanmış haberleri listeler
   * @route GET /api/news/approved
   */
  public listApprovedNews = async (_req: Request, res: Response): Promise<void> => {
    try {
      const approvedNews = await this.newsScraperService.listNewsByStatus(NewsStatus.APPROVED);
      
      res.status(200).json({
        status: 'success',
        count: approvedNews.length,
        data: approvedNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.listApprovedNews - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Onaylanmış haberler listelenirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Tüm haberleri listeler
   * @route GET /api/news/scraped
   */
  public listAllScrapedNews = async (_req: Request, res: Response): Promise<void> => {
    try {
      const allNews = await this.newsScraperService.listNewsByStatus();
      
      res.status(200).json({
        status: 'success',
        count: allNews.length,
        data: allNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.listAllScrapedNews - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Haberler listelenirken bir hata oluştu'
      });
    }
  };
  
  /**
   * Haberi onaylar veya reddeder
   * @route PATCH /api/news/:id/status
   */
  public updateNewsStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      console.log(`Durum güncelleme isteği alındı: ID=${id}, Status=${status}`);
      console.log('Mevcut enum değerleri:', Object.values(NewsStatus));
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ status: 'error', message: 'Geçerli bir haber ID\'si gereklidir' });
        return;
      }
      
      const validStatuses = Object.values(NewsStatus);
      console.log(`Statüs kontrol ediliyor: ${status}, Geçerli değerler: ${validStatuses.join(', ')}`);
      
      if (!status) {
        res.status(400).json({
          status: 'error',
          message: `Durum değeri gereklidir. Olası değerler: ${validStatuses.join(', ')}`
        });
        return;
      }
      
      // String kontrolü ekleyelim
      if (typeof status !== 'string') {
        res.status(400).json({
          status: 'error',
          message: `Durum değeri string olmalıdır. Gönderilen: ${typeof status}`
        });
        return;
      }
      
      // Enum değerlerine göre değil, alınan string değer doğrudan pending, approved, rejected değerlerine mi uyuyor diye kontrol edelim
      const lowerStatus = status.toLowerCase();
      if (!['pending', 'approved', 'rejected', 'scraped'].includes(lowerStatus)) {
        res.status(400).json({
          status: 'error',
          message: `Geçerli bir durum değeri gereklidir. Olası değerler: pending, approved, rejected, scraped`
        });
        return;
      }
      
      logger.info('NewsScraperController: Haber durumu güncelleme isteği alındı', { id, status });
      
      const updatedNews = await this.newsScraperService.updateNewsStatus(Number(id), lowerStatus);
      console.log('Güncelleme yanıtı:', updatedNews);
      
      if (!updatedNews || updatedNews.length === 0) {
        res.status(404).json({ status: 'error', message: 'Haber bulunamadı veya güncellenemedi' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: `Haber durumu '${lowerStatus}' olarak güncellendi`,
        data: updatedNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.updateNewsStatus - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Haber durumu güncellenirken bir hata oluştu'
      });
    }
  };

  /**
   * Reddedilmiş haberleri listeler
   * @route GET /api/news/rejected
   */
  public listRejectedNews = async (_req: Request, res: Response): Promise<void> => {
    try {
      const rejectedNews = await this.newsScraperService.listNewsByStatus(NewsStatus.REJECTED);
      
      res.status(200).json({
        status: 'success',
        count: rejectedNews.length,
        data: rejectedNews
      });
    } catch (error: any) {
      logger.error('NewsScraperController.listRejectedNews - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Reddedilmiş haberler listelenirken bir hata oluştu'
      });
    }
  };

  /**
   * Belirli bir haberi siler
   * @route DELETE /api/news/:id
   */
  public deleteNews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ status: 'error', message: 'Geçerli bir haber ID\'si gereklidir' });
        return;
      }
      
      logger.info('NewsScraperController: Haber silme isteği alındı', { id });
      
      const { data, error } = await supabaseAdmin
        .from('News')
        .delete()
        .eq('id', Number(id))
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        res.status(404).json({ status: 'error', message: 'Haber bulunamadı veya silinemedi' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Haber başarıyla silindi',
        data
      });
    } catch (error: any) {
      logger.error('NewsScraperController.deleteNews - Hata:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Haber silinirken bir hata oluştu'
      });
    }
  };

  /**
   * Belirli durumdaki haberlerin sayısını getirir
   * @param req Express request
   * @param res Express response
   */
  public getNewsCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      
      // Status parametresi string olmalı, eğer değilse undefined olarak bırak
      const statusParam = typeof status === 'string' ? status : undefined;
      
      console.log(`Haber sayısı isteniyor, durum filtresi: ${statusParam || 'tümü'}`);
      
      const count = await this.newsScraperService.getNewsCount(statusParam);
      
      console.log(`Toplam ${count} haber bulundu (durum: ${statusParam || 'tümü'})`);
      
      res.status(200).json({
        status: 'success',
        count,
        data: { count }
      });
    } catch (error: any) {
      console.error('Haber sayısı alınırken hata oluştu:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Haber sayısı alınamadı',
        error: error.message
      });
    }
  };
} 
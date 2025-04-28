import { Request, Response } from 'express';
import { NewsScraperService } from '../services/NewsScraperService';
import { NewsStatus } from '../types/News';
import logger from '../utils/logger';
import { supabase } from '../utils/supabaseClient';

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
      
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ status: 'error', message: 'Geçerli bir haber ID\'si gereklidir' });
        return;
      }
      
      if (!status || !Object.values(NewsStatus).includes(status as NewsStatus)) {
        res.status(400).json({
          status: 'error',
          message: `Geçerli bir durum değeri gereklidir. Olası değerler: ${Object.values(NewsStatus).join(', ')}`
        });
        return;
      }
      
      logger.info('NewsScraperController: Haber durumu güncelleme isteği alındı', { id, status });
      
      const updatedNews = await this.newsScraperService.updateNewsStatus(Number(id), status);
      
      if (!updatedNews || updatedNews.length === 0) {
        res.status(404).json({ status: 'error', message: 'Haber bulunamadı veya güncellenemedi' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: `Haber durumu '${status}' olarak güncellendi`,
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
      
      const { data, error } = await supabase
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
} 
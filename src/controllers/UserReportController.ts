import { Request, Response, NextFunction } from 'express';
import UserReportService from '../services/UserReportService';
import logger from '../utils/logger';

export const UserReportController = {
  /**
   * Bir kullanıcıyı raporla
   */
  async reportUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reporterId = req.user?.id;
      const { reportedId, reason } = req.body;
      
      if (!reporterId) {
        res.status(401).json({
          success: false,
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız'
        });
        return;
      }
      
      if (!reportedId) {
        res.status(400).json({
          success: false,
          message: 'Raporlanacak kullanıcı ID\'si gereklidir'
        });
        return;
      }
      
      if (!reason || reason.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Rapor sebebi gereklidir'
        });
        return;
      }
      
      // Kullanıcı kendini raporlayamaz
      if (reporterId === reportedId) {
        res.status(400).json({
          success: false,
          message: 'Kendinizi raporlayamazsınız'
        });
        return;
      }
      
      const report = await UserReportService.reportUser(reporterId, reportedId, reason);
      
      res.status(201).json({
        success: true,
        message: 'Rapor başarıyla oluşturuldu',
        data: report
      });
    } catch (error) {
      logger.error('UserReportController.reportUser - Hata:', error);
      next(error);
    }
  },
  
  /**
   * Bir etkinliği raporla
   */
  async reportEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reporterId = req.user?.id;
      const { eventId, reason } = req.body;
      
      if (!reporterId) {
        res.status(401).json({
          success: false,
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız'
        });
        return;
      }
      
      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Raporlanacak etkinlik ID\'si gereklidir'
        });
        return;
      }
      
      if (!reason || reason.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Rapor sebebi gereklidir'
        });
        return;
      }
      
      const report = await UserReportService.reportEvent(reporterId, eventId, reason);
      
      res.status(201).json({
        success: true,
        message: 'Etkinlik raporu başarıyla oluşturuldu',
        data: report
      });
    } catch (error) {
      logger.error('UserReportController.reportEvent - Hata:', error);
      next(error);
    }
  },
  
  /**
   * Kullanıcının kendi raporlarını getir
   */
  async getUserReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız'
        });
        return;
      }
      
      const reports = await UserReportService.getUserReports(userId);
      
      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length
      });
    } catch (error) {
      logger.error('UserReportController.getUserReports - Hata:', error);
      next(error);
    }
  }
}; 
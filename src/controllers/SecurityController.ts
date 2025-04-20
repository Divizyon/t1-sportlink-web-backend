import { Request, Response } from 'express';
import SecurityService from '../services/securityService';
import { SecurityLogFilters, CreateSecurityLogDTO } from '../models/SecurityLog';

export const SecurityController = {
  /**
   * Güvenlik loglarını getir (filtreleme ve sayfalama destekli)
   * @route GET /api/security/logs
   */
  async getLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Filtreleri al
      const filters: SecurityLogFilters = {};
      if (req.query.searchQuery) filters.searchQuery = req.query.searchQuery as string;
      if (req.query.dateFilter) filters.dateFilter = req.query.dateFilter as string;
      if (req.query.actionType) filters.actionType = req.query.actionType as SecurityLogFilters['actionType'];
      if (req.query.status) filters.status = req.query.status as SecurityLogFilters['status'];
      
      const { logs, count, error } = await SecurityService.getLogs(filters, page, limit);
      
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Güvenlik logları alınırken bir hata oluştu',
          error: error.message
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Güvenlik logları alınırken beklenmeyen bir hata oluştu:', error);
      return res.status(500).json({
        success: false,
        message: 'Güvenlik logları alınırken beklenmeyen bir hata oluştu',
        error: (error as Error).message
      });
    }
  },
  
  /**
   * Yeni bir güvenlik logu oluştur
   * @route POST /api/security/logs
   */
  async createLog(req: Request, res: Response) {
    try {
      const logData: CreateSecurityLogDTO = req.body;
      
      // Gerekli alanları kontrol et
      const requiredFields = ['type', 'admin', 'ip', 'status', 'action'];
      const missingFields = requiredFields.filter(field => !logData[field as keyof CreateSecurityLogDTO]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Eksik alanlar: ${missingFields.join(', ')}`
        });
      }
      
      const { success, error } = await SecurityService.createLog(logData);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Güvenlik logu oluşturulurken bir hata oluştu',
          error: error?.message
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Güvenlik logu başarıyla oluşturuldu'
      });
    } catch (error) {
      console.error('Güvenlik logu oluşturulurken beklenmeyen bir hata oluştu:', error);
      return res.status(500).json({
        success: false,
        message: 'Güvenlik logu oluşturulurken beklenmeyen bir hata oluştu',
        error: (error as Error).message
      });
    }
  },
  
  /**
   * Güvenlik logunu sil (sadece admin yetkisi ile)
   * @route DELETE /api/security/logs/:id
   */
  async deleteLog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Log ID\'si gereklidir'
        });
      }
      
      const { success, error } = await SecurityService.deleteLog(id);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Güvenlik logu silinirken bir hata oluştu',
          error: error?.message
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Güvenlik logu başarıyla silindi'
      });
    } catch (error) {
      console.error('Güvenlik logu silinirken beklenmeyen bir hata oluştu:', error);
      return res.status(500).json({
        success: false,
        message: 'Güvenlik logu silinirken beklenmeyen bir hata oluştu',
        error: (error as Error).message
      });
    }
  }
};

export default SecurityController; 
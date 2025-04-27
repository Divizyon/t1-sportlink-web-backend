import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import * as userService from '../services/userService';
import { AdminReportInfo } from '../models/Report';

/**
 * Admin paneli için rapor bilgilerini getirir
 * @param req Express Request
 * @param res Express Response
 */
export const getReportAdminDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    
    if (!reportId) {
      res.status(400).json({ message: 'Rapor ID gereklidir' });
      return;
    }
    
    const adminDetails: AdminReportInfo = await reportService.getReportAdminDetails(reportId);
    
    res.status(200).json({
      message: 'Rapor admin bilgileri başarıyla getirildi',
      data: adminDetails
    });
  } catch (error) {
    console.error('Rapor admin bilgileri getirilirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Rapor admin bilgileri getirilirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
};

/**
 * Kullanıcıya admin uyarısı gönderir
 * @param req Express Request
 * @param res Express Response
 */
export const sendWarningToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const adminId = req.user?.id; // Auth middleware'den gelen admin kullanıcı ID'si
    
    if (!userId || !message) {
      res.status(400).json({ message: 'Kullanıcı ID ve uyarı mesajı gereklidir' });
      return;
    }
    
    if (!adminId) {
      res.status(401).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      return;
    }
    
    const result = await userService.sendWarningToUser(userId, adminId, message);
    
    res.status(200).json({
      message: 'Uyarı başarıyla gönderildi',
      data: {
        user: {
          id: result.id,
          email: result.email,
          name: `${result.first_name} ${result.last_name}`
        }
      }
    });
  } catch (error) {
    console.error('Uyarı gönderilirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else if (errorMessage.includes('yetki')) {
      res.status(403).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Uyarı gönderilirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
};

/**
 * Kullanıcı durumunu değiştirir (aktif/aktif değil)
 * @param req Express Request
 * @param res Express Response
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id; // Auth middleware'den gelen admin kullanıcı ID'si
    
    if (!userId) {
      res.status(400).json({ message: 'Kullanıcı ID gereklidir' });
      return;
    }
    
    if (!adminId) {
      res.status(401).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      return;
    }
    
    const updatedUser = await userService.toggleUserStatus(userId, adminId);
    
    res.status(200).json({
      message: `Kullanıcı durumu başarıyla ${updatedUser.status === 'active' ? 'aktif' : 'pasif'} olarak güncellendi`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Kullanıcı durumu değiştirilirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else if (errorMessage.includes('yetki')) {
      res.status(403).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Kullanıcı durumu değiştirilirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
}; 
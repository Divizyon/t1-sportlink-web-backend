import { Request, Response } from 'express';
import * as reportService from '../services/reportService';

/**
 * Tüm raporları getirir
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 */
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getAllReports();
    
    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: {
        reports
      }
    });
  } catch (error) {
    console.error('Raporlar getirilirken hata oluştu:', error);
    res.status(500).json({
      status: 'error',
      message: 'Raporlar getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Frontend'in istediği formatta rapor verilerini getirir (örnek veri formatı)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 */
export const getReportData = async (req: Request, res: Response) => {
  try {
    const reportData = await reportService.getReportData();
    
    res.status(200).json({
      status: 'success',
      results: reportData.length,
      data: {
        DASHBOARD_REPORTS: reportData
      }
    });
  } catch (error) {
    console.error('Rapor verileri getirilirken hata oluştu:', error);
    res.status(500).json({
      status: 'error',
      message: 'Rapor verileri getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Rapor durumunu günceller (çözer veya reddeder)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 */
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Status validasyonu
    if (!status || !['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir durum değeri girin (resolved veya rejected).'
      });
    }
    
    // Rapor durumunu güncelle
    const updatedReport = await reportService.updateReportStatus(
      parseInt(id, 10),
      status as 'resolved' | 'rejected'
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        report: updatedReport
      }
    });
  } catch (error) {
    console.error('Rapor durumu güncellenirken hata oluştu:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('bulunamadı')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Rapor durumu güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Rapora admin notu ekler
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 */
export const updateAdminNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    
    // Admin notu validasyonu
    if (admin_notes === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin notu gereklidir.'
      });
    }
    
    // Admin notunu güncelle
    const updatedReport = await reportService.updateAdminNotes(
      parseInt(id, 10),
      admin_notes
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        report: updatedReport
      }
    });
  } catch (error) {
    console.error('Admin notu güncellenirken hata oluştu:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('bulunamadı')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Admin notu güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Raporlanan kullanıcıyı banlar
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 */
export const banUserFromReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Kullanıcı ID'sine gerek yok, bu bilgi raporun içinde zaten var
    try {
      // Kullanıcıyı banla
      const result = await reportService.banUserFromReport(parseInt(id, 10));
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          banned_user_id: result.user_id
        }
      });
    } catch (error) {
      console.error('Kullanıcı banlanırken hata oluştu:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('bulunamadı')) {
          return res.status(404).json({
            status: 'error',
            message: error.message
          });
        }
        
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Kullanıcı banlanırken bir hata oluştu.'
      });
    }
  } catch (error) {
    console.error('Kullanıcı banlanırken hata oluştu:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı banlanırken bir hata oluştu.'
    });
  }
}; 
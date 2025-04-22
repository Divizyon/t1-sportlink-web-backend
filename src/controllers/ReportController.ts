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
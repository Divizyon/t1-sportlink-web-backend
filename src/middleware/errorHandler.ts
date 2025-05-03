import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Hata mesajını logla
  logger.error(`Error occurred: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    errorCode: err.code || 'unknown_error',
    errorDetails: err.details || null,
    errorHint: err.hint || null
  });

  // Supabase hatalarını kontrol et
  if (err.code && err.code === '42501') { // Permission denied hatası
    return res.status(403).json({
      status: 'error',
      message: 'Bu işlem için yetkiniz bulunmuyor. (RLS veya izin hatası)',
      details: 'Bu bir Row Level Security (RLS) hatası olabilir.',
      code: err.code
    });
  }

  // Diğer Supabase hatalarını kontrol et
  if (err.code && /^[0-9]{5}$/.test(err.code)) {
    return res.status(500).json({
      status: 'error',
      message: 'Veritabanı işlemi başarısız',
      details: err.message,
      code: err.code,
      hint: err.hint || 'Yöneticiyle iletişime geçin'
    });
  }
  
  // Status kodunu belirle
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Bir hata oluştu',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
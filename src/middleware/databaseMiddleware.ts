import { Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection, warmupConnectionPool } from '../config/supabase';
import logger from '../utils/logger';

let requestCounter = 0; // İstek sayacı

/**
 * Veritabanı bağlantısını belirli aralıklarla kontrol eden middleware
 */
export const dbConnectionCheck = async (req: Request, res: Response, next: NextFunction) => {
  // Her 50 istekte bir veya rastgele olarak bağlantıyı kontrol et
  requestCounter++;
  
  if (requestCounter % 50 === 0 || Math.random() < 0.02) {
    logger.info(`Veritabanı bağlantısı kontrol ediliyor (istek #${requestCounter})...`);
    
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      logger.warn('Veritabanı bağlantısı kesilmiş, yeniden bağlanılıyor...');
      await warmupConnectionPool();
    } else {
      logger.debug('Veritabanı bağlantısı aktif.');
    }
  }
  
  next();
};

/**
 * Önemli endpoint'ler için zorunlu bağlantı kontrolü yapan middleware
 */
export const enforceDbConnection = async (req: Request, res: Response, next: NextFunction) => {
  logger.info('Kritik endpoint için veritabanı bağlantısı kontrol ediliyor...');
  
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    logger.error('Kritik endpoint için veritabanı bağlantısı sağlanamadı.');
    
    const connectionRestored = await warmupConnectionPool();
    
    if (!connectionRestored) {
      logger.error('Veritabanı bağlantısı yeniden kurulamadı!');
      return res.status(503).json({ 
        status: 'error', 
        message: 'Veritabanı bağlantısı şu anda sağlanamıyor. Lütfen daha sonra tekrar deneyin.' 
      });
    }
    
    logger.info('Veritabanı bağlantısı yeniden kuruldu, istek devam ediyor...');
  }
  
  next();
};

export default { dbConnectionCheck, enforceDbConnection }; 
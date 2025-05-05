import { format } from 'date-fns';
import { supabaseAdmin } from '../config/supabase';
import { Pool } from 'pg';
import logger from '../utils/logger';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

// Bağlantı bilgilerini logla
const dbUrl = process.env.DIRECT_URL || 'Tanımlı değil';
logger.info(`DIRECT_URL: ${dbUrl.substring(0, 15)}...`);

// Doğrudan PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

// Tablo yapısını kontrol et
const checkTable = async () => {
  const client = await pool.connect();
  try {
    // Tablo sütunlarını kontrol et
    const columnResult = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'security_logs'"
    );
    
    logger.info(`security_logs tablosu yapısı: ${JSON.stringify(columnResult.rows)}`);
    
    // admin_id sütunu var mı kontrol et
    const hasAdminIdColumn = columnResult.rows.some(row => row.column_name === 'admin_id');
    
    if (!hasAdminIdColumn) {
      logger.warn('security_logs tablosunda admin_id sütunu bulunamadı! Sütunu eklemeye çalışıyorum...');
      
      try {
        await client.query('ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS admin_id UUID');
        logger.info('admin_id sütunu başarıyla eklendi');
      } catch (alterError) {
        logger.error(`Tablo değiştirme hatası: ${alterError}`);
      }
    }
  } catch (error) {
    logger.error(`Tablo kontrolü hatası: ${error}`);
  } finally {
    client.release();
  }
};

// Uygulama başlangıcında tablo kontrolü yap
checkTable().catch(err => {
  logger.error(`Tablo kontrolü hatası: ${err}`);
});

// Security log tipi
export type SecurityLogType = 
  | 'login'
  | 'logout'
  | 'user_create' 
  | 'user_update' 
  | 'user_delete'
  | 'user_ban'
  | 'user_unban'
  | 'event_create'
  | 'event_update'
  | 'event_delete'
  | 'event_status_update'
  | 'news_create'
  | 'news_update'
  | 'news_delete'
  | 'report_add_note'
  | 'report_update_status'
  | 'settings_update'
  | 'security_update'
  | 'other';

// Security log için DTO
export interface SecurityLogDTO {
  admin_id?: string;  // Opsiyonel
  admin_username: string;
  type: SecurityLogType;
  details?: Record<string, any>; // İşlem detayları (JSON olarak kaydedilecek)
  ip_address: string;
  action?: string; // Kullanıcı dostu eylem açıklaması
  status?: 'success' | 'failed'; // İşlem durumu
}

/**
 * Güvenlik ve admin işlemlerini loglamak için servis
 */
export const SecurityLogService = {
  /**
   * Yeni bir güvenlik işlem logu oluştur
   */
  async createLog(logData: SecurityLogDTO): Promise<{ success: boolean; error?: any }> {
    logger.info(`SecurityLogService.createLog çağrılıyor: ${JSON.stringify(logData)}`);
    
    // Çevre değişkenleri kontrolü
    if (!process.env.DIRECT_URL) {
      logger.error('DIRECT_URL çevre değişkeni tanımlanmamış! Log kaydedilemedi.');
      
      // DIRECT_URL yoksa, sadece konsola yazalım ama hata dönmeyelim
      logger.info(`[LOG KONSOL] ${logData.admin_username} - ${logData.type} - ${logData.details ? JSON.stringify(logData.details) : 'Detay yok'}`);
      return { success: false, error: 'Veritabanı bağlantı hatası: DIRECT_URL tanımlı değil' };
    }
    
    // Pool bağlantı detayları
    logger.info(`Veritabanı bağlantı bilgileri: ${process.env.DIRECT_URL ? 'DIRECT_URL tanımlı' : 'DIRECT_URL tanımlı değil'}`);
    
    let client;
    try {
      // Client bağlantısı al
      logger.info('Pool.connect çağrılıyor...');
      client = await pool.connect();
      logger.info('Veritabanı bağlantısı başarılı');
      
      const now = new Date();
      
      // Action alanını oluştur (formatı: "Kullanıcı engelledi / icardi99@example.com")
      let action = logData.action || '';
      
      if (!action) {
        switch(logData.type) {
          case 'login':
            action = `Başarılı giriş / ${logData.admin_username}`;
            break;
          case 'logout':
            action = `Çıkış yaptı / ${logData.admin_username}`;
            break;
          case 'user_create':
            action = `Kullanıcı oluşturdu / ${logData.details?.email || ''}`;
            break;
          case 'user_update':
            action = `Kullanıcı bilgilerini güncelledi / ${logData.details?.email || ''}`;
            break;
          case 'user_delete':
            action = `Kullanıcı sildi / ${logData.details?.email || ''}`;
            break;
          case 'user_ban':
            action = `Kullanıcı engelledi / ${logData.details?.email || ''}`;
            break;
          case 'user_unban':
            action = `Kullanıcı engelini kaldırdı / ${logData.details?.email || ''}`;
            break;
          case 'event_create':
            action = `Etkinlik oluşturdu / ${logData.details?.title || ''} (#${logData.details?.event_id || ''})`;
            break;
          case 'event_update':
            action = `Etkinlik güncelledi / ${logData.details?.title || ''} (#${logData.details?.event_id || ''})`;
            
            // Değişen alanların isimlerini kullan
            if (logData.details?.updated_fields && Array.isArray(logData.details.updated_fields)) {
              const fieldCount = logData.details.updated_fields.length;
              if (fieldCount > 0) {
                // Türkçe alan adları için çeviri tablosu
                const fieldNameTranslations: Record<string, string> = {
                  title: "Başlık",
                  description: "Açıklama",
                  location: "Konum",
                  event_date: "Tarih",
                  start_time: "Başlangıç saati",
                  end_time: "Bitiş saati",
                  capacity: "Kapasite",
                  sport_id: "Spor türü", 
                  status: "Durum",
                  image_url: "Resim",
                  is_featured: "Öne çıkan",
                  price: "Ücret"
                };
                
                // Alan adlarını çevir
                const translatedFieldNames = logData.details.updated_fields.map(
                  field => fieldNameTranslations[field] || field
                );
                
                // 3'ten fazla alan değiştiyse sayı göster, değilse alan adlarını göster
                if (fieldCount > 3) {
                  action += ` • ${fieldCount} alan değişti (${translatedFieldNames.slice(0, 3).join(", ")}...)`;
                } else {
                  action += ` • Değişen: ${translatedFieldNames.join(", ")}`;
                }
              }
            }
            break;
          case 'event_delete':
            action = `Etkinlik sildi / ${logData.details?.title || ''} (#${logData.details?.event_id || ''})`;
            break;
          case 'event_status_update':
            action = `Etkinlik durumu: ${logData.details?.old_status || ''} → ${logData.details?.newStatus || ''} / ${logData.details?.title || ''} (#${logData.details?.event_id || ''})`;
            break;
          case 'news_create':
            action = `Haber oluşturdu / ${logData.details?.title || ''} (#${logData.details?.news_id || ''})`;
            break;
          case 'news_update':
            action = `Haber güncelledi / ${logData.details?.title || ''} (#${logData.details?.news_id || ''})`;
            break;
          case 'news_delete':
            action = `Haber sildi / ${logData.details?.title || ''} (#${logData.details?.news_id || ''})`;
            break;
          case 'report_add_note':
            action = `Rapora not ekledi / #${logData.details?.reportId || ''}`;
            break;
          case 'report_update_status':
            action = `Rapor durumu: ${logData.details?.oldStatus || ''} → ${logData.details?.newStatus || ''} / #${logData.details?.reportId || ''}`;
            break;
          case 'settings_update':
            action = `Ayarları güncelledi / ${logData.details?.settingName || ''}`;
            break;
          case 'security_update':
            action = `Güvenlik ayarlarını güncelledi / ${logData.details?.securityType || ''}`;
            break;
          default:
            action = logData.type;
        }
      }
      
      // Log oluşturma sorgusu
      const insertQuery = `
        INSERT INTO security_logs (
          type, 
          admin, 
          ip, 
          date, 
          time, 
          status, 
          action, 
          created_at,
          admin_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `;
      
      logger.info(`SQL sorgusu çalıştırılıyor: ${insertQuery}`);
      logger.info(`Parametreler: ${logData.type}, ${logData.admin_username}, ${logData.ip_address}, ${format(now, 'yyyy-MM-dd')}, ${format(now, 'HH:mm')}, ${logData.status || 'success'}, ${action}, ${logData.admin_id || null}`);
      
      const result = await client.query(insertQuery, [
        logData.type,
        logData.admin_username,
        logData.ip_address,
        format(now, 'yyyy-MM-dd'),
        format(now, 'HH:mm'),
        logData.status || 'success',
        action,
        now,
        logData.admin_id || null
      ]);
      
      logger.info(`Güvenlik logu oluşturuldu: ${logData.admin_username} - ${logData.type} - ${action}`);
      
      return {
        success: true
      };
    } catch (error) {
      logger.error('Güvenlik logu oluşturulurken hata oluştu:', error);
      return {
        success: false,
        error
      };
    } finally {
      if (client) client.release();
    }
  },
  
  /**
   * Güvenlik loglarını getir (filtreleme ve sayfalama destekli)
   */
  async getLogs(
    filters?: {
      admin_id?: string;
      admin?: string;
      type?: SecurityLogType;
      start_date?: Date;
      end_date?: Date;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ logs: any[]; count: number; error?: any }> {
    const client = await pool.connect();
    
    try {
      // Temel sorgu
      let queryText = `
        SELECT * FROM security_logs
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Filtreleri uygula
      if (filters) {
        if (filters.admin_id) {
          queryText += ` AND admin_id = $${paramIndex}`;
          queryParams.push(filters.admin_id);
          paramIndex++;
        }
        
        if (filters.admin) {
          queryText += ` AND admin ILIKE $${paramIndex}`;
          queryParams.push(`%${filters.admin}%`);
          paramIndex++;
        }
        
        if (filters.type) {
          queryText += ` AND type = $${paramIndex}`;
          queryParams.push(filters.type);
          paramIndex++;
        }
        
        if (filters.start_date) {
          queryText += ` AND date >= $${paramIndex}`;
          queryParams.push(format(filters.start_date, 'yyyy-MM-dd'));
          paramIndex++;
        }
        
        if (filters.end_date) {
          queryText += ` AND date <= $${paramIndex}`;
          queryParams.push(format(filters.end_date, 'yyyy-MM-dd'));
          paramIndex++;
        }
      }
      
      // Toplam kayıt sayısını al
      const countQuery = `SELECT COUNT(*) as total FROM security_logs WHERE ${queryText.split('WHERE')[1]}`;
      const countResult = await client.query(countQuery, queryParams);
      const count = parseInt(countResult.rows[0].total);
      
      // Sıralama ve sayfalama ekle
      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);
      
      // Sorguyu çalıştır
      const result = await client.query(queryText, queryParams);
      
      return {
        logs: result.rows,
        count
      };
    } catch (error) {
      logger.error('Güvenlik logları alınırken hata oluştu:', error);
      return {
        logs: [],
        count: 0,
        error
      };
    } finally {
      client.release();
    }
  }
};

export default SecurityLogService; 
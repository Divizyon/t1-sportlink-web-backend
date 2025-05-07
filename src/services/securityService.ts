import { format } from 'date-fns';
import supabase, { supabaseAdmin } from '../config/supabase';
import { SecurityLog, CreateSecurityLogDTO, SecurityLogFilters } from '../models/SecurityLog';
import { PostgrestError } from '@supabase/supabase-js';
import { Pool } from 'pg';
import logger from '../utils/logger';

// Doğrudan PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});

export interface SecurityLogParams {
  type: string;
  admin: string;
  ip: string;
  status: string;
  action: string;
  admin_id?: string;
}

/**
 * Güvenlik logları için servis sınıfı
 */
export const SecurityService = {
  /**
   * Tüm güvenlik loglarını getir (filtre ve sayfalama destekli)
   */
  async getLogs(filters?: SecurityLogFilters, page: number = 1, limit: number = 20): Promise<{ logs: SecurityLog[], count: number, error: any }> {
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
        if (filters.searchQuery) {
          queryText += ` AND (admin ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`;
          queryParams.push(`%${filters.searchQuery}%`);
          paramIndex++;
        }
        
        if (filters.dateFilter) {
          queryText += ` AND date = $${paramIndex}`;
          queryParams.push(filters.dateFilter);
          paramIndex++;
        }
        
        if (filters.actionType) {
          queryText += ` AND type = $${paramIndex}`;
          queryParams.push(filters.actionType);
          paramIndex++;
        }
        
        if (filters.status) {
          queryText += ` AND status = $${paramIndex}`;
          queryParams.push(filters.status);
          paramIndex++;
        }
      }
      
      // Toplam kayıt sayısını al
      const countQuery = `SELECT COUNT(*) as total FROM security_logs WHERE ${queryText.split('WHERE')[1]}`;
      const countResult = await client.query(countQuery, queryParams);
      const count = parseInt(countResult.rows[0].total);
      
      // Sıralama ve sayfalama ekle
      queryText += ` ORDER BY date DESC, time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);
      
      // Sorguyu çalıştır
      const result = await client.query(queryText, queryParams);
      
      return {
        logs: result.rows as SecurityLog[],
        count,
        error: null
      };
    } catch (error) {
      console.error('Güvenlik logları alınırken hata oluştu:', error);
      return {
        logs: [],
        count: 0,
        error
      };
    } finally {
      client.release();
    }
  },
  
  /**
   * Yeni bir güvenlik logu oluştur
   */
  async createLog(params: SecurityLogParams): Promise<{ success: boolean, message: string }> {
    try {
      const now = new Date();
      const date = format(now, 'yyyy-MM-dd');
      const time = format(now, 'HH:mm');
      
      // RLS aktif olduğunda bile çalışması için supabaseAdmin kullan
      const { error } = await supabaseAdmin.from('security_logs').insert({
        type: params.type,
        admin: params.admin,
        ip: params.ip,
        date,
        time,
        status: params.status,
        action: params.action,
        created_at: now.toISOString(),
        admin_id: params.admin_id || null
      });
      
      if (error) {
        logger.error('Security log creation error:', error);
        throw error;
      }
      
      return { success: true, message: 'Log created successfully' };
    } catch (error) {
      logger.error('Security log error:', error);
      // Sessizce başarısız ol - uygulamayı bloke etme
      return { success: false, message: 'Failed to create security log' };
    }
  },
  
  /**
   * Log kaydını sil (sadece admin yetkisi ile)
   */
  async deleteLog(id: string): Promise<{ success: boolean, error: any }> {
    const client = await pool.connect();
    
    try {
      // ID'nin geçerli olup olmadığını kontrol et
      if (!id || id.trim() === '') {
        return {
          success: false,
          error: new Error('Geçersiz log ID\'si')
        };
      }

      // İlk olarak bu ID'li kaydın var olup olmadığını kontrol et
      const checkQuery = `SELECT id FROM security_logs WHERE id = $1;`;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return {
          success: false,
          error: new Error(`ID: ${id} olan log kaydı bulunamadı`)
        };
      }

      // Silme işlemini gerçekleştir
      const deleteQuery = `DELETE FROM security_logs WHERE id = $1 RETURNING *;`;
      const result = await client.query(deleteQuery, [id]);
      
      // Etkilenen satır sayısını kontrol et
      if (result.rowCount !== null && result.rowCount > 0) {
        return {
          success: true,
          error: null
        };
      } else {
        return {
          success: false,
          error: new Error(`Silme işlemi başarısız oldu. ID: ${id}`)
        };
      }
    } catch (error) {
      console.error('Güvenlik logu silinirken hata oluştu:', error);
      
      // Hata mesajını daha detaylı hale getir
      const errorMessage = error instanceof Error 
        ? `${error.message} (ID: ${id})` 
        : `Bilinmeyen hata (ID: ${id})`;
        
      return {
        success: false,
        error: new Error(errorMessage)
      };
    } finally {
      client.release();
    }
  }
};

export default SecurityService; 
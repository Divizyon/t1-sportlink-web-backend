import { format } from 'date-fns';
import supabase, { supabaseAdmin } from '../config/supabase';
import { SecurityLog, CreateSecurityLogDTO, SecurityLogFilters } from '../models/SecurityLog';
import { PostgrestError } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Doğrudan PostgreSQL bağlantısı
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});

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
  async createLog(logData: CreateSecurityLogDTO): Promise<{ success: boolean, error: any }> {
    const client = await pool.connect();
    
    try {
      const now = new Date();
      
      const insertQuery = `
        INSERT INTO security_logs (type, admin, ip, date, time, status, action)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      
      const result = await client.query(insertQuery, [
        logData.type,
        logData.admin,
        logData.ip,
        format(now, 'yyyy-MM-dd'),
        format(now, 'HH:mm'),
        logData.status,
        logData.action
      ]);
      
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Güvenlik logu oluşturulurken hata oluştu:', error);
      return {
        success: false,
        error
      };
    } finally {
      client.release();
    }
  },
  
  /**
   * Log kaydını sil (sadece admin yetkisi ile)
   */
  async deleteLog(id: string): Promise<{ success: boolean, error: any }> {
    const client = await pool.connect();
    
    try {
      const deleteQuery = `DELETE FROM security_logs WHERE id = $1 RETURNING *;`;
      const result = await client.query(deleteQuery, [id]);
      
      return {
        success: result.rowCount !== null && result.rowCount > 0,
        error: null
      };
    } catch (error) {
      console.error('Güvenlik logu silinirken hata oluştu:', error);
      return {
        success: false,
        error
      };
    } finally {
      client.release();
    }
  }
};

export default SecurityService; 
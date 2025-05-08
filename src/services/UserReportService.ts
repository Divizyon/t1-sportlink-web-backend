import supabase from '../config/supabase';
import logger from '../utils/logger';

class UserReportService {
  /**
   * Bir kullanıcının diğer bir kullanıcıyı raporlamasını sağlar
   */
  async reportUser(reporterId: string, reportedId: string, reason: string): Promise<{id: number}> {
    try {
      logger.info(`${reporterId} ID'li kullanıcı, ${reportedId} ID'li kullanıcıyı raporluyor`);
      
      const { data, error } = await supabase
        .from('Reports')
        .insert({
          reporter_id: reporterId,
          reported_id: reportedId,
          report_reason: reason,
          report_date: new Date().toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) {
        logger.error('Kullanıcı raporlama hatası:', error);
        throw new Error(`Kullanıcı raporlanamadı: ${error.message}`);
      }
      
      logger.info(`Rapor başarıyla oluşturuldu, ID: ${data.id}`);
      return { id: data.id };
    } catch (error) {
      logger.error('Kullanıcı raporlama servisinde hata:', error);
      throw error;
    }
  }
  
  /**
   * Bir etkinliği raporlar
   */
  async reportEvent(reporterId: string, eventId: string, reason: string): Promise<{id: number}> {
    try {
      logger.info(`${reporterId} ID'li kullanıcı, ${eventId} ID'li etkinliği raporluyor`);
      
      const { data, error } = await supabase
        .from('Reports')
        .insert({
          reporter_id: reporterId,
          event_id: eventId,
          report_reason: reason,
          report_date: new Date().toISOString(),
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) {
        logger.error('Etkinlik raporlama hatası:', error);
        throw new Error(`Etkinlik raporlanamadı: ${error.message}`);
      }
      
      logger.info(`Rapor başarıyla oluşturuldu, ID: ${data.id}`);
      return { id: data.id };
    } catch (error) {
      logger.error('Etkinlik raporlama servisinde hata:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcının kendi raporlarını getirir
   */
  async getUserReports(userId: string): Promise<any[]> {
    try {
      logger.info(`${userId} ID'li kullanıcının raporları getiriliyor`);
      
      const { data, error } = await supabase
        .from('Reports')
        .select(`
          id,
          report_reason,
          report_date,
          status,
          event_id,
          reported_id,
          reported:users!reported_id (username, first_name, last_name),
          event:Events!event_id (title)
        `)
        .eq('reporter_id', userId)
        .order('report_date', { ascending: false });
      
      if (error) {
        logger.error('Kullanıcı raporlarını getirme hatası:', error);
        throw new Error(`Raporlar getirilemedi: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      logger.error('Kullanıcı raporları getirme servisinde hata:', error);
      throw error;
    }
  }
}

export default new UserReportService(); 
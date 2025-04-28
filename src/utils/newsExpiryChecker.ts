import supabase from '../config/supabase';
import logger from './logger';

/**
 * Süresi dolmuş haberleri kontrol eden ve durumlarını rejected olarak güncelleyen servis
 */
export class NewsExpiryChecker {
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 60000; // 1 dakika (milisaniye cinsinden)

  /**
   * Servis başlatma
   */
  public start(): void {
    logger.info('Haber süresi kontrol servisi başlatılıyor...');
    
    // Hemen bir kez çalıştır
    this.checkExpiredNews();
    
    // Düzenli aralıklarla çalıştır
    this.intervalId = setInterval(() => {
      this.checkExpiredNews();
    }, this.checkIntervalMs);
    
    logger.info(`Haber süresi kontrol servisi başlatıldı. Her ${this.checkIntervalMs / 1000} saniyede bir kontrol edilecek.`);
  }

  /**
   * Servisi durdurma
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Haber süresi kontrol servisi durduruldu.');
    }
  }

  /**
   * Süresi dolmuş haberleri kontrol etme ve "rejected" olarak işaretleme
   */
  private async checkExpiredNews(): Promise<void> {
    try {
      logger.info('Süresi dolmuş haberleri kontrol ediliyor...');
      
      // Şu anki zamandan daha küçük end_time'ı olan ve rejected olmayan haberleri bul
      const { data: expiredNews, error: updateError } = await supabase
        .from('News')
        .update({ 
          status: 'rejected',
          updated_at: new Date() 
        })
        .lt('end_time', new Date().toISOString())
        .not('status', 'eq', 'rejected')
        .select('id');
      
      if (updateError) {
        throw updateError;
      }
      
      // Rejected haberleri sil
      if (expiredNews && expiredNews.length > 0) {
        logger.info(`Süresi dolmuş ${expiredNews.length} haber rejected olarak işaretlendi ve silinecek.`);
        
        // ID'leri bir diziye çıkaralım
        const expiredIds = expiredNews.map(news => news.id);
        
        // Haberleri sil
        const { error: deleteError } = await supabase
          .from('News')
          .delete()
          .in('id', expiredIds);
          
        if (deleteError) {
          throw deleteError;
        }
        
        logger.info(`${expiredIds.length} haber başarıyla silindi.`);
      } else {
        logger.info('Süresi dolmuş haber bulunamadı.');
      }
      
      // Var olan tüm rejected haberleri sil (temizlik için)
      const { data: rejectedNews, error: findError } = await supabase
        .from('News')
        .select('id')
        .eq('status', 'rejected');
        
      if (findError) {
        throw findError;
      }
      
      if (rejectedNews && rejectedNews.length > 0) {
        // ID'leri bir diziye çıkaralım
        const rejectedIds = rejectedNews.map(news => news.id);
        
        // Haberleri sil
        const { error: cleanupError } = await supabase
          .from('News')
          .delete()
          .in('id', rejectedIds);
          
        if (cleanupError) {
          throw cleanupError;
        }
        
        logger.info(`${rejectedIds.length} rejected haber başarıyla temizlendi.`);
      }
    } catch (error: any) {
      logger.error(`Haber süresi kontrol hatası: ${error.message}`, { error });
    }
  }
}

// Tek bir örnek oluştur
const newsExpiryChecker = new NewsExpiryChecker();

export default newsExpiryChecker; 
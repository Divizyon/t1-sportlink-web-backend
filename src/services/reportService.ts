import supabase, { supabaseAdmin } from '../config/supabase';
import { DatabaseReport, Report, ReportData } from '../models/Report';
import { format, parseISO, Locale } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Tarih formatını işleyen yardımcı fonksiyon
 * @param dateValue Tarih değeri (string veya Date olabilir)
 * @returns Formatlı tarih string'i
 */
const formatDate = (dateValue: string | Date, formatStr: string, locale?: Locale): string => {
  if (!dateValue) return ''; // null veya undefined ise boş string döndür
  
  try {
    // Eğer zaten string ise parseISO kullan
    if (typeof dateValue === 'string') {
      return format(parseISO(dateValue), formatStr, { locale });
    }
    
    // Date nesnesi ise doğrudan format kullan
    if (dateValue instanceof Date) {
      return format(dateValue, formatStr, { locale });
    }
    
    // Tür belirsizse toString() ile stringe çevir ve parseISO kullan
    return format(parseISO(String(dateValue)), formatStr, { locale });
  } catch (error) {
    console.error('Tarih formatlanırken hata oluştu:', error);
    return String(dateValue); // Hata durumunda orijinal değeri string olarak döndür
  }
};

/**
 * Veritabanından gelen rapor verilerini istenen formata dönüştürür
 * @param databaseReport Veritabanından gelen rapor verisi
 * @returns Frontend'e gönderilecek formatta rapor verisi
 */
const mapDatabaseReportToFrontend = (databaseReport: any): Report => {
  // Oncelik değerini belirle
  let oncelik: "Yüksek" | "Orta" | "Düşük" = "Orta";
  // Basit bir algoritma: "önemli" veya "uygunsuz" kelimeleri geçiyorsa yüksek öncelik
  const reportReasonLower = databaseReport.report_reason.toLowerCase();
  if (reportReasonLower.includes('önemli') || 
      reportReasonLower.includes('uygunsuz') || 
      reportReasonLower.includes('tehlikeli') ||
      reportReasonLower.includes('dolandırıcılık') ||
      reportReasonLower.includes('yaş sınırı') ||
      reportReasonLower.includes('taciz')) {
    oncelik = "Yüksek";
  } else if (reportReasonLower.includes('küçük') || 
            reportReasonLower.includes('minor') || 
            reportReasonLower.includes('düşük')) {
    oncelik = "Düşük";
  }

  // Durum değerini belirle
  let durum: "Beklemede" | "İnceleniyor" | "Çözüldü" | "Reddedildi" = "Beklemede";
  switch (databaseReport.status.toLowerCase()) {
    case 'pending':
      durum = "Beklemede";
      break;
    case 'reviewing':
      durum = "İnceleniyor";
      break;
    case 'resolved':
      durum = "Çözüldü";
      break;
    case 'rejected':
      durum = "Reddedildi";
      break;
  }

  // Tarih formatını GG.AA.YYYY olarak düzenle
  const tarih = formatDate(databaseReport.report_date, 'dd.MM.yyyy', tr);

  // Raporu gönderen kişinin tam adını oluştur
  // Supabase'den dönen verinin formatına göre ayarlama yapıyoruz
  const reporter = databaseReport.reporter || {};
  const firstName = reporter.first_name || '';
  const lastName = reporter.last_name || '';
  const raporlayan = `${firstName} ${lastName}`.trim();

  // Rapor türünü belirle
  const tur = databaseReport.reported_id !== databaseReport.reporter_id ? "Kullanıcı" : "Etkinlik";

  // Frontend'in beklediği formatta rapo nesnesi oluştur
  return {
    id: databaseReport.id.toString(),
    konu: databaseReport.report_reason,
    raporlayan,
    tarih,
    tur,
    oncelik,
    durum
  };
};

/**
 * Tüm raporları çeker ve istenen formata dönüştürür
 * @returns Frontend'e gönderilecek formatta rapor dizisi
 */
export const getAllReports = async (): Promise<Report[]> => {
  try {
    // Veritabanından raporları çek
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .select(`
        id,
        event_id,
        report_reason,
        report_date,
        status,
        admin_notes,
        reporter_id,
        reported_id,
        reporter:users!reporter_id (first_name, last_name),
        reported:users!reported_id (first_name, last_name),
        event:Events!event_id (title)
      `)
      .order('report_date', { ascending: false });
      
    if (error) {
      console.error('Raporlar getirilirken hata oluştu:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Veritabanından gelen verileri dönüştür
    return data.map(report => mapDatabaseReportToFrontend(report));
    
  } catch (error) {
    console.error('Rapor servisi hatası:', error);
    throw error;
  }
};

/**
 * Örnek veri formatında raporları oluşturur ve döndürür
 * @returns Örnek rapor verileri 
 */
export const getReportData = async (): Promise<ReportData[]> => {
  try {
    // Veritabanından raporları çek
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .select(`
        id,
        event_id,
        report_reason,
        report_date,
        status,
        admin_notes,
        reporter_id,
        reported_id,
        reporter:users!reporter_id (first_name, last_name),
        reported:users!reported_id (first_name, last_name),
        event:Events!event_id (title)
      `)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Raporlar getirilirken hata oluştu:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Veritabanından gelen verileri ReportData formatına dönüştür
    return data.map((report: any) => {
      let priority: "high" | "medium" | "low" = "medium";
      const reportReasonLower = report.report_reason.toLowerCase();
      
      if (reportReasonLower.includes('önemli') || 
          reportReasonLower.includes('uygunsuz') || 
          reportReasonLower.includes('tehlikeli')) {
        priority = "high";
      } else if (reportReasonLower.includes('küçük') || 
                reportReasonLower.includes('minor')) {
        priority = "low";
      }

      let status: "pending" | "reviewing" | "resolved" | "rejected" = "pending";
      switch (report.status.toLowerCase()) {
        case 'pending':
          status = "pending";
          break;
        case 'reviewing':
          status = "reviewing";
          break;
        case 'resolved':
          status = "resolved";
          break;
        case 'rejected':
          status = "rejected";
          break;
      }

      // Supabase'den dönen verinin formatına göre ayarlama yapıyoruz
      const reporter = report.reporter || {};
      const firstName = reporter.first_name || '';
      const lastName = reporter.last_name || '';
      const reportedBy = `${firstName} ${lastName}`.trim();
      
      const reportedDate = formatDate(report.report_date, 'yyyy-MM-dd');
      const entityType = report.reported_id !== report.reporter_id ? "user" : "event";
      const entityId = entityType === "user" ? parseInt(report.reported_id, 10) : report.event_id;

      return {
        id: report.id,
        subject: report.report_reason,
        description: report.admin_notes || "Açıklama bulunmuyor.",
        reportedBy,
        reportedDate,
        priority,
        status,
        entityId,
        entityType
      };
    });
  } catch (error) {
    console.error('Rapor servisi hatası:', error);
    throw error;
  }
}; 
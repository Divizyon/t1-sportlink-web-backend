import supabase, { supabaseAdmin } from '../config/supabase';
import { DatabaseReport, Report, ReportData, AdminReportInfo } from '../models/Report';
import { format, parseISO, Locale } from 'date-fns';
import { tr } from 'date-fns/locale';
import logger from '../utils/logger';

// Rapor detayları için tip tanımlamaları
interface ReportDetailsResponse {
  id: number;
  report_reason: string;
  report_date: string;
  status: string;
  admin_notes: string;
  reporter: ReporterInfo | null;
  reported_user: ReportedUserInfo | null;
  event: ReportEventInfo | null;
  updated_by: string | null;
}

interface ReporterInfo {
  id: string;
  username: string;
  email: string;
  full_name: string;
}

interface ReportedUserInfo {
  id: string;
  username: string;
  email: string;
  full_name: string;
}

interface ReportEventInfo {
  id: string;
  title: string;
}

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
  const reporter = databaseReport.reporter || {};
  const reporterFirstName = reporter.first_name || '';
  const reporterLastName = reporter.last_name || '';
  const raporlayan = `${reporterFirstName} ${reporterLastName}`.trim();

  // Raporlanan kişinin tam adını oluştur
  const reported = databaseReport.reported || {};
  const reportedFirstName = reported.first_name || '';
  const reportedLastName = reported.last_name || '';
  const raporlanan = `${reportedFirstName} ${reportedLastName}`.trim();

  // Rapor türünü belirle ve detayları ekle
  const tur = databaseReport.reported_id !== databaseReport.reporter_id ? "Kullanıcı" : "Etkinlik";
  const konu = databaseReport.report_reason;
  
  // Admin notlarını ekle
  const adminNotes = databaseReport.admin_notes || "";

  // Frontend'in beklediği formatta rapor nesnesi oluştur
  return {
    id: databaseReport.id.toString(),
    konu,
    raporlayan,
    raporlanan: tur === "Kullanıcı" ? raporlanan : "",
    tarih,
    tur,
    oncelik,
    durum,
    adminNotes
  };
};

/**
 * Tüm raporları çeker ve istenen formata dönüştürür
 * @returns Frontend'e gönderilecek formatta rapor dizisi
 */
export const getAllReports = async (): Promise<Report[]> => {
  try {
    // Service key kullanarak veritabanı sorgusu yapacağımızı logla
    logger.info('Tüm raporlar getiriliyor - Service Role Key ile sorgu yapılıyor');
    
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
      logger.error('Raporlar getirilirken hata oluştu:', {
        message: error.message,
        code: error.code,
        details: error.details || 'Detay yok',
        hint: error.hint || 'İpucu yok'
      });
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Veritabanından gelen verileri dönüştür
    logger.info(`${data.length} rapor başarıyla alındı`);
    return data.map(report => mapDatabaseReportToFrontend(report));
    
  } catch (error) {
    logger.error('Rapor servisi hatası:', error);
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

/**
 * Rapor durumunu günceller
 * @param reportId Raporun ID'si
 * @param status Yeni durum değeri (resolved veya rejected)
 * @param adminId İşlemi yapan adminin ID'si
 * @returns Güncellenmiş rapor
 */
export const updateReportStatus = async (
  reportId: number,
  status: 'resolved' | 'rejected',
  adminId: string
): Promise<Report> => {
  try {
    console.log(`Rapor durumu güncelleniyor: ${reportId} -> ${status}, Admin ID: ${adminId}`);
    
    // Veritabanında durumu ve güncelleyen admin bilgisini güncelle
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .update({ 
        status,
        updated_by: adminId
      })
      .eq('id', reportId)
      .select(`
        id,
        event_id,
        report_reason,
        report_date,
        status,
        admin_notes,
        reporter_id,
        reported_id,
        updated_by,
        reporter:users!reporter_id (first_name, last_name),
        reported:users!reported_id (first_name, last_name),
        event:Events!event_id (title)
      `)
      .single();
    
    if (error) {
      console.error('Rapor durumu güncellenirken hata oluştu:', error);
      throw new Error(`Rapor durumu güncellenirken hata oluştu: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Güncellenecek rapor bulunamadı.');
    }
    
    console.log(`Rapor durumu başarıyla güncellendi: ${reportId} -> ${status}`);
    
    // Güncellenmiş raporu formatla ve döndür
    return mapDatabaseReportToFrontend(data);
  } catch (error) {
    console.error('Rapor durumu güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Rapora admin notu ekler veya mevcut notu günceller
 * @param reportId Raporun ID'si
 * @param adminNotes Admin notu içeriği
 * @param adminId İşlemi yapan adminin ID'si
 * @returns Güncellenmiş rapor
 */
export const updateAdminNotes = async (
  reportId: number,
  adminNotes: string,
  adminId: string
): Promise<Report> => {
  try {
    console.log(`Rapor admin notu güncelleniyor: ${reportId}, Admin ID: ${adminId}`);
    
    // Veritabanında admin notunu güncelle ve updated_by alanına admin ID'sini ekle
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .update({ 
        admin_notes: adminNotes,
        updated_by: adminId
      })
      .eq('id', reportId)
      .select(`
        id,
        event_id,
        report_reason,
        report_date,
        status,
        admin_notes,
        reporter_id,
        reported_id,
        updated_by,
        reporter:users!reporter_id (first_name, last_name),
        reported:users!reported_id (first_name, last_name),
        event:Events!event_id (title)
      `)
      .single();
    
    if (error) {
      console.error('Rapor admin notu güncellenirken hata oluştu:', error);
      throw new Error(`Rapor admin notu güncellenirken hata oluştu: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Güncellenecek rapor bulunamadı.');
    }
    
    console.log(`Rapor admin notu başarıyla güncellendi: ${reportId}`);
    
    // Güncellenmiş raporu formatla ve döndür
    return mapDatabaseReportToFrontend(data);
  } catch (error) {
    console.error('Rapor admin notu güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Raporlanan kullanıcının durumunu inactive yapar
 * @param reportId Raporun ID'si
 * @param adminId İşlemi yapan adminin ID'si
 * @returns İşlem sonucu
 */
export const banUserFromReport = async (
  reportId: number,
  adminId: string
): Promise<{ success: boolean; message: string; user_id: string }> => {
  try {
    logger.info(`Raporlanan kullanıcının durumu güncelleniyor, rapor ID: ${reportId}, Admin ID: ${adminId}`);
    
    // Önce raporu ve raporlanan kullanıcıyı bul
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('Reports')
      .select(`
        id,
        reported_id,
        status,
        reported:users!reported_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', reportId)
      .single() as { 
        data: DatabaseReport | null; 
        error: any; 
      };
      
    if (reportError || !reportData) {
      logger.error('Rapor bulunamadı:', reportError);
      throw new Error('İlgili rapor bulunamadı.');
    }

    // Rapor zaten çözüldü mü kontrol et
    if (reportData.status === 'resolved') {
      throw new Error('Bu rapor zaten çözüldü.');
    }
    
    // Raporlanan kullanıcının ID'sini al
    const userId = reportData.reported_id;
    const reportedUser = reportData.reported;
    
    if (!userId || !reportedUser) {
      throw new Error('Raporda raporlanan kullanıcı bilgisi bulunamadı.');
    }
    
    logger.info(`Raporlanan kullanıcı bilgileri:`, {
      id: userId,
      name: `${reportedUser.first_name} ${reportedUser.last_name}`,
      email: reportedUser.email
    });
    
    // Kullanıcının durumunu inactive yap
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      logger.error('Kullanıcı durumu güncellenirken hata oluştu:', updateError);
      throw new Error(`Kullanıcı durumu güncellenirken hata oluştu: ${updateError.message}`);
    }
    
    logger.info(`Kullanıcı durumu inactive olarak güncellendi: ${userId}`);
    
    // Admin notunu ve güncelleyen adminini güncelle ama rapor durumunu değiştirme
    const { error: reportUpdateError } = await supabaseAdmin
      .from('Reports')
      .update({ 
        admin_notes: `Kullanıcı ${new Date().toLocaleString('tr-TR')} tarihinde devre dışı bırakıldı.`,
        updated_by: adminId
      })
      .eq('id', reportId);
    
    if (reportUpdateError) {
      logger.error('Rapor admin notu güncellenirken hata oluştu:', reportUpdateError);
      logger.warn('Kullanıcı durumu güncellendi ancak rapor admin notu güncellenemedi.');
    }
    
    return {
      success: true,
      message: 'Kullanıcı devre dışı bırakıldı.',
      user_id: userId
    };
  } catch (error) {
    logger.error('İşlem hatası:', error);
    throw error;
  }
};

/**
 * Users tablosundaki alanları kontrol etmek için yardımcı fonksiyon
 * @returns Users tablosundaki alanların listesi
 */
const getUserTableFields = async (): Promise<string[]> => {
  try {
    // Önce bir kullanıcı kaydını al ve alanları kontrol et
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
      .single();
      
    if (error) {
      console.error('Kullanıcı tablosu kontrol edilirken hata oluştu:', error);
      return []; // Hata durumunda boş dizi döndür
    }
    
    // Kaydın alanlarını döndür
    return Object.keys(data || {});
  } catch (error) {
    console.error('Kullanıcı tablosu alanları kontrol edilirken hata oluştu:', error);
    return []; // Hata durumunda boş dizi döndür
  }
};

/**
 * Belirli bir raporun admin bilgilerini getirir
 * @param reportId Rapor ID
 * @returns Rapor admin bilgileri
 */
export const getReportAdminDetails = async (reportId: string): Promise<AdminReportInfo> => {
  try {
    console.log(`Rapor admin bilgileri getiriliyor, id: ${reportId}`);
    
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .select(`
        id, 
        status,
        admin_notes,
        updated_by,
        admin:users!updated_by (email, username)
      `)
      .eq('id', reportId)
      .single();
      
    if (error) {
      console.error('Rapor admin bilgileri getirilirken hata:', error);
      throw error;
    }
    
    if (!data) {
      console.error(`Rapor bulunamadı: ${reportId}`);
      throw new Error('Rapor bulunamadı');
    }
    
    // Durumu Türkçe'ye çevir
    let durum = "Beklemede";
    switch (data.status?.toLowerCase() || 'pending') {
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
    
    // TypeScript'in admin yapısını anlayabilmesi için tip dönüşümü
    const admin = data.admin as { email?: string; username?: string } || {};
    
    const result: AdminReportInfo = {
      rapor_id: data.id?.toString() || "",
      admin_email: admin?.email || "",
      admin_username: admin?.username || "",
      admin_notu: data.admin_notes || "",
      durum
    };
    
    console.log('Rapor admin bilgileri başarıyla getirildi:', reportId);
    return result;
  } catch (error) {
    console.error('Rapor admin bilgileri servis hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir raporun detaylarını getirir
 * @param reportId Rapor ID
 * @returns Rapor detayları
 */
export const getReportDetails = async (reportId: number): Promise<ReportDetailsResponse> => {
  try {
    // Raporu veritabanından al
    const { data: report, error } = await supabaseAdmin
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
        updated_by,
        reporter:users!reporter_id (id, first_name, last_name, username, email),
        reported:users!reported_id (id, first_name, last_name, username, email),
        event:Events!event_id (id, title),
        admin:users!updated_by (id, first_name, last_name, username, email)
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      console.error(`Rapor detayları getirilirken hata (ID: ${reportId}):`, error);
      throw error;
    }

    if (!report) {
      throw new Error('Rapor bulunamadı');
    }

    // TypeScript için tip güvenlikli işlemler yapalım
    type UserInfo = {
      id?: string;
      first_name?: string;
      last_name?: string;
      username?: string;
      email?: string;
    };

    type EventInfo = {
      id?: string;
      title?: string;
    };

    // Reporter bilgilerini formatla
    let reporterInfo: ReporterInfo | null = null;
    if (report.reporter && typeof report.reporter === 'object') {
      const reporter = report.reporter as UserInfo;
      reporterInfo = {
        id: reporter.id || '',
        username: reporter.username || '',
        email: reporter.email || '',
        full_name: `${reporter.first_name || ''} ${reporter.last_name || ''}`.trim()
      };
    }

    // Reported user bilgilerini formatla
    let reportedUserInfo: ReportedUserInfo | null = null;
    if (report.reported && typeof report.reported === 'object') {
      const reported = report.reported as UserInfo;
      reportedUserInfo = {
        id: reported.id || '',
        username: reported.username || '',
        email: reported.email || '',
        full_name: `${reported.first_name || ''} ${reported.last_name || ''}`.trim()
      };
    }

    // Event bilgilerini formatla
    let eventInfo: ReportEventInfo | null = null;
    if (report.event && typeof report.event === 'object') {
      // Sanırım supabase dönüşü array olabilir, buna göre kontrol edelim
      const event = Array.isArray(report.event) 
        ? (report.event.length > 0 ? report.event[0] : null) 
        : report.event;
      
      if (event && typeof event === 'object' && 'id' in event) {
        eventInfo = {
          id: String(event.id) || '',
          title: String(event.title) || ''
        };
      }
    }

    // Rapor nesnesini hazırla
    const reportDetails: ReportDetailsResponse = {
      id: report.id,
      report_reason: report.report_reason || '',
      report_date: report.report_date || '',
      status: report.status || '',
      admin_notes: report.admin_notes || '',
      reporter: reporterInfo,
      reported_user: reportedUserInfo,
      event: eventInfo,
      updated_by: report.updated_by || null
    };

    return reportDetails;
  } catch (error) {
    console.error('Rapor detayları servis hatası:', error);
    throw error;
  }
}; 
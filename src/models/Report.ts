/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - id
 *         - konu
 *         - raporlayan
 *         - tarih
 *         - tur
 *         - oncelik
 *         - durum
 *       properties:
 *         id:
 *           type: string
 *           description: Benzersiz rapor kimliği
 *         konu:
 *           type: string
 *           description: Raporun konusu
 *         raporlayan:
 *           type: string
 *           description: Raporu gönderen kullanıcının adı
 *         tarih:
 *           type: string
 *           description: Raporun oluşturulma tarihi (GG.AA.YYYY formatında)
 *         tur:
 *           type: string
 *           enum: [Kullanıcı, Etkinlik]
 *           description: Raporun türü
 *         oncelik:
 *           type: string
 *           enum: [Yüksek, Orta, Düşük]
 *           description: Raporun önceliği 
 *         durum:
 *           type: string
 *           enum: [Beklemede, İnceleniyor, Çözüldü, Reddedildi]
 *           description: Raporun mevcut durumu
 *         adminNotes:
 *           type: string
 *           description: Admin tarafından eklenen notlar
 *     ReportData:
 *       type: object
 *       required:
 *         - id
 *         - subject
 *         - description
 *         - reportedBy
 *         - reportedDate
 *         - priority
 *         - status
 *         - entityId
 *         - entityType
 *       properties:
 *         id:
 *           type: number
 *           description: Benzersiz rapor ID
 *         subject:
 *           type: string
 *           description: Raporun konusu
 *         description:
 *           type: string
 *           description: Rapor açıklaması
 *         reportedBy:
 *           type: string
 *           description: Raporu oluşturan kullanıcı adı
 *         reportedDate:
 *           type: string
 *           format: date
 *           description: Raporun oluşturulma tarihi (YYYY-MM-DD formatında)
 *         priority:
 *           type: string
 *           enum: [high, medium, low]
 *           description: Raporun önceliği
 *         status:
 *           type: string
 *           enum: [pending, reviewing, resolved, rejected]
 *           description: Raporun mevcut durumu
 *         entityId:
 *           type: number
 *           description: Raporlanan varlığın ID'si
 *         entityType:
 *           type: string
 *           enum: [user, event]
 *           description: Raporlanan varlığın türü
 */

// Frontend'e gönderilecek rapor tipi
export interface Report {
  id: string; // Benzersiz rapor kimliği
  konu: string; // Raporun konusu (Örn: "Uygunsuz Davranış")
  raporlayan: string; // Raporu gönderen kullanıcının adı (Örn: "Ahmet Yılmaz")
  raporlanan: string; // Raporu raporlayanının adı (Örn: "Ayşe Kaya")
  tarih: string; // Raporun oluşturulma tarihi (Örn: "25.08.2023")
  tur: "Kullanıcı" | "Etkinlik"; // Raporun türü
  oncelik: "Yüksek" | "Orta" | "Düşük"; // Raporun önceliği
  durum: "Beklemede" | "İnceleniyor" | "Çözüldü" | "Reddedildi"; // Raporun mevcut durumu
  adminNotes?: string; // Admin notları (opsiyonel)
}

// Backend'den alınan verilerin formatı
export interface ReportData {
  id: number;
  subject: string;
  description: string;
  reportedBy: string;
  reportedDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "reviewing" | "resolved" | "rejected";
  entityId: number;
  entityType: "user" | "event";
}

// Veritabanından gelen rapor verisi ile ilişkili tip
export interface DatabaseReport {
  id: number;
  event_id: number;
  report_reason: string;
  report_date: Date;
  status: string;
  admin_notes?: string | null;
  reporter_id: string;
  reported_id: string;
  reporter: {
    first_name?: string;
    last_name?: string;
  };
  reported: {
    first_name: string;
    last_name: string;
    email: string;
  };
  event: {
    title?: string;
  };
}

// Admin rapor bilgileri için ortak tip
export interface AdminReportInfo {
  rapor_id: string;
  admin_email: string;
  admin_username: string;
  admin_notu: string;
  durum: string;
} 
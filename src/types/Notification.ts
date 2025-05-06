// Bildirim türleri
export enum NotificationType {
  NEW_REPORT = 'new_report',           // Yeni rapor oluşturulduğunda
  NEW_EVENT = 'new_event',             // Yeni etkinlik oluşturulduğunda
  EVENT_UPDATED = 'event_updated',     // Etkinlik güncellendiğinde
  EVENT_JOIN = 'event_join',           // Kullanıcı etkinliğe katıldığında
  EVENT_LEAVE = 'event_leave',         // Kullanıcı etkinlikten ayrıldığında
  USER_WATCHED = 'user_watched',       // Kullanıcı izlemeye alındığında
  USER_INACTIVE = 'user_inactive',     // Kullanıcı inaktif olduğunda
  USER_ACTIVE = 'user_active',         // Kullanıcı aktif olduğunda
  NEW_ACHIEVEMENT = 'new_achievement', // Yeni başarı kazanıldığında
  PENDING_APPROVAL = 'pending_approval', // Onay bekleyen içerik olduğunda
  NEWS_APPROVED = 'news_approved',     // Haber onaylandığında
  SYSTEM_ALERT = 'system_alert'        // Sistem uyarıları
}

// Bildirim modeli
export interface Notification {
  id?: number;
  notification_type: NotificationType;
  content: string;
  read_status: boolean;
  created_at?: string | Date;
  event_id?: number;
  user_id: string;
  link?: string; // Bildirimin yönlendireceği link (opsiyonel)
}

// Bildirim oluşturma parametreleri
export interface CreateNotificationParams {
  notification_type: NotificationType;
  content: string;
  event_id?: number;
  user_id: string;
  link?: string;
}

// Bildirim listeleme parametreleri
export interface ListNotificationsParams {
  user_id?: string;
  read_status?: boolean;
  limit?: number;
  offset?: number;
} 
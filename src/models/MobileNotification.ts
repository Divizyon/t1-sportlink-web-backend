export enum MobileNotificationType {
  EVENT_REMINDER = 'event_reminder',
  EVENT_JOIN = 'event_join',         // Etkinliğe katılım
  EVENT_LEAVE = 'event_leave',       // Etkinlikten ayrılma
  EVENT_UPDATE = 'event_update',     // Etkinlik güncelleme (genel)
  EVENT_STATUS_CHANGE = 'event_status_change', // Etkinlik durumu değişikliği
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_COMPLETED = 'event_completed', // Etkinlik tamamlandı
  FRIEND_REQUEST = 'friend_request',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  NEW_MESSAGE = 'new_message',
  SYSTEM_NOTIFICATION = 'system_notification'
}

export enum PlatformType {
  IOS = 'ios',
  ANDROID = 'android'
}

export enum SendStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered' // Bu durumu FCM/APNS'den geri bildirim alabiliyorsanız kullanabilirsiniz
}

export interface MobileNotification {
  id?: number;
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read_status: boolean;
  send_status: SendStatus;
  notification_type: MobileNotificationType;
  created_at?: string;
  sent_at?: string;
  device_token?: string | null;
  platform?: PlatformType | null;
}

export interface CreateMobileNotificationDTO {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  notification_type: MobileNotificationType;
  device_token?: string | null;
  platform?: PlatformType | null;
}

export interface UserDevice {
  id?: number;
  user_id: string;
  device_token: string;
  device_type: PlatformType;
  app_version?: string;
  last_used_at?: string;
  created_at?: string;
}

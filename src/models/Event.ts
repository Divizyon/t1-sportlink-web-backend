import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - id
 *         - creator_id
 *         - sport_id
 *         - title
 *         - description
 *         - event_date
 *         - start_time
 *         - end_time
 *         - location_name
 *         - location_latitude
 *         - location_longitude
 *         - max_participants
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Etkinliğin benzersiz tanımlayıcısı
 *         creator_id:
 *           type: string
 *           format: uuid
 *           description: Etkinliği oluşturan kullanıcının ID'si
 *         sport_id:
 *           type: string
 *           format: uuid
 *           description: Etkinliğin spor türünün ID'si
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Etkinlik başlığı
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Etkinlik açıklaması
 *         event_date:
 *           type: string
 *           format: date-time
 *           description: Etkinlik tarihi
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: Etkinlik başlangıç zamanı
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: Etkinlik bitiş zamanı
 *         location_name:
 *           type: string
 *           maxLength: 200
 *           description: Etkinlik konumunun adı
 *         location_latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           format: float
 *           description: Etkinlik konumunun enlem bilgisi
 *         location_longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           format: float
 *           description: Etkinlik konumunun boylam bilgisi
 *         max_participants:
 *           type: integer
 *           minimum: 2
 *           maximum: 1000
 *           description: Maksimum katılımcı sayısı
 *         status:
 *           type: string
 *           enum: [ACTIVE, CANCELLED, COMPLETED]
 *           description: Etkinliğin durumu
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Etkinliğin oluşturulma zamanı
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Etkinliğin son güncellenme zamanı
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventParticipant'
 *           description: Etkinliğe katılan kullanıcılar
 *         ratings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventRating'
 *           description: Etkinlik değerlendirmeleri
 *         reports:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Report'
 *           description: Etkinlik raporları
 *
 *     EventParticipant:
 *       type: object
 *       required:
 *         - id
 *         - event_id
 *         - user_id
 *         - role
 *         - joined_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Katılımcı kaydının benzersiz tanımlayıcısı
 *         event_id:
 *           type: string
 *           format: uuid
 *           description: Etkinliğin ID'si
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Katılımcı kullanıcının ID'si
 *         role:
 *           type: string
 *           enum: [PARTICIPANT, ORGANIZER]
 *           description: Kullanıcının etkinlikteki rolü
 *         joined_at:
 *           type: string
 *           format: date-time
 *           description: Kullanıcının etkinliğe katılma tarihi
 *
 *     EventRating:
 *       type: object
 *       required:
 *         - id
 *         - event_id
 *         - rating
 *         - created_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Değerlendirmenin benzersiz tanımlayıcısı
 *         event_id:
 *           type: string
 *           format: uuid
 *           description: Değerlendirilen etkinliğin ID'si
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Etkinlik puanı (1-5 arası)
 *         review:
 *           type: string
 *           description: İsteğe bağlı değerlendirme yorumu
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Değerlendirmenin oluşturulma tarihi
 *
 *     Report:
 *       type: object
 *       required:
 *         - id
 *         - reporter_id
 *         - event_id
 *         - report_reason
 *         - report_date
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Raporun benzersiz tanımlayıcısı
 *         reporter_id:
 *           type: string
 *           format: uuid
 *           description: Raporu oluşturan kullanıcının ID'si
 *         event_id:
 *           type: string
 *           format: uuid
 *           description: Raporlanan etkinliğin ID'si
 *         report_reason:
 *           type: string
 *           description: Rapor nedeni
 *         report_date:
 *           type: string
 *           format: date-time
 *           description: Raporun oluşturulma tarihi
 *         status:
 *           type: string
 *           enum: [PENDING, REVIEWED, CLOSED]
 *           description: Raporun durumu
 *         admin_notes:
 *           type: string
 *           description: İsteğe bağlı yönetici notları
 *
 *     TodayEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Etkinlik ID'si
 *         title:
 *           type: string
 *           description: Etkinlik başlığı
 *         description:
 *           type: string
 *           description: Etkinlik açıklaması
 *         date:
 *           type: string
 *           format: date
 *           description: Etkinlik tarihi
 *         time:
 *           type: string
 *           description: Başlangıç saati (HH:MM)
 *         endTime:
 *           type: string
 *           description: Bitiş saati (HH:MM)
 *         location:
 *           type: string
 *           description: Etkinlik konumu
 *         category:
 *           type: string
 *           description: Etkinlik kategorisi
 *         participants:
 *           type: number
 *           description: Katılımcı sayısı
 *         maxParticipants:
 *           type: number
 *           description: Maksimum katılımcı sayısı
 *         status:
 *           type: string
 *           description: Etkinlik durumu
 *         organizer:
 *           type: string
 *           description: Organizatör adı
 *         isAttending:
 *           type: boolean
 *           description: Kullanıcı etkinliğe katılıyor mu
 */

export const EventStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
} as const;

export type EventStatus = typeof EventStatus[keyof typeof EventStatus];

export const EventParticipantRole = {
  PARTICIPANT: 'PARTICIPANT',
  ORGANIZER: 'ORGANIZER'
} as const;

export type EventParticipantRole = typeof EventParticipantRole[keyof typeof EventParticipantRole];

// Zod şemaları ile validasyon
export const EventValidationSchema = z.object({
  id: z.string().or(z.number()),
  creator_id: z.string().uuid(),
  sport_id: z.string().uuid().or(z.number()),
  title: z.string().min(3).max(100),
  description: z.string().max(1000),
  event_date: z.string().or(z.coerce.date()),
  start_time: z.string().or(z.coerce.date()),
  end_time: z.string().or(z.coerce.date()),
  location_name: z.string().max(200),
  location_latitude: z.number().min(-90).max(90),
  location_longitude: z.number().min(-180).max(180),
  max_participants: z.number().int().min(2).max(1000),
  status: z.enum([EventStatus.ACTIVE, EventStatus.CANCELLED, EventStatus.COMPLETED]),
  created_at: z.string().or(z.coerce.date()),
  updated_at: z.string().or(z.coerce.date()),
  sport: z.optional(z.object({
    id: z.number(),
    icon: z.string(),
    name: z.string(),
    description: z.string()
  })),
  sport_category: z.optional(z.string())
}).refine(
  (data) => {
    const endTime = typeof data.end_time === 'string' ? new Date(data.end_time) : data.end_time;
    const startTime = typeof data.start_time === 'string' ? new Date(data.start_time) : data.start_time;
    return endTime > startTime;
  },
  { message: "Bitiş zamanı başlangıç zamanından sonra olmalıdır" }
);

export const UpdateEventStatusSchema = z.object({
  status: z.enum([EventStatus.ACTIVE, EventStatus.CANCELLED, EventStatus.COMPLETED])
});

export type Event = z.infer<typeof EventValidationSchema>;
export type UpdateEventStatusDTO = z.infer<typeof UpdateEventStatusSchema>;

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  role: EventParticipantRole;
  joined_at: Date;
}

export interface EventRating {
  id: string;
  event_id: string;
  rating: number;
  review?: string;
  created_at: Date;
}

export interface EventReport {
  id: string;
  reporter_id: string;
  event_id: string;
  report_reason: string;
  report_date: Date;
  status: string;
  admin_notes?: string;
}

// Custom error sınıfları
export class EventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventValidationError';
  }
}

export class EventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`Etkinlik bulunamadı: ${eventId}`);
    this.name = 'EventNotFoundError';
  }
}

export class EventPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventPermissionError';
  }
}

export class EventStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventStatusError';
  }
}

export interface TodayEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  endTime: string;
  location: string;
  category: string;
  participants: number;
  maxParticipants: number;
  status: string;
  organizer: string;
  image: string | null;
  isAttending: boolean;
} 
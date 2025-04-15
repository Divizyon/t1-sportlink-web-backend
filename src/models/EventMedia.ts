/**
 * @swagger
 * components:
 *   schemas:
 *     EventMedia:
 *       type: object
 *       required:
 *         - id
 *         - event_id
 *         - media_type
 *         - media_url
 *         - storage_path
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Medya dosyasının benzersiz tanımlayıcısı
 *         event_id:
 *           type: string
 *           format: uuid
 *           description: İlişkili etkinliğin ID'si
 *         media_type:
 *           type: string
 *           enum: [image, video]
 *           description: Medya dosyasının tipi (görsel veya video)
 *         media_url:
 *           type: string
 *           description: Medya dosyasının genel erişilebilir URL'si
 *         thumbnail_url:
 *           type: string
 *           description: Medya dosyası için küçük resim URL'si (varsa)
 *         storage_path:
 *           type: string
 *           description: Medya dosyasının depolama sistemindeki yolu
 *         is_cover:
 *           type: boolean
 *           description: Bu görselin etkinlik kapağı olarak kullanılıp kullanılmadığı
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Medya dosyasının yüklenme tarihi
 */

export interface EventMedia {
  id: string;
  event_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  storage_path: string;
  is_cover: boolean;
  created_at: string;
}

export interface CreateEventMediaDTO {
  event_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  storage_path: string;
  is_cover?: boolean;
} 
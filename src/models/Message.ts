/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: Mesaj ID'si
 *         sender_id:
 *           type: string
 *           format: uuid
 *           description: Gönderen kullanıcının ID'si
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: Alıcı kullanıcının ID'si
 *         content:
 *           type: string
 *           description: Mesaj içeriği
 *         content_type:
 *           type: string
 *           enum: [text, image, video, file]
 *           default: text
 *           description: Mesaj içerik türü
 *         is_read:
 *           type: boolean
 *           description: Mesajın okunup okunmadığı
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Mesajın gönderilme tarihi
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Mesajın son güncellenme tarihi
 *     
 *     CreateMessageDTO:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Mesaj içeriği
 *         content_type:
 *           type: string
 *           enum: [text, image, video, file]
 *           default: text
 *           description: Mesaj içerik türü
 *     
 *     UnreadMessageCount:
 *       type: object
 *       properties:
 *         sender_id:
 *           type: string
 *           format: uuid
 *           description: Mesajın gönderen kullanıcı ID'si
 *         count:
 *           type: integer
 *           description: Okunmamış mesaj sayısı
 *         sender_name:
 *           type: string
 *           description: Gönderenin adı soyadı
 *         sender_avatar:
 *           type: string
 *           format: uri
 *           description: Gönderenin profil resmi
 *     
 *     Conversation:
 *       type: object
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *           description: Mesajların listesi
 *         peer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Konuşulan kişinin ID'si
 *             first_name:
 *               type: string
 *               description: Konuşulan kişinin adı
 *             last_name:
 *               type: string
 *               description: Konuşulan kişinin soyadı
 *             profile_picture:
 *               type: string
 *               format: uri
 *               description: Konuşulan kişinin profil resmi
 *             is_online:
 *               type: boolean
 *               description: Çevrimiçi durumu
 *             last_seen_at:
 *               type: string
 *               format: date-time
 *               description: Son görülme zamanı
 */

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'file';
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMessageDTO {
  receiver_id: string;
  content: string;
  content_type?: 'text' | 'image' | 'video' | 'file';
}

export interface UnreadMessageCount {
  sender_id: string;
  count: number;
  sender_name?: string;
  sender_avatar?: string;
}

export interface Conversation {
  messages: Message[];
  peer: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
    is_online: boolean;
    last_seen_at?: Date;
  };
}

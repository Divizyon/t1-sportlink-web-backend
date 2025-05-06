/**
 * @swagger
 * components:
 *   schemas:
 *     FriendshipRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: Arkadaşlık isteği ID'si
 *         requester_id:
 *           type: string
 *           format: uuid
 *           description: İsteği gönderen kullanıcının ID'si
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: İsteği alan kullanıcının ID'si
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           description: İsteğin durumu
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: İsteğin oluşturulma tarihi
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: İsteğin son güncelleme tarihi
 *     
 *     FriendshipRequestDTO:
 *       type: object
 *       required:
 *         - receiver_id
 *       properties:
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: Arkadaşlık isteği gönderilecek kullanıcının ID'si
 */

export interface FriendshipRequest {
    id: number;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * @swagger
   * components:
   *   schemas:
   *     Friendship:
   *       type: object
   *       properties:
   *         id:
 *           type: integer
 *           format: int64
 *           description: Arkadaşlık ID'si
 *         user_id_1:
 *           type: string
 *           format: uuid
 *           description: Birinci kullanıcının ID'si
 *         user_id_2:
 *           type: string
 *           format: uuid
 *           description: İkinci kullanıcının ID'si
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Arkadaşlığın oluşturulma tarihi
 *         last_message_at:
 *           type: string
 *           format: date-time
 *           description: Son mesajın gönderilme tarihi
 * 
 *     FriendshipResponseDTO:
 *       type: object
 *       required:
 *         - request_id
 *         - status
 *       properties:
 *         request_id:
 *           type: integer
 *           description: Yanıtlanan arkadaşlık isteğinin ID'si
 *         status:
 *           type: string
 *           enum: [accepted, rejected]
 *           description: İsteğe verilen yanıt
 */
  
  export interface Friendship {
    id: number;
    user_id_1: string;
    user_id_2: string;
    created_at: Date;
    last_message_at: Date;
  }
  
  export interface FriendshipRequestDTO {
    receiver_id: string;
  }
  
  export interface FriendshipResponseDTO {
    request_id: number;
    status: 'accepted' | 'rejected';
  }
  
  export interface FriendProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture: string;
    is_online: boolean;
    last_seen_at?: Date;
    mutual_friends_count?: number;
  }
  
  /**
   * @swagger
   * components:
   *   schemas:
   *     FriendProfile:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: Kullanıcı ID'si
   *         first_name:
   *           type: string
   *           description: Kullanıcının adı
   *         last_name:
   *           type: string
   *           description: Kullanıcının soyadı
   *         email:
   *           type: string
   *           format: email
   *           description: Kullanıcının e-posta adresi
   *         profile_picture:
   *           type: string
   *           format: uri
   *           description: Profil resmi URL'si
   *         is_online:
   *           type: boolean
   *           description: Kullanıcının çevrimiçi durumu
   *         last_seen_at:
   *           type: string
   *           format: date-time
   *           description: Son görülme zamanı
   *         mutual_friends_count:
   *           type: integer
   *           description: Ortak arkadaş sayısı
   */
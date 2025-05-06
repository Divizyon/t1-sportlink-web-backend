import express from 'express';
import * as FriendshipController from '../controllers/FriendshipController';
import { protect } from '../middleware/authMiddleware';
import supabase, { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

const router = express.Router();

// Tüm rotaları koruma altına alıyoruz
router.use(protect);

/**
 * @swagger
 * /api/mobile/friendships/test-db:
 *   get:
 *     summary: Veritabanı izinlerini test et
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test sonuçları
 *       500:
 *         description: Sunucu hatası
 */
router.get('/test-db', async (req, res) => {
  try {
    logger.info('Veritabanı izin testi başladı');
    
    // Çevre değişkenlerini log'a yaz
    const supabaseUrl = process.env.SUPABASE_URL || 'Tanımlanmamış';
    const serviceKeyStatus = process.env.SUPABASE_SERVICE_KEY ? 'Tanımlı' : 'Tanımlı değil';
    const anonKeyStatus = process.env.SUPABASE_KEY ? 'Tanımlı' : 'Tanımlı değil';
    
    logger.info(`Supabase URL: ${supabaseUrl}`);
    logger.info(`Service Key: ${serviceKeyStatus}`);
    logger.info(`Anon Key: ${anonKeyStatus}`);
    
    // 1. Normal client ile users tablosuna erişim testi
    const usersResult = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    logger.info(`Normal client ile users tablosuna erişim: ${usersResult.error ? 'Başarısız' : 'Başarılı'}`);
    
    // 2. Admin client ile users tablosuna erişim testi
    const usersAdminResult = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
      
    logger.info(`Admin client ile users tablosuna erişim: ${usersAdminResult.error ? 'Başarısız' : 'Başarılı'}`);
    
    // 3. Admin client ile friendship_requests tablosuna erişim testi
    const friendshipRequestsResult = await supabaseAdmin
      .from('friendship_requests')
      .select('*')
      .limit(1);
      
    logger.info(`Admin client ile friendship_requests tablosuna erişim: ${friendshipRequestsResult.error ? 'Başarısız' : 'Başarılı'}`);
    
    // 4. REST API ile friendship_requests tablosuna erişim testi
    try {
      const url = `${process.env.SUPABASE_URL}/rest/v1/friendship_requests?limit=1`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''}`
      };
      
      logger.info(`REST API isteği yapılıyor: ${url}`);
      logger.info(`Headers: ${JSON.stringify(headers)}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`REST API hatası: ${response.status} - ${errorText}`);
        throw new Error(`REST API hatası: ${response.status}`);
      }
      
      const data = await response.json();
      logger.info(`REST API ile friendship_requests tablosuna erişim: Başarılı, Sonuç: ${JSON.stringify(data)}`);
    } catch (restError) {
      logger.error(`REST API ile friendship_requests tablosuna erişim: Başarısız, Hata: ${restError}`);
    }
    
    // 5. Admin client ile test verisi ekleme
    try {
      const testInsertResult = await supabaseAdmin
        .from('friendship_requests')
        .insert({
          requester_id: req.userId,
          receiver_id: '00000000-0000-0000-0000-000000000000', // Geçersiz bir UUID, sadece test için
          status: 'pending'
        })
        .select();
        
      logger.info(`Veri ekleme testi: ${testInsertResult.error ? `Başarısız: ${JSON.stringify(testInsertResult.error)}` : 'Başarılı'}`);
      
      // Eklenen test verisi varsa temizleyelim
      if (testInsertResult.data && testInsertResult.data.length > 0) {
        const deleteResult = await supabaseAdmin
          .from('friendship_requests')
          .delete()
          .eq('id', testInsertResult.data[0].id);
          
        logger.info(`Test verisi temizleme: ${deleteResult.error ? 'Başarısız' : 'Başarılı'}`);
      }
    } catch (insertError) {
      logger.error(`Veri ekleme testi: Başarısız, Hata: ${insertError}`);
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Veritabanı izin testleri tamamlandı, logları kontrol edin.'
    });
  } catch (error) {
    logger.error(`Veritabanı izin testi genel hatası: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: 'Veritabanı izin testi sırasında bir hata oluştu.'
    });
  }
});

/**
 * @swagger
 * /api/mobile/friendships/requests:
 *   post:
 *     summary: Arkadaşlık isteği gönder
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendshipRequestDTO'
 *     responses:
 *       201:
 *         description: Arkadaşlık isteği gönderildi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/requests', FriendshipController.sendFriendRequest);

/**
 * @swagger
 * /api/mobile/friendships/requests/incoming:
 *   get:
 *     summary: Gelen arkadaşlık isteklerini listele
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arkadaşlık istekleri listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/requests/incoming', FriendshipController.getIncomingFriendRequests);

/**
 * @swagger
 * /api/mobile/friendships/requests/outgoing:
 *   get:
 *     summary: Gönderilen arkadaşlık isteklerini listele
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arkadaşlık istekleri listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/requests/outgoing', FriendshipController.getOutgoingFriendRequests);

/**
 * @swagger
 * /api/mobile/friendships/requests/{requestId}:
 *   put:
 *     summary: Arkadaşlık isteğini yanıtla
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: İstek başarıyla yanıtlandı
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: İstek bulunamadı
 */
router.put('/requests/:requestId', FriendshipController.respondToFriendRequest);

/**
 * @swagger
 * /api/mobile/friendships:
 *   get:
 *     summary: Arkadaşları listele
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arkadaşlar listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/', FriendshipController.getFriends);

/**
 * @swagger
 * /api/mobile/friendships/{friendId}:
 *   delete:
 *     summary: Arkadaşlığı sil
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Arkadaşlık başarıyla silindi
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Arkadaşlık bulunamadı
 */
router.delete('/:friendId', FriendshipController.removeFriendship);

/**
 * @swagger
 * /api/mobile/friendships/status:
 *   put:
 *     summary: Çevrimiçi durumunu güncelle
 *     tags: [Mobile - Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_online:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Durum başarıyla güncellendi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/status', FriendshipController.updateOnlineStatus);

export default router;

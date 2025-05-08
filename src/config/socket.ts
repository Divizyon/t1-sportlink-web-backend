import { Server } from 'socket.io';
import http from 'http';
import supabase , { supabaseAdmin } from './supabase';
import logger from '../utils/logger';

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Production'da güvenli domainleri belirtin
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Yeni socket bağlantısı: ${socket.id}`);
    
    // Kullanıcı kimlik doğrulama ve oda katılımı
    socket.on('authenticate', async (data: { token: string, userId: string }) => {
      try {
        // Token doğrulama
        const { data: authData, error } = await supabaseAdmin.auth.getUser(data.token);
        
        if (error || !authData.user) {
          socket.emit('error', { message: 'Kimlik doğrulama başarısız' });
          return;
        }
        
        // Kullanıcının kendi odasına katılması
        const userId = authData.user.id;
        socket.join(`user:${userId}`);
        logger.info(`Kullanıcı ${userId} odasına katıldı`);
        
        // Çevrimiçi durumunu güncelle
        await supabaseAdmin
          .from('users')
          .update({ 
            is_online: true,
            last_seen_at: new Date()
          })
          .eq('id', userId);
          
        socket.emit('authenticated', { userId });
        
        // Bağlantı kesildiğinde
        socket.on('disconnect', async () => {
          await supabaseAdmin
            .from('users')
            .update({ 
              is_online: false,
              last_seen_at: new Date()
            })
            .eq('id', userId);
            
          logger.info(`Kullanıcı bağlantısı kesildi: ${userId}`);
        });
        
        // Kullanıcının okunmamış uyarı mesajlarını gönder - Yeni eklenen kısım
        const { data: unreadWarnings, error: warningsError } = await supabaseAdmin
          .from('User_Warnings')
          .select('*')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('sent_at', { ascending: false });
        
        if (!warningsError && unreadWarnings && unreadWarnings.length > 0) {
          // Admin bilgilerini ayrı bir sorguda alıp birleştirelim
          const adminIds = [...new Set(unreadWarnings.map(warning => warning.admin_id))];
          
          if (adminIds.length > 0) {
            const { data: admins, error: adminsError } = await supabaseAdmin
              .from('users')
              .select('id, first_name, last_name')
              .in('id', adminIds);
            
            if (!adminsError && admins) {
              // Admin bilgilerini uyarı verilerine ekleyelim
              const warningsWithAdmins = unreadWarnings.map(warning => {
                const admin = admins.find(a => a.id === warning.admin_id);
                return {
                  ...warning,
                  admin: admin ? {
                    first_name: admin.first_name,
                    last_name: admin.last_name
                  } : null
                };
              });
              
              socket.emit('unread_warnings', { warnings: warningsWithAdmins });
              logger.info(`Kullanıcıya ${unreadWarnings.length} adet okunmamış uyarı gönderildi: ${userId}`);
            } else {
              // Admin bilgileri alınamazsa, sadece uyarıları gönder
              socket.emit('unread_warnings', { warnings: unreadWarnings });
              logger.info(`Kullanıcıya ${unreadWarnings.length} adet okunmamış uyarı gönderildi (admin bilgileri olmadan): ${userId}`);
            }
          } else {
            socket.emit('unread_warnings', { warnings: unreadWarnings });
            logger.info(`Kullanıcıya ${unreadWarnings.length} adet okunmamış uyarı gönderildi: ${userId}`);
          }
        }
      } catch (error) {
        logger.error('Socket kimlik doğrulama hatası:', error);
        socket.emit('error', { message: 'Sunucu hatası' });
      }
    });
    
    // Özel mesaj gönderme
    socket.on('send_message', async (data: { receiverId: string, content: string, contentType?: string }) => {
      try {
        const { receiverId, content, contentType = 'text' } = data;
        const senderId = getSocketUserId(socket);
        
        if (!senderId) {
          socket.emit('error', { message: 'Kimlik doğrulama gerekli' });
          return;
        }
        
        // Mesajı veritabanına kaydet
        const { data: message, error } = await supabaseAdmin
          .from('messages')
          .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            content_type: contentType,
            is_read: false
          })
          .select()
          .single();
          
        if (error) {
          socket.emit('error', { message: 'Mesaj gönderilemedi' });
          return;
        }
        
        // Arkadaşlığın son mesaj zamanını güncelle
        await updateLastMessageTime(senderId, receiverId);
        
        // Alıcıya ve gönderene mesajı bildir
        io.to(`user:${receiverId}`).emit('new_message', message);
        socket.emit('message_sent', message);
        
      } catch (error) {
        logger.error('Mesaj gönderme hatası:', error);
        socket.emit('error', { message: 'Sunucu hatası' });
      }
    });
    
    // Mesajları okundu olarak işaretle
    socket.on('mark_messages_read', async (data: { senderId: string }) => {
      try {
        const { senderId } = data;
        const receiverId = getSocketUserId(socket);
        
        if (!receiverId) {
          socket.emit('error', { message: 'Kimlik doğrulama gerekli' });
          return;
        }
        
        // Mesajları güncelle
        const { error } = await supabaseAdmin
          .from('messages')
          .update({ is_read: true, updated_at: new Date() })
          .eq('sender_id', senderId)
          .eq('receiver_id', receiverId)
          .eq('is_read', false);
          
        if (error) {
          socket.emit('error', { message: 'Mesajlar işaretlenemedi' });
          return;
        }
        
        // Okundu bildirimi gönder
        io.to(`user:${senderId}`).emit('messages_read', { 
          by: receiverId,
          timestamp: new Date()
        });
        
        socket.emit('marked_as_read', { success: true });
        
      } catch (error) {
        logger.error('Mesaj okundu işaretleme hatası:', error);
        socket.emit('error', { message: 'Sunucu hatası' });
      }
    });
    
    // Uyarı mesajlarını okundu olarak işaretle - Yeni eklenen kısım
    socket.on('mark_warning_read', async (data: { warningId: string }) => {
      try {
        const { warningId } = data;
        const userId = getSocketUserId(socket);
        
        if (!userId) {
          socket.emit('error', { message: 'Kimlik doğrulama gerekli' });
          return;
        }
        
        // Tablo adını sabit olarak belirle
        const validTable = 'User_Warnings';

        // Güvenlik kontrolü: Uyarının gerçekten bu kullanıcıya ait olduğundan emin olun
        const { data: warning, error: checkError } = await supabaseAdmin
          .from(validTable)
          .select('id')
          .eq('id', warningId)
          .eq('user_id', userId)
          .single();
        
        if (checkError || !warning) {
          socket.emit('error', { message: 'Uyarı mesajı bulunamadı veya bu kullanıcıya ait değil' });
          return;
        }
        
        // Uyarıyı okundu olarak işaretle - updated_at alanı olmadığı için yalnızca is_read güncelleniyor
        const { error } = await supabaseAdmin
          .from(validTable)
          .update({ is_read: true })
          .eq('id', warningId);
          
        if (error) {
          socket.emit('error', { message: 'Uyarı işaretlenemedi' });
          return;
        }
        
        socket.emit('warning_read', { warningId, success: true });
        
      } catch (error) {
        logger.error('Uyarı okundu işaretleme hatası:', error);
        socket.emit('error', { message: 'Sunucu hatası' });
      }
    });
  });
  
  return io;
};

// Kullanıcı ID'sini socket'ten alma yardımcı fonksiyonu
const getSocketUserId = (socket: any) => {
  const userRooms = Array.from(socket.rooms)
    .filter((room): room is string => typeof room === 'string' && room.startsWith('user:'))
    .map((room) => room.replace('user:', ''));
    
  return userRooms[0] || null;
};

// Son mesaj zamanını güncelleme yardımcı fonksiyonu
const updateLastMessageTime = async (userId1: string, userId2: string) => {
  try {
    const { data: friendship } = await supabaseAdmin
      .from('friendships')
      .select('id')
      .or(`and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`)
      .single();
      
    if (friendship) {
      await supabaseAdmin
        .from('friendships')
        .update({ last_message_at: new Date() })
        .eq('id', friendship.id);
    }
  } catch (error) {
    logger.error('Son mesaj zamanı güncelleme hatası:', error);
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO henüz başlatılmadı');
  }
  return io;
};

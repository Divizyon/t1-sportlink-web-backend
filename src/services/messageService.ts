import supabase, { supabaseAdmin } from '../config/supabase';
import { Message, CreateMessageDTO, UnreadMessageCount, Conversation } from '../models/Message';
import { getIO } from '../config/socket';

/**
 * Mesaj gönderir
 */
export const sendMessage = async (senderId: string, receiverId: string, content: string, contentType: string = 'text'): Promise<Message> => {
  console.log(`Mesaj gönderme başladı. Gönderen: ${senderId}, Alıcı: ${receiverId}`);
  try {
    // Arkadaşlık kontrolü
    console.log('Arkadaşlık kontrolü yapılıyor...');
    const { data: friendship, error: friendshipError } = await supabaseAdmin
      .from('friendships')
      .select('*')
      .or(`and(user_id_1.eq.${senderId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${senderId})`)
      .maybeSingle();

    if (friendshipError) {
      console.error(`Arkadaşlık kontrolü hatası: ${JSON.stringify(friendshipError)}`);
      throw friendshipError;
    }

    if (!friendship) {
      console.error(`Arkadaşlık bulunamadı: ${senderId} -> ${receiverId}`);
      throw new Error('Bu kullanıcıya mesaj göndermek için önce arkadaş olmalısınız.');
    }

    console.log(`Arkadaşlık bulundu: ${JSON.stringify(friendship)}`);

    // Mesaj gönder
    console.log('Mesaj gönderiliyor...');
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        content_type: contentType,
        is_read: false
      })
      .select();

    if (error) {
      console.error(`Mesaj gönderme hatası: ${JSON.stringify(error)}`);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('Mesaj kaydedildi ancak veri dönmedi');
      throw new Error('Mesaj gönderilirken bir hata oluştu');
    }
    
    console.log(`Mesaj başarıyla kaydedildi: ${JSON.stringify(data[0])}`);
  
    // Arkadaşlığın son mesaj zamanını güncelle
    console.log('Son mesaj zamanı güncelleniyor...');
    const { error: updateError } = await supabaseAdmin
      .from('friendships')
      .update({ last_message_at: new Date() })
      .eq('id', friendship.id);

    if (updateError) {
      console.error(`Son mesaj zamanı güncelleme hatası: ${JSON.stringify(updateError)}`);
      // Bu hata ana işlemi etkilemesin
    }
  
    console.log('Mesaj gönderme işlemi tamamlandı');
    return data[0];
  } catch (error) {
    console.error('Mesaj gönderme genel hatası:', error);
    throw error;
  }
};

/**
 * Bir arkadaşla olan konuşmayı getirir
 */
export const getConversation = async (userId: string, friendId: string, limit = 50, offset = 0): Promise<Conversation> => {
  // Arkadaşlık kontrolü
  const { data: friendship, error: friendshipError } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`)
    .maybeSingle();

  if (friendshipError) throw friendshipError;

  if (!friendship) {
    throw new Error('Bu kullanıcı ile görüşmelerinizi görmek için önce arkadaş olmalısınız.');
  }

  // Arkadaş profilini getir
  const { data: friendProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, profile_picture, is_online, last_seen_at')
    .eq('id', friendId)
    .single();

  if (profileError) throw profileError;

  // Mesajları getir
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  return {
    messages: data || [],
    peer: friendProfile
  };
};

/**
 * Mesajları okundu olarak işaretler
 * 
 * Bu fonksiyon, bir arkadaşın (friendId) bir kullanıcıya (userId) gönderdiği
 * ve henüz okunmamış olan mesajları okundu olarak işaretler.
 */
export const markMessagesAsRead = async (userId: string, friendId: string) => {
  console.log(`Mesajları okundu olarak işaretleniyor. Kullanıcı: ${userId}, Arkadaş: ${friendId}`);
  console.log(`Şu mesajlar işaretlenecek: ${friendId} tarafından gönderilen ve ${userId} tarafından alınan okunmamış mesajlar`);

  try {
    // Arkadaşın gönderdiği ve kullanıcının aldığı okunmamış mesajları okundu olarak işaretle
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true, updated_at: new Date() })
      .eq('sender_id', friendId)  // Mesajı gönderen: arkadaş
      .eq('receiver_id', userId)  // Mesajı alan: aktif kullanıcı
      .eq('is_read', false);      // Sadece okunmamış mesajlar
    
    if (error) {
      console.error(`Mesajları okundu olarak işaretleme hatası: ${JSON.stringify(error)}`);
      throw error;
    }
    
    console.log(`${friendId} tarafından gönderilen mesajlar başarıyla okundu olarak işaretlendi.`);
    return { success: true };
  } catch (error) {
    console.error('Mesajları okundu olarak işaretleme genel hatası:', error);
    throw error;
  }
};

/**
 * Okunmamış mesaj sayılarını getirir
 */
export const getUnreadMessageCount = async (userId: string): Promise<UnreadMessageCount[]> => {
  const { data, error } = await supabaseAdmin.rpc('get_unread_message_count', {
    user_id: userId
  });

  if (error) {
    console.error('Okunmamış mesaj sayısı RPC hatası:', error);
    throw error;
  }
  
  console.log('Okunmamış mesaj sayısı ham verisi:', JSON.stringify(data));
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Gönderen bilgilerini ekle
  const senderIds = data.map((item: {sender_id: string}) => item.sender_id);
  const { data: senders, error: sendersError } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, profile_picture')
    .in('id', senderIds);
  
  if (sendersError) {
    console.error('Okunmamış mesaj gönderen bilgileri hatası:', sendersError);
    throw sendersError;
  }
  
  // Sonuçları birleştir
  const result = data.map((item: {sender_id: string, count: string | number}) => {
    const sender = senders?.find(s => s.id === item.sender_id);
    // count tipini kontrol et ve sayıya dönüştür
    let countValue: number;
    if (typeof item.count === 'string') {
      countValue = parseInt(item.count);
    } else if (typeof item.count === 'number') {
      countValue = item.count;
    } else {
      console.warn(`Beklenmeyen count türü: ${typeof item.count}, değer: ${item.count}`);
      countValue = 0;
    }
    
    return {
      sender_id: item.sender_id,
      count: countValue,
      sender_name: sender ? `${sender.first_name} ${sender.last_name}` : undefined,
      sender_avatar: sender?.profile_picture
    };
  });
  
  console.log('İşlenmiş okunmamış mesaj sayısı:', JSON.stringify(result));
  return result;
};

/**
 * Sohbet listesini getirir
 */
export const getChatList = async (userId: string) => {
  // Kullanıcının arkadaşlarını bul
  const { data: friendships, error: friendshipsError } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (friendshipsError) throw friendshipsError;
  
  if (!friendships || friendships.length === 0) {
    return [];
  }
  
  // Arkadaş ID'lerini topla
  const friendIds = friendships.map(friendship =>
    friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1
  );
  
  // Arkadaş profillerini getir
  const { data: friends, error: friendsError } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, profile_picture, is_online, last_seen_at')
    .in('id', friendIds);
  
  if (friendsError) throw friendsError;
  
  // Her arkadaş için son mesajı getir
  const chatList = await Promise.all(
    friendships.map(async (friendship) => {
      const friendId = friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1;
      const friend = friends?.find(f => f.id === friendId);
      
      if (!friend) return null;
      
      // Son mesajı getir
      const { data: lastMessage } = await supabaseAdmin
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Okunmamış mesaj sayısını getir
      const { count: unreadCount, error: unreadCountError } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
      
      if (unreadCountError) {
        console.error(`Okunmamış mesaj sayısı hatası: ${JSON.stringify(unreadCountError)}`);
      }

      return {
        friend,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
        last_activity: friendship.last_message_at
      };
    })
  );
  
  // null değerleri filtrele ve son aktiviteye göre sırala
  return chatList
    .filter(Boolean)
    .sort((a, b) => new Date(b!.last_activity).getTime() - new Date(a!.last_activity).getTime());
};

/**
 * Socket üzerinden mesaj gönderir
 */
export const sendMessageViaSocket = async (senderId: string, receiverId: string, content: string, contentType: string = 'text'): Promise<Message> => {
  // Önce normal mesaj gönderme işlemi
  const message = await sendMessage(senderId, receiverId, content, contentType);
  
  // Socket.IO ile bildirim gönder
  const io = getIO();
  io.to(`user:${receiverId}`).emit('new_message', message);
  
  return message;
};

/**
 * Socket üzerinden mesajları okundu olarak işaretler
 */
export const markMessagesAsReadViaSocket = async (userId: string, friendId: string) => {
  // Önce normal okundu işaretleme
  const result = await markMessagesAsRead(userId, friendId);
  
  // Socket.IO ile bildirim gönder
  const io = getIO();
  io.to(`user:${friendId}`).emit('messages_read', { 
    by: userId,
    timestamp: new Date()
  });
  
  return result;
};

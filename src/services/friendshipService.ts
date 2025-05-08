import supabase, { supabaseAdmin } from '../config/supabase';
import { FriendshipRequest, Friendship, FriendProfile } from '../models/Friendship';
import logger from '../utils/logger';

/**
 * Arkadaşlık isteği gönderir
 */
export const sendFriendRequest = async (requesterId: string, receiverId: string): Promise<FriendshipRequest> => {
  logger.info(`Arkadaşlık isteği gönderme başladı: ${requesterId} -> ${receiverId}`);
  
  try {
    // Kendine istek göndermeyi engelle
    if (requesterId === receiverId) {
      throw new Error('Kendinize arkadaşlık isteği gönderemezsiniz.');
    }

    // Supabase bağlantı bilgilerini log'a yazdır
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_KEY ? 'Tanımlı' : 'Tanımlı değil';
    logger.info(`Supabase bağlantı kontrolü: URL=${supabaseUrl}, SERVICE_KEY=${serviceRole}`);

    // Mevcut arkadaşlık kontrolü
    logger.info('Mevcut arkadaşlık kontrolü başlıyor...');
    const { data: existingFriendship, error: friendshipError } = await supabaseAdmin
      .from('friendships')
      .select('*')
      .or(`and(user_id_1.eq.${requesterId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${requesterId})`)
      .maybeSingle();
      
    if (friendshipError) {
      logger.error(`Arkadaşlık kontrolü hatası: ${JSON.stringify(friendshipError)}`);
      throw friendshipError;
    }

    if (existingFriendship) {
      logger.info(`Mevcut arkadaşlık bulundu: ${JSON.stringify(existingFriendship)}`);
      throw new Error('Bu kullanıcı ile zaten arkadaşsınız.');
    }

    // Mevcut istek kontrolü
    logger.info('Mevcut arkadaşlık isteği kontrolü başlıyor...');
    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
      .from('friendship_requests')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('receiver_id', receiverId)
      .or('status.eq.pending,status.eq.rejected,status.eq.deleted')
      .maybeSingle();
      
    if (existingRequestError) {
      logger.error(`Mevcut istek kontrolü hatası: ${JSON.stringify(existingRequestError)}`);
      throw existingRequestError;
    }

    if (existingRequest) {
      // Eğer istek varsa ve reddedilmişse veya silinmişse, durumunu pending'e güncelle
      if (existingRequest.status === 'rejected' || existingRequest.status === 'deleted') {
        logger.info(`${existingRequest.status} durumundaki istek bulundu, durumu güncelleniyor: ${JSON.stringify(existingRequest)}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('friendship_requests')
          .update({ 
            status: 'pending', 
            updated_at: new Date() 
          })
          .eq('id', existingRequest.id);
          
        if (updateError) {
          logger.error(`İstek durumu güncelleme hatası: ${JSON.stringify(updateError)}`);
          throw updateError;
        }
        
        // Güncellenmiş isteği getir
        const { data: updatedRequest, error: getError } = await supabaseAdmin
          .from('friendship_requests')
          .select('*')
          .eq('id', existingRequest.id)
          .single();
          
        if (getError) {
          logger.error(`Güncellenmiş isteği alma hatası: ${JSON.stringify(getError)}`);
          throw getError;
        }
        
        logger.info(`İstek durumu başarıyla güncellendi: ${JSON.stringify(updatedRequest)}`);
        return updatedRequest;
      } else {
        // Pending veya accepted ise hata ver
        logger.info(`Mevcut istek bulundu: ${JSON.stringify(existingRequest)}`);
        if (existingRequest.status === 'pending') {
          throw new Error('Bu kullanıcıya zaten bir arkadaşlık isteği gönderdiniz.');
        } else if (existingRequest.status === 'accepted') {
          throw new Error('Bu kullanıcı ile zaten arkadaşsınız.');
        }
      }
    }

    // Tersine istek kontrolü
    logger.info('Tersine arkadaşlık isteği kontrolü başlıyor...');
    const { data: reverseRequest, error: reverseRequestError } = await supabaseAdmin
      .from('friendship_requests')
      .select('*')
      .eq('requester_id', receiverId)
      .eq('receiver_id', requesterId)
      .eq('status', 'pending')
      .maybeSingle();
      
    if (reverseRequestError) {
      logger.error(`Tersine istek kontrolü hatası: ${JSON.stringify(reverseRequestError)}`);
      throw reverseRequestError;
    }

    if (reverseRequest) {
      logger.info(`Tersine istek bulundu: ${JSON.stringify(reverseRequest)}`);
      throw new Error('Bu kullanıcı size zaten bir arkadaşlık isteği göndermiş. İsteği kabul edebilirsiniz.');
    }

    // Silinmiş bir arkadaşlığımız var mı kontrol edelim
    const { data: deletedRequest, error: deletedRequestError } = await supabaseAdmin
      .from('friendship_requests')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
      .eq('status', 'deleted')
      .maybeSingle();

    if (deletedRequestError) {
      logger.error(`Silinmiş istek kontrolü hatası: ${JSON.stringify(deletedRequestError)}`);
      // Bu hatayı fırlatmıyoruz, ana akışı etkilemesin
    }

    // Silinmiş istekle ilgili bilgi logla (varsa)
    if (deletedRequest) {
      logger.info(`Daha önce silinmiş bir arkadaşlık isteği bulundu: ${JSON.stringify(deletedRequest)}`);
      
      // Bu durumda, silinmiş isteğin durumunu güncelleyerek tekrar kullanabiliriz
      const { error: updateError } = await supabaseAdmin
        .from('friendship_requests')
        .update({ 
          status: 'pending', 
          updated_at: new Date(),
          requester_id: requesterId,
          receiver_id: receiverId
        })
        .eq('id', deletedRequest.id);
        
      if (updateError) {
        logger.error(`Silinmiş istek güncelleme hatası: ${JSON.stringify(updateError)}`);
        // Bu hatayı fırlatmıyoruz, yeni bir istek oluşturmaya devam edeceğiz
      } else {
        // Başarıyla güncellendiyse, güncellenmiş isteği döndür
        const { data: updatedRequest, error: getError } = await supabaseAdmin
          .from('friendship_requests')
          .select('*')
          .eq('id', deletedRequest.id)
          .single();
          
        if (!getError && updatedRequest) {
          logger.info(`Silinmiş istek başarıyla güncellendi ve tekrar aktifleştirildi: ${JSON.stringify(updatedRequest)}`);
          return updatedRequest;
        }
      }
    }

    // Yeni istek oluştur
    logger.info('Yeni arkadaşlık isteği oluşturma başlıyor...');
    
    // DÜZELTME: Herhangi bir durumda kayıt var mı diye tüm durumları kapsayan bir sorgu yapalım
    const { data: anyExistingRequest, error: anyExistingError } = await supabaseAdmin
      .from('friendship_requests')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('receiver_id', receiverId)
      .maybeSingle();
    
    if (anyExistingError) {
      logger.error(`Genel istek kontrolü hatası: ${JSON.stringify(anyExistingError)}`);
      // Bu hatayı fırlatmıyoruz, devam ediyoruz
    }
    
    // Eğer herhangi bir durumda kayıt varsa, onu güncelle
    if (anyExistingRequest) {
      logger.info(`Daha önceden herhangi bir durumda istek kaydı bulundu: ${JSON.stringify(anyExistingRequest)}`);
      
      const { error: updateError } = await supabaseAdmin
        .from('friendship_requests')
        .update({ 
          status: 'pending',
          updated_at: new Date() 
        })
        .eq('id', anyExistingRequest.id);
        
      if (updateError) {
        logger.error(`Mevcut isteği güncelleme hatası: ${JSON.stringify(updateError)}`);
        throw updateError;
      }
      
      // Güncellenmiş isteği getir
      const { data: updatedRequest, error: getError } = await supabaseAdmin
        .from('friendship_requests')
        .select('*')
        .eq('id', anyExistingRequest.id)
        .single();
        
      if (getError) {
        logger.error(`Güncellenmiş genel isteği alma hatası: ${JSON.stringify(getError)}`);
        throw getError;
      }
      
      logger.info(`İstek durumu başarıyla güncellendi: ${JSON.stringify(updatedRequest)}`);
      return updatedRequest;
    }
    
    // Eğer daha önce hiç istek yoksa yeni oluştur
    const requestData = {
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 'pending'
    };
    logger.info(`İstek verisi: ${JSON.stringify(requestData)}`);
    
    // Supabase SDK ile doğrudan ekleyelim
    const { data, error: insertError } = await supabaseAdmin
      .from('friendship_requests')
      .insert(requestData)
      .select()
      .single();

    if (insertError) {
      logger.error(`Arkadaşlık isteği oluşturma hatası: ${JSON.stringify(insertError)}`);
      throw insertError;
    }
    
    if (!data) {
      logger.error('Arkadaşlık isteği oluşturuldu ancak veri döndürülmedi');
      throw new Error('Arkadaşlık isteği kaydedilirken bir sorun oluştu');
    }
    
    logger.info(`Arkadaşlık isteği başarıyla oluşturuldu: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    logger.error(`Arkadaşlık isteği gönderme genel hatası: ${error}`);
    // Hata bilgisini konsolda daha detaylı görüntüleyelim
    console.error('Arkadaşlık isteği gönderme hatası:', error);
    throw error;
  }
};

/**
 * Gelen arkadaşlık isteklerini listeler
 */
export const getIncomingFriendRequests = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabaseAdmin
    .from('friendship_requests')
    .select(`
      *,
      requester:requester_id(
        id, 
        first_name, 
        last_name, 
        email, 
        profile_picture,
        is_online,
        last_seen_at
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  
  // Her istek için ortak arkadaş sayısını hesapla
  const requestsWithMutualCount = await Promise.all(
    (data || []).map(async (request) => {
      const { data: mutualCount } = await supabaseAdmin.rpc('get_mutual_friends_count', {
        user_id_1: userId,
        user_id_2: request.requester_id
      });
      
      return {
        ...request,
        mutual_friends_count: mutualCount || 0
      };
    })
  );
  
  return requestsWithMutualCount;
};

/**
 * Gönderilen arkadaşlık isteklerini listeler
 */
export const getOutgoingFriendRequests = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabaseAdmin
    .from('friendship_requests')
    .select(`
      *,
      receiver:receiver_id(
        id, 
        first_name, 
        last_name, 
        email, 
        profile_picture,
        is_online,
        last_seen_at
      )
    `)
    .eq('requester_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  
  return data || [];
};

/**
 * Arkadaşlık isteğini yanıtlar (kabul/red)
 */
export const respondToFriendRequest = async (
  requestId: number, 
  status: 'accepted' | 'rejected', 
  userId: string
) => {
  // İsteği bul
  const { data: request, error: requestError } = await supabaseAdmin
    .from('friendship_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .single();

  if (requestError) throw new Error('Geçerli bir arkadaşlık isteği bulunamadı.');

  if (!request) {
    throw new Error('Bu arkadaşlık isteğini yanıtlama yetkiniz yok veya istek zaten yanıtlanmış.');
  }

  // İstek durumunu güncelle
  const { error: updateError } = await supabaseAdmin
    .from('friendship_requests')
    .update({ status, updated_at: new Date() })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Eğer kabul edildiyse, arkadaşlık oluştur
  if (status === 'accepted') {
    const { error: friendshipError } = await supabaseAdmin
      .from('friendships')
      .insert({
        user_id_1: request.requester_id,
        user_id_2: request.receiver_id
      });

    if (friendshipError) throw friendshipError;

    // Bu iki kullanıcı arasındaki diğer bekleyen istekleri reddet
    logger.info(`Kabul edilen istek nedeniyle diğer bekleyen istekleri reddediyorum. Kullanıcılar: ${request.requester_id} ve ${request.receiver_id}`);
    
    const { error: rejectOtherRequestsError } = await supabaseAdmin
      .from('friendship_requests')
      .update({ 
        status: 'rejected', 
        updated_at: new Date() 
      })
      .not('id', 'eq', requestId)
      .eq('status', 'pending')
      .or(`and(requester_id.eq.${request.requester_id},receiver_id.eq.${request.receiver_id}),and(requester_id.eq.${request.receiver_id},receiver_id.eq.${request.requester_id})`)
    
    if (rejectOtherRequestsError) {
      logger.error(`Diğer istekleri reddetme hatası: ${JSON.stringify(rejectOtherRequestsError)}`);
      // Ana işlemi etkilememesi için hatayı fırlatmıyoruz, sadece logluyoruz
    }
  }

  return { success: true, status };
};

/**
 * Kullanıcının arkadaşlarını listeler
 */
export const getFriends = async (userId: string): Promise<FriendProfile[]> => {
  // Kullanıcının aktif arkadaşlarını bul (her iki yönde)
  const { data: friendships, error } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  if (error) {
    logger.error(`Arkadaşlık bulma hatası: ${JSON.stringify(error)}`);
    throw error;
  }

  if (!friendships || friendships.length === 0) {
    return [];
  }

  // Arkadaş ID'lerini topla
  const friendIds = friendships.map(friendship => 
    friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1
  );

  logger.info(`${userId} kullanıcısının ${friendIds.length} aktif arkadaşlığı bulundu.`);

  // Arkadaş profillerini getir
  const { data: friends, error: friendsError } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, profile_picture, is_online, last_seen_at')
    .in('id', friendIds);

  if (friendsError) {
    logger.error(`Arkadaş profilleri getirme hatası: ${JSON.stringify(friendsError)}`);
    throw friendsError;
  }

  return friends || [];
};

/**
 * Arkadaşlığı siler
 */
export const removeFriendship = async (userId: string, friendId: string) => {
  // Arkadaşlığı bul
  const { data: friendship, error: findError } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`)
    .single();

  if (findError || !friendship) {
    throw new Error('Bu kullanıcı ile arkadaşlık bulunamadı.');
  }

  // İlgili arkadaşlık isteğini bul
  const { data: friendshipRequest, error: requestError } = await supabaseAdmin
    .from('friendship_requests')
    .select('*')
    .or(`and(requester_id.eq.${userId},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${userId})`)
    .eq('status', 'accepted')
    .maybeSingle();

  // Arkadaşlığı sil
  const { error: deleteError } = await supabaseAdmin
    .from('friendships')
    .delete()
    .eq('id', friendship.id);

  if (deleteError) throw deleteError;

  // İlgili arkadaşlık isteği varsa, durumunu 'deleted' olarak güncelle
  if (friendshipRequest) {
    const { error: updateError } = await supabaseAdmin
      .from('friendship_requests')
      .update({ 
        status: 'deleted', 
        updated_at: new Date() 
      })
      .eq('id', friendshipRequest.id);

    if (updateError) {
      logger.error(`Arkadaşlık isteği durumu güncelleme hatası: ${JSON.stringify(updateError)}`);
      // Asıl işlem (arkadaşlık silme) başarılı olduğu için hatayı fırlatmıyoruz, sadece log kaydı yapıyoruz
    }
  } else {
    // Eğer aktif bir friendship_request bulunamadıysa, yeni bir kayıt oluştur
    // Bu, geçmişte friendship_requests tablosunun olmadığı zamanlardan kalan arkadaşlıklar için
    const requestData = {
      requester_id: friendship.user_id_1,
      receiver_id: friendship.user_id_2,
      status: 'deleted',
      created_at: friendship.created_at || new Date(),
      updated_at: new Date()
    };

    const { error: insertError } = await supabaseAdmin
      .from('friendship_requests')
      .insert(requestData);

    if (insertError) {
      logger.error(`Silinen arkadaşlık için istek kaydı oluşturma hatası: ${JSON.stringify(insertError)}`);
      // Asıl işlem (arkadaşlık silme) başarılı olduğu için hatayı fırlatmıyoruz, sadece log kaydı yapıyoruz
    }
  }

  // Friend count RPC çağrıları kaldırıldı (friend_count kolonu artık kullanılmıyor)
  // await supabaseAdmin.rpc('decrement_friend_count', { user_id: userId });
  // await supabaseAdmin.rpc('decrement_friend_count', { user_id: friendId });

  return { success: true };
};

/**
 * Kullanıcının çevrimiçi durumunu günceller
 */
export const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
  console.log(`Çevrimiçi durum güncelleniyor: Kullanıcı ID=${userId}, Durum=${isOnline}`);
  
  try {
    // RPC yerine doğrudan SQL güncelleme kullanarak durumu güncelleyelim
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_online: isOnline,
        last_seen_at: new Date()
      })
      .eq('id', userId);
    
    if (error) {
      console.error(`Çevrimiçi durum güncelleme hatası: ${JSON.stringify(error)}`);
      throw error;
    }
    
    console.log(`Çevrimiçi durum başarıyla güncellendi: ${userId} -> ${isOnline ? 'çevrimiçi' : 'çevrimdışı'}`);
    return { success: true };
  } catch (error) {
    console.error('Çevrimiçi durum güncelleme genel hatası:', error);
    throw error;
  }
};

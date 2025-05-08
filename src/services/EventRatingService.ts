import supabase from '../config/supabase';

interface EventRating {
  id?: number;
  event_id: number;
  user_id: string;
  rating?: number | null;
  review: string;
  created_at?: string;
}

interface EventStatus {
  status: string;
}

class EventRatingService {
  // Etkinliğin tüm yorumlarını getir
  async getEventRatings(eventId: number) {
    try {
      console.log(`Getting ratings for event ID: ${eventId}`);
      
      // İlişki sorgusunu basitleştir - users tablosunu join etmeden sadece rating verilerini getir
      const { data, error } = await supabase
        .from('Event_Ratings')
        .select('id, event_id, user_id, rating, review, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      console.log('Query result:', { data: data?.length || 0, error });
      
      if (error) {
        // Tablo yoksa daha net bir hata ver
        if (error.code === '42P01') { // PostgreSQL'de tablo bulunamadı hatası
          console.error('Event_Ratings table does not exist');
          throw new Error('Event_Ratings tablosu bulunamadı. SQL komutlarını çalıştırın.');
        }
        
        console.error('Error fetching ratings:', error);
        throw new Error(`Etkinlik yorumları getirilirken hata oluştu: ${error.message}`);
      }

      // Sonuçlar için kullanıcı bilgilerini ayrı bir sorgu ile getir
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(rating => rating.user_id))];
        
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, profile_picture')
            .in('id', userIds);
          
          if (!usersError && usersData) {
            // Kullanıcı verilerini rating verilerine birleştir
            const ratingWithUserData = data.map(rating => {
              const user = usersData.find(u => u.id === rating.user_id);
              return {
                ...rating,
                user: user ? {
                  full_name: user.first_name && user.last_name ? 
                    `${user.first_name} ${user.last_name}` : 
                    user.email,
                  profile_picture: user.profile_picture
                } : null
              };
            });
            
            return ratingWithUserData;
          }
        }
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getEventRatings:', err);
      throw err;
    }
  }

  // Kullanıcının belirli bir etkinliğe yaptığı yorumu getir
  async getUserRatingForEvent(eventId: number, userId: string) {
    try {
      const { data, error } = await supabase
        .from('Event_Ratings')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: No rows returned
        // Tablo yoksa daha net bir hata ver
        if (error.code === '42P01') { // PostgreSQL'de tablo bulunamadı hatası
          throw new Error('Event_Ratings tablosu bulunamadı. SQL komutlarını çalıştırın.');
        }
        
        throw new Error(`Kullanıcı yorumu getirilirken hata oluştu: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Exception in getUserRatingForEvent:', err);
      throw err;
    }
  }

  // Etkinlik durumunu kontrol et (ACTIVE veya COMPLETED)
  async checkEventStatus(eventId: number): Promise<EventStatus> {
    try {
      const { data, error } = await supabase
        .from('Events')
        .select('status')  // user_id sütunu yok, sadece status sorgula
        .eq('id', eventId)
        .single();
      
      if (error) {
        throw new Error(`Etkinlik durumu kontrol edilirken hata oluştu: ${error.message}`);
      }

      return { status: data.status };
    } catch (err) {
      console.error('Exception in checkEventStatus:', err);
      throw err;
    }
  }

  // Yeni yorum/puanlama ekle
  async addRating(ratingData: EventRating) {
    try {
      // Etkinlik durumunu kontrol et
      const eventStatus = await this.checkEventStatus(ratingData.event_id);
      
      // Kullanıcının bu etkinliğe daha önce yorum yapıp yapmadığını kontrol et
      const existingRating = await this.getUserRatingForEvent(ratingData.event_id, ratingData.user_id);
      
      if (eventStatus.status === 'COMPLETED') {
        // COMPLETED etkinlikler için validasyon
        if (existingRating) {
          throw new Error('Bu etkinlik için zaten bir yorum yapmışsınız.');
        }
        
        if (ratingData.rating === undefined || ratingData.rating === null || ratingData.rating < 1 || ratingData.rating > 5) {
          throw new Error('COMPLETED etkinlikler için 1-5 arası puanlama zorunludur.');
        }
      } else if (eventStatus.status === 'ACTIVE') {
        // ACTIVE etkinlikler için validasyon
        ratingData.rating = null; // ACTIVE etkinlikler için rating'i null yap
      } else {
        throw new Error('Bu etkinlik için yorum yapılamaz.');
      }

      const { data, error } = await supabase
        .from('Event_Ratings')
        .insert([ratingData])
        .select()
        .single();

      if (error) {
        // Tablo yoksa daha net bir hata ver
        if (error.code === '42P01') { // PostgreSQL'de tablo bulunamadı hatası
          throw new Error('Event_Ratings tablosu bulunamadı. SQL komutlarını çalıştırın.');
        }
        
        throw new Error(`Yorum eklenirken hata oluştu: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Exception in addRating:', err);
      throw err;
    }
  }

  // Yorumu güncelle
  async updateRating(ratingId: number, userId: string, updates: Partial<EventRating>) {
    try {
      // Önce yorumun varlığını ve kullanıcının kendi yorumu olduğunu kontrol et
      const { data: existingRating, error: fetchError } = await supabase
        .from('Event_Ratings')
        .select('*, events:event_id(status)')
        .eq('id', ratingId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // Tablo yoksa daha net bir hata ver
        if (fetchError.code === '42P01') { // PostgreSQL'de tablo bulunamadı hatası
          throw new Error('Event_Ratings tablosu bulunamadı. SQL komutlarını çalıştırın.');
        }
        
        throw new Error(`Yorum bulunamadı veya bu yorumu güncelleme yetkiniz yok: ${fetchError.message}`);
      }

      // Etkinlik durumuna göre validasyon
      if (existingRating.events.status === 'COMPLETED') {
        if (updates.rating === undefined || updates.rating === null || updates.rating < 1 || updates.rating > 5) {
          throw new Error('COMPLETED etkinlikler için 1-5 arası puanlama zorunludur.');
        }
      } else if (existingRating.events.status === 'ACTIVE') {
        updates.rating = null; // ACTIVE etkinlikler için rating'i null yap
      }

      const { data, error } = await supabase
        .from('Event_Ratings')
        .update(updates)
        .eq('id', ratingId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Yorum güncellenirken hata oluştu: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Exception in updateRating:', err);
      throw err;
    }
  }

  // Yorumu sil
  async deleteRating(ratingId: number, userId: string) {
    try {
      // Önce yorumun varlığını ve kullanıcının kendi yorumu olduğunu kontrol et
      const { data: existingRating, error: fetchError } = await supabase
        .from('Event_Ratings')
        .select('*')
        .eq('id', ratingId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // Tablo yoksa daha net bir hata ver
        if (fetchError.code === '42P01') { // PostgreSQL'de tablo bulunamadı hatası
          throw new Error('Event_Ratings tablosu bulunamadı. SQL komutlarını çalıştırın.');
        }
        
        throw new Error(`Yorum bulunamadı veya bu yorumu silme yetkiniz yok: ${fetchError.message}`);
      }

      const { error } = await supabase
        .from('Event_Ratings')
        .delete()
        .eq('id', ratingId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Yorum silinirken hata oluştu: ${error.message}`);
      }

      return { success: true, message: 'Yorum başarıyla silindi.' };
    } catch (err) {
      console.error('Exception in deleteRating:', err);
      throw err;
    }
  }
}

export default new EventRatingService(); 
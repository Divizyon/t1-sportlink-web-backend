import supabase, { supabaseAdmin } from '../config/supabase';
import { User, CreateUserDTO, UserDetail } from '../models/User';
import { format } from 'date-fns';
import { sendWarningEmail } from './emailService';
import { NotFoundError, BadRequestError } from '../errors/customErrors';
import logger from '../utils/logger';
import { AdminReportInfo } from '../models/Report';

// Sport ve UserSport tipleri için interface tanımlamaları
interface Sport {
  id: string;
  name: string;
  description: string;
}

interface UserSport {
  sport_id: string;
  skill_level: string;
  sport: Sport;
}

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    console.log('findUserById çağrıldı:', { id });
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('findUserById hatası:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw error;
    }

    if (!data) {
      console.log('Kullanıcı bulunamadı:', { id });
      return null;
    }

    console.log('Kullanıcı bulundu:', {
      id: data.id,
      email: data.email,
      role: data.role
    });

    return data as User;
  } catch (error) {
    console.error('findUserById beklenmeyen hata:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

export const createUser = async (userData: CreateUserDTO): Promise<User | null> => {
  try {
    console.log('Starting user creation process for:', userData.email);
    
    // Sadece Auth sisteminde kullanıcı oluştur, veritabanına kaydetme
    console.log('Creating auth user only...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // E-posta doğrulama işlemini atla (geliştirme kolaylığı için)
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        birthday_date: userData.birthday_date,
        role: 'USER' // Tüm yeni kayıtlar için USER rolü kullan
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message.includes('already been registered')) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor.');
      }
      throw authError;
    }
    
    if (!authData.user) {
      console.error('Auth data user is null');
      throw new Error('Kullanıcı oluşturulamadı.');
    }

    console.log('Auth user created successfully:', authData.user.id);
    
    // Veritabanına users tablosuna kayıt eklenmeyecek
    // Auth verilerinden User nesnesini oluşturup döndür
    const user: User = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      birthday_date: userData.birthday_date,
      role: 'USER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return user;
  } catch (error) {
    console.error('Error in createUser:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
    throw new Error('Kullanıcı oluşturulurken bir hata oluştu.');
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const getUserDetails = async (): Promise<UserDetail[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, created_at, updated_at');

    if (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }

    // Varsayılan avatar yolu
    const defaultAvatar = '/avatars/default.jpg';
    
    // Kullanıcı detaylarını dönüştürme
    const userDetails: UserDetail[] = data.map((user: any, index: number) => {
      const registeredDate = user.created_at 
        ? format(new Date(user.created_at), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
        
      const lastActive = user.updated_at
        ? format(new Date(user.updated_at), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
        
      return {
        id: (user.id && !isNaN(Number(user.id))) ? Number(user.id) : index + 1,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role?.toLowerCase() === 'user' ? 'üye' : user.role?.toLowerCase() || 'üye',
        status: 'aktif', // Varsayılan olarak aktif durumda
        joinDate: registeredDate,
        avatar: `${defaultAvatar.replace('.jpg', '')}${(index % 3) + 1}.jpg`, // Rastgele avatar atama
        registeredDate: registeredDate,
        lastActive: lastActive,
        birthday_date: user.birthday_date ? format(new Date(user.birthday_date), 'yyyy-MM-dd') : ''
      };
    });

    return userDetails;
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    return [];
  }
};

export const getUserDetailsById = async (id: string) => {
  try {
    console.log('Getting user details for ID:', id);

    // Önce User_Sports tablosundaki raw veriyi kontrol edelim
    console.log('Checking raw User_Sports data...');
    const { data: rawSportsData, error: rawSportsError } = await supabaseAdmin
      .from('User_Sports')
      .select('*')
      .eq('user_id', id);

    console.log('Raw User_Sports query result:', {
      error: rawSportsError ? {
        code: rawSportsError.code,
        message: rawSportsError.message,
        details: rawSportsError.details
      } : null,
      data: rawSportsData,
      sql: `SELECT * FROM "User_Sports" WHERE user_id = '${id}'`
    });

    // Sports tablosundaki tüm sporları kontrol edelim
    console.log('Checking all available sports...');
    const { data: allSports, error: allSportsError } = await supabaseAdmin
      .from('Sports')
      .select('*');

    console.log('All sports in database:', {
      error: allSportsError ? {
        code: allSportsError.code,
        message: allSportsError.message,
        details: allSportsError.details
      } : null,
      count: allSports?.length || 0,
      data: allSports
    });

    // Şimdi user_sports verilerini ilişkisel olarak çekelim
    console.log('Fetching user sports data with relations...');
    const { data: sportsData, error: sportsError } = await supabaseAdmin
      .from('User_Sports')
      .select(`
        sport_id,
        skill_level,
        sport:Sports (
          id,
          name,
          description
        )
      `)
      .eq('user_id', id) as { data: UserSport[] | null; error: any };

    if (sportsError) {
      console.error('Sports query error:', sportsError);
      console.error('Sports query error details:', {
        code: sportsError.code,
        message: sportsError.message,
        details: sportsError.details,
        hint: sportsError.hint,
        query: `SELECT sport_id, skill_level, Sports.* FROM User_Sports JOIN Sports ON User_Sports.sport_id = Sports.id WHERE user_id = '${id}'`
      });
    } else {
      console.log('Sports data fetched successfully:', {
        count: sportsData?.length || 0,
        data: JSON.stringify(sportsData, null, 2),
        sportIds: sportsData?.map(s => s.sport_id)
      });
    }

    // Kullanıcı verilerini çekmeden önce kullanıcının varlığını kontrol edelim
    console.log('Checking if user exists...');
    const { data: userCheck, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    console.log('User existence check:', {
      exists: !!userCheck,
      error: userCheckError ? {
        code: userCheckError.code,
        message: userCheckError.message,
        details: userCheckError.details
      } : null
    });

    // Sonra kullanıcı ve etkinlik verilerini çekelim
    console.log('Fetching user and event data...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        Event_Participants (
          event:Events (
            id,
            title,
            event_date,
            status
          )
        )
      `)
      .eq('id', id)
      .single();

    if (userError) {
      console.error('User query error:', userError);
      console.error('User query error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        query: `SELECT *, Event_Participants.* FROM users LEFT JOIN Event_Participants ON users.id = Event_Participants.user_id WHERE users.id = '${id}'`
      });
      throw userError;
    }

    if (!userData) {
      console.error('No user data found for ID:', id);
      return null;
    }

    console.log('User data fetched successfully:', {
      id: userData.id,
      email: userData.email,
      eventParticipantsCount: userData.Event_Participants?.length || 0,
      rawUserData: JSON.stringify(userData, null, 2)
    });

    // Tamamlanan etkinlik sayısını hesapla
    const completedEvents = userData.Event_Participants?.filter(
      (ep: any) => ep.event?.status === 'COMPLETED'
    ).length || 0;

    console.log('Completed events count:', completedEvents);

    // Favori kategorileri dönüştür
    const favoriteCategories = (sportsData || []).map(
      (sportData: UserSport) => sportData.sport?.name
    ).filter(Boolean);

    console.log('Favorite categories processing:', {
      rawSportsData: sportsData,
      mappedNames: (sportsData || []).map(sport => sport.sport?.name),
      filteredCategories: favoriteCategories
    });

    // Etkinlikleri dönüştür
    const events = userData.Event_Participants?.map((ep: any) => ({
      id: ep.event?.id,
      title: ep.event?.title,
      date: ep.event?.event_date,
      status: ep.event?.status
    })).filter((event: any) => event.id) || [];

    console.log('Events processing:', {
      rawEvents: userData.Event_Participants,
      processedEvents: events
    });

    const response = {
      id: userData.id,
      username: userData.username || '',
      name: `${userData.first_name} ${userData.last_name}`,
      email: userData.email,
      role: userData.role,
      status: userData.status || 'active',
      is_banned: userData.is_banned || false,
      banned_at: userData.banned_at,
      joinDate: format(new Date(userData.created_at), 'yyyy-MM-dd'),
      avatar: userData.avatar || '',
      profile_picture: userData.profile_picture || '',
      registeredDate: format(new Date(userData.created_at), 'yyyy-MM-dd'),
      lastActive: format(new Date(userData.updated_at), 'yyyy-MM-dd'),
      gender: userData.gender || '',
      birthday_date: userData.birthday_date ? format(new Date(userData.birthday_date), 'yyyy-MM-dd') : null,
      address: userData.address || '',
      bio: userData.bio || '',
      phone: userData.phone || '',
      eventCount: events.length,
      completedEvents,
      favoriteCategories,
      events
    };

    console.log('Final response:', response);
    return response;

  } catch (error) {
    console.error('Error getting user details by ID:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

export const toggleUserStatus = async (userId: string, adminId: string) => {
  try {
    // Admin kontrolü
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || admin?.role !== 'ADMIN') {
      throw new Error('Bu işlem için admin yetkisine sahip olmalısınız');
    }

    // Kullanıcı kontrolü
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('status')
      .eq('id', userId)
      .single();

    if (userError || !userExists) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Önce mevcut durumu alalım
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('status')
      .eq('id', userId)
      .single();

    if (currentUserError) {
      throw currentUserError;
    }

    const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';

    // Status güncelleme
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, status, updated_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedUser;

  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string, adminId: string) => {
  try {
    // Admin kontrolü
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || admin?.role !== 'ADMIN') {
      throw new Error('Bu işlem için admin yetkisine sahip olmalısınız');
    }

    // Kullanıcı kontrolü
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !userExists) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Önce ilişkili kayıtları temizleyelim
    // User_Sports kayıtlarını sil
    await supabase
      .from('User_Sports')
      .delete()
      .eq('user_id', userId);

    // Event_Participants kayıtlarını sil
    await supabase
      .from('Event_Participants')
      .delete()
      .eq('user_id', userId);

    // Kullanıcıyı sil
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return {
      success: true,
      message: 'Kullanıcı ve ilişkili tüm kayıtları başarıyla silindi',
      deletedUser: userExists
    };

  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};

/**
 * Kullanıcıya uyarı gönderir
 * @param userId Uyarı gönderilecek kullanıcının ID'si
 * @param adminId Uyarıyı gönderen admin kullanıcısının ID'si
 * @param message Uyarı mesajı
 * @returns Uyarı gönderilen kullanıcının güncel bilgileri
 */
export const sendWarningToUser = async (
  userId: string,
  adminId: string,
  message: string
) => {
  try {
    console.log('Uyarı gönderme işlemi başlatıldı:', {
      userId,
      adminId,
      messageLength: message.length
    });

    // Kullanıcının varlığını kontrol et
    console.log('Kullanıcı kontrolü yapılıyor...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Kullanıcı sorgulama hatası:', {
        error: userError,
        code: userError.code,
        details: userError.details,
        hint: userError.hint,
        message: userError.message
      });
      throw new Error('Kullanıcı bulunamadı');
    }

    if (!userData) {
      console.error('Kullanıcı bulunamadı:', { userId });
      throw new Error('Kullanıcı bulunamadı');
    }

    console.log('Kullanıcı bulundu:', {
      id: userData.id,
      email: userData.email,
      role: userData.role
    });

    // Admin kontrolü
    console.log('Admin kontrolü yapılıyor...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData || adminData.role !== 'ADMIN') {
      console.error('Admin kontrolü hatası:', {
        error: adminError,
        adminData,
        adminId
      });
      throw new Error('Bu işlem için admin yetkisine sahip olmalısınız');
    }

    console.log('Admin yetkisi doğrulandı');

    // Uyarıyı User_Warnings tablosuna kaydet
    console.log('Uyarı kaydediliyor...');
    const { data: warningData, error: warningError } = await supabaseAdmin
      .from('User_Warnings')
      .insert({
        user_id: userId,
        admin_id: adminId,
        message: message,
        sent_at: new Date().toISOString(),
        is_read: false
      })
      .select()
      .single();

    if (warningError) {
      console.error('Uyarı kaydetme hatası:', {
        error: warningError,
        code: warningError.code,
        details: warningError.details,
        hint: warningError.hint,
        message: warningError.message
      });
      throw new Error('Uyarı kaydedilirken bir hata oluştu');
    }

    console.log('Uyarı başarıyla kaydedildi:', {
      warningId: warningData.id,
      userId: warningData.user_id,
      adminId: warningData.admin_id,
      sentAt: warningData.sent_at
    });

    // E-posta gönderimi
    try {
      console.log('E-posta gönderimi başlatılıyor...');
      await sendWarningEmail(
        userData.email,
        `${userData.first_name} ${userData.last_name}`,
        message,
        `${adminData.first_name} ${adminData.last_name}`
      );
      console.log('E-posta başarıyla gönderildi');
    } catch (emailError) {
      console.error('E-posta gönderimi hatası:', emailError);
      // E-posta hatası uyarı kaydını engellemeyecek
    }

    return userData;
  } catch (error) {
    console.error('Uyarı gönderme işlemi hatası:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      adminId
    });
    throw error;
  }
};

interface UserProfileData {
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  gender: string | null;
  birthday_date: string | null;
  address: string | null;
  first_name: string;
  last_name: string;
  total_events: number;
  friend_count: number;
}

export const getUserProfileById = async (userId: string): Promise<UserProfileData> => {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, email, phone, profile_picture, bio, gender, birthday_date, address')
    .eq('id', userId)
    .single();

  if (error || !data) {
    logger.error(`User profile not found for ID: ${userId}`, error);
    throw new NotFoundError('User profile not found');
  }

  const { count: eventCount, error: eventError } = await supabase
    .from('Event_Participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (eventError) {
    logger.error(`Error getting event count for user ID: ${userId}`, eventError);
  }

  // Arkadaş sayısını getir
  const { getFriends } = await import('../services/friendshipService');
  let friendCount = 0;
  try {
    const friends = await getFriends(userId);
    friendCount = friends.length;
  } catch (err) {
    logger.error(`Error getting friend count for user ID: ${userId}`, err);
  }

  return {
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    email: data.email,
    phone: data.phone,
    avatar: data.profile_picture,
    bio: data.bio,
    gender: data.gender,
    birthday_date: data.birthday_date ? format(new Date(data.birthday_date), 'yyyy-MM-dd') : null,
    address: data.address,
    first_name: data.first_name,
    last_name: data.last_name,
    total_events: eventCount || 0,
    friend_count: friendCount
  };
};

interface UpdateUserProfileDTO {
  first_name?: string;
  last_name?: string;
  email?: string; // Email update needs careful consideration due to auth link
  phone?: string;
  bio?: string;
  gender?: string;
  birthday_date?: string;
  address?: string;
}

export const updateUserProfileById = async (userId: string, updateData: UpdateUserProfileDTO): Promise<void> => {
  // Remove undefined fields to avoid overwriting with null
  const validUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );

  if (Object.keys(validUpdateData).length === 0) {
    throw new BadRequestError('No valid fields provided for update.');
  }

  // Add updated_at timestamp
  validUpdateData.updated_at = new Date().toISOString();

  // Use supabaseAdmin for potentially restricted updates if needed
  // Or ensure RLS policy allows users to update their own profile
  const { error } = await supabase
    .from('users')
    .update(validUpdateData)
    .eq('id', userId);

  if (error) {
    logger.error(`Error updating user profile for ID: ${userId}`, error);
    throw new Error('Failed to update user profile');
  }
  logger.info(`User profile updated successfully for ID: ${userId}`);
};

export const updateUserAvatar = async (userId: string, file: Express.Multer.File): Promise<string> => {
  if (!file) {
    throw new BadRequestError('Avatar file is required.');
  }

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `users/avatars/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('sportlink-files') // Using the correct bucket name
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true, // Overwrite if file exists (optional)
    });

  if (uploadError) {
    logger.error(`Error uploading avatar to storage for user ${userId}:`, uploadError);
    throw new Error('Failed to upload avatar to storage.');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('sportlink-files')
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
     logger.error(`Failed to get public URL for avatar: ${filePath}`);
     // Even if URL fails, upload might be successful, proceed with caution or throw
     throw new Error('Failed to get avatar public URL.');
  }

  const avatarUrl = urlData.publicUrl;

  // Update profile_picture in users table
  const { error: dbError } = await supabase
    .from('users')
    .update({ profile_picture: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (dbError) {
    logger.error(`Error updating avatar URL in DB for user ${userId}:`, dbError);
    // Consider deleting the uploaded file from storage if DB update fails
    throw new Error('Failed to update avatar URL in profile.');
  }

  logger.info(`Avatar updated successfully for user ${userId}. URL: ${avatarUrl}`);
  return avatarUrl;
};

/**
 * Kullanıcının raporlandığı raporları getirir
 * @param userId Kullanıcı ID'si
 * @returns Kullanıcının raporlandığı raporlar
 */
export const getUserReports = async (userId: string): Promise<AdminReportInfo[]> => {
  try {
    console.log(`Kullanıcının raporları getiriliyor, id: ${userId}`);
    
    // Kullanıcının raporlandığı raporları getir
    const { data, error } = await supabaseAdmin
      .from('Reports')
      .select(`
        id,
        status,
        admin_notes,
        updated_by,
        admin:users!updated_by (email, username)
      `)
      .eq('reported_id', userId);
      
    if (error) {
      console.error('Kullanıcı raporları getirilirken hata oluştu:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        query: `SELECT id, status, admin_notes, updated_by FROM Reports WHERE reported_id = '${userId}'`
      });
      throw error;
    }

    console.log(`Kullanıcının raporları sorgusu tamamlandı:`, {
      userId,
      reportCount: data?.length || 0,
      reportIds: data?.map(r => r.id)
    });

    if (!data || data.length === 0) {
      console.log(`Kullanıcı için rapor bulunamadı: ${userId}`);
      return [];
    }

    // Raporları dönüştür
    const formattedReports: AdminReportInfo[] = data.map(report => {
      // Durumu Türkçe'ye çevir
      let durum = "Beklemede";
      switch (report.status?.toLowerCase() || 'pending') {
        case 'pending':
          durum = "Beklemede";
          break;
        case 'reviewing':
          durum = "İnceleniyor";
          break;
        case 'resolved':
          durum = "Çözüldü";
          break;
        case 'rejected':
          durum = "Reddedildi";
          break;
      }
      
      // TypeScript'in admin yapısını anlayabilmesi için tip dönüşümü yapalım
      const admin = report.admin as { email?: string; username?: string } || {};
      
      const reportInfo: AdminReportInfo = {
        rapor_id: report.id?.toString() || "",
        admin_email: admin?.email || "",
        admin_username: admin?.username || "",
        admin_notu: report.admin_notes || "",
        durum
      };
      
      return reportInfo;
    });

    console.log('Dönüştürülmüş raporlar sayısı:', formattedReports.length);
    return formattedReports;
  } catch (error) {
    console.error('Kullanıcı raporları servis hatası:', error);
    // Hata olsa bile boş dizi döndür
    return [];
  }
};

/**
 * Sadece USER rolündeki kullanıcıları sayfalandırılmış şekilde getirir
 * @param page Sayfa numarası (1'den başlar)
 * @param limit Sayfa başına kaç kullanıcı getirileceği
 * @param sortBy Sıralama kriteri: 'new' (yeni kullanıcılar) veya 'active' (aktif kullanıcılar) veya 'mixed' (karışık)
 * @returns Kullanıcılar ve sayfalama bilgileri
 */
export const getUsersByRole = async (page: number = 1, limit: number = 10, sortBy: string = 'mixed') => {
  try {
    logger.info(`USER rolündeki kullanıcılar getiriliyor: sayfa=${page}, limit=${limit}, sıralama=${sortBy}`);
    
    // Toplam kullanıcı sayısını al
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'USER');
    
    if (countError) {
      logger.error('Kullanıcı sayısı alınırken hata oluştu:', countError);
      throw new Error('Kullanıcı sayısı alınırken bir hata oluştu');
    }
    
    // Sayfalama hesapları
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    if (sortBy === 'mixed') {
      // Tüm kullanıcıları getir
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          created_at,
          updated_at,
          profile_picture,
          status,
          gender,
          birthday_date,
          address,
          phone,
          bio
        `)
        .eq('role', 'USER');
        
      if (usersError) {
        logger.error('Kullanıcılar alınırken hata oluştu:', usersError);
        throw new Error('Kullanıcılar alınırken bir hata oluştu');
      }
      
      // Her kullanıcı için etkinlik sayısını ayrı sorgu ile al
      const usersWithEventCounts = await Promise.all(
        users.map(async (user) => {
          // Kullanıcının katıldığı etkinlik sayısını al
          const { count: eventCount, error: eventCountError } = await supabaseAdmin
            .from('Event_Participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (eventCountError) {
            logger.warn(`Kullanıcının etkinlik sayısı alınırken hata: ${user.id}`, eventCountError);
            return { ...user, event_count: 0 };
          }
          
          return { ...user, event_count: eventCount || 0 };
        })
      );
      
      // Etkinlik sayısına göre sırala (çoktan aza)
      const sortedUsers = usersWithEventCounts.sort((a, b) => {
        // Önce etkinlik sayısına göre sırala (çoktan aza)
        if (b.event_count !== a.event_count) {
          return b.event_count - a.event_count;
        }
        
        // Etkinlik sayıları eşitse, kayıt tarihine göre sırala (yeniden eskiye)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Sayfalandırma uygula
      const paginatedUsers = sortedUsers.slice(from, from + limit);
      
      logger.info(`${paginatedUsers.length} kullanıcı bulundu`);
      
      return {
        users: paginatedUsers,
        meta: {
          totalCount,
          page,
          limit,
          totalPages,
          sortBy
        }
      };
    } else {
      // Sıralama kriterine göre sorguyu oluştur
      let query = supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          created_at,
          updated_at,
          profile_picture,
          status,
          gender,
          birthday_date,
          address,
          phone,
          bio
        `)
        .eq('role', 'USER');
      
      // Sıralama kriterine göre sırala
      if (sortBy === 'new') {
        query = query.order('created_at', { ascending: false });
        logger.info('Kullanıcılar yeni kayıt olma tarihine göre sıralanıyor');
      } else if (sortBy === 'active') {
        query = query.order('updated_at', { ascending: false });
        logger.info('Kullanıcılar son aktiflik tarihine göre sıralanıyor');
      } else {
        query = query.order('created_at', { ascending: false });
        logger.info('Kullanıcılar varsayılan olarak yeni kayıt olma tarihine göre sıralanıyor');
      }
      
      // Sayfalama uygula
      query = query.range(from, to);
      
      // Kullanıcıları getir
      const { data, error } = await query;
      
      if (error) {
        logger.error('Kullanıcılar alınırken hata oluştu:', error);
        throw new Error('Kullanıcılar alınırken bir hata oluştu');
      }
      
      logger.info(`${data.length} kullanıcı bulundu`);
      
      return {
        users: data,
        meta: {
          totalCount,
          page,
          limit,
          totalPages,
          sortBy
        }
      };
    }
  } catch (error) {
    logger.error('getUsersByRole fonksiyonunda hata:', error);
    throw error;
  }
}; 
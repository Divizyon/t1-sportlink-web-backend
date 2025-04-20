import supabase, { getSupabaseAdmin } from '../utils/supabaseHelper';
import { CreateUserDTO } from '../models/User';
import { User } from '../types/User';

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error finding user by ID:', error);
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
    console.log('Creating user:', userData.email);
    
    // Önce email'in kullanımda olup olmadığını kontrol et
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      console.log('Email already exists:', userData.email);
      throw new Error('Bu e-posta adresi zaten kullanılıyor.');
    }

    // Admin client'ı al
    const supabaseAdmin = getSupabaseAdmin();
    console.log('Admin client başarıyla alındı');
    
    console.log('Creating auth user with service role...');
    
    // Auth user oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message.includes('already been registered')) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor.');
      }
      
      if (authError.message?.includes('Invalid API key')) {
        throw new Error('Geçersiz API anahtarı. Sistem yöneticinize başvurun.');
      }
      
      throw authError;
    }
    
    if (!authData.user) {
      console.error('Auth data user is null');
      throw new Error('Kullanıcı oluşturulamadı.');
    }

    console.log('Auth user created, ID:', authData.user.id);
    console.log('Creating user profile...');
    
    // Kullanıcı profilini oluştur
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'USER'
      })
      .select()
      .single();

    if (error) {
      console.error('User profile creation error:', error);
      console.error('Profile error details:', JSON.stringify(error, null, 2));
      
      // Eğer profil oluşturma başarısız olursa auth user'ı da sil
      console.log('Cleaning up auth user...');
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError);
      }
      throw error;
    }

    console.log('User created successfully:', data.email);
    return data as User;
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

/**
 * Tüm kullanıcıların detaylarını getiren servis fonksiyonu
 * @returns Formatlı kullanıcı detay listesi
 */
export const getUserDetails = async (): Promise<User[]> => {
  try {
    // Supabase'den kullanıcıları çek
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      throw new Error(`Kullanıcı verileri alınamadı: ${error.message}`);
    }
    
    if (!data) {
      return [];
    }
    
    // Supabase'den gelen verileri istenen User formata dönüştür
    const formattedUsers: User[] = data.map(user => ({
      id: user.id,
      name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      role: user.role || 'üye',
      status: user.status || 'aktif',
      joinDate: formatDate(user.join_date || user.created_at),
      avatar: user.avatar_url || `/avatars/default.jpg`,
      registeredDate: formatDate(user.created_at),
      lastActive: formatDate(user.last_login_at || user.updated_at)
    }));
    
    return formattedUsers;
  } catch (error) {
    console.error('Kullanıcı verileri alınırken hata oluştu:', error);
    throw error;
  }
};

/**
 * ID'ye göre belirli bir kullanıcının detaylarını getiren servis fonksiyonu
 * @param userId Kullanıcı ID'si
 * @returns Formatlı kullanıcı detayı
 */
export const getUserDetailsById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(`Kullanıcı verisi alınamadı: ${error.message}`);
    }
    
    if (!data) {
      return null;
    }
    
    // Supabase'den gelen veriyi istenen User formata dönüştür
    const formattedUser: User = {
      id: data.id,
      name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      role: data.role || 'üye',
      status: data.status || 'aktif',
      joinDate: formatDate(data.join_date || data.created_at),
      avatar: data.avatar_url || `/avatars/default.jpg`,
      registeredDate: formatDate(data.created_at),
      lastActive: formatDate(data.last_login_at || data.updated_at)
    };
    
    return formattedUser;
  } catch (error) {
    console.error('Kullanıcı verisi alınırken hata oluştu:', error);
    throw error;
  }
};

/**
 * Tarih formatını düzenleyen yardımcı fonksiyon
 * @param dateString Tarih değeri
 * @returns YYYY-MM-DD formatında tarih
 */
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};
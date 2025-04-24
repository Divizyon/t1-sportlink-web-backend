import supabase, { supabaseAdmin } from '../config/supabase';
import { User, CreateUserDTO, UserDetail } from '../models/User';
import { format } from 'date-fns';

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
    console.log('Starting user creation process for:', userData.email);
    
    // Önce email'in Supabase Auth'da kullanımda olup olmadığını kontrol et
    // Bu kontrol doğrudan Auth servisi üzerinden yapılacak, users tablosunda değil
    
    console.log('Creating auth user...');
    // Sadece Auth user oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // E-posta doğrulama işlemini atla (geliştirme kolaylığı için)
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'USER'
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
    
    // Users tablosuna kayıt eklemeden doğrudan auth verilerini dönüştürelim
    const user: User = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role || 'USER',
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
        lastActive: lastActive
      };
    });

    return userDetails;
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    return [];
  }
};

export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<User | null> => {
  try {
    // Get existing user first to ensure it exists
    const existingUser = await findUserById(userId);
    
    if (!existingUser) {
      throw new Error('Kullanıcı bulunamadı.');
    }
    
    console.log('Updating user profile for ID:', userId);
    
    // Update the user in Supabase database
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        phone: userData.phone,
        default_location_latitude: userData.default_location_latitude,
        default_location_longitude: userData.default_location_longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    // Also update the user metadata in Auth
    if (userData.first_name || userData.last_name) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            first_name: userData.first_name || existingUser.first_name,
            last_name: userData.last_name || existingUser.last_name
          }
        }
      );
      
      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError);
        // Continue anyway as DB update succeeded
      }
    }
    
    return data as User;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Kullanıcı profili güncellenirken bir hata oluştu.');
  }
};

export const uploadAvatar = async (userId: string, file: Express.Multer.File): Promise<User | null> => {
  try {
    // Önce kullanıcıyı kontrol et
    const existingUser = await findUserById(userId);
    
    if (!existingUser) {
      throw new Error('Kullanıcı bulunamadı.');
    }
    
    console.log('Uploading avatar for user ID:', userId);
    
    // Dosya adını benzersiz yap
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `users/avatars/${fileName}`;
    
    // Dosyayı Supabase Storage'a yükle
    const { error: uploadError } = await supabase.storage
      .from('sportlink-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      throw uploadError;
    }
    
    // Yüklenen dosyanın genel URL'sini al
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Avatar URL alınamadı.');
    }
    
    const avatarUrl = urlData.publicUrl;
    
    // Kullanıcı profilini güncelle
    const { data, error } = await supabase
      .from('users')
      .update({
        profile_picture: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
    
    // Ayrıca kullanıcının Auth metadatasını da güncelle
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          avatar_url: avatarUrl
        }
      }
    );
    
    if (authUpdateError) {
      console.error('Error updating auth user metadata:', authUpdateError);
      // Devam et, DB güncelleme başarılı olduğu için
    }
    
    return data as User;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Avatar yüklenirken bir hata oluştu.');
  }
}; 
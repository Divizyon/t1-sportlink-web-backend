import supabase, { supabaseAdmin } from '../config/supabase';
import { LoginDTO } from '../models/User';
import { SecurityService } from './securityService';
import { UnauthorizedError } from '../errors/customErrors';
import logger from '../utils/logger';

export const login = async (credentials: LoginDTO, ip: string = '127.0.0.1') => {
  try {
    console.log('Login attempt:', credentials.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      
      // Başarısız login girişimini kaydet
      await SecurityService.createLog({
        type: 'login',
        admin: credentials.email,
        ip: ip,
        status: 'error',
        action: `Başarısız giriş: ${error.message}`
      });
      
      throw error;
    }
    
    console.log('Login successful for:', credentials.email);
    
    // Başarılı login işlemini kaydet
    const userFullName = data.user?.user_metadata?.first_name && data.user?.user_metadata?.last_name 
      ? `${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name}` 
      : data.user?.email || 'Bilinmeyen Kullanıcı';
    
    await SecurityService.createLog({
      type: 'login',
      admin: userFullName,
      ip: ip,
      status: 'success',
      action: `Başarılı giriş / ${data.user?.email || 'bilinmeyen'}`
    });
    
    // Kullanıcı başarıyla giriş yaptıysa ve last_sign_in_at verisi varsa
    if (data.user && data.user.last_sign_in_at) {
      // Kullanıcının users tablosunda olup olmadığını kontrol et
      const { data: existingUser, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('User check error:', userCheckError);
      }
      
      // Kullanıcı users tablosunda yoksa ekle
      if (!existingUser) {
        // RLS hatasını önlemek için supabaseAdmin kullan
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            username: data.user.email?.split('@')[0] || '',
            email: data.user.email || '',
            first_name: data.user.user_metadata?.first_name || '',
            last_name: data.user.user_metadata?.last_name || '',
            phone: data.user.phone || '',
            profile_picture: data.user.user_metadata?.avatar_url || '',
            default_location_latitude: 0,
            default_location_longitude: 0,
            role: 'USER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error inserting user data to users table:', insertError);
        } else {
          console.log('User data successfully inserted to users table');
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        scopes: 'email profile'
      }
    });

    if (error) {
      console.error('Google OAuth başlatma hatası:', error);
      throw error;
    }

    if (!data.url) {
      throw new Error('Google OAuth URL alınamadı');
    }
    
    return {
      url: data.url
    };
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Refresh session error:', error);
    throw error;
  }
};

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get session error:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
};

// Google OAuth ile giriş yaptıktan sonra kullanıcıyı veritabanına kaydetmek için
export const handleOAuthCallback = async (code: string) => {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback hatası:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Kullanıcı bilgileri alınamadı');
    }

    // Kullanıcının users tablosunda olup olmadığını kontrol et
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Kullanıcı kontrolü hatası:', userCheckError);
    }

    // Kullanıcı users tablosunda yoksa ekle
    if (!existingUser) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          first_name: data.user.user_metadata?.given_name || '',
          last_name: data.user.user_metadata?.family_name || '',
          profile_picture: data.user.user_metadata?.picture || '',
          role: 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Users tablosuna veri ekleme hatası:', insertError);
      }
    }

    return {
      session: data.session,
      user: data.user
    };
  } catch (error) {
    console.error('OAuth callback işleme hatası:', error);
    throw error;
  }
};

/**
 * YAPILAN DEĞİŞİKLİKLER - 25 Nisan 2024
 * ---------------------------------------
 * 1. Şifre değiştirme fonksiyonu güncellendi
 *    - Eski yaklaşım: Email ile tekrar giriş yapma kontrolü
 *    - Yeni yaklaşım: Mevcut oturum üzerinden doğrulama
 * 
 * 2. Güvenlik iyileştirmeleri
 *    - Şifre doğrulama kontrolü ProfileController'a taşındı
 *    - Oturum kontrolü eklendi
 *    - Hata yönetimi geliştirildi
 * 
 * 3. Performans iyileştirmeleri
 *    - Gereksiz veritabanı sorguları kaldırıldı
 *    - Daha az API çağrısı yapılıyor
 */

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logger.error('Error getting current session:', sessionError);
      throw new UnauthorizedError('No active session found');
    }

    // Update password directly
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      logger.error('Error updating password:', updateError);
      throw new Error('Failed to update password');
    }

    logger.info('Password successfully updated for user:', userId);
  } catch (error) {
    logger.error('Error in changePassword:', error);
    throw error;
  }
}; 
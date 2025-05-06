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
    console.log('Auth user data:', {
      id: data.user?.id,
      email: data.user?.email,
      metadata: data.user?.user_metadata,
      lastSignIn: data.user?.last_sign_in_at
    });
    
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
    
    // Kullanıcı başarıyla giriş yaptı, users tablosunda kontrol et ve yoksa ekle
    if (data.user) {
      console.log('Checking if user exists in users table, id:', data.user.id);
      
      // Kullanıcının users tablosunda olup olmadığını kontrol et
      const { data: existingUser, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      console.log('User check result:', { existingUser, error: userCheckError ? userCheckError.message : null });
      
      if (userCheckError) {
        // PGRST116: Row not found hatası beklenebilir, kullanıcı yoksa bu hata gelir
        if (userCheckError.code !== 'PGRST116') {
          console.error('User check error details:', {
            code: userCheckError.code,
            message: userCheckError.message,
            details: userCheckError.details,
            hint: userCheckError.hint
          });
        } else {
          console.log('User not found in database, will create a new record');
        }
      }
      
      // Kullanıcı users tablosunda yoksa ekle
      if (!existingUser) {
        console.log('Creating user record in users table, user details:', {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name,
          last_name: data.user.user_metadata?.last_name
        });
        
        // Kullanıcı verilerini hazırla
        const userData = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          first_name: data.user.user_metadata?.first_name || '',
          last_name: data.user.user_metadata?.last_name || '',
          phone: data.user.phone || '',
          profile_picture: data.user.user_metadata?.avatar_url || '',
          role: data.user.user_metadata?.role || 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Inserting user data:', userData);
        
        // RLS hatasını önlemek için supabaseAdmin kullan
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('users')
          .insert(userData)
          .select();
        
        console.log('Insert result:', { 
          success: !insertError, 
          data: insertData, 
          error: insertError ? {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          } : null 
        });
        
        if (insertError) {
          console.error('Error inserting user data to users table:', insertError);
          logger.error(`Failed to create user record in database on first login: ${data.user.id}`, insertError);
          
          // Doğrudan başka bir sorgu ile tekrar deneyelim (bazı Supabase hataları için)
          try {
            console.log('Retrying insert with raw query...');
            const { error: retryError } = await supabaseAdmin.rpc('insert_user_manually', {
              p_id: data.user.id,
              p_email: data.user.email || '',
              p_first_name: data.user.user_metadata?.first_name || '',
              p_last_name: data.user.user_metadata?.last_name || '',
              p_role: 'USER'
            });
            
            if (retryError) {
              console.error('Retry insert error:', retryError);
            } else {
              console.log('Retry insert successful');
            }
          } catch (retryError) {
            console.error('Manual insert retry error:', retryError);
          }
        } else {
          console.log('User data successfully inserted to users table');
          logger.info(`User created in database on first login: ${data.user.id} / ${data.user.email}`);
          
          // Güvenlik logu oluştur
          await SecurityService.createLog({
            type: 'user_update',
            admin: userFullName,
            ip: ip, 
            status: 'success',
            action: `Kullanıcı veritabanı kaydı oluşturuldu (ilk giriş) / ${data.user.email}`
          });
        }
      } else {
        console.log('User already exists in database:', existingUser.id);
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
    
    console.log('OAuth login successful for:', data.user.email);

    // Kullanıcının users tablosunda olup olmadığını kontrol et
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // PGRST116: Row not found hatası beklenebilir, kullanıcı yoksa bu hata gelir
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Kullanıcı kontrolü hatası:', userCheckError);
    }

    // Kullanıcı tam adı
    const userFullName = 
      (data.user.user_metadata?.given_name || data.user.user_metadata?.first_name) && 
      (data.user.user_metadata?.family_name || data.user.user_metadata?.last_name)
        ? `${data.user.user_metadata?.given_name || data.user.user_metadata?.first_name} ${data.user.user_metadata?.family_name || data.user.user_metadata?.last_name}`
        : data.user.email || 'Bilinmeyen Kullanıcı';
    
    // IP adresini alamıyoruz, genel değer kullan
    const ip = '0.0.0.0';

    // Kullanıcı users tablosunda yoksa ekle
    if (!existingUser) {
      console.log('Creating user record in users table for OAuth user');
      
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          first_name: data.user.user_metadata?.given_name || data.user.user_metadata?.first_name || '',
          last_name: data.user.user_metadata?.family_name || data.user.user_metadata?.last_name || '',
          profile_picture: data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url || '',
          role: 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Users tablosuna veri ekleme hatası:', insertError);
        logger.error(`Failed to create user record in database on first OAuth login: ${data.user.id}`, insertError);
      } else {
        console.log('User data successfully inserted to users table for OAuth user');
        logger.info(`OAuth user created in database on first login: ${data.user.id} / ${data.user.email}`);
        
        // Güvenlik logu oluştur
        try {
          await SecurityService.createLog({
            type: 'login',
            admin: userFullName,
            ip: ip,
            status: 'success',
            action: `Google ile ilk giriş / ${data.user.email}`
          });
        } catch (logError) {
          console.error('OAuth security log error:', logError);
        }
      }
    } else {
      console.log('OAuth user already exists in database:', existingUser.id);
      
      // Başarılı OAuth girişini logla
      try {
        await SecurityService.createLog({
          type: 'login',
          admin: userFullName,
          ip: ip,
          status: 'success',
          action: `Google ile giriş / ${data.user.email}`
        });
      } catch (logError) {
        console.error('OAuth login security log error:', logError);
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
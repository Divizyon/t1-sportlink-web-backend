import supabase, { supabaseAdmin } from '../config/supabase';
import { LoginDTO } from '../models/User';
import { SecurityService } from './securityService';
import { UnauthorizedError } from '../errors/UnauthorizedError';

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
        action: `Basarisiz giris: ${error.message}`
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
      const { data: existingUser, error: userCheckError } = await supabase
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
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    
    // Google ile giriş başarılıysa ve kullanıcı bilgileri alındıysa
    // Gerçek kullanıcı verilerine, callback işlenmesi sırasında erişilecek
    // Bu nedenle burada sadece authentication işlemi başlatılıyor
    
    return data;
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
    // OAuth kodu ile oturum bilgilerini elde et
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
    
    // Kullanıcı verilerini al
    if (data.user) {
      // Kullanıcının veritabanında olup olmadığını kontrol et
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('User check error:', userCheckError);
      }
      
      // Kullanıcı veritabanında yoksa ekle
      if (!existingUser) {
        // RLS hatasını önlemek için supabaseAdmin kullan
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            username: data.user.email?.split('@')[0] || '',
            email: data.user.email || '',
            first_name: data.user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            phone: data.user.phone || '',
            profile_picture: data.user.user_metadata?.avatar_url || '',
            default_location_latitude: 0,
            default_location_longitude: 0,
            role: 'USER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error inserting user data from OAuth to users table:', insertError);
        } else {
          console.log('User data from OAuth successfully inserted to users table');
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('OAuth callback handling error:', error);
    throw error;
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // First get the user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData?.email) {
      console.error('Error fetching user email:', userError);
      throw new Error('Unable to find user email');
    }
    
    // Now verify the current password with the email
    const { data: user, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword
    });

    if (signInError || !user) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error('Failed to update password');
    }
  } catch (error) {
    console.error('Error in AuthService.changePassword:', error);
    throw error;
  }
}; 
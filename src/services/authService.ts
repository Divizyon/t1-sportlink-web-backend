import supabase from '../utils/supabaseHelper';
import { LoginDTO } from '../models/User';

export const login = async (credentials: LoginDTO) => {
  try {
    console.log('Login attempt:', credentials.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('Login successful for:', credentials.email);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
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
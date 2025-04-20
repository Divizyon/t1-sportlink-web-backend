import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { LoginDTO, CreateUserDTO } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const userData: CreateUserDTO = req.body;
    console.log('Register attempt with data:', userData);
    
    // Kullanıcı oluştur - Sadece Auth kullanıcısı oluşturulur, users tablosuna eklenmez
    const newUser = await userService.createUser(userData);
    if (!newUser) {
      console.error('User creation failed: newUser is null');
      return res.status(500).json({
        status: 'error',
        message: 'Kullanıcı oluşturulurken bir hata oluştu.'
      });
    }
    
    console.log('User created successfully in Auth:', newUser.id);
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('Register error details:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Özel hata mesajlarını kontrol et
      if (error.message.includes('e-posta adresi zaten kullanılıyor') || 
          error.message.includes('already been registered')) {
        return res.status(400).json({
          status: 'error',
          message: 'Bu e-posta adresi zaten kullanılıyor.'
        });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Kayıt işlemi sırasında bir hata oluştu.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const credentials: LoginDTO = req.body;
    const authData = await authService.login(credentials);
    
    if (!authData.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Giriş başarısız oldu.'
      });
    }
    
    // Auth kullanıcı verilerinden direkt dönüş yapalım
    res.status(200).json({
      status: 'success',
      data: {
        session: authData.session,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: authData.user.user_metadata?.first_name || '',
          last_name: authData.user.user_metadata?.last_name || '',
          role: authData.user.user_metadata?.role || 'USER'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Geçersiz e-posta veya şifre.'
    });
  }
};

export const googleAuthRedirect = async (req: Request, res: Response) => {
  try {
    const data = await authService.loginWithGoogle();
    res.redirect(data.url);
  } catch (error) {
    console.error('Google auth redirect error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Google ile giriş yapılırken bir hata oluştu.'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await authService.logout();
    res.status(200).json({
      status: 'success',
      message: 'Başarıyla çıkış yapıldı.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Çıkış yapılırken bir hata oluştu.'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userData = await authService.getCurrentUser();
    
    if (!userData.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    // Auth verileri üzerinden kullanıcı bilgilerini dön
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          first_name: userData.user.user_metadata?.first_name || '',
          last_name: userData.user.user_metadata?.last_name || '',
          role: userData.user.user_metadata?.role || 'USER'
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Oturum açılmamış veya süresi dolmuş.'
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'E-posta adresi gereklidir.'
      });
    }
    
    await authService.resetPassword(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Yeni şifre gereklidir.'
      });
    }
    
    await authService.updatePassword(password);
    
    res.status(200).json({
      status: 'success',
      message: 'Şifreniz başarıyla güncellendi.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre güncellenirken bir hata oluştu.'
    });
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  try {
    const data = await authService.refreshSession();
    
    res.status(200).json({
      status: 'success',
      data: {
        session: data.session
      }
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Oturum yenilenirken bir hata oluştu.'
    });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'E-posta adresi gereklidir.'
      });
    }
    
    await authService.sendVerificationEmail(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Doğrulama bağlantısı e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Doğrulama bağlantısı gönderilirken bir hata oluştu.'
    });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Geçersiz OAuth kodu.'
      });
    }
    
    // OAuth token değişimi ve kullanıcıyı veritabanına kaydetme
    const data = await authService.handleOAuthCallback(code);
    
    // Başarılı giriş sonrası ana sayfaya yönlendir
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'OAuth işlemi sırasında bir hata oluştu.'
    });
  }
}; 